import { NodeIDType } from "@zwave-js/core";
import {
	Message,
	type MessageEncodingContext,
	type MessageParsingContext,
} from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

import { ApplicationUpdateRequestNodeInfoRequestFailed } from "./ApplicationUpdateRequest.js";

const frame16Bit = Bytes.from("010700498100000030", "hex");
const frame8Bit = Bytes.from("0106004981000031", "hex");

test("ApplicationUpdateRequest with NodeInfo_RequestFailed is parsed correctly (16-bit node IDs)", (t) => {
	const msg = Message.parse(frame16Bit, {
		nodeIdType: NodeIDType.Long,
	} as MessageParsingContext);
	t.expect(msg).toBeInstanceOf(ApplicationUpdateRequestNodeInfoRequestFailed);
	t.expect(
		(msg as ApplicationUpdateRequestNodeInfoRequestFailed).isOK(),
	).toBe(false);
});

test("ApplicationUpdateRequest with NodeInfo_RequestFailed is parsed correctly (8-bit node IDs)", (t) => {
	const msg = Message.parse(frame8Bit, {
		nodeIdType: NodeIDType.Short,
	} as MessageParsingContext);
	t.expect(msg).toBeInstanceOf(ApplicationUpdateRequestNodeInfoRequestFailed);
});

test("ApplicationUpdateRequestNodeInfoRequestFailed serializes like the controller sends it", async (t) => {
	const msg = new ApplicationUpdateRequestNodeInfoRequestFailed();
	t.expect(
		await msg.serialize({
			nodeIdType: NodeIDType.Long,
		} as MessageEncodingContext),
	).toStrictEqual(frame16Bit);

	t.expect(
		await new ApplicationUpdateRequestNodeInfoRequestFailed().serialize({
			nodeIdType: NodeIDType.Short,
		} as MessageEncodingContext),
	).toStrictEqual(frame8Bit);
});
