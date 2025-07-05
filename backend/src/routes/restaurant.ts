import express, { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { getPrisma } from '../index';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Get active order count for restaurant
router.get('/orders/active-count', authenticate, authorize(UserRole.RESTAURANT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Find restaurant owned by this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Count active orders (not completed, cancelled, or refunded)
    const activeOrderCount = await (await getPrisma()).order.count({
      where: {
        restaurantId: restaurant.id,
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY']
        }
      }
    });

    res.json({ count: activeOrderCount });
  } catch (error) {
    console.error('Get active order count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get restaurant hours
router.get('/hours', authenticate, authorize(UserRole.RESTAURANT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId },
      select: {
        id: true,
        name: true,
        operatingHours: true
      }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    res.json({
      restaurantId: restaurant.id,
      name: restaurant.name,
      operatingHours: restaurant.operatingHours || getDefaultHours()
    });
  } catch (error) {
    console.error('Get restaurant hours error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update restaurant hours
router.put('/hours', authenticate, authorize(UserRole.RESTAURANT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { operatingHours } = req.body;

    if (!operatingHours) {
      res.status(400).json({ error: 'Operating hours are required' });
      return;
    }

    // Validate hours format
    const validatedHours = validateOperatingHours(operatingHours);
    if (!validatedHours) {
      res.status(400).json({ error: 'Invalid operating hours format' });
      return;
    }

    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    const updatedRestaurant = await (await getPrisma()).restaurant.update({
      where: { id: restaurant.id },
      data: { operatingHours: validatedHours },
      select: {
        id: true,
        name: true,
        operatingHours: true
      }
    });

    res.json({
      success: true,
      restaurant: updatedRestaurant
    });
  } catch (error) {
    console.error('Update restaurant hours error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if restaurant is currently open
router.get('/status', authenticate, authorize(UserRole.RESTAURANT), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId },
      select: {
        id: true,
        name: true,
        operatingHours: true,
        active: true
      }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    const isOpen = restaurant.active && isRestaurantCurrentlyOpen(restaurant.operatingHours);

    res.json({
      restaurantId: restaurant.id,
      name: restaurant.name,
      isOpen,
      isActive: restaurant.active,
      operatingHours: restaurant.operatingHours
    });
  } catch (error) {
    console.error('Get restaurant status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper functions
function getDefaultHours() {
  return {
    monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '22:00' },
    saturday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '20:00' }
  };
}

function validateOperatingHours(hours: any): any {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const validatedHours: any = {};

  for (const day of days) {
    if (!hours[day]) return null;
    
    const dayHours = hours[day];
    if (typeof dayHours.isOpen !== 'boolean') return null;
    
    if (dayHours.isOpen) {
      if (!dayHours.openTime || !dayHours.closeTime) return null;
      if (!isValidTimeFormat(dayHours.openTime) || !isValidTimeFormat(dayHours.closeTime)) return null;
    }
    
    validatedHours[day] = {
      isOpen: dayHours.isOpen,
      openTime: dayHours.isOpen ? dayHours.openTime : null,
      closeTime: dayHours.isOpen ? dayHours.closeTime : null
    };
  }

  return validatedHours;
}

function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function isRestaurantCurrentlyOpen(operatingHours: any): boolean {
  if (!operatingHours) return true; // Default to open if no hours set

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = operatingHours[dayName];
  if (!todayHours || !todayHours.isOpen) return false;

  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
}

// Public endpoints for browsing restaurants and menus

// Get all restaurants by school
router.get('/by-school/:schoolDomain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolDomain } = req.params;

    // Find school by domain
    const school = await (await getPrisma()).school.findUnique({
      where: { domain: schoolDomain, active: true }
    });

    if (!school) {
      res.status(404).json({ error: 'School not found' });
      return;
    }

    const restaurants = await (await getPrisma()).restaurant.findMany({
      where: { 
        schoolId: school.id,
        active: true 
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        description: true,
        logoUrl: true,
        operatingHours: true,
        callEnabled: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants by school error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get restaurant details with menu
router.get('/:restaurantId/menu', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await (await getPrisma()).restaurant.findUnique({
      where: { 
        id: restaurantId,
        active: true 
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        description: true,
        logoUrl: true,
        operatingHours: true,
        callEnabled: true,
        menuItems: {
          where: { available: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
            imageUrl: true,
            modifiers: true
          },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        }
      }
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all restaurants (for browsing)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.query;

    const whereClause: any = { active: true };
    if (schoolId) {
      whereClause.schoolId = schoolId as string;
    }

    const restaurants = await (await getPrisma()).restaurant.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        description: true,
        logoUrl: true,
        operatingHours: true,
        callEnabled: true,
        school: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;