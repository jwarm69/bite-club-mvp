declare class MigrationRunner {
    private backupPath;
    constructor();
    runFullMigration(): Promise<void>;
    private preMigrationChecks;
    private createBackup;
    private postMigrationValidation;
    private printCleanupRecommendations;
    runDataMigrationOnly(): Promise<void>;
    runImageMigrationOnly(): Promise<void>;
}
export default MigrationRunner;
//# sourceMappingURL=run-migration.d.ts.map