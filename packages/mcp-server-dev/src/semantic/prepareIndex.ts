import { LAUNCH_ROOT, getCheckout } from "../checkout.js";

import { SemanticSearchService } from "./service.js";

const checkout = await getCheckout(LAUNCH_ROOT);
if (!checkout) throw new Error(`${LAUNCH_ROOT} is not a zwave-js checkout`);

const service = new SemanticSearchService();
const result = await service.prepareIndex(checkout);

console.error(
	`Cached ${result.parameters} parameters and ${result.templates} templates `
		+ `with ${result.warnings} corpus warnings`,
);
