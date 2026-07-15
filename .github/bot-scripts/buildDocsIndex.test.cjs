// @ts-check

import { describe, expect, it } from "vitest";
import { chunkMarkdown } from "./buildDocsIndex.cjs";

describe("buildDocsIndex", () => {
	it("uses the file title as the breadcrumb before the first heading", () => {
		const chunks = chunkMarkdown(
			"guide/example.md",
			"Content before a heading that is long enough to become a searchable documentation chunk.\n\n"
				+ "# Heading\n\nContent after the heading that is also long enough to become a searchable chunk.",
		);
		expect(chunks[0].breadcrumbs).toEqual(["example"]);
	});

	it("does not parse headings inside code fences", () => {
		const chunks = chunkMarkdown(
			"guide/example.md",
			"# Real\n\n```\n# not a heading but enough content to remain in the real heading chunk\n```\n"
				+ "Additional content makes this section long enough to index.",
		);
		expect(chunks.every((chunk) => chunk.title === "Real")).toBe(true);
	});
});
