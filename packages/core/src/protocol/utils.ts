export function longRangeBeamPowerToDBm(power: number): number {
	return [
		-6,
		-2,
		2,
		6,
		10,
		13,
		16,
		19,
		21,
		23,
		25,
		26,
		27,
		28,
		29,
		30,
	][power];
}

export function formatNodeId(nodeId: number): string {
	return nodeId.toString().padStart(3, "0");
}

export function formatRoute(
	source: number,
	repeaters: readonly number[],
	destination: number,
	direction: "outbound" | "inbound",
	currentHop: number,
	failedHop?: number,
): string {
	return [
		direction === "outbound"
			? formatNodeId(source)
			: formatNodeId(destination),
		...repeaters.map(formatNodeId),
		direction === "outbound"
			? formatNodeId(destination)
			: formatNodeId(source),
	].map((id, i) => {
		if (i === 0) return id;
		if (i - 1 === failedHop) return " × " + id;
		if (i - 1 === currentHop) {
			return (direction === "outbound" ? " » " : " « ") + id;
		}
		return (direction === "outbound" ? " › " : " ‹ ") + id;
	})
		.join("");
}
