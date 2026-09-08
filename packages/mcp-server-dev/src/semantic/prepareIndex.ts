import { SemanticSearchService } from "./service.js";

const service = new SemanticSearchService();
const result = await service.prepareIndex();

console.error(
	`Cached ${result.parameters} parameters and ${result.templates} templates `
		+ `with ${result.warnings} corpus warnings`,
);
