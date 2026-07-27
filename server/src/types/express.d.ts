declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: "admin" | "user";
      };
      boardAccess?: "viewer" | "editor" | "owner";
      authorizedBoardId?: string;
    }
  }
}

export {};
