const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeRestaurantNames() {
  console.log('🔍 Analyzing restaurant names and menu content...\n');

  // Get all restaurants with their menu items
  const restaurants = await prisma.restaurant.findMany({
    include: {
      menuItems: {
        select: {
          name: true,
          description: true,
          category: true,
          price: true
        }
      }
    }
  });

  const genericRestaurants = [];
  const properlyNamed = [];

  restaurants.forEach(restaurant => {
    const isGeneric = /^Restaurant \d+$/.test(restaurant.name);
    
    if (isGeneric) {
      genericRestaurants.push({
        id: restaurant.id,
        name: restaurant.name,
        menuItemCount: restaurant.menuItems.length,
        menuItems: restaurant.menuItems
      });
    } else {
      properlyNamed.push(restaurant.name);
    }
  });

  console.log(`📊 Analysis Results:`);
  console.log(`   • Generic named restaurants: ${genericRestaurants.length}`);
  console.log(`   • Properly named restaurants: ${properlyNamed.length}`);
  console.log(`   • Total restaurants: ${restaurants.length}\n`);

  console.log(`✅ Properly Named Restaurants:`);
  properlyNamed.forEach(name => console.log(`   • ${name}`));
  console.log('');

  console.log(`⚠️  Generic Named Restaurants with Menu Analysis:`);
  genericRestaurants.forEach(restaurant => {
    console.log(`\n🍴 ${restaurant.name} (${restaurant.id})`);
    console.log(`   📋 Menu Items: ${restaurant.menuItemCount}`);
    
    if (restaurant.menuItems.length > 0) {
      // Analyze menu patterns
      const categories = [...new Set(restaurant.menuItems.map(item => item.category).filter(Boolean))];
      const itemNames = restaurant.menuItems.slice(0, 5).map(item => item.name);
      
      console.log(`   🏷️  Categories: ${categories.join(', ') || 'None'}`);
      console.log(`   🍽️  Sample Items: ${itemNames.join(', ')}`);
      
      // Try to infer restaurant type
      const menuText = restaurant.menuItems.map(item => `${item.name} ${item.description || ''}`).join(' ').toLowerCase();
      
      let suggestedType = 'Unknown';
      if (menuText.includes('pizza')) suggestedType = 'Pizza';
      else if (menuText.includes('burrito') || menuText.includes('mexican')) suggestedType = 'Mexican';
      else if (menuText.includes('sandwich') || menuText.includes('sub')) suggestedType = 'Sandwich Shop';
      else if (menuText.includes('chinese') || menuText.includes('noodle') || menuText.includes('rice')) suggestedType = 'Asian';
      else if (menuText.includes('burger') || menuText.includes('fries')) suggestedType = 'American/Burger';
      else if (menuText.includes('salad') || menuText.includes('healthy')) suggestedType = 'Healthy/Salads';
      else if (menuText.includes('coffee') || menuText.includes('latte')) suggestedType = 'Coffee Shop';
      else if (menuText.includes('donut') || menuText.includes('dessert')) suggestedType = 'Dessert/Bakery';
      
      console.log(`   🎯 Inferred Type: ${suggestedType}`);
    }
  });

  return { genericRestaurants, properlyNamed };
}

async function main() {
  try {
    const results = await analyzeRestaurantNames();
    
    console.log('\n💾 Saving analysis to file...');
    const fs = require('fs');
    fs.writeFileSync(
      '/Users/jackwarman/bite-club-mvp/backend/restaurant-analysis.json',
      JSON.stringify(results, null, 2)
    );
    console.log('✅ Analysis saved to restaurant-analysis.json');
    
  } catch (error) {
    console.error('❌ Error analyzing restaurants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();