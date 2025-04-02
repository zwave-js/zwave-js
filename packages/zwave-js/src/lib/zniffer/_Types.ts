export enum ZWaveFrameType {
	Singlecast,
	Multicast,
	AckDirect,
	ExplorerNormal,
	ExplorerSearchResult,
	ExplorerInclusionRequest,
	BeamStart,
	BeamStop,
	Broadcast,
}

export enum LongRangeFrameType {
	Singlecast,
	Ack,
	BeamStart,
	BeamStop,
	Broadcast,
}
