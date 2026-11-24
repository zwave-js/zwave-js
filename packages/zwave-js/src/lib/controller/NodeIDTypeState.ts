import { NodeIDType, ZWaveErrorCodes, isZWaveError } from "@zwave-js/core";

/**
 * Tracks which node ID type the controller uses. The rules:
 * - A successful response to `SetNodeIDType` makes the requested type known.
 * - A response that rejects the switch keeps the previous state. A known type stays known, an unknown one stays unknown.
 * - A `SetNodeIDType` that was sent but got no response makes the type unknown, because the controller may have switched.
 *   This includes a command aborted by a controller reset.
 * - CAN, NAK or a missing ACK mean that the controller did not process the command. The state does not change.
 * - A reset below SDK 7.21 makes the type known as 8 bit. From SDK 7.21 on, a reset keeps the state, also an unknown one.
 * - A soft reset that may or may not have happened makes a 16-bit type unknown below SDK 7.21.
 *
 * While the type is unknown, nothing that contains a node ID may be sent.
 */
export class NodeIDTypeState {
	/** The node ID type used to serialize and parse commands. While the state is unknown, this is the last assumption. */
	public type: NodeIDType = NodeIDType.Short;
	public known: boolean = true;

	/** Records a successful or rejecting response to `SetNodeIDType` */
	public recordResponse(requested: NodeIDType, success: boolean): void {
		if (success) {
			this.type = requested;
			this.known = true;
		}
	}

	/** Records an error while sending `SetNodeIDType`. Returns `false` if the error is not about the transmission. */
	public recordError(e: unknown): boolean {
		if (!isZWaveError(e)) return false;
		switch (e.code) {
			case ZWaveErrorCodes.Controller_ResponseNOK:
			case ZWaveErrorCodes.Controller_MessageDropped:
				// Rejected, or not processed because of CAN or NAK
				return true;
			case ZWaveErrorCodes.Controller_Timeout:
				if (e.context !== "ACK") this.known = false;
				return true;
			case ZWaveErrorCodes.Controller_Reset:
				this.known = false;
				return true;
		}
		return false;
	}

	public recordPossibleReset(keepsNodeIdType: boolean): void {
		if (keepsNodeIdType || this.type === NodeIDType.Short) return;
		this.known = false;
	}

	public recordReset(keepsNodeIdType: boolean): void {
		if (keepsNodeIdType) return;
		this.type = NodeIDType.Short;
		this.known = true;
	}
}
