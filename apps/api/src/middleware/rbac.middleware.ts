import { RequestHandler } from "express";

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource",
        },
      });
      return;
    }

    next();
  };
}
