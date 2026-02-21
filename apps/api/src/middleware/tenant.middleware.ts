import { RequestHandler } from "express";

export const tenantMiddleware: RequestHandler = (req, res, next) => {
  const user = req.user;

  if (!user || !user.clinicId) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Tenant context not available",
      },
    });
    return;
  }

  next();
};
