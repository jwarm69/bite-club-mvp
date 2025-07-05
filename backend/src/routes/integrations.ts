import express, { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { integrationManager } from '../services/integration';
import { getPrisma } from '../index';

const router = express.Router();

// Helper function to get restaurant ID
async function getRestaurantId(req: Request): Promise<string | null> {
  if (req.user?.role === UserRole.ADMIN) {
    return req.body.restaurantId || req.query.restaurantId as string || null;
  } else {
    // Find restaurant owned by this user
    const restaurant = await (await getPrisma()).restaurant.findFirst({
      where: { userId: req.user!.userId },
      select: { id: true }
    });
    return restaurant?.id || null;
  }
}

// Get restaurant integration status
router.get('/status', authenticate, authorize(UserRole.RESTAURANT, UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurantId = await getRestaurantId(req);
    
    if (!restaurantId) {
      res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
      return;
    }

    const status = await integrationManager.getIntegrationStatus(restaurantId);
    res.json(status);
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enable integration
router.post('/enable', authenticate, authorize(UserRole.RESTAURANT, UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, config } = req.body;
    const restaurantId = await getRestaurantId(req);

    if (!restaurantId) {
      res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
      return;
    }

    if (!type || !config) {
      res.status(400).json({ error: 'Integration type and config are required' });
      return;
    }

    const result = await integrationManager.enableIntegration(restaurantId, type, config);
    
    if (result.success) {
      res.json({ success: true, message: `${type} integration enabled successfully` });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Enable integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable integration
router.post('/disable', authenticate, authorize(UserRole.RESTAURANT, UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.body;
    const restaurantId = await getRestaurantId(req);

    if (!restaurantId) {
      res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
      return;
    }

    if (!type) {
      res.status(400).json({ error: 'Integration type required' });
      return;
    }

    const result = await integrationManager.disableIntegration(restaurantId, type);
    
    if (result.success) {
      res.json({ success: true, message: `${type} integration disabled successfully` });
    } else {
      res.status(500).json({ error: 'Failed to disable integration' });
    }
  } catch (error) {
    console.error('Disable integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test integration configuration
router.post('/test', authenticate, authorize(UserRole.RESTAURANT, UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, config } = req.body;

    if (!type || !config) {
      res.status(400).json({ error: 'Integration type and config are required' });
      return;
    }

    const isValid = await integrationManager.validateIntegrationConfig(type, config);
    
    res.json({ 
      valid: isValid,
      message: isValid ? 'Configuration is valid' : 'Configuration is invalid'
    });
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync menu with integrations
router.post('/sync/menu', authenticate, authorize(UserRole.RESTAURANT, UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { integrationType } = req.body;
    const restaurantId = await getRestaurantId(req);

    if (!restaurantId) {
      res.status(400).json({ error: 'Restaurant ID required or restaurant not found' });
      return;
    }

    const result = await integrationManager.syncRestaurantMenu(restaurantId, integrationType);
    
    res.json({
      success: result.success,
      results: result.results,
      message: result.success ? 'Menu sync completed' : 'Menu sync failed'
    });
  } catch (error) {
    console.error('Sync menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync specific order with integrations
router.post('/sync/order/:orderId', authenticate, authorize(UserRole.RESTAURANT, UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const result = await integrationManager.syncOrderToIntegrations(orderId);
    
    res.json({
      success: result.success,
      results: result.results,
      message: result.success ? 'Order sync completed' : 'Order sync failed'
    });
  } catch (error) {
    console.error('Sync order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available integration types
router.get('/types', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const types = [
      {
        type: 'TOAST',
        name: 'Toast POS',
        description: 'Integration with Toast point-of-sale system',
        status: 'available',
        configFields: [
          { name: 'clientId', type: 'string', required: true, description: 'Toast API Client ID' },
          { name: 'clientSecret', type: 'password', required: true, description: 'Toast API Client Secret' },
          { name: 'locationGuid', type: 'string', required: true, description: 'Toast Location GUID' },
          { name: 'environment', type: 'select', required: true, description: 'Environment', options: ['sandbox', 'production'] }
        ]
      },
      {
        type: 'SQUARE',
        name: 'Square POS',
        description: 'Integration with Square point-of-sale system',
        status: 'coming_soon',
        configFields: [
          { name: 'accessToken', type: 'password', required: true, description: 'Square Access Token' },
          { name: 'applicationId', type: 'string', required: true, description: 'Square Application ID' },
          { name: 'locationId', type: 'string', required: true, description: 'Square Location ID' }
        ]
      }
    ];

    res.json({ types });
  } catch (error) {
    console.error('Get integration types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all restaurants with integration status
router.get('/admin/restaurants', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurants = await (await getPrisma()).restaurant.findMany({
      include: {
        school: true,
        integrationConfigs: true
      },
      orderBy: { name: 'asc' }
    });

    const restaurantsWithIntegration = restaurants.map((restaurant: any) => ({
      id: restaurant.id,
      name: restaurant.name,
      school: restaurant.school.name,
      toastLocationGuid: restaurant.toastLocationGuid,
      integrationEnabled: restaurant.integrationEnabled,
      integrations: restaurant.integrationConfigs.map((config: any) => ({
        type: config.integrationType,
        enabled: config.enabled,
        syncEnabled: config.syncEnabled,
        lastSync: config.lastSyncAt
      }))
    }));

    res.json({ restaurants: restaurantsWithIntegration });
  } catch (error) {
    console.error('Get admin restaurants integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Enable integration for restaurant
router.post('/admin/enable', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId, type, config } = req.body;

    if (!restaurantId || !type || !config) {
      res.status(400).json({ error: 'Restaurant ID, integration type, and config are required' });
      return;
    }

    const result = await integrationManager.enableIntegration(restaurantId, type, config);
    
    if (result.success) {
      res.json({ success: true, message: `${type} integration enabled for restaurant` });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Admin enable integration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;