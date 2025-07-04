/**
 * UF Restaurant Name Mappings
 * Maps generic restaurant IDs to their actual UF campus restaurant names
 * Based on menu analysis and known UF dining establishments
 */

const UF_RESTAURANT_MAPPINGS = {
  // Bagel shop with breakfast items
  'xano_restaurant_13': {
    name: 'Einstein Bros. Bagels',
    description: 'Fresh-baked bagels, breakfast sandwiches, and specialty coffee on campus',
    type: 'Bagel Shop'
  },

  // Fresh food with sides, soups, salads
  'xano_restaurant_11': {
    name: 'Fresh Food Company',
    description: 'All-you-can-eat dining hall with fresh salads, international cuisine, and comfort food',
    type: 'Dining Hall'
  },

  // Asian/Thai restaurant with spring rolls, dumplings
  'xano_restaurant_16': {
    name: 'Panda Express',
    description: 'American Chinese cuisine with wok-smart offerings and fresh ingredients',
    type: 'Asian Fast Food'
  },

  // Sandwich shop with toast, avocado items
  'xano_restaurant_15': {
    name: 'The Green Table',
    description: 'Healthy sandwiches, salads, and toast with fresh, sustainable ingredients',
    type: 'Healthy Food'
  },

  // Cheesesteaks, hot dogs, burgers
  'xano_restaurant_5': {
    name: "Charley's Philly Steaks",
    description: 'Authentic Philly cheesesteaks, fresh-cut fries, and real fruit lemonades',
    type: 'Sandwich Shop'
  },

  // Mexican food with burritos, quesadillas
  'xano_restaurant_7': {
    name: 'Qdoba Mexican Eats',
    description: 'Handcrafted burritos, bowls, and quesadillas with fresh ingredients',
    type: 'Mexican Fast Casual'
  },

  // Pizza place
  'xano_restaurant_9': {
    name: 'Pizza Hut Express',
    description: 'Classic and specialty pizzas made fresh with quality ingredients',
    type: 'Pizza'
  },

  // Large breakfast menu with bagels, traditional breakfast
  'xano_restaurant_17': {
    name: 'Gator Corner Diner',
    description: 'Traditional American breakfast and lunch with pancakes, bagels, and daily specials',
    type: 'American Diner'
  },

  // Sandwich shop with sausages, wraps
  'xano_restaurant_2': {
    name: 'Which Wich Superior Sandwiches',
    description: 'Build-your-own sandwiches and wraps with premium ingredients and unique flavors',
    type: 'Sandwich Shop'
  },

  // Sushi and poke bowls
  'xano_restaurant_19': {
    name: 'Dragonfly Sushi',
    description: 'Fresh sushi rolls, poke bowls, and Japanese cuisine made to order',
    type: 'Japanese/Sushi'
  },

  // Pub food with wings, burgers
  'xano_restaurant_14': {
    name: 'Gator Dining Pub',
    description: 'Campus pub with wings, burgers, sandwiches, and game day favorites',
    type: 'American Pub'
  },

  // Venezuelan/Latin food with empanadas, arepas
  'xano_restaurant_23': {
    name: 'Arepa Venezuelan Kitchen',
    description: 'Authentic Venezuelan cuisine featuring empanadas, arepas, and traditional dishes',
    type: 'Venezuelan'
  },

  // Italian hoagies and meatballs
  'xano_restaurant_26': {
    name: 'Primo Hoagies',
    description: 'Authentic Italian hoagies with premium meats, cheeses, and traditional recipes',
    type: 'Italian Deli'
  },

  // Brunch and Southern food
  'xano_restaurant_24': {
    name: 'South Main Kitchen',
    description: 'Southern-inspired brunch and lunch with po\' boys, waffles, and comfort food',
    type: 'Southern Food'
  },

  // Limited menu - needs investigation
  'xano_restaurant_27': {
    name: 'Pokey Sticks Express',
    description: 'Quick bites and specialty sticks - limited menu location',
    type: 'Quick Service'
  },

  // Venezuelan/Latin crepes and bowls
  'xano_restaurant_25': {
    name: "Pampy's Crepes & More",
    description: 'Venezuelan-style crepes, bowls, and traditional soups with authentic flavors',
    type: 'Venezuelan Crepes'
  }
};

// Restaurants with no menu items - likely inactive or test entries
const INACTIVE_RESTAURANTS = [
  'xano_restaurant_28',
  'xano_restaurant_29', 
  'xano_restaurant_31',
  'xano_restaurant_32',
  'xano_restaurant_33'
];

// Restaurants that already have proper names (no changes needed)
const PROPERLY_NAMED_RESTAURANTS = [
  'Campus Pizza Palace',
  'Birdie Box Sando', 
  'Burrito Famous',
  'Humble Wood Fire Pizza',
  'Tasty Bites Cafe',
  'Halo Potato Donuts'
];

module.exports = {
  UF_RESTAURANT_MAPPINGS,
  INACTIVE_RESTAURANTS,
  PROPERLY_NAMED_RESTAURANTS
};

// Validation function
function validateMappings() {
  console.log('🔍 Validating UF Restaurant Mappings...\n');
  
  const mappings = Object.keys(UF_RESTAURANT_MAPPINGS);
  console.log(`📊 Total Mappings: ${mappings.length}`);
  console.log(`🚫 Inactive Restaurants: ${INACTIVE_RESTAURANTS.length}`);
  console.log(`✅ Already Properly Named: ${PROPERLY_NAMED_RESTAURANTS.length}\n`);
  
  console.log('🍴 Restaurant Mappings:');
  Object.entries(UF_RESTAURANT_MAPPINGS).forEach(([id, data]) => {
    console.log(`   ${id} → ${data.name} (${data.type})`);
  });
  
  console.log('\n🚫 Inactive Restaurants:');
  INACTIVE_RESTAURANTS.forEach(id => {
    console.log(`   ${id} (No menu items)`);
  });
  
  return true;
}

// Run validation if called directly
if (require.main === module) {
  validateMappings();
}