/** The absolute path of the embedded configuration directory */
// Fall back to a bare path because QuickJS and txiki.js have no import.meta.resolve
// and pass the deviceConfigEmbeddedDir option instead
export const configDir: string = import.meta.resolve?.("/config") ?? "/config";
