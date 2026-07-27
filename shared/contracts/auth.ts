import { z } from "zod";
import { objectIdSchema } from "./kanban.js";

export const registerSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(10).max(128),
});

export const loginSchema = z.strictObject({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(1).max(128),
});

export const inviteMemberSchema = z.strictObject({
  email: z.email().trim().toLowerCase().max(254),
  access: z.enum(["viewer", "editor"]),
});

export const updateMemberSchema = z.strictObject({
  access: z.enum(["viewer", "editor"]),
});

export const transferOwnershipSchema = z.strictObject({
  userId: objectIdSchema,
});

export const memberParamsSchema = z.object({
  id: objectIdSchema,
  userId: objectIdSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
