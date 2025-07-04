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
exports.MigrationUtils = exports.MIGRATION_CONFIG = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Mapping configuration for Xano to Supabase migration
exports.MIGRATION_CONFIG = {
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
            'id': (xanoUser) => `xano_${xanoUser.id}`,
            'email': (xanoUser) => xanoUser.email,
            'firstName': (xanoUser) => xanoUser.name,
            'lastName': (xanoUser) => xanoUser.lastname,
            'phone': (xanoUser) => xanoUser.Phone_Number,
            'role': (xanoUser) => (xanoUser.role || 'student').toUpperCase(),
            'creditBalance': (xanoUser) => (xanoUser.credit_balance / 100).toString(), // Convert cents to dollars
            'active': () => true,
            'createdAt': (xanoUser) => new Date(xanoUser.created_at),
            'updatedAt': (xanoUser) => new Date(xanoUser.Updated_at || xanoUser.created_at)
        },
        MENU_ITEM: {
            'id': (xanoItem) => `xano_item_${xanoItem.id}`,
            'name': (xanoItem) => xanoItem.Menu_item_name,
            'description': (xanoItem) => xanoItem.Menu_item_description || null,
            'price': (xanoItem) => (xanoItem.Menu_item_price / 100).toString(), // Convert cents to dollars
            'category': (xanoItem) => xanoItem.Restauraunt_Name_aux || null,
            'available': (xanoItem) => xanoItem.available,
            'createdAt': (xanoItem) => new Date(xanoItem.created_at),
            'updatedAt': (xanoItem) => new Date(xanoItem.updated_at || xanoItem.created_at)
        },
        CATEGORY: {
            'id': (xanoCategory) => `xano_cat_${xanoCategory.id}`,
            'name': (xanoCategory) => xanoCategory.Category_name,
            'description': (xanoCategory) => xanoCategory.category_description || null,
            'createdAt': (xanoCategory) => new Date(xanoCategory.created_at),
            'updatedAt': (xanoCategory) => new Date(xanoCategory.updated_at || xanoCategory.created_at)
        }
    }
};
// Utility functions
class MigrationUtils {
    static async hashPassword(plainPassword) {
        // For Xano passwords that are already hashed, we'll create new ones
        // or use a default secure password that users will need to reset
        return await bcrypt.hash('TempPassword123!', 10);
    }
    static readXanoFile(fileName) {
        const filePath = path.join(exports.MIGRATION_CONFIG.XANO_CONTENT_PATH, fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Xano file not found: ${filePath}`);
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);
        return jsonData.payload || jsonData;
    }
    static readAllPaginatedFiles(baseFileName) {
        const baseName = baseFileName.replace('-1.json', '');
        const allData = [];
        let pageNumber = 1;
        while (true) {
            const fileName = `${baseName}-${pageNumber}.json`;
            const filePath = path.join(exports.MIGRATION_CONFIG.XANO_CONTENT_PATH, fileName);
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
    static extractRestaurantsFromMenuItems(menuItems) {
        const restaurants = new Map();
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
    static processImageUrl(xanoFile) {
        if (!xanoFile)
            return null;
        // For now, we'll store the Xano path as reference
        // In the next phase, we'll migrate these to Supabase storage
        return `xano:${xanoFile.path}`;
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static cleanPhoneNumber(phone) {
        if (!phone || phone.trim() === '')
            return null;
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        // Return null if it's too short or clearly invalid
        if (cleaned.length < 10)
            return null;
        return cleaned;
    }
}
exports.MigrationUtils = MigrationUtils;
exports.default = exports.MIGRATION_CONFIG;
//# sourceMappingURL=migration-config.js.map