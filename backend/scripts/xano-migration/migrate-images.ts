import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { MIGRATION_CONFIG, MigrationUtils, XanoMenuItem, XanoFile } from './migration-config';

const prisma = new PrismaClient();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class ImageMigrator {
  private migratedImages = new Map<string, string>(); // Xano path -> Supabase URL
  
  async migrateImages() {
    try {
      console.log('🖼️  Starting image migration from Xano vault to Supabase storage...');
      
      // Get all menu items that have images
      const xanoMenuItems: XanoMenuItem[] = MigrationUtils.readAllPaginatedFiles(MIGRATION_CONFIG.FILES.MENU_ITEMS);
      const itemsWithImages = xanoMenuItems.filter(item => item.Menu_item_image);
      
      console.log(`Found ${itemsWithImages.length} menu items with images to migrate.`);
      
      // Create storage bucket if it doesn't exist
      await this.ensureStorageBucket();
      
      // Migrate each image
      for (const item of itemsWithImages) {
        if (item.Menu_item_image) {
          await this.migrateImage(item.Menu_item_image, item.id);
        }
      }
      
      // Update menu items with new image URLs
      await this.updateMenuItemImageUrls();
      
      console.log('✅ Image migration completed successfully!');
      console.log(`Migrated ${this.migratedImages.size} images.`);
      
    } catch (error) {
      console.error('❌ Image migration failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  private async ensureStorageBucket() {
    const bucketName = 'menu-images';
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
      
      if (error) {
        throw new Error(`Failed to create storage bucket: ${error.message}`);
      }
      
      console.log(`✅ Created storage bucket: ${bucketName}`);
    } else {
      console.log(`✅ Using existing storage bucket: ${bucketName}`);
    }
  }
  
  private async migrateImage(xanoFile: XanoFile, menuItemId: number): Promise<void> {
    try {
      // Check if we've already migrated this image
      if (this.migratedImages.has(xanoFile.path)) {
        return;
      }
      
      // Construct the full path to the image in the Xano vault
      const xanoImagePath = path.join(MIGRATION_CONFIG.XANO_VAULT_PATH, xanoFile.path.replace('/vault/', ''));
      
      // Check if the file exists
      if (!fs.existsSync(xanoImagePath)) {
        console.log(`⚠️  Image file not found: ${xanoImagePath}`);
        return;
      }
      
      // Read the image file
      const imageBuffer = fs.readFileSync(xanoImagePath);
      
      // Generate a unique filename for Supabase storage
      const fileExtension = path.extname(xanoFile.name) || this.getExtensionFromMime(xanoFile.mime);
      const fileName = `menu-item-${menuItemId}-${Date.now()}${fileExtension}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, imageBuffer, {
          contentType: xanoFile.mime,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error(`❌ Failed to upload image ${xanoFile.name}:`, error);
        return;
      }
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Store the mapping
      this.migratedImages.set(xanoFile.path, publicUrl);
      
      console.log(`✅ Migrated image: ${xanoFile.name} -> ${fileName}`);
      
    } catch (error) {
      console.error(`❌ Failed to migrate image ${xanoFile.name}:`, error);
    }
  }
  
  private getExtensionFromMime(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };
    
    return mimeMap[mimeType] || '.jpg';
  }
  
  private async updateMenuItemImageUrls() {
    console.log('🔄 Updating menu item image URLs in database...');
    
    // Get all menu items that currently have Xano image references
    const menuItems = await prisma.menuItem.findMany({
      where: {
        imageUrl: {
          startsWith: 'xano:'
        }
      }
    });
    
    for (const menuItem of menuItems) {
      if (menuItem.imageUrl) {
        // Extract the Xano path from the stored reference
        const xanoPath = menuItem.imageUrl.replace('xano:', '');
        const supabaseUrl = this.migratedImages.get(xanoPath);
        
        if (supabaseUrl) {
          await prisma.menuItem.update({
            where: { id: menuItem.id },
            data: { imageUrl: supabaseUrl }
          });
          
          console.log(`✅ Updated image URL for menu item: ${menuItem.name}`);
        } else {
          console.log(`⚠️  No migrated image found for menu item: ${menuItem.name}`);
        }
      }
    }
  }
  
  async validateImageMigration() {
    console.log('🔍 Validating image migration...');
    
    const menuItemsWithImages = await prisma.menuItem.count({
      where: {
        imageUrl: {
          not: null
        }
      }
    });
    
    const menuItemsWithXanoImages = await prisma.menuItem.count({
      where: {
        imageUrl: {
          startsWith: 'xano:'
        }
      }
    });
    
    const menuItemsWithSupabaseImages = await prisma.menuItem.count({
      where: {
        imageUrl: {
          startsWith: supabaseUrl
        }
      }
    });
    
    console.log('\n📊 Image migration summary:');
    console.log(`Total menu items with images: ${menuItemsWithImages}`);
    console.log(`Items still with Xano image references: ${menuItemsWithXanoImages}`);
    console.log(`Items with Supabase image URLs: ${menuItemsWithSupabaseImages}`);
    console.log(`Images successfully migrated: ${this.migratedImages.size}`);
    
    if (menuItemsWithXanoImages > 0) {
      console.log('⚠️  Warning: Some menu items still have Xano image references. These images may not have been found in the vault.');
    }
  }
  
  async cleanupXanoReferences() {
    console.log('🧹 Cleaning up remaining Xano image references...');
    
    // Set imageUrl to null for any items that still have Xano references
    // (indicating the image couldn't be migrated)
    const { count } = await prisma.menuItem.updateMany({
      where: {
        imageUrl: {
          startsWith: 'xano:'
        }
      },
      data: {
        imageUrl: null
      }
    });
    
    console.log(`✅ Cleaned up ${count} remaining Xano image references.`);
  }
}

// Execute image migration if run directly
if (require.main === module) {
  const imageMigrator = new ImageMigrator();
  imageMigrator.migrateImages()
    .then(() => imageMigrator.validateImageMigration())
    .then(() => {
      console.log('\n🤔 Do you want to clean up remaining Xano references? (They will be set to null)');
      console.log('Run with --cleanup flag to automatically clean up.');
      
      if (process.argv.includes('--cleanup')) {
        return imageMigrator.cleanupXanoReferences();
      }
    })
    .catch(console.error);
}

export default ImageMigrator;