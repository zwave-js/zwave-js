/* oxlint-disable typescript/no-unused-vars */
import type {
	Database,
	DatabaseFactory,
	DatabaseOptions,
} from "@zwave-js/shared/bindings";

export const db: DatabaseFactory = {
	createInstance: function<V>(
		filename: string,
		options?: DatabaseOptions<V>,
	): Database<V> {
		throw new Error(
			"The default DB bindings are not available on this platform",
		);
	},
};
