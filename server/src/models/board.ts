import { Schema, model } from "mongoose";

const boardSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { timestamps: true, optimisticConcurrency: true },
);

export const BoardModel = model("Board", boardSchema);
