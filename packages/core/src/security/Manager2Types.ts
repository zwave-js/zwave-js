import { BytesView } from "@zwave-js/shared";
import type {
	S2SecurityClass,
	SecurityClass,
} from "../definitions/SecurityClass.js";
import type { CtrDRBG } from "./ctr_drbg.js";

export interface NetworkKeys {
	pnk: BytesView;
	keyCCM: BytesView;
	keyMPAN: BytesView;
	personalizationString: BytesView;
}
export interface TempNetworkKeys {
	keyCCM: BytesView;
	personalizationString: BytesView;
}

export enum SPANState {
	/** No entry exists */
	None = 0,
	/* The other node's receiver's entropy input is known but, but we didn't send it our sender's EI yet */
	RemoteEI,
	/* We've sent the other node our receiver's entropy input, but we didn't receive its sender's EI yet */
	LocalEI,
	/* An SPAN with the other node has been established */
	SPAN,
}

export enum MPANState {
	/** No entry exists */
	None = 0,
	/** The group is in use, but no MPAN was received yet, or it is out of sync */
	OutOfSync,
	/** An MPAN has been established */
	MPAN,
}

export type SPANTableEntry =
	| {
		// We know the other node's receiver's entropy input, but we didn't send it our sender's EI yet
		type: SPANState.RemoteEI;
		receiverEI: BytesView;
	}
	| {
		// We've sent the other node our receiver's entropy input, but we didn't receive its sender's EI yet
		type: SPANState.LocalEI;
		receiverEI: BytesView;
	}
	| {
		// We've established an SPAN with the other node
		type: SPANState.SPAN;
		securityClass: SecurityClass;
		rng: CtrDRBG;
		/** The most recent generated SPAN */
		currentSPAN?: {
			nonce: BytesView;
			expires: number;
		};
	};

export type MPANTableEntry =
	| {
		type: MPANState.OutOfSync;
	}
	| {
		type: MPANState.MPAN;
		currentMPAN: BytesView;
	};

export interface MulticastGroup {
	nodeIDs: readonly number[];
	securityClass: S2SecurityClass;
	sequenceNumber: number;
}
