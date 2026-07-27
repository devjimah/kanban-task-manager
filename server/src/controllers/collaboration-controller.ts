import type { Request, Response } from "express";
import { CollaborationService } from "../services/collaboration-service.js";

// What: Collaboration HTTP controller class.
// Does: Translates board membership requests into collaboration-service calls.
// If removed: Collaboration routes must re-embed request/response handling logic.
export class CollaborationController {
  constructor(private readonly service: CollaborationService = new CollaborationService()) {}

  // What: Asynchronous collaborator-list handler method.
  // Does: Returns accepted and pending memberships to board owners.
  // If removed: `GET /boards/:id/members` has no controller action.
  listMembers = async (request: Request, response: Response) => {
    response.json({ status: "success", data: await this.service.listMembers(String(request.params.id)) });
  };

  // What: Asynchronous collaborator-invitation handler method.
  // Does: Creates a pending viewer/editor invitation for an existing user.
  // If removed: `POST /boards/:id/members` has no controller action.
  invite = async (request: Request, response: Response) => {
    const data = await this.service.invite(String(request.params.id), request.auth!.userId, request.body);
    response.status(201).json({ status: "success", data });
  };

  // What: Asynchronous invitation-acceptance handler method.
  // Does: Activates the authenticated invitee's own pending membership.
  // If removed: `POST /boards/:id/members/accept` has no controller action.
  accept = async (request: Request, response: Response) => {
    response.json({
      status: "success",
      data: await this.service.accept(String(request.params.id), request.auth!.userId),
    });
  };

  // What: Asynchronous collaborator-role handler method.
  // Does: Lets owners change an accepted non-owner between viewer and editor.
  // If removed: `PUT /boards/:id/members/:userId` has no controller action.
  updateAccess = async (request: Request, response: Response) => {
    response.json({
      status: "success",
      data: await this.service.updateAccess(
        String(request.params.id),
        String(request.params.userId),
        request.body.access,
      ),
    });
  };

  // What: Asynchronous collaborator-removal handler method.
  // Does: Lets owners revoke a non-owner's board membership.
  // If removed: `DELETE /boards/:id/members/:userId` has no controller action.
  remove = async (request: Request, response: Response) => {
    await this.service.remove(String(request.params.id), String(request.params.userId));
    response.status(204).send();
  };

  // What: Asynchronous ownership-transfer handler method.
  // Does: Atomically transfers board ownership to an accepted collaborator.
  // If removed: `POST /boards/:id/transfer` has no controller action.
  transferOwnership = async (request: Request, response: Response) => {
    await this.service.transferOwnership(String(request.params.id), request.auth!.userId, request.body.userId);
    response.status(204).send();
  };
}
