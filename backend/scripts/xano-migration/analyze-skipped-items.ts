import { MIGRATION_CONFIG, MigrationUtils, XanoMenuItem } from './migration-config';
import * as fs from 'fs';
import * as path from 'path';

interface SkippedItem {
  id: number;
  name: string | null;
  restaurantId: number | null;
  restaurantName: string | null;
  reason: string;
  price?: number;
  description?: string;
  available?: boolean;
}

interface RestaurantStats {
  id: number;
  name: string;
  totalItems: number;
  skippedItems: number;
  migratedItems: number;
  skipReasons: { [reason: string]: number };
}

class SkippedItemsAnalyzer {
  private allMenuItems: XanoMenuItem[] = [];
  private skippedItems: SkippedItem[] = [];
  private restaurantStats: Map<number, RestaurantStats> = new Map();
  private extractedRestaurants: Map<number, { name: string; id: number }> = new Map();

  async analyze() {
    console.log('🔍 Analyzing skipped menu items from Xano migration...\n');

    // Step 1: Load all menu items
    this.loadAllMenuItems();
    
    // Step 2: Extract restaurant information
    this.extractRestaurantInfo();
    
    // Step 3: Analyze each menu item
    this.analyzeMenuItems();
    
    // Step 4: Generate comprehensive report
    this.generateReport();
    
    // Step 5: Save detailed lists
    await this.saveDetailedReports();
  }

