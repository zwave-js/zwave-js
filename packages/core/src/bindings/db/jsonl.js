import { JsonlDB } from "@alcalzone/jsonl-db";
/** An implementation of the Database bindings for Node.js based on JsonlDB */
export const db = {
    createInstance(filename, options) {
        return new JsonlDB(filename, options);
    },
};
//# sourceMappingURL=jsonl.js.map