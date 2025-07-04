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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const migrate_data_1 = __importDefault(require("./migrate-data"));
const migrate_images_1 = __importDefault(require("./migrate-images"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
class MigrationRunner {
    constructor() {
        this.backupPath = path.join(process.cwd(), 'migration-backups', `backup-${Date.now()}.sql`);
    }
    async runFullMigration() {
        try {
            console.log('🚀 Starting complete Xano to Supabase migration...');
            console.log('⏰ Started at:', new Date().toISOString());
            // Step 1: Pre-migration checks
            await this.preMigrationChecks();
            // Step 2: Create backup
            await this.createBackup();
            // Step 3: Run data migration
            console.log('\n📊 Starting data migration...');
            const dataMigrator = new migrate_data_1.default();
            await dataMigrator.migrate();
            await dataMigrator.validateMigration();
            // Step 4: Run image migration
            console.log('\n🖼️  Starting image migration...');
            const imageMigrator = new migrate_images_1.default();
            await imageMigrator.migrateImages();
            await imageMigrator.validateImageMigration();
            // Step 5: Post-migration validation
            await this.postMigrationValidation();
            console.log('\n🎉 Complete migration finished successfully!');
            console.log('⏰ Completed at:', new Date().toISOString());
            // Step 6: Cleanup recommendations
            this.printCleanupRecommendations();
        }
        catch (error) {
            console.error('\n❌ Migration failed:', error);
            console.log('\n🔧 To restore from backup, run:');
            console.log(`psql $DATABASE_URL < ${this.backupPath}`);
            throw error;
        }
        finally {
            await prisma.$disconnect();
        }
    }
    async preMigrationChecks() {
        console.log('🔍 Running pre-migration checks...');
        // Check if required environment variables are set
        const requiredEnvVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        // Check if Xano export files exist
        const xanoExportPath = '/Users/jackwarman/Downloads/workspace-1-1750959705';
        if (!fs.existsSync(xanoExportPath)) {
            throw new Error(`Xano export not found at: ${xanoExportPath}`);
        }
        // Check database connection
        try {
            await prisma.$connect();
            console.log('✅ Database connection successful');
        }
        catch (error) {
            throw new Error(`Database connection failed: ${error}`);
        }
        // Check current data in database
        const userCount = await prisma.user.count();
        const restaurantCount = await prisma.restaurant.count();
        const menuItemCount = await prisma.menuItem.count();
        console.log(`Current database state:`);
        console.log(`  Users: ${userCount}`);
        console.log(`  Restaurants: ${restaurantCount}`);
        console.log(`  Menu Items: ${menuItemCount}`);
        if (userCount > 0 || restaurantCount > 0 || menuItemCount > 0) {
            console.log('⚠️  Warning: Database contains existing data. Migration will add to existing data.');
            console.log('   Make sure you want to proceed or consider using a clean database.');
        }
        console.log('✅ Pre-migration checks completed');
    }
    async createBackup() {
        console.log('💾 Creating database backup...');
        // Create backup directory
        const backupDir = path.dirname(this.backupPath);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        // Note: This is a placeholder for backup creation
        // In a real scenario, you'd use pg_dump or similar tool
        console.log('⚠️  Note: Manual backup recommended before running migration.');
        console.log(`   Run: pg_dump $DATABASE_URL > ${this.backupPath}`);
        // Create a simple metadata backup
        const metadata = {
            timestamp: new Date().toISOString(),
            databaseUrl: process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@'), // Hide credentials
            userCount: await prisma.user.count(),
            restaurantCount: await prisma.restaurant.count(),
            menuItemCount: await prisma.menuItem.count()
        };
        fs.writeFileSync(path.join(backupDir, `metadata-${Date.now()}.json`), JSON.stringify(metadata, null, 2));
        console.log('✅ Backup metadata created');
    }
    async postMigrationValidation() {
        console.log('🔍 Running post-migration validation...');
        // Check data consistency
        const userCount = await prisma.user.count();
        const restaurantCount = await prisma.restaurant.count();
        const menuItemCount = await prisma.menuItem.count();
        const schoolCount = await prisma.school.count();
        console.log('\n📊 Final database state:');
        console.log(`  Schools: ${schoolCount}`);
        console.log(`  Users: ${userCount}`);
        console.log(`  Restaurants: ${restaurantCount}`);
        console.log(`  Menu Items: ${menuItemCount}`);
        // Check for data consistency
        const usersWithoutSchool = await prisma.user.count({
            where: {
                schoolId: null
            }
        });
        if (usersWithoutSchool > 0) {
            console.log(`⚠️  Warning: ${usersWithoutSchool} users without school assignment`);
        }
        // Test some basic queries
        try {
            const sampleUser = await prisma.user.findFirst({
                include: {
                    school: true
                }
            });
            const sampleRestaurant = await prisma.restaurant.findFirst({
                include: {
                    menuItems: true,
                    school: true
                }
            });
            console.log('✅ Sample queries successful');
            if (sampleUser) {
                console.log(`   Sample user: ${sampleUser.email} (${sampleUser.role})`);
            }
            if (sampleRestaurant) {
                console.log(`   Sample restaurant: ${sampleRestaurant.name} (${sampleRestaurant.menuItems.length} menu items)`);
            }
        }
        catch (error) {
            console.error('❌ Sample queries failed:', error);
        }
        console.log('✅ Post-migration validation completed');
    }
    printCleanupRecommendations() {
        console.log('\n🧹 Cleanup Recommendations:');
        console.log('');
        console.log('1. Update user passwords:');
        console.log('   - All users have been assigned temporary passwords');
        console.log('   - Send password reset emails to all migrated users');
        console.log('   - Consider implementing a "first login" flow');
        console.log('');
        console.log('2. Review restaurant ownership:');
        console.log('   - Restaurant ownership mappings need manual review');
        console.log('   - Assign proper restaurant owners based on business logic');
        console.log('');
        console.log('3. Test application functionality:');
        console.log('   - Test user authentication');
        console.log('   - Test menu browsing and ordering');
        console.log('   - Verify image display');
        console.log('');
        console.log('4. Clean up migration files:');
        console.log('   - Remove Xano export files if no longer needed');
        console.log('   - Archive migration scripts');
        console.log('');
        console.log('5. Monitor for issues:');
        console.log('   - Watch for any data inconsistencies');
        console.log('   - Monitor user feedback for missing data');
    }
    async runDataMigrationOnly() {
        console.log('📊 Running data migration only...');
        const dataMigrator = new migrate_data_1.default();
        await dataMigrator.migrate();
        await dataMigrator.validateMigration();
        console.log('✅ Data migration completed');
    }
    async runImageMigrationOnly() {
        console.log('🖼️  Running image migration only...');
        const imageMigrator = new migrate_images_1.default();
        await imageMigrator.migrateImages();
        await imageMigrator.validateImageMigration();
        console.log('✅ Image migration completed');
    }
}
// CLI interface
const command = process.argv[2];
const migrationRunner = new MigrationRunner();
switch (command) {
    case 'full':
        migrationRunner.runFullMigration().catch(console.error);
        break;
    case 'data':
        migrationRunner.runDataMigrationOnly().catch(console.error);
        break;
    case 'images':
        migrationRunner.runImageMigrationOnly().catch(console.error);
        break;
    default:
        console.log('🚀 Xano to Supabase Migration Tool');
        console.log('');
        console.log('Usage:');
        console.log('  npm run migrate:full     - Run complete migration (data + images)');
        console.log('  npm run migrate:data     - Run data migration only');
        console.log('  npm run migrate:images   - Run image migration only');
        console.log('');
        console.log('Environment variables required:');
        console.log('  DATABASE_URL             - PostgreSQL connection string');
        console.log('  SUPABASE_URL             - Supabase project URL');
        console.log('  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key');
        console.log('');
        break;
}
exports.default = MigrationRunner;
//# sourceMappingURL=run-migration.js.map