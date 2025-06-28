interface MigrationOptions {
    force?: boolean;
    dryRun?: boolean;
    yes?: boolean;
    backup?: boolean;
    cleanup?: boolean;
}
/**
 * Main migration function
 * @param {MigrationOptions} options - Migration options
 */
export declare function migrateProject(options?: MigrationOptions): Promise<void>;
declare const _default: {
    migrateProject: typeof migrateProject;
};
export default _default;
//# sourceMappingURL=migrate.d.ts.map