import { PrismaClient } from '@prisma/client';
import { MIGRATION_CONFIG, MigrationUtils } from './migration-config';
import * as fs from 'fs';

const prisma = new PrismaClient();

class MigrationTester {
  async testPrerequisites() {
    console.log('🧪 Testing migration prerequisites...\n');
    
    let allPassed = true;
    
    // Test 1: Environment variables
    console.log('1️⃣  Testing environment variables...');
    const requiredEnvVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      allPassed = false;
    } else {
      console.log('✅ All environment variables present');
    }
    
    // Test 2: Database connection
    console.log('\n2️⃣  Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.log(`❌ Database connection failed: ${error}`);
      allPassed = false;
    }
    
    // Test 3: Xano export files
    console.log('\n3️⃣  Testing Xano export files...');
    const contentPath = MIGRATION_CONFIG.XANO_CONTENT_PATH;
    
    if (!fs.existsSync(contentPath)) {
      console.log(`❌ Xano content directory not found: ${contentPath}`);
      allPassed = false;
    } else {
      console.log('✅ Xano content directory found');
      
      // Check individual files
      for (const [tableName, fileName] of Object.entries(MIGRATION_CONFIG.FILES)) {
        const filePath = `${contentPath}/${fileName}`;
        if (fs.existsSync(filePath)) {
          console.log(`✅ ${tableName} file found: ${fileName}`);
        } else {
          console.log(`❌ ${tableName} file missing: ${fileName}`);
          allPassed = false;
        }
      }
    }
    
    // Test 4: Xano vault directory
    console.log('\n4️⃣  Testing Xano vault directory...');
    const vaultPath = MIGRATION_CONFIG.XANO_VAULT_PATH;
    
    if (!fs.existsSync(vaultPath)) {
      console.log(`❌ Xano vault directory not found: ${vaultPath}`);
      console.log('   (Image migration will be skipped)');
    } else {
      const vaultContents = fs.readdirSync(vaultPath);
      console.log(`✅ Xano vault directory found with ${vaultContents.length} items`);
    }
    
    // Test 5: Parse sample data
    console.log('\n5️⃣  Testing data parsing...');
    try {
      console.log('   Reading paginated files...');
      const users = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.USERS);
      const menuItems = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.MENU_ITEMS);
      const categories = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.CATEGORIES);
      
      console.log(`✅ Data parsing successful:`);
      console.log(`   Users: ${users.length}`);
      console.log(`   Menu Items: ${menuItems.length}`);
      console.log(`   Categories: ${categories.length}`);
      
      // Sample data validation
      if (users.length > 0) {
        const sampleUser = users[0];
        console.log(`   Sample user: ${sampleUser.email || 'N/A'} (${sampleUser.role || 'N/A'})`);
      }
      
      if (menuItems.length > 0) {
        const sampleItem = menuItems[0];
        console.log(`   Sample menu item: ${sampleItem.Menu_item_name || 'N/A'} ($${(sampleItem.Menu_item_price || 0)/100})`);
      }
      
    } catch (error) {
      console.log(`❌ Data parsing failed: ${error}`);
      allPassed = false;
    }
    
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('🎉 All prerequisites passed! Ready for migration.');
      console.log('\nTo run migration:');
      console.log('  npm run migrate:full     # Complete migration');
      console.log('  npm run migrate:data     # Data only');
      console.log('  npm run migrate:images   # Images only');
    } else {
      console.log('❌ Some prerequisites failed. Please fix issues above before migration.');
    }
    
    return allPassed;
  }
  
  async testCurrentDatabase() {
    console.log('\n📊 Current database state:');
    
    try {
      const userCount = await prisma.user.count();
      const restaurantCount = await prisma.restaurant.count();
      const menuItemCount = await prisma.menuItem.count();
      const schoolCount = await prisma.school.count();
      
      console.log(`   Schools: ${schoolCount}`);
      console.log(`   Users: ${userCount}`);
      console.log(`   Restaurants: ${restaurantCount}`);
      console.log(`   Menu Items: ${menuItemCount}`);
      
      if (userCount > 0 || restaurantCount > 0 || menuItemCount > 0) {
        console.log('\n⚠️  Database contains existing data.');
        console.log('   Migration will add to existing data, not replace it.');
      } else {
        console.log('\n✅ Database is empty - perfect for migration.');
      }
      
    } catch (error) {
      console.log(`❌ Database query failed: ${error}`);
    }
  }
  
  async simulateDataTransformation() {
    console.log('\n🔄 Simulating data transformation...');
    
    try {
      const users = MigrationUtils.readXanoFile(MIGRATION_CONFIG.FILES.USERS);
      const menuItems = MigrationUtils.readXanoFile(MIGRATION_CONFIG.FILES.MENU_ITEMS);
      
      // Test user transformation
      if (users.length > 0) {
        const sampleUser = users[0];
        console.log('\n👤 Sample user transformation:');
        console.log(`   Xano: ${sampleUser.name} ${sampleUser.lastname} (${sampleUser.email})`);
        console.log(`   → firstName: "${sampleUser.name}"`);
        console.log(`   → lastName: "${sampleUser.lastname}"`);
        console.log(`   → role: "${sampleUser.role.toUpperCase()}"`);
        console.log(`   → creditBalance: "$${(sampleUser.credit_balance / 100).toFixed(2)}"`);
        console.log(`   → phone: "${MigrationUtils.cleanPhoneNumber(sampleUser.Phone_Number)}"`);
      }
      
      // Test menu item transformation
      if (menuItems.length > 0) {
        const sampleItem = menuItems[0];
        console.log('\n🍔 Sample menu item transformation:');
        console.log(`   Xano: ${sampleItem.Menu_item_name} ($${sampleItem.Menu_item_price/100})`);
        console.log(`   → name: "${sampleItem.Menu_item_name}"`);
        console.log(`   → price: "$${(sampleItem.Menu_item_price / 100).toFixed(2)}"`);
        console.log(`   → available: ${sampleItem.available}`);
        if (sampleItem.Menu_item_image) {
          console.log(`   → image: "${sampleItem.Menu_item_image.name}"`);
        }
      }
      
      // Test restaurant extraction
      console.log('\n🔄 Analyzing restaurant data...');
      const restaurants = MigrationUtils.extractRestaurantsFromMenuItems(menuItems);
      console.log(`\n🏪 Restaurants to create: ${restaurants.size}`);
      let count = 0;
      for (const [id, restaurant] of restaurants) {
        if (count < 3) {
          console.log(`   → ${restaurant.name} (ID: ${id})`);
          count++;
        }
      }
      if (restaurants.size > 3) {
        console.log(`   ... and ${restaurants.size - 3} more`);
      }
      
    } catch (error) {
      console.log(`❌ Simulation failed: ${error}`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new MigrationTester();
  
  (async () => {
    try {
      const passed = await tester.testPrerequisites();
      
      if (passed) {
        await tester.testCurrentDatabase();
        await tester.simulateDataTransformation();
      }
      
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  })();
}

export default MigrationTester;