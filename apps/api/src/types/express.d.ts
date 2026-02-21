declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        userId: string;
        clinicId: string;
        role: string;
      };
      validatedBody?: unknown;
      validatedParams?: unknown;
      validatedQuery?: unknown;
    }
  }
}

export {};
