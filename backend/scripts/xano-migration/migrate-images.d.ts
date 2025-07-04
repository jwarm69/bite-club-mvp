export declare class ImageMigrator {
    private migratedImages;
    migrateImages(): Promise<void>;
    private ensureStorageBucket;
    private migrateImage;
    private getExtensionFromMime;
    private updateMenuItemImageUrls;
    validateImageMigration(): Promise<void>;
    cleanupXanoReferences(): Promise<void>;
}
export default ImageMigrator;
//# sourceMappingURL=migrate-images.d.ts.map