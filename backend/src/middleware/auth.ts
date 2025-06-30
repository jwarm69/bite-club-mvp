import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { verifyToken, extractToken, JWTPayload } from '../utils/auth';
import { prisma } from '../index';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const payload = verifyToken(token);
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, active: true }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Middleware to check if user belongs to the same school (for students/restaurants)
export const checkSchoolAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admins can access all schools
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    const schoolId = req.params.schoolId || req.body.schoolId;
    
    if (schoolId && req.user.schoolId !== schoolId) {
      res.status(403).json({ error: 'Access denied to this school' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};