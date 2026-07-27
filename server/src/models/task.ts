import { Schema, model } from "mongoose";

const subtaskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    isCompleted: { type: Boolean, required: true, default: false },
    position: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const taskSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, required: true, index: true },
    columnId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, default: "", maxlength: 500 },
    position: { type: Number, required: true, min: 0 },
    assignedTo: { type: Schema.Types.ObjectId, default: null, index: true },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    subtasks: { type: [subtaskSchema], default: [] },
  },
  { timestamps: true, optimisticConcurrency: true },
);

taskSchema.index({ columnId: 1, position: 1 }, { unique: true });
export const TaskModel = model("Task", taskSchema);
