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
export declare const MIGRATION_CONFIG: {
    XANO_EXPORT_PATH: string;
    XANO_CONTENT_PATH: string;
    XANO_VAULT_PATH: string;
    FILES: {
        USERS: string;
        MENU_ITEMS: string;
        CATEGORIES: string;
        CITIES: string;
        NOTIFICATIONS: string;
    };
    DEFAULTS: {
        SCHOOL_NAME: string;
        SCHOOL_DOMAIN: string;
        SCHOOL_LOCATION: string;
        DEFAULT_CITY: string;
    };
    FIELD_MAPPINGS: {
        USER: {
            id: (xanoUser: XanoUser) => string;
            email: (xanoUser: XanoUser) => string;
            firstName: (xanoUser: XanoUser) => string;
            lastName: (xanoUser: XanoUser) => string;
            phone: (xanoUser: XanoUser) => string;
            role: (xanoUser: XanoUser) => "STUDENT" | "RESTAURANT";
            creditBalance: (xanoUser: XanoUser) => string;
            active: () => boolean;
            createdAt: (xanoUser: XanoUser) => Date;
            updatedAt: (xanoUser: XanoUser) => Date;
        };
        MENU_ITEM: {
            id: (xanoItem: XanoMenuItem) => string;
            name: (xanoItem: XanoMenuItem) => string;
            description: (xanoItem: XanoMenuItem) => string | null;
            price: (xanoItem: XanoMenuItem) => string;
            category: (xanoItem: XanoMenuItem) => string | null;
            available: (xanoItem: XanoMenuItem) => boolean;
            createdAt: (xanoItem: XanoMenuItem) => Date;
            updatedAt: (xanoItem: XanoMenuItem) => Date;
        };
        CATEGORY: {
            id: (xanoCategory: XanoCategory) => string;
            name: (xanoCategory: XanoCategory) => string;
            description: (xanoCategory: XanoCategory) => string | null;
            createdAt: (xanoCategory: XanoCategory) => Date;
            updatedAt: (xanoCategory: XanoCategory) => Date;
        };
    };
};
export declare class MigrationUtils {
    static hashPassword(plainPassword: string): Promise<string>;
    static readXanoFile(fileName: string): any;
    static readAllPaginatedFiles(baseFileName: string): any[];
    static extractRestaurantsFromMenuItems(menuItems: XanoMenuItem[]): Map<number, {
        name: string;
        id: number;
    }>;
    static processImageUrl(xanoFile: XanoFile | null): string | null;
    static validateEmail(email: string): boolean;
    static cleanPhoneNumber(phone: string): string | null;
}
export default MIGRATION_CONFIG;
//# sourceMappingURL=migration-config.d.ts.map