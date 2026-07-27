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

const ownerId = new mongoose.Types.ObjectId("66a000000000000000000001");
const boardId = new mongoose.Types.ObjectId("66a000000000000000000010");
const todoId = new mongoose.Types.ObjectId("66a000000000000000000020");
const doingId = new mongoose.Types.ObjectId("66a000000000000000000021");

await connectDatabase(env.MONGODB_URI);
try {
  await Promise.all([
    RefreshSessionModel.deleteMany({ userId: ownerId }),
    BoardMemberModel.deleteMany({ boardId }),
    TaskModel.deleteMany({ boardId }),
    ColumnModel.deleteMany({ boardId }),
    BoardModel.deleteOne({ _id: boardId }),
    UserModel.deleteOne({ _id: ownerId }),
  ]);
  const passwordHash = await bcrypt.hash("password1234", env.BCRYPT_ROUNDS);
  await UserModel.create({
    _id: ownerId,
    name: "Demo Owner",
    email: "demo@example.com",
    passwordHash,
    role: "user",
  });
  await BoardModel.create({ _id: boardId, title: "Platform Launch", ownerId });
  await BoardMemberModel.create({
    boardId,
    userId: ownerId,
    access: "owner",
    status: "accepted",
    invitedBy: ownerId,
  });
  await ColumnModel.create([
    { _id: todoId, boardId, title: "Todo", position: 0 },
    { _id: doingId, boardId, title: "Doing", position: 1 },
  ]);
  await TaskModel.create({
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
  });
  console.log(`Seeded board ${boardId}`);
} finally {
  await disconnectDatabase();
}
