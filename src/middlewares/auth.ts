import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  userId?: string;
  role?: string;
}

const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not Authenticated, Please Login" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
  
    
    req.userId = decoded.id;
    req.role = decoded.role;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const checkPermission = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
};

export { authenticate, checkPermission };
