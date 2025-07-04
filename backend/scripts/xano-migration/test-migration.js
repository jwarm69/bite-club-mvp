"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const migration_config_1 = require("./migration-config");
const fs = __importStar(require("fs"));
const prisma = new client_1.PrismaClient();
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
        }
        else {
            console.log('✅ All environment variables present');
        }
        // Test 2: Database connection
        console.log('\n2️⃣  Testing database connection...');
        try {
            await prisma.$connect();
            console.log('✅ Database connection successful');
        }
        catch (error) {
            console.log(`❌ Database connection failed: ${error}`);
            allPassed = false;
        }
        // Test 3: Xano export files
        console.log('\n3️⃣  Testing Xano export files...');
        const contentPath = migration_config_1.MIGRATION_CONFIG.XANO_CONTENT_PATH;
        if (!fs.existsSync(contentPath)) {
            console.log(`❌ Xano content directory not found: ${contentPath}`);
            allPassed = false;
        }
        else {
            console.log('✅ Xano content directory found');
            // Check individual files
            for (const [tableName, fileName] of Object.entries(migration_config_1.MIGRATION_CONFIG.FILES)) {
                const filePath = `${contentPath}/${fileName}`;
                if (fs.existsSync(filePath)) {
                    console.log(`✅ ${tableName} file found: ${fileName}`);
                }
                else {
                    console.log(`❌ ${tableName} file missing: ${fileName}`);
                    allPassed = false;
                }
            }
        }
        // Test 4: Xano vault directory
        console.log('\n4️⃣  Testing Xano vault directory...');
        const vaultPath = migration_config_1.MIGRATION_CONFIG.XANO_VAULT_PATH;
        if (!fs.existsSync(vaultPath)) {
            console.log(`❌ Xano vault directory not found: ${vaultPath}`);
            console.log('   (Image migration will be skipped)');
        }
        else {
            const vaultContents = fs.readdirSync(vaultPath);
            console.log(`✅ Xano vault directory found with ${vaultContents.length} items`);
        }
        // Test 5: Parse sample data
        console.log('\n5️⃣  Testing data parsing...');
        try {
            console.log('   Reading paginated files...');
            const users = migration_config_1.MigrationUtils.readAllPaginatedFiles(migration_config_1.MIGRATION_CONFIG.FILES.USERS);
            const menuItems = migration_config_1.MigrationUtils.readAllPaginatedFiles(migration_config_1.MIGRATION_CONFIG.FILES.MENU_ITEMS);
            const categories = migration_config_1.MigrationUtils.readAllPaginatedFiles(migration_config_1.MIGRATION_CONFIG.FILES.CATEGORIES);
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
                console.log(`   Sample menu item: ${sampleItem.Menu_item_name || 'N/A'} ($${(sampleItem.Menu_item_price || 0) / 100})`);
            }
        }
        catch (error) {
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
        }
        else {
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
            }
            else {
                console.log('\n✅ Database is empty - perfect for migration.');
            }
        }
        catch (error) {
            console.log(`❌ Database query failed: ${error}`);
        }
    }
    async simulateDataTransformation() {
        console.log('\n🔄 Simulating data transformation...');
        try {
            const users = migration_config_1.MigrationUtils.readXanoFile(migration_config_1.MIGRATION_CONFIG.FILES.USERS);
            const menuItems = migration_config_1.MigrationUtils.readXanoFile(migration_config_1.MIGRATION_CONFIG.FILES.MENU_ITEMS);
            // Test user transformation
            if (users.length > 0) {
                const sampleUser = users[0];
                console.log('\n👤 Sample user transformation:');
                console.log(`   Xano: ${sampleUser.name} ${sampleUser.lastname} (${sampleUser.email})`);
                console.log(`   → firstName: "${sampleUser.name}"`);
                console.log(`   → lastName: "${sampleUser.lastname}"`);
                console.log(`   → role: "${sampleUser.role.toUpperCase()}"`);
                console.log(`   → creditBalance: "$${(sampleUser.credit_balance / 100).toFixed(2)}"`);
                console.log(`   → phone: "${migration_config_1.MigrationUtils.cleanPhoneNumber(sampleUser.Phone_Number)}"`);
            }
            // Test menu item transformation
            if (menuItems.length > 0) {
                const sampleItem = menuItems[0];
                console.log('\n🍔 Sample menu item transformation:');
                console.log(`   Xano: ${sampleItem.Menu_item_name} ($${sampleItem.Menu_item_price / 100})`);
                console.log(`   → name: "${sampleItem.Menu_item_name}"`);
                console.log(`   → price: "$${(sampleItem.Menu_item_price / 100).toFixed(2)}"`);
                console.log(`   → available: ${sampleItem.available}`);
                if (sampleItem.Menu_item_image) {
                    console.log(`   → image: "${sampleItem.Menu_item_image.name}"`);
                }
            }
            // Test restaurant extraction
            console.log('\n🔄 Analyzing restaurant data...');
            const restaurants = migration_config_1.MigrationUtils.extractRestaurantsFromMenuItems(menuItems);
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Test failed:', error);
        }
        finally {
            await prisma.$disconnect();
        }
    })();
}
exports.default = MigrationTester;
//# sourceMappingURL=test-migration.js.map