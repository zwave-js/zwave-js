import { LocalEmbeddingProvider } from "./embedding.js";
import {
	LOCAL_MODEL_ID,
	LOCAL_MODEL_REVISION,
	parseSemanticEnv,
} from "./env.js";

const config = {
	...parseSemanticEnv(),
	downloadPolicy: "allow" as const,
};
const provider = new LocalEmbeddingProvider(config, undefined);

await provider.embed(["Z-Wave JS device configuration parameter"]);
console.error(
	`Cached ${LOCAL_MODEL_ID}@${LOCAL_MODEL_REVISION} in ${config.modelCacheDir}`,
);
