import { PrismaClient } from '@prisma/client';
import { 
  MIGRATION_CONFIG, 
  MigrationUtils, 
  XanoUser, 
  XanoMenuItem, 
  XanoCategory, 
  XanoCity 
} from './migration-config';

const prisma = new PrismaClient();

export class XanoMigrator {
  private schoolId: string | null = null;
  private userMappings = new Map<number, string>(); // Xano ID -> Supabase ID
  private restaurantMappings = new Map<number, string>(); // Xano ID -> Supabase ID
  private categoryMappings = new Map<number, string>(); // Xano ID -> Supabase ID
  
  async migrate() {
    try {
      console.log('🚀 Starting Xano to Supabase migration...');
      
      // Step 1: Create or find school
      await this.setupSchool();
      
      // Step 2: Migrate users
      await this.migrateUsers();
      
      // Step 3: Extract and create restaurants from menu items
      await this.migrateRestaurants();
      
      // Step 4: Migrate menu categories (but don't create them yet - they'll be categories on items)
      await this.processCategories();
      
      // Step 5: Migrate menu items
      await this.migrateMenuItems();
      
      console.log('✅ Migration completed successfully!');
      console.log('\n📊 Migration Summary:');
      console.log(`Users migrated: ${this.userMappings.size}`);
      console.log(`Restaurants created: ${this.restaurantMappings.size}`);
      console.log(`Categories processed: ${this.categoryMappings.size}`);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  private async setupSchool() {
    console.log('🏫 Setting up school...');
    
    // Check if school already exists
    let school = await prisma.school.findUnique({
      where: { domain: MIGRATION_CONFIG.DEFAULTS.SCHOOL_DOMAIN }
    });
    
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: MIGRATION_CONFIG.DEFAULTS.SCHOOL_NAME,
          domain: MIGRATION_CONFIG.DEFAULTS.SCHOOL_DOMAIN,
          location: MIGRATION_CONFIG.DEFAULTS.SCHOOL_LOCATION,
          active: true
        }
      });
      console.log(`Created school: ${school.name}`);
    } else {
      console.log(`Using existing school: ${school.name}`);
    }
    
    this.schoolId = school.id;
  }
  
  private async migrateUsers() {
    console.log('👥 Migrating users...');
    
    const xanoUsers: XanoUser[] = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.USERS);
    
    for (const xanoUser of xanoUsers) {
      try {
        // Skip users with invalid emails
        if (!xanoUser.email || !MigrationUtils.validateEmail(xanoUser.email)) {
          console.log(`⚠️  Skipping user ${xanoUser.id} - invalid email: ${xanoUser.email}`);
          continue;
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: xanoUser.email }
        });
        
        if (existingUser) {
          console.log(`⚠️  User ${xanoUser.email} already exists, skipping...`);
          this.userMappings.set(xanoUser.id, existingUser.id);
          continue;
        }
        
        const userData = {
          id: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.id(xanoUser),
          email: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.email(xanoUser),
          passwordHash: await MigrationUtils.hashPassword(xanoUser.password),
          role: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.role(xanoUser),
          schoolId: this.schoolId,
          creditBalance: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.creditBalance(xanoUser),
          firstName: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.firstName(xanoUser) || null,
          lastName: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.lastName(xanoUser) || null,
          phone: MigrationUtils.cleanPhoneNumber(MIGRATION_CONFIG.FIELD_MAPPINGS.USER.phone(xanoUser)),
          active: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.active(),
          createdAt: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.createdAt(xanoUser),
          updatedAt: MIGRATION_CONFIG.FIELD_MAPPINGS.USER.updatedAt(xanoUser)
        };
        
        const newUser = await prisma.user.create({ data: userData });
        this.userMappings.set(xanoUser.id, newUser.id);
        
        console.log(`✅ Migrated user: ${newUser.email} (${newUser.role})`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate user ${xanoUser.id}:`, error);
      }
    }
    
    console.log(`✅ Users migration completed. Migrated ${this.userMappings.size} users.`);
  }
  
  private async migrateRestaurants() {
    console.log('🍴 Creating restaurants from menu items...');
    
    const xanoMenuItems: XanoMenuItem[] = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.MENU_ITEMS);
    const restaurants = MigrationUtils.extractRestaurantsFromMenuItems(xanoMenuItems);
    
    for (const [xanoRestaurantId, restaurantData] of restaurants) {
      try {
        const restaurantId = `xano_restaurant_${xanoRestaurantId}`;
        
        // Check if restaurant already exists
        const existingRestaurant = await prisma.restaurant.findUnique({
          where: { id: restaurantId }
        });
        
        if (existingRestaurant) {
          console.log(`⚠️  Restaurant ${restaurantData.name} already exists, skipping...`);
          this.restaurantMappings.set(xanoRestaurantId, existingRestaurant.id);
          continue;
        }
        
        const newRestaurant = await prisma.restaurant.create({
          data: {
            id: restaurantId,
            name: restaurantData.name,
            schoolId: this.schoolId!,
            userId: null, // We don't have clear ownership mapping from Xano
            description: `Migrated from Xano - ${restaurantData.name}`,
            active: true,
            callEnabled: true,
            callRetries: 2,
            callTimeoutSeconds: 30
          }
        });
        
        this.restaurantMappings.set(xanoRestaurantId, newRestaurant.id);
        console.log(`✅ Created restaurant: ${newRestaurant.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to create restaurant ${xanoRestaurantId}:`, error);
      }
    }
    
    console.log(`✅ Restaurant creation completed. Created ${this.restaurantMappings.size} restaurants.`);
  }
  
  private async processCategories() {
    console.log('📂 Processing categories...');
    
    const xanoCategories: XanoCategory[] = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.CATEGORIES);
    
    // We'll store category mappings but not create separate entities
    // Instead, we'll use the category names as strings on menu items
    for (const xanoCategory of xanoCategories) {
      if (xanoCategory.Category_name && xanoCategory.Category_name.trim() !== '') {
        this.categoryMappings.set(xanoCategory.id, xanoCategory.Category_name);
      }
    }
    
    console.log(`✅ Processed ${this.categoryMappings.size} categories.`);
  }
  
  private async migrateMenuItems() {
    console.log('🍕 Migrating menu items...');
    
    const xanoMenuItems: XanoMenuItem[] = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.MENU_ITEMS);
    
    for (const xanoItem of xanoMenuItems) {
      try {
        // Skip items without names or invalid restaurants
        if (!xanoItem.Menu_item_name || !this.restaurantMappings.has(xanoItem.restaurants_id)) {
          console.log(`⚠️  Skipping menu item ${xanoItem.id} - missing name or invalid restaurant`);
          continue;
        }
        
        const itemId = MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.id(xanoItem);
        
        // Check if menu item already exists
        const existingMenuItem = await prisma.menuItem.findUnique({
          where: { id: itemId }
        });
        
        if (existingMenuItem) {
          console.log(`⚠️  Menu item ${xanoItem.Menu_item_name} already exists, skipping...`);
          continue;
        }
        
        const restaurantId = this.restaurantMappings.get(xanoItem.restaurants_id)!;
        const categoryName = this.categoryMappings.get(xanoItem.menu_categories_id) || null;
        
        const menuItemData = {
          id: itemId,
          restaurantId: restaurantId,
          name: MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.name(xanoItem),
          description: MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.description(xanoItem),
          price: MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.price(xanoItem),
          category: categoryName,
          imageUrl: MigrationUtils.processImageUrl(xanoItem.Menu_item_image),
          available: MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.available(xanoItem),
          createdAt: MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.createdAt(xanoItem),
          updatedAt: MIGRATION_CONFIG.FIELD_MAPPINGS.MENU_ITEM.updatedAt(xanoItem)
        };
        
        const newMenuItem = await prisma.menuItem.create({ data: menuItemData });
        console.log(`✅ Migrated menu item: ${newMenuItem.name} (${newMenuItem.price})`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate menu item ${xanoItem.id}:`, error);
      }
    }
    
    console.log('✅ Menu items migration completed.');
  }
  
  async validateMigration() {
    console.log('🔍 Validating migration...');
    
    const userCount = await prisma.user.count();
    const restaurantCount = await prisma.restaurant.count();
    const menuItemCount = await prisma.menuItem.count();
    const schoolCount = await prisma.school.count();
    
    console.log('\n📊 Database counts after migration:');
    console.log(`Schools: ${schoolCount}`);
    console.log(`Users: ${userCount}`);
    console.log(`Restaurants: ${restaurantCount}`);
    console.log(`Menu Items: ${menuItemCount}`);
    
    // Check for any obvious data issues
    const usersWithoutSchool = await prisma.user.count({ where: { schoolId: null } });
    const menuItemsWithoutPrice = await prisma.menuItem.count({ where: { price: '0' } });
    
    if (usersWithoutSchool > 0) {
      console.log(`⚠️  Warning: ${usersWithoutSchool} users without school assignment`);
    }
    
    if (menuItemsWithoutPrice > 0) {
      console.log(`⚠️  Warning: ${menuItemsWithoutPrice} menu items with $0 price`);
    }
    
    console.log('✅ Migration validation completed.');
  }
}

// Execute migration if run directly
if (require.main === module) {
  const migrator = new XanoMigrator();
  migrator.migrate()
    .then(() => migrator.validateMigration())
    .catch(console.error);
}

export default XanoMigrator;