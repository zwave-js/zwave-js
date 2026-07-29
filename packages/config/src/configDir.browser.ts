/** The absolute path of the embedded configuration directory */
// Fall back to a bare path on runtimes without import.meta.resolve like QuickJS,
// where embedders set the deviceConfigEmbeddedDir option instead
export const configDir: string = import.meta.resolve?.("/config") ?? "/config";
