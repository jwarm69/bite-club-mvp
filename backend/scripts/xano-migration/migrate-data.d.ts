export declare class XanoMigrator {
    private schoolId;
    private userMappings;
    private restaurantMappings;
    private categoryMappings;
    migrate(): Promise<void>;
    private setupSchool;
    private migrateUsers;
    private migrateRestaurants;
    private processCategories;
    private migrateMenuItems;
    validateMigration(): Promise<void>;
}
export default XanoMigrator;
//# sourceMappingURL=migrate-data.d.ts.map