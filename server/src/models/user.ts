import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user", required: true },
    themePreference: { type: String, enum: ["light", "dark"], default: "light" },
  },
  { timestamps: true },
);

export const UserModel = model("User", userSchema);
