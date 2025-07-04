declare class MigrationTester {
    testPrerequisites(): Promise<boolean>;
    testCurrentDatabase(): Promise<void>;
    simulateDataTransformation(): Promise<void>;
}
export default MigrationTester;
//# sourceMappingURL=test-migration.d.ts.map