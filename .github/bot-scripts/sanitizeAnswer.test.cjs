// @ts-check

import { describe, expect, it } from "vitest";
import {
	neutralizeMentions,
	neutralizeRawUrls,
	sanitizeModelAnswer,
	stripHtml,
	stripImages,
	stripLinks,
} from "./sanitizeAnswer.cjs";

describe("sanitizeAnswer", () => {
	it("neutralizes mentions and raw URLs", () => {
		expect(neutralizeMentions("@user @org/team")).toBe(
			"@\u200buser @\u200borg/team",
		);
		expect(neutralizeRawUrls("https://example.com www.example.com")).toBe(
			"https://\u200bexample.com www.\u200bexample.com",
		);
	});

	it("removes complete, unfinished, and overlapping HTML delimiters", () => {
		expect(stripHtml("before<!-- secret -->after")).toBe("beforeafter");
		expect(stripHtml("before<!-- unfinished")).toBe("before");
		expect(stripHtml("before<!--<!-->after")).toBe("beforeafter");
		expect(stripHtml("<b>bold</b><img src=x>")).toBe("bold");
		expect(stripHtml("see <https://example.com>")).toBe("see ");
	});

	it("removes images and link targets", () => {
		expect(stripImages("a ![pixel](https://example.com/x.png) b")).toBe(
			"a  b",
		);
		expect(stripLinks("[label](https://example.com)")).toBe("label");
		expect(stripLinks("[label]: https://example.com")).toBe("");
	});

	it("prevents nested markdown links and images from rendering", () => {
		const result = sanitizeModelAnswer(
			"Click [here[for help]](evil.example/phish) "
				+ "![see[details]](https://evil.example/pixel)",
		);
		expect(result).toContain(String.raw`\[here\[for help\]\]`);
		expect(result).toContain(String.raw`!\[see\[details\]\]`);
		expect(result).not.toContain("https://evil.example");
	});

	it("sanitizes all untrusted constructs while preserving basic markdown", () => {
		const result = sanitizeModelAnswer(
			"**Answer** @user <script>x</script> "
				+ "[link](https://evil.example) https://evil.example",
		);
		expect(result).toContain("**Answer**");
		expect(result).toContain("@\u200buser");
		expect(result).toContain("link");
		expect(result).not.toContain("<script>");
		expect(result).toContain("https://\u200bevil.example");
	});
});
