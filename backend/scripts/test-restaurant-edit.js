const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRestaurantEdit() {
  try {
    console.log('🔧 Testing restaurant edit functionality...');
    
    // Find a restaurant to test with
    const testRestaurant = await prisma.restaurant.findFirst({
      where: { name: { startsWith: 'Restaurant' } }, // Find one of our migrated restaurants
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        school: true
      }
    });
    
    if (!testRestaurant) {
      console.log('❌ No test restaurant found');
      return;
    }
    
    console.log('🍽️ Found test restaurant:', testRestaurant);
    
    // Test updating the restaurant
    const updatedData = {
      name: 'Tasty Bites Cafe',
      description: 'Fresh and delicious meals made with local ingredients',
      phone: '(352) 555-0123',
      email: 'tastybites@ufl.edu'
    };
    
    console.log('📝 Updating restaurant with:', updatedData);
    
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: testRestaurant.id },
      data: updatedData,
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        active: true,
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('✅ Restaurant updated successfully:', updatedRestaurant);
    
    // Test getting the restaurant details
    const fetchedRestaurant = await prisma.restaurant.findUnique({
      where: { id: testRestaurant.id },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        active: true,
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
      }
    });
    
    console.log('📋 Fetched restaurant details:', fetchedRestaurant);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRestaurantEdit();