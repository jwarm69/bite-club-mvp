const { PrismaClient } = require('@prisma/client');
const { UF_RESTAURANT_MAPPINGS, INACTIVE_RESTAURANTS } = require('./uf-restaurant-mappings');

const prisma = new PrismaClient();

class RestaurantNameUpdater {
  constructor(dryRun = true) {
    this.dryRun = dryRun;
    this.updateCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
  }

  async updateRestaurantNames() {
    console.log('🍴 UF Restaurant Name Update Tool');
    console.log(`🔧 Mode: ${this.dryRun ? 'DRY RUN (No changes will be made)' : 'LIVE UPDATE'}\n`);

    // Get all restaurants that need updating
    const restaurantsToUpdate = await this.getRestaurantsToUpdate();
    
    if (restaurantsToUpdate.length === 0) {
      console.log('✅ No restaurants need updating.');
      return;
    }

    console.log(`📊 Found ${restaurantsToUpdate.length} restaurants to update:\n`);

    // Process each restaurant
    for (const restaurant of restaurantsToUpdate) {
      await this.updateSingleRestaurant(restaurant);
    }

    // Summary
    this.printSummary();
  }

  async getRestaurantsToUpdate() {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        id: {
          in: Object.keys(UF_RESTAURANT_MAPPINGS)
        }
      },
      include: {
        menuItems: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return restaurants.filter(restaurant => {
      const mapping = UF_RESTAURANT_MAPPINGS[restaurant.id];
      return mapping && restaurant.name !== mapping.name;
    });
  }

  async updateSingleRestaurant(restaurant) {
    const mapping = UF_RESTAURANT_MAPPINGS[restaurant.id];
    
    try {
      console.log(`🔄 ${restaurant.name} → ${mapping.name}`);
      console.log(`   📍 Type: ${mapping.type}`);
      console.log(`   📝 Description: ${mapping.description}`);
      console.log(`   🍽️  Menu Items: ${restaurant.menuItems.length}`);

      if (!this.dryRun) {
        // Perform the actual update
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: {
            name: mapping.name,
            description: mapping.description
          }
        });
        console.log('   ✅ Updated successfully');
      } else {
        console.log('   🚧 Would update (dry run mode)');
      }

      this.updateCount++;
      console.log('');

    } catch (error) {
      console.error(`   ❌ Error updating restaurant ${restaurant.id}:`, error.message);
      this.errorCount++;
    }
  }

  async handleInactiveRestaurants() {
    console.log('🚫 Checking inactive restaurants...\n');

    for (const restaurantId of INACTIVE_RESTAURANTS) {
      try {
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId },
          include: {
            menuItems: true,
            orders: true
          }
        });

        if (!restaurant) {
          console.log(`   ⚠️  ${restaurantId}: Not found in database`);
          continue;
        }

        console.log(`🚫 ${restaurant.name} (${restaurantId})`);
        console.log(`   📋 Menu Items: ${restaurant.menuItems.length}`);
        console.log(`   📦 Orders: ${restaurant.orders.length}`);

        if (restaurant.menuItems.length === 0 && restaurant.orders.length === 0) {
          console.log(`   💡 Recommendation: Safe to deactivate or remove`);
          
          if (!this.dryRun) {
            await prisma.restaurant.update({
              where: { id: restaurantId },
              data: { active: false }
            });
            console.log('   ✅ Deactivated');
          } else {
            console.log('   🚧 Would deactivate (dry run mode)');
          }
        } else {
          console.log(`   ⚠️  Has data - requires manual review`);
        }
        console.log('');

      } catch (error) {
        console.error(`   ❌ Error checking ${restaurantId}:`, error.message);
      }
    }
  }

  async validateUpdates() {
    console.log('🔍 Validating restaurant name updates...\n');

    const updatedRestaurants = await prisma.restaurant.findMany({
      where: {
        id: { in: Object.keys(UF_RESTAURANT_MAPPINGS) }
      }
    });

    let validCount = 0;
    let invalidCount = 0;

    for (const restaurant of updatedRestaurants) {
      const mapping = UF_RESTAURANT_MAPPINGS[restaurant.id];
      const isCorrect = restaurant.name === mapping.name;
      
      console.log(`${isCorrect ? '✅' : '❌'} ${restaurant.id}: ${restaurant.name}`);
      
      if (isCorrect) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`   Expected: ${mapping.name}`);
      }
    }

    console.log(`\n📊 Validation Results:`);
    console.log(`   ✅ Correct: ${validCount}`);
    console.log(`   ❌ Incorrect: ${invalidCount}`);
    
    return invalidCount === 0;
  }

  printSummary() {
    console.log('📊 Update Summary:');
    console.log(`   ✅ Successfully updated: ${this.updateCount}`);
    console.log(`   ⏭️  Skipped: ${this.skippedCount}`);
    console.log(`   ❌ Errors: ${this.errorCount}`);
    
    if (this.dryRun) {
      console.log('\n💡 This was a dry run. No changes were made.');
      console.log('   Run with --live to apply updates.');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--live');
  const validateOnly = args.includes('--validate');
  const handleInactive = args.includes('--inactive');

  const updater = new RestaurantNameUpdater(dryRun);

  try {
    if (validateOnly) {
      await updater.validateUpdates();
    } else if (handleInactive) {
      await updater.handleInactiveRestaurants();
    } else {
      await updater.updateRestaurantNames();
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Help text
if (process.argv.includes('--help')) {
  console.log(`
🍴 UF Restaurant Name Update Tool

Usage:
  node update-restaurant-names.js [options]

Options:
  --live        Apply updates to database (default: dry run)
  --validate    Only validate existing names
  --inactive    Handle inactive restaurants
  --help        Show this help

Examples:
  node update-restaurant-names.js                    # Dry run
  node update-restaurant-names.js --live             # Apply updates
  node update-restaurant-names.js --validate         # Check current state
  node update-restaurant-names.js --inactive --live  # Handle inactive restaurants
`);
  process.exit(0);
}

main();