  private loadAllMenuItems() {
    console.log('📄 Loading all paginated menu item files...');
    this.allMenuItems = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.MENU_ITEMS);
    console.log(`✅ Loaded ${this.allMenuItems.length} total menu items\n`);
  }

  private extractRestaurantInfo() {
    console.log('🏪 Extracting restaurant information...');
    this.extractedRestaurants = MigrationUtils.extractRestaurantsFromMenuItems(this.allMenuItems);
    
    // Initialize restaurant stats
    for (const [restaurantId, restaurantData] of this.extractedRestaurants) {
      this.restaurantStats.set(restaurantId, {
        id: restaurantId,
        name: restaurantData.name,
        totalItems: 0,
        skippedItems: 0,
        migratedItems: 0,
        skipReasons: {}
      });
    }
    
    console.log(`✅ Found ${this.extractedRestaurants.size} unique restaurants\n`);
  }

  private analyzeMenuItems() {
    console.log('🔍 Analyzing each menu item...');
    
    for (const item of this.allMenuItems) {
      const restaurantId = item.restaurants_id;
      const restaurantName = item.Restauraunt_Name_aux;
      
      // Update restaurant stats
      if (restaurantId && this.restaurantStats.has(restaurantId)) {
        const stats = this.restaurantStats.get(restaurantId)!;
        stats.totalItems++;
      }
      
      // Check if item would be skipped
      const skipReason = this.getSkipReason(item);
      
      if (skipReason) {
        // Item would be skipped
        this.skippedItems.push({
          id: item.id,
          name: item.Menu_item_name || null,
          restaurantId: restaurantId,
          restaurantName: restaurantName || null,
          reason: skipReason,
          price: item.Menu_item_price,
          description: item.Menu_item_description || undefined,
          available: item.available
        });
        
        // Update restaurant stats
        if (restaurantId && this.restaurantStats.has(restaurantId)) {
          const stats = this.restaurantStats.get(restaurantId)!;
          stats.skippedItems++;
          stats.skipReasons[skipReason] = (stats.skipReasons[skipReason] || 0) + 1;
        }
      } else {
        // Item would be migrated
        if (restaurantId && this.restaurantStats.has(restaurantId)) {
          const stats = this.restaurantStats.get(restaurantId)!;
          stats.migratedItems++;
        }
      }
    }
    
    console.log(`✅ Analysis complete. Found ${this.skippedItems.length} items that would be skipped\n`);
  }

  private getSkipReason(item: XanoMenuItem): string | null {
    // Check for missing or empty name
    if (!item.Menu_item_name || item.Menu_item_name.trim() === '') {
      return 'Missing or empty menu item name';
    }
    
    // Check for missing restaurant ID
    if (!item.restaurants_id || item.restaurants_id === 0) {
      return 'Missing or invalid restaurant ID';
    }
    
    // Check if restaurant exists in our extracted restaurants
    if (!this.extractedRestaurants.has(item.restaurants_id)) {
      return 'Restaurant not found in extraction (orphaned item)';
    }
    
    // Check for test/placeholder data
    const name = item.Menu_item_name.toLowerCase();
    if (name.includes('test') || name.includes('placeholder') || name === 'delete' || name === 'temp') {
      return 'Test or placeholder data';
    }
    
    // Item would be migrated successfully
    return null;
  }

  private generateReport() {
    console.log('📊 XANO MENU ITEMS MIGRATION ANALYSIS REPORT');
    console.log('='.repeat(60));
    
    // Overall statistics
    const totalItems = this.allMenuItems.length;
    const skippedCount = this.skippedItems.length;
    const migratedCount = totalItems - skippedCount;
    const skipPercentage = ((skippedCount / totalItems) * 100).toFixed(1);
    
    console.log('\n📈 OVERALL STATISTICS');
    console.log('-'.repeat(30));
    console.log(`Total menu items in Xano export: ${totalItems}`);
    console.log(`Items that would be migrated: ${migratedCount} (${(100 - parseFloat(skipPercentage)).toFixed(1)}%)`);
    console.log(`Items that would be skipped: ${skippedCount} (${skipPercentage}%)`);
    
    // Skip reasons breakdown
    console.log('\n❌ SKIP REASONS BREAKDOWN');
    console.log('-'.repeat(30));
    const skipReasons: { [reason: string]: number } = {};
    for (const item of this.skippedItems) {
      skipReasons[item.reason] = (skipReasons[item.reason] || 0) + 1;
    }
    
    for (const [reason, count] of Object.entries(skipReasons)) {
      const percentage = ((count / skippedCount) * 100).toFixed(1);
      console.log(`${reason}: ${count} items (${percentage}%)`);
    }
    
    // Restaurant statistics
    console.log('\n🏪 RESTAURANT STATISTICS');
    console.log('-'.repeat(30));
    const sortedRestaurants = Array.from(this.restaurantStats.values())
      .sort((a, b) => b.totalItems - a.totalItems);
    
    for (const restaurant of sortedRestaurants) {
      const skipRate = restaurant.totalItems > 0 ? 
        ((restaurant.skippedItems / restaurant.totalItems) * 100).toFixed(1) : '0.0';
      
      console.log(`\n${restaurant.name} (ID: ${restaurant.id})`);
      console.log(`  Total items: ${restaurant.totalItems}`);
      console.log(`  Migrated: ${restaurant.migratedItems}`);
      console.log(`  Skipped: ${restaurant.skippedItems} (${skipRate}%)`);
      
      if (restaurant.skippedItems > 0) {
        console.log(`  Skip reasons:`);
        for (const [reason, count] of Object.entries(restaurant.skipReasons)) {
          console.log(`    - ${reason}: ${count}`);
        }
      }
    }
    
    // Items worth reviewing
    console.log('\n🔍 ITEMS WORTH REVIEWING');
    console.log('-'.repeat(30));
    
    const itemsWithNames = this.skippedItems.filter(item => 
      item.name && 
      !item.name.toLowerCase().includes('test') && 
      item.reason !== 'Test or placeholder data'
    );
    
    console.log(`Items with valid names that might be recoverable: ${itemsWithNames.length}`);
    
    if (itemsWithNames.length > 0) {
      console.log('\nSample recoverable items:');
      itemsWithNames.slice(0, 10).forEach(item => {
        console.log(`  - "${item.name}" (${item.restaurantName || 'Unknown Restaurant'}) - ${item.reason}`);
      });
      
      if (itemsWithNames.length > 10) {
        console.log(`  ... and ${itemsWithNames.length - 10} more`);
      }
    }
  }

  private async saveDetailedReports() {
    console.log('\n💾 Saving detailed reports...');
    
    const reportDir = path.join(process.cwd(), 'migration-analysis');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    // Save all skipped items
    const skippedItemsReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalItems: this.allMenuItems.length,
        skippedItems: this.skippedItems.length,
        migratedItems: this.allMenuItems.length - this.skippedItems.length
      },
      skippedItems: this.skippedItems,
      restaurantStats: Array.from(this.restaurantStats.values())
    };
    
    const skippedItemsPath = path.join(reportDir, 'skipped-menu-items.json');
    fs.writeFileSync(skippedItemsPath, JSON.stringify(skippedItemsReport, null, 2));
    console.log(`✅ Saved detailed skipped items report: ${skippedItemsPath}`);
    
    // Save recoverable items (items with names but missing restaurants)
    const recoverableItems = this.skippedItems.filter(item => 
      item.name && 
      item.name.trim() !== '' &&
      !item.name.toLowerCase().includes('test') &&
      item.reason !== 'Test or placeholder data'
    );
    
    const recoverablePath = path.join(reportDir, 'recoverable-menu-items.json');
    fs.writeFileSync(recoverablePath, JSON.stringify({
      timestamp: new Date().toISOString(),
      count: recoverableItems.length,
      items: recoverableItems
    }, null, 2));
    console.log(`✅ Saved recoverable items report: ${recoverablePath}`);
    
    // Save CSV for easy review
    const csvContent = [
      'ID,Name,Restaurant Name,Restaurant ID,Reason,Price,Description,Available',
      ...this.skippedItems.map(item => [
        item.id,
        `"${item.name || ''}"`,
        `"${item.restaurantName || ''}"`,
        item.restaurantId || '',
        `"${item.reason}"`,
        item.price ? (item.price / 100).toFixed(2) : '',
        `"${item.description || ''}"`,
        item.available !== undefined ? item.available : ''
      ].join(','))
    ].join('\n');
    
    const csvPath = path.join(reportDir, 'skipped-menu-items.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`✅ Saved CSV report: ${csvPath}`);
    
    console.log('\n📂 Reports saved in:', reportDir);
    console.log('   - skipped-menu-items.json (complete analysis)');
    console.log('   - recoverable-menu-items.json (items worth reviewing)');
    console.log('   - skipped-menu-items.csv (spreadsheet format)');
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new SkippedItemsAnalyzer();
  analyzer.analyze().catch(console.error);
}

export default SkippedItemsAnalyzer;