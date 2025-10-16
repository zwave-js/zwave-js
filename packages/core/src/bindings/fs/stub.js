function fail() {
    throw new Error("The default FS bindings are not available on this platform");
}
export const fs = {
    readFile: function (path) {
        fail();
    },
    writeFile: function (path, data) {
        fail();
    },
    copyFile: function (source, dest) {
        fail();
    },
    open: function (path, flags) {
        fail();
    },
    readDir: function (path) {
        fail();
    },
    stat: function (path) {
        fail();
    },
    ensureDir: function (path) {
        fail();
    },
    deleteDir: function (path) {
        fail();
    },
    makeTempDir: function (prefix) {
        fail();
    },
};
//# sourceMappingURL=stub.js.map