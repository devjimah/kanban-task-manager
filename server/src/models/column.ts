import { Schema, model } from "mongoose";

const columnSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 30 },
    position: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, optimisticConcurrency: true },
);

columnSchema.index({ boardId: 1, position: 1 }, { unique: true });
export const ColumnModel = model("Column", columnSchema);
