import type { Request, Response } from "express";
import type { Environment } from "../config/env.js";
import { UnauthorizedError } from "../lib/errors.js";
import { UserModel } from "../models/user.js";
import { AuthService, type AuthTokens } from "../services/auth-service.js";

export const REFRESH_COOKIE = "kanban_refresh";

// What: Authentication HTTP controller class.
// Does: Owns session lifecycle actions and the scoped refresh-cookie transport policy.
// If removed: Auth routes must re-embed cookie handling and response shaping.
export class AuthController {
  private readonly service: AuthService;

  constructor(private readonly environment: Environment, service?: AuthService) {
    this.service = service ?? new AuthService(environment);
  }

  // What: Refresh-cookie option builder method.
  // Does: Produces one cookie policy shared by issuance and clearing, so a cleared
  //       cookie always matches the attributes it was set with.
  // If removed: Set/clear attribute drift can leave undeletable stale cookies.
  private refreshCookieOptions() {
    // When the client and API are on different sites (e.g. *.vercel.app calling
    // *.onrender.com), browsers only send the cookie with SameSite=None, which
    // in turn requires Secure. Locally both run on localhost, so the stricter
    // policy is kept.
    const crossSite = this.environment.CROSS_SITE_COOKIES;
    return {
      httpOnly: true,
      secure: crossSite || this.environment.NODE_ENV === "production",
      sameSite: crossSite ? ("none" as const) : ("strict" as const),
      path: "/api/v1/auth",
    };
  }

  // What: Refresh-cookie response helper method.
  // Does: Stores a refresh JWT in a scoped HTTP-only cookie with environment-aware transport security.
  // If removed: Browsers cannot retain refresh credentials without exposing them to JavaScript.
  private setRefreshCookie(response: Response, tokens: AuthTokens) {
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.refreshCookieOptions(),
      expires: tokens.refreshExpiresAt,
    });
  }

  // What: Refresh-cookie clearing helper method.
  // Does: Removes the browser refresh credential using the same security scope used at issuance.
  // If removed: Logout can revoke the server session but leave a stale cookie in the browser.
  private clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
  }

  // What: Asynchronous registration handler method.
  // Does: Creates a user, starts a refresh session, and returns public identity plus access token.
  // If removed: `POST /auth/register` has no controller action.
  register = async (request: Request, response: Response) => {
    const result = await this.service.register(request.body);
    this.setRefreshCookie(response, result.tokens);
    response
      .status(201)
      .json({ status: "success", data: { user: result.user, accessToken: result.tokens.accessToken } });
  };

  // What: Asynchronous login handler method.
  // Does: Verifies credentials, starts a refresh session, and returns identity plus access token.
  // If removed: `POST /auth/login` has no controller action.
  login = async (request: Request, response: Response) => {
    const result = await this.service.login(request.body);
    this.setRefreshCookie(response, result.tokens);
    response.json({ status: "success", data: { user: result.user, accessToken: result.tokens.accessToken } });
  };

  // What: Asynchronous token-refresh handler method.
  // Does: Rotates the HTTP-only refresh credential and returns a new short-lived access token.
  // If removed: Users must log in again whenever an access token expires.
  refresh = async (request: Request, response: Response) => {
    const token = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedError("Refresh token is required");
    const result = await this.service.refresh(token);
    this.setRefreshCookie(response, result.tokens);
    response.json({ status: "success", data: { user: result.user, accessToken: result.tokens.accessToken } });
  };

  // What: Asynchronous logout handler method.
  // Does: Revokes the current refresh session, clears its cookie, and returns HTTP 204.
  // If removed: `POST /auth/logout` has no controller action.
  logout = async (request: Request, response: Response) => {
    await this.service.logout(request.cookies?.[REFRESH_COOKIE] as string | undefined);
    this.clearRefreshCookie(response);
    response.status(204).send();
  };

  // What: Asynchronous current-user handler method.
  // Does: Returns the latest public user record for the authenticated access token subject.
  // If removed: Clients cannot restore or verify the current authenticated profile.
  me = async (request: Request, response: Response) => {
    const user = await UserModel.findById(request.auth?.userId);
    if (!user) throw new UnauthorizedError();
    response.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          themePreference: user.themePreference,
        },
      },
    });
  };
}
