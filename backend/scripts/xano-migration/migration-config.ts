import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

export interface XanoFile {
  access: string;
  path: string;
  name: string;
  type: string;
  size: number;
  mime: string;
  meta?: any;
}

export interface XanoUser {
  id: number;
  created_at: number;
  name: string;
  lastname: string;
  email: string;
  password: string;
  Phone_Number: string;
  credit_balance: number;
  Updated_at: number;
  Push_token: string;
  role: 'student' | 'restaurant';
  cities_id: number;
  needs_refill: boolean;
  google_oauth: {
    id: string;
    name: string;
    email: string;
  };
}

export interface XanoMenuItem {
  id: number;
  created_at: number;
  menu_categories_id: number;
  restaurants_id: number;
  Menu_item_name: string;
  Menu_item_description: string;
  updated_at: number | null;
  Menu_item_price: number;
  Restauraunt_Name_aux: string;
  available: boolean;
  Menu_item_image: XanoFile | null;
}

export interface XanoCategory {
  id: number;
  created_at: number;
  restaurants_id: number;
  Category_name: string;
  category_description: string;
  updated_at: number | null;
  availability_id: number;
}

export interface XanoCity {
  id: number;
  created_at: number;
  name: string;
}

// Mapping configuration for Xano to Supabase migration
export const MIGRATION_CONFIG = {
  // File paths for Xano exports
  XANO_EXPORT_PATH: '/Users/jackwarman/Downloads/workspace-1-1750959705',
  XANO_CONTENT_PATH: '/Users/jackwarman/Downloads/workspace-1-1750959705/content',
  XANO_VAULT_PATH: '/Users/jackwarman/Downloads/workspace-1-1750959705/vault',
  
  // File mappings based on your Xano export structure
  FILES: {
    USERS: '4z_bYGw9y8nPLD7Uz991W54wcTM-1.json',
    MENU_ITEMS: 'kbAJekx99e12pH855L5fxNTaYDk-1.json', 
    CATEGORIES: '4DpFq-zw5VyqBZ0Y0mJLOWuODvY-1.json',
    CITIES: 'ARc1lXjIw0H73LWqteTgiaGU3C4-1.json',
    NOTIFICATIONS: 'CFrtmncBHzBk8GULIcHsMPycaDo-1.json'
  },
  
  // Default values for new fields not in Xano
  DEFAULTS: {
    SCHOOL_NAME: 'University of Florida',
    SCHOOL_DOMAIN: 'ufl.edu',
    SCHOOL_LOCATION: 'Gainesville, FL',
    DEFAULT_CITY: 'Gainesville'
  },
  
  // Field mappings
  FIELD_MAPPINGS: {
    USER: {
      'id': (xanoUser: XanoUser) => `xano_${xanoUser.id}`,
      'email': (xanoUser: XanoUser) => xanoUser.email,
      'firstName': (xanoUser: XanoUser) => xanoUser.name,
      'lastName': (xanoUser: XanoUser) => xanoUser.lastname,
      'phone': (xanoUser: XanoUser) => xanoUser.Phone_Number,
      'role': (xanoUser: XanoUser) => (xanoUser.role || 'student').toUpperCase() as 'STUDENT' | 'RESTAURANT',
      'creditBalance': (xanoUser: XanoUser) => (xanoUser.credit_balance / 100).toString(), // Convert cents to dollars
      'active': () => true,
      'createdAt': (xanoUser: XanoUser) => new Date(xanoUser.created_at),
      'updatedAt': (xanoUser: XanoUser) => new Date(xanoUser.Updated_at || xanoUser.created_at)
    },
    
    MENU_ITEM: {
      'id': (xanoItem: XanoMenuItem) => `xano_item_${xanoItem.id}`,
      'name': (xanoItem: XanoMenuItem) => xanoItem.Menu_item_name,
      'description': (xanoItem: XanoMenuItem) => xanoItem.Menu_item_description || null,
      'price': (xanoItem: XanoMenuItem) => (xanoItem.Menu_item_price / 100).toString(), // Convert cents to dollars
      'category': (xanoItem: XanoMenuItem) => xanoItem.Restauraunt_Name_aux || null,
      'available': (xanoItem: XanoMenuItem) => xanoItem.available,
      'createdAt': (xanoItem: XanoMenuItem) => new Date(xanoItem.created_at),
      'updatedAt': (xanoItem: XanoMenuItem) => new Date(xanoItem.updated_at || xanoItem.created_at)
    },
    
    CATEGORY: {
      'id': (xanoCategory: XanoCategory) => `xano_cat_${xanoCategory.id}`,
      'name': (xanoCategory: XanoCategory) => xanoCategory.Category_name,
      'description': (xanoCategory: XanoCategory) => xanoCategory.category_description || null,
      'createdAt': (xanoCategory: XanoCategory) => new Date(xanoCategory.created_at),
      'updatedAt': (xanoCategory: XanoCategory) => new Date(xanoCategory.updated_at || xanoCategory.created_at)
    }
  }
};

// Utility functions
export class MigrationUtils {
  static async hashPassword(plainPassword: string): Promise<string> {
    // For Xano passwords that are already hashed, we'll create new ones
    // or use a default secure password that users will need to reset
    return await bcrypt.hash('TempPassword123!', 10);
  }
  
  static readXanoFile(fileName: string): any {
    const filePath = path.join(MIGRATION_CONFIG.XANO_CONTENT_PATH, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Xano file not found: ${filePath}`);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    return jsonData.payload || jsonData;
  }
  
  static readAllPaginatedFiles(baseFileName: string): any[] {
    const baseName = baseFileName.replace('-1.json', '');
    const allData: any[] = [];
    let pageNumber = 1;
    
    while (true) {
      const fileName = `${baseName}-${pageNumber}.json`;
      const filePath = path.join(MIGRATION_CONFIG.XANO_CONTENT_PATH, fileName);
      
      if (!fs.existsSync(filePath)) {
        break; // No more pages
      }
      
      console.log(`📄 Reading page ${pageNumber}: ${fileName}`);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      const pageData = jsonData.payload || jsonData;
      
      allData.push(...pageData);
      pageNumber++;
    }
    
    console.log(`✅ Read ${pageNumber - 1} pages, total records: ${allData.length}`);
    return allData;
  }
  
  static extractRestaurantsFromMenuItems(menuItems: XanoMenuItem[]): Map<number, { name: string; id: number }> {
    const restaurants = new Map<number, { name: string; id: number }>();
    
    menuItems.forEach(item => {
      if (item.restaurants_id && !restaurants.has(item.restaurants_id)) {
        restaurants.set(item.restaurants_id, {
          id: item.restaurants_id,
          name: item.Restauraunt_Name_aux || `Restaurant ${item.restaurants_id}`
        });
      }
    });
    
    return restaurants;
  }
  
  static processImageUrl(xanoFile: XanoFile | null): string | null {
    if (!xanoFile) return null;
    
    // For now, we'll store the Xano path as reference
    // In the next phase, we'll migrate these to Supabase storage
    return `xano:${xanoFile.path}`;
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static cleanPhoneNumber(phone: string): string | null {
    if (!phone || phone.trim() === '') return null;
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Return null if it's too short or clearly invalid
    if (cleaned.length < 10) return null;
    
    return cleaned;
  }
}

export default MIGRATION_CONFIG;