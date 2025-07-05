import express, { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { getPrisma } from '../index';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authenticate } from '../middleware/auth';
import { sendPasswordResetEmail } from '../utils/email';
import crypto from 'crypto';

const router = express.Router();

// Get all active schools for signup
router.get('/schools', async (req: Request, res: Response): Promise<void> => {
  try {
    const schools = await (await getPrisma()).school.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        domain: true,
        location: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ schools });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Student Signup
router.post('/signup/student', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, schoolDomain } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !schoolDomain) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Note: Email domain verification removed - students can use any email

    // Find school by domain
    const school = await (await getPrisma()).school.findUnique({
      where: { domain: schoolDomain, active: true }
    });

    if (!school) {
      res.status(400).json({ error: 'School not found or inactive' });
      return;
    }

    // Check if user already exists
    const existingUser = await (await getPrisma()).user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await (await getPrisma()).user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: UserRole.STUDENT,
        firstName,
        lastName,
        schoolId: school.id,
        creditBalance: 0
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        creditBalance: true,
        school: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: school.id
    });

    res.status(201).json({
      message: 'Student account created successfully',
      user,
      token
    });
  } catch (error) {
    console.error('Student signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restaurant Signup
router.post('/signup/restaurant', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      restaurantName, 
      phone, 
      schoolDomain,
      description 
    } = req.body;

    // Validate input
    if (!email || !password || !restaurantName || !phone || !schoolDomain) {
      res.status(400).json({ error: 'All required fields must be provided' });
      return;
    }

    // Find school by domain
    const school = await (await getPrisma()).school.findUnique({
      where: { domain: schoolDomain, active: true }
    });

    if (!school) {
      res.status(400).json({ error: 'School not found or inactive' });
      return;
    }

    // Check if user already exists
    const existingUser = await (await getPrisma()).user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User already exists with this email' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and restaurant in a transaction
    const result = await (await getPrisma()).$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          role: UserRole.RESTAURANT,
          phone,
          schoolId: school.id
        }
      });

      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          phone,
          email: email.toLowerCase(),
          schoolId: school.id,
          description,
          active: false // Requires admin approval
        }
      });

      return { user, restaurant };
    });

    res.status(201).json({
      message: 'Restaurant account created successfully. Pending admin approval.',
      userId: result.user.id,
      restaurantId: result.restaurant.id
    });
  } catch (error) {
    console.error('Restaurant signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await (await getPrisma()).user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    });

    if (!user || !user.active) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // For restaurant users, check if restaurant is approved
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await (await getPrisma()).restaurant.findFirst({
        where: { email: user.email, active: true }
      });

      if (!restaurant) {
        res.status(401).json({ 
          error: 'Restaurant account pending approval or inactive' 
        });
        return;
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId || undefined
    });

    // Return user data (excluding password hash)
    const { passwordHash, ...userResponse } = user;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await (await getPrisma()).user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        creditBalance: true,
        school: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available schools
router.get('/schools', async (req: Request, res: Response): Promise<void> => {
  try {
    const schools = await (await getPrisma()).school.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        domain: true,
        location: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ schools });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Find user by email
    const user = await (await getPrisma()).user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
      return;
    }

    // Don't allow password reset for admin users
    if (user.role === UserRole.ADMIN) {
      res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await (await getPrisma()).passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt
      }
    });

    // Send password reset email
    const userType = user.role === UserRole.STUDENT ? 'student' : 'restaurant';
    await sendPasswordResetEmail(user.email, resetToken, userType);

    res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    // Find and validate reset token
    const resetToken = await (await getPrisma()).passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and mark token as used
    await (await getPrisma()).$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      });
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;