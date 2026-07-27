declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: "admin" | "editor" | "viewer" | "user";
      };
      boardAccess?: "viewer" | "editor" | "owner";
      authorizedBoardId?: string;
    }
  }
}

export {};
