import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { BoardModel } from "../models/board.js";
import { ColumnModel } from "../models/column.js";
import { TaskModel } from "../models/task.js";
import { UserModel } from "../models/user.js";
import { BoardMemberModel } from "../models/board-member.js";
import { RefreshSessionModel } from "../models/refresh-session.js";

// Fixed ids keep the seed idempotent: re-running replaces the demo fixture
// instead of accumulating duplicates.
const adminId = new mongoose.Types.ObjectId("66a000000000000000000000");
const ownerId = new mongoose.Types.ObjectId("66a000000000000000000001");
const editorId = new mongoose.Types.ObjectId("66a000000000000000000002");
const viewerId = new mongoose.Types.ObjectId("66a000000000000000000003");
const boardId = new mongoose.Types.ObjectId("66a000000000000000000010");
const archiveBoardId = new mongoose.Types.ObjectId("66a000000000000000000011");
const todoId = new mongoose.Types.ObjectId("66a000000000000000000020");
const doingId = new mongoose.Types.ObjectId("66a000000000000000000021");
const doneId = new mongoose.Types.ObjectId("66a000000000000000000022");

const userIds = [adminId, ownerId, editorId, viewerId];
const boardIds = [boardId, archiveBoardId];
const SEED_PASSWORD = "password1234";
const seedEmails = [
  "admin@example.com",
  "demo@example.com",
  "editor@example.com",
  "viewer@example.com",
];

await connectDatabase(env.MONGODB_URI);
try {
  // Match seeded users by id OR email: an earlier seed revision may have created
  // the same demo addresses under different ids, and `email` is uniquely indexed,
  // so an id-only cleanup would collide on insert.
  const staleUsers = await UserModel.find({
    $or: [{ _id: { $in: userIds } }, { email: { $in: seedEmails } }],
  }).select("_id");
  const staleUserIds = staleUsers.map((user) => user._id);
  // Boards created by a previous seed under different ids would otherwise remain
  // as orphans owned by a user this script is about to delete.
  const staleBoards = await BoardModel.find({
    $or: [{ _id: { $in: boardIds } }, { ownerId: { $in: staleUserIds } }],
  }).select("_id");
  const staleBoardIds = staleBoards.map((board) => board._id);

  await Promise.all([
    RefreshSessionModel.deleteMany({ userId: { $in: staleUserIds } }),
    BoardMemberModel.deleteMany({ boardId: { $in: staleBoardIds } }),
    TaskModel.deleteMany({ boardId: { $in: staleBoardIds } }),
    ColumnModel.deleteMany({ boardId: { $in: staleBoardIds } }),
    BoardModel.deleteMany({ _id: { $in: staleBoardIds } }),
    UserModel.deleteMany({ _id: { $in: staleUserIds } }),
  ]);

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, env.BCRYPT_ROUNDS);
  await UserModel.create([
    { _id: adminId, name: "Ada Admin", email: "admin@example.com", passwordHash, role: "admin" },
    { _id: ownerId, name: "Demo Owner", email: "demo@example.com", passwordHash, role: "user" },
    { _id: editorId, name: "Eli Editor", email: "editor@example.com", passwordHash, role: "editor" },
    { _id: viewerId, name: "Vera Viewer", email: "viewer@example.com", passwordHash, role: "viewer" },
  ]);

  await BoardModel.create([
    { _id: boardId, title: "Platform Launch", ownerId },
    { _id: archiveBoardId, title: "Roadmap Archive", ownerId },
  ]);

  // Owner plus an accepted editor, an accepted viewer, and one pending
  // invitation so every collaboration state is represented in the demo data.
  await BoardMemberModel.create([
    { boardId, userId: ownerId, access: "owner", status: "accepted", invitedBy: ownerId },
    { boardId, userId: editorId, access: "editor", status: "accepted", invitedBy: ownerId },
    { boardId, userId: viewerId, access: "viewer", status: "accepted", invitedBy: ownerId },
    { boardId: archiveBoardId, userId: ownerId, access: "owner", status: "accepted", invitedBy: ownerId },
    { boardId: archiveBoardId, userId: editorId, access: "editor", status: "pending", invitedBy: ownerId },
  ]);

  await ColumnModel.create([
    { _id: todoId, boardId, title: "Todo", position: 0 },
    { _id: doingId, boardId, title: "Doing", position: 1 },
    { _id: doneId, boardId, title: "Done", position: 2 },
    { boardId: archiveBoardId, title: "Backlog", position: 0 },
  ]);

  await TaskModel.create([
    {
      boardId,
      columnId: todoId,
      title: "Connect the frontend API",
      description: "Replace the mock data boundary with the tested REST client.",
      position: 0,
      assignedTo: ownerId,
      dueDate: new Date(Date.now() + 7 * 86_400_000),
      subtasks: [
        { title: "Add environment base URL", isCompleted: false, position: 0 },
        { title: "Handle API errors", isCompleted: false, position: 1 },
      ],
    },
    {
      boardId,
      columnId: todoId,
      title: "Document the deployment runbook",
      description: "Capture environment variables and the replica-set requirement.",
      position: 1,
      assignedTo: editorId,
      dueDate: new Date(Date.now() + 14 * 86_400_000),
      subtasks: [{ title: "List required secrets", isCompleted: false, position: 0 }],
    },
    {
      boardId,
      columnId: doingId,
      title: "Build collaborator management",
      description: "Invite, re-role, and remove board collaborators from the UI.",
      position: 0,
      assignedTo: editorId,
      dueDate: new Date(Date.now() + 3 * 86_400_000),
      subtasks: [
        { title: "Invite by email", isCompleted: true, position: 0 },
        { title: "Change access level", isCompleted: false, position: 1 },
      ],
    },
    {
      boardId,
      columnId: doneId,
      title: "Model boards, columns, and tasks",
      description: "Normalized Mongoose schemas with contiguous ordering indexes.",
      position: 0,
      assignedTo: ownerId,
      completedAt: new Date(),
      subtasks: [{ title: "Add unique position indexes", isCompleted: true, position: 0 }],
    },
    {
      boardId,
      columnId: doneId,
      title: "Unassigned backlog spike",
      description: "Left unassigned to demonstrate the optional assignee field.",
      position: 1,
      subtasks: [],
    },
  ]);

  console.log(
    [
      `Seeded ${userIds.length} users, ${boardIds.length} boards, 4 columns, and 5 tasks.`,
      `Sign in with any seeded email and the password: ${SEED_PASSWORD}`,
      "  admin@example.com  (global admin — sees every board)",
      "  demo@example.com   (owner of both seeded boards)",
      "  editor@example.com (accepted editor on Platform Launch, pending on Roadmap Archive)",
      "  viewer@example.com (read-only viewer on Platform Launch)",
    ].join("\n"),
  );
} finally {
  await disconnectDatabase();
}
