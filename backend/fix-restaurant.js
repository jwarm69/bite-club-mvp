const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixRestaurantOwnership() {
  try {
    // First find the restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: { email: 'pizza@fau.edu' }
    });
    
    if (!restaurant) {
      console.log('Restaurant not found');
      return;
    }
    
    console.log('Found restaurant:', restaurant.id, restaurant.name);
    
    // Update the restaurant to be owned by the restaurant user
    const result = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { userId: 'cmcdjphox0006s8xmpf8459fy' }
    });
    
    console.log('Restaurant ownership fixed:', result.name);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRestaurantOwnership();