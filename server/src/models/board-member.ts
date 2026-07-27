import { Schema, model } from "mongoose";

const boardMemberSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    access: { type: String, enum: ["viewer", "editor", "owner"], required: true },
    status: { type: String, enum: ["pending", "accepted"], required: true, default: "pending" },
    invitedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

boardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });
export const BoardMemberModel = model("BoardMember", boardMemberSchema);
