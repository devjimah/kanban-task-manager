import { z } from "zod";

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Expected a valid MongoDB object ID");

export const boardParamsSchema = z.object({ id: objectIdSchema });

export const createBoardSchema = z.strictObject({
  title: z.string().trim().min(2).max(50),
});

export const updateBoardSchema = z.strictObject({
  title: z.string().trim().min(2).max(50),
  version: z.number().int().min(0),
});

export const createColumnSchema = z.strictObject({
  title: z.string().trim().min(1).max(30),
  position: z.number().int().min(0),
});

export const updateColumnSchema = z
  .strictObject({
    title: z.string().trim().min(1).max(30).optional(),
    position: z.number().int().min(0).optional(),
    version: z.number().int().min(0),
  })
  .refine((value) => value.title !== undefined || value.position !== undefined, {
    message: "Provide a title or position",
  });

export const moveColumnSchema = z.strictObject({
  position: z.number().int().min(0),
  version: z.number().int().min(0),
});

export const subtaskSchema = z.strictObject({
  title: z.string().trim().min(1).max(100),
  isCompleted: z.boolean().default(false),
  position: z.number().int().min(0),
});

export const createTaskSchema = z.strictObject({
  boardId: objectIdSchema,
  columnId: objectIdSchema,
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(500).default(""),
  position: z.number().int().min(0),
  assignedTo: objectIdSchema.nullable().optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  subtasks: z.array(subtaskSchema).max(50).default([]),
});

export const updateTaskSchema = createTaskSchema
  .omit({ boardId: true })
  .partial()
  .extend({ version: z.number().int().min(0) })
  .refine((value) => Object.keys(value).some((key) => key !== "version"), {
    message: "Provide at least one task field",
  });

export const moveTaskSchema = z.strictObject({
  columnId: objectIdSchema,
  position: z.number().int().min(0),
  version: z.number().int().min(0),
});

export const completeTaskSchema = z.strictObject({
  isCompleted: z.boolean(),
  version: z.number().int().min(0),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type MoveColumnInput = z.infer<typeof moveColumnSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;

export interface SuccessResponse<T> {
  status: "success";
  data: T;
}

export interface ErrorResponse {
  status: "error";
  code: string;
  message: string;
  requestId: string;
  errors?: Array<{ field: string; message: string }>;
}
