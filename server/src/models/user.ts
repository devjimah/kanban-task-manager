import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    // Global role. Per-board capability lives on BoardMember.access; "editor"
    // and "viewer" here express an account's default posture across the app.
    role: { type: String, enum: ["admin", "editor", "viewer", "user"], default: "user", required: true },
    // "system" defers to the client's OS colour scheme. Stored as intent; the
    // client resolves it to a concrete theme when rendering.
    themePreference: { type: String, enum: ["light", "dark", "system"], default: "system" },
  },
  { timestamps: true },
);

export const UserModel = model("User", userSchema);
