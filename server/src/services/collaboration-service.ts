import mongoose from "mongoose";
import type { InviteMemberInput } from "../../../shared/contracts/auth.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors.js";
import { BoardMemberModel } from "../models/board-member.js";
import { BoardModel } from "../models/board.js";
import { UserModel } from "../models/user.js";

// What: Collaboration application-service class.
// Does: Owns board invitation, acceptance, role change, removal, and ownership-transfer invariants.
// If removed: Board membership changes have no centralized business-policy layer.
export class CollaborationService {
  // What: Asynchronous collaborator-list query method.
  // Does: Returns board memberships joined with safe public user identities.
  // If removed: Owners cannot inspect current and pending collaborators.
  async listMembers(boardId: string) {
    const memberships = await BoardMemberModel.find({ boardId }).sort({ createdAt: 1 });
    // What: Membership-user-ID mapping callback function.
    // Does: Extracts user IDs needed for one batched collaborator identity query.
    // If removed: Member listing must issue repeated user queries or cannot join identities.
    const users = await UserModel.find({ _id: { $in: memberships.map((membership) => membership.userId) } });
    // What: User-index mapping callback function.
    // Does: Converts users into key-value entries for constant-time membership response lookup.
    // If removed: Each membership requires a repeated linear search through users.
    const usersById = new Map(users.map((user) => [user.id, user]));
    // What: Membership response-mapping callback function.
    // Does: Combines each membership with its safe user identity for API output.
    // If removed: The endpoint cannot return collaborator names and emails with access state.
    return memberships.map((membership) => {
      const user = usersById.get(String(membership.userId));
      return {
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
        access: membership.access,
        status: membership.status,
      };
    });
  }

  // What: Asynchronous collaborator-invitation command method.
  // Does: Creates or refreshes a pending viewer/editor invitation for an existing user.
  // If removed: Board owners cannot invite collaborators.
  async invite(boardId: string, inviterId: string, input: InviteMemberInput) {
    const user = await UserModel.findOne({ email: input.email });
    if (!user) throw new NotFoundError("User");
    const existing = await BoardMemberModel.findOne({ boardId, userId: user.id });
    if (existing?.access === "owner") throw new ConflictError("The board owner cannot be reinvited");
    if (existing?.status === "accepted") throw new ConflictError("User is already a board collaborator");
    const membership = await BoardMemberModel.findOneAndUpdate(
      { boardId, userId: user.id },
      { $set: { access: input.access, status: "pending", invitedBy: inviterId } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    return { user: { id: user.id, name: user.name, email: user.email }, access: membership.access, status: membership.status };
  }

  // What: Asynchronous invitation-acceptance command method.
  // Does: Activates the authenticated user's pending membership for one board.
  // If removed: Invited users cannot gain accepted board access.
  async accept(boardId: string, userId: string) {
    const membership = await BoardMemberModel.findOneAndUpdate(
      { boardId, userId, status: "pending" },
      { $set: { status: "accepted" } },
      { returnDocument: "after" },
    );
    if (!membership) throw new NotFoundError("Pending invitation");
    return { boardId, access: membership.access, status: membership.status };
  }

  // What: Asynchronous collaborator-role command method.
  // Does: Changes an accepted non-owner membership between viewer and editor.
  // If removed: Owners cannot adjust collaborator permissions.
  async updateAccess(boardId: string, userId: string, access: "viewer" | "editor") {
    const membership = await BoardMemberModel.findOne({ boardId, userId });
    if (!membership) throw new NotFoundError("Board membership");
    if (membership.access === "owner") throw new ConflictError("Transfer ownership before changing the owner role");
    membership.access = access;
    await membership.save();
    return { userId, access: membership.access, status: membership.status };
  }

  // What: Asynchronous collaborator-removal command method.
  // Does: Removes a non-owner membership and blocks deletion of the current owner.
  // If removed: Owners cannot revoke board access safely.
  async remove(boardId: string, userId: string) {
    const membership = await BoardMemberModel.findOne({ boardId, userId });
    if (!membership) throw new NotFoundError("Board membership");
    if (membership.access === "owner") throw new ConflictError("Transfer ownership before removing the owner");
    await membership.deleteOne();
  }

  // What: Asynchronous ownership-transfer command method.
  // Does: Atomically promotes an accepted collaborator and demotes the previous owner to editor.
  // If removed: Ownership cannot be transferred without unsafe manual database changes.
  async transferOwnership(boardId: string, currentOwnerId: string, nextOwnerId: string) {
    if (currentOwnerId === nextOwnerId) throw new ConflictError("User already owns this board");
    const session = await mongoose.startSession();
    try {
      // What: MongoDB ownership-transfer transaction callback function.
      // Does: Revalidates the collaborator and updates the board and both memberships as one atomic state transition.
      // If removed: A partial transfer can leave multiple owners or no authoritative owner.
      await session.withTransaction(async () => {
        const nextOwner = await BoardMemberModel.findOne({
          boardId,
          userId: nextOwnerId,
          status: "accepted",
        }).session(session);
        if (!nextOwner) throw new ForbiddenError("New owner must be an accepted collaborator");
        const board = await BoardModel.findOneAndUpdate(
          { _id: boardId, ownerId: currentOwnerId },
          { $set: { ownerId: nextOwnerId } },
          { session, returnDocument: "after" },
        );
        if (!board) throw new ForbiddenError("Only the current owner can transfer ownership");
        const previousOwnerUpdate = await BoardMemberModel.updateOne(
          { boardId, userId: currentOwnerId, access: "owner" },
          { $set: { access: "editor" } },
          { session },
        );
        if (previousOwnerUpdate.matchedCount !== 1) {
          throw new ConflictError("The current ownership membership changed; reload and try again");
        }
        const nextOwnerUpdate = await BoardMemberModel.updateOne(
          { boardId, userId: nextOwnerId },
          { $set: { access: "owner", status: "accepted" } },
          { session },
        );
        if (nextOwnerUpdate.matchedCount !== 1) {
          throw new ConflictError("The new owner membership changed; reload and try again");
        }
      });
    } finally {
      await session.endSession();
    }
  }
}
