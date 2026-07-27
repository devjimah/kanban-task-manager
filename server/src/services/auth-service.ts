import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import type { Environment } from "../config/env.js";
import { globalRoleSchema } from "../../../shared/contracts/auth.js";
import type { LoginInput, RegisterInput } from "../../../shared/contracts/auth.js";
import { ConflictError, UnauthorizedError } from "../lib/errors.js";
import { RefreshSessionModel } from "../models/refresh-session.js";
import { UserModel } from "../models/user.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

// What: Cryptographic token-hashing function.
// Does: Produces the irreversible refresh-token identifier stored in MongoDB.
// If removed: Raw bearer refresh tokens would need to be stored, increasing credential exposure risk.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// What: User response-serialization function.
// Does: Converts a Mongoose user into the safe public identity returned by auth endpoints.
// If removed: Responses may expose internal fields or require repeated manual shaping.
function serializeUser(user: { id: string; name: string; email: string; role: string; themePreference: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    themePreference: user.themePreference,
  };
}

// What: Authentication application-service class.
// Does: Owns credential verification, password hashing, JWT creation, and refresh-session rotation.
// If removed: Auth routes have no secure domain layer for identity and session operations.
export class AuthService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  // What: Authentication-service constructor.
  // Does: Converts validated environment secrets into cryptographic key material.
  // If removed: Token signing and verification cannot use configured secrets.
  constructor(private readonly environment: Environment) {
    this.accessSecret = new TextEncoder().encode(environment.JWT_ACCESS_SECRET);
    this.refreshSecret = new TextEncoder().encode(environment.JWT_REFRESH_SECRET);
  }

  // What: Asynchronous user-registration method.
  // Does: Normalizes email, hashes the password, creates a non-admin user, and issues a session.
  // If removed: New users cannot securely register.
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    if (await UserModel.exists({ email })) {
      throw new ConflictError("An account with that email already exists");
    }
    const passwordHash = await bcrypt.hash(input.password, this.environment.BCRYPT_ROUNDS);
    // The contract already excludes "admin", so a requested role can never
    // escalate privileges here; absent input falls back to the default role.
    const user = await UserModel.create({ name: input.name, email, passwordHash, role: input.role ?? "user" });
    return { user: serializeUser(user), tokens: await this.issueTokens(user) };
  }

  // What: Asynchronous login method.
  // Does: Verifies normalized credentials with bcrypt and issues a new access/refresh session.
  // If removed: Existing users cannot authenticate.
  async login(input: LoginInput) {
    const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
    const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new UnauthorizedError("Invalid email or password");
    }
    return { user: serializeUser(user), tokens: await this.issueTokens(user) };
  }

  // What: Asynchronous access-token verification method.
  // Does: Validates signature, issuer, audience, token type, subject, email, and role claims.
  // If removed: Protected middleware cannot establish a trustworthy request identity.
  async verifyAccessToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret, {
        issuer: "kanban-api",
        audience: "kanban-client",
      });
      // Validate the role claim against the shared enum so a token carrying an
      // unknown or forged role is rejected rather than trusted.
      const role = globalRoleSchema.safeParse(payload.role);
      if (
        payload.type !== "access" ||
        typeof payload.sub !== "string" ||
        typeof payload.email !== "string" ||
        !role.success
      ) {
        throw new Error("Invalid access claims");
      }
      return { userId: payload.sub, email: payload.email, role: role.data };
    } catch {
      throw new UnauthorizedError("Access token is invalid or expired");
    }
  }

  // What: Asynchronous refresh-token rotation method.
  // Does: Verifies a refresh JWT, revokes its stored session, and issues a replacement token pair.
  // If removed: Sessions cannot continue safely after short-lived access tokens expire.
  async refresh(refreshToken: string) {
    try {
      const { payload } = await jwtVerify(refreshToken, this.refreshSecret, {
        issuer: "kanban-api",
        audience: "kanban-client",
      });
      if (payload.type !== "refresh" || typeof payload.sub !== "string" || typeof payload.jti !== "string") {
        throw new Error("Invalid refresh claims");
      }
      const tokenHash = hashToken(refreshToken);
      const session = await RefreshSessionModel.findOneAndUpdate(
        { userId: payload.sub, tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { revokedAt: new Date() } },
        { returnDocument: "after" },
      );
      if (!session) throw new Error("Refresh session is unavailable");
      const user = await UserModel.findById(payload.sub);
      if (!user) throw new Error("User is unavailable");
      const tokens = await this.issueTokens(user);
      session.replacedByHash = hashToken(tokens.refreshToken);
      await session.save();
      return { user: serializeUser(user), tokens };
    } catch {
      throw new UnauthorizedError("Refresh token is invalid, expired, or revoked");
    }
  }

  // What: Asynchronous logout method.
  // Does: Revokes the matching refresh session without revealing whether it existed.
  // If removed: Users cannot explicitly invalidate their current server-side session.
  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    await RefreshSessionModel.updateOne(
      { tokenHash: hashToken(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  // What: Asynchronous token-issuance method.
  // Does: Signs short-lived access and rotating refresh JWTs and persists the refresh hash.
  // If removed: Registration, login, and refresh cannot create authenticated sessions.
  private async issueTokens(user: { id: string; email: string; role: string }): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const accessExpiresAt = now + this.environment.ACCESS_TOKEN_TTL_MINUTES * 60;
    const refreshExpiresAt = new Date(Date.now() + this.environment.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    const accessToken = await new SignJWT({ email: user.email, role: user.role, type: "access" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer("kanban-api")
      .setAudience("kanban-client")
      .setSubject(user.id)
      .setIssuedAt(now)
      .setExpirationTime(accessExpiresAt)
      .sign(this.accessSecret);
    const refreshToken = await new SignJWT({ type: "refresh" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer("kanban-api")
      .setAudience("kanban-client")
      .setSubject(user.id)
      .setJti(randomUUID())
      .setIssuedAt(now)
      .setExpirationTime(Math.floor(refreshExpiresAt.getTime() / 1000))
      .sign(this.refreshSecret);
    await RefreshSessionModel.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    });
    return { accessToken, refreshToken, refreshExpiresAt };
  }
}
