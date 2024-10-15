import {
	BasicCCGet,
	BasicCCSet,
	CRC16CC,
	type CRC16CCCommandEncapsulation,
	CommandClass,
	InvalidCC,
	isEncapsulatingCommandClass,
} from "@zwave-js/cc";
import { createTestingHost } from "@zwave-js/host";
import test from "ava";

const host = createTestingHost();

test("should be detected as an encapsulating CC", (t) => {
	const basicCCSet = new BasicCCSet({
		nodeId: 3,
		targetValue: 89,
	});
	const crc16 = CRC16CC.encapsulate(basicCCSet);
	t.true(isEncapsulatingCommandClass(crc16));
});

test("should match the specs", (t) => {
	// SDS13783 contains the following sample encapsulated command:
	const basicCCGet = new BasicCCGet({ nodeId: 1 });
	const crc16 = CRC16CC.encapsulate(basicCCGet);
	const serialized = crc16.serialize({} as any);
	const expected = Buffer.from("560120024d26", "hex");
	t.deepEqual(serialized, expected);
});

test("serialization and deserialization should be compatible", (t) => {
	const basicCCSet = new BasicCCSet({
		nodeId: 3,
		targetValue: 89,
	});
	const crc16 = CRC16CC.encapsulate(basicCCSet);
	t.is(crc16.nodeId, basicCCSet.nodeId);
	t.is(crc16.encapsulated, basicCCSet);
	const serialized = crc16.serialize({} as any);

	const deserialized = CommandClass.from({
		nodeId: basicCCSet.nodeId as number,
		data: serialized,
		context: {} as any,
	});
	t.is(deserialized.nodeId, basicCCSet.nodeId);
	const deserializedPayload = (deserialized as CRC16CCCommandEncapsulation)
		.encapsulated as BasicCCSet;
	t.true(deserializedPayload instanceof BasicCCSet);
	t.is(deserializedPayload.nodeId, basicCCSet.nodeId);
	t.is(deserializedPayload.targetValue, basicCCSet.targetValue);
});

test("deserializing a CC with a wrong checksum should result in an invalid CC", (t) => {
	const basicCCSet = new BasicCCSet({
		nodeId: 3,
		targetValue: 89,
	});
	const crc16 = CRC16CC.encapsulate(basicCCSet);
	t.is(crc16.nodeId, basicCCSet.nodeId);
	t.is(crc16.encapsulated, basicCCSet);
	const serialized = crc16.serialize({} as any);
	serialized[serialized.length - 1] ^= 0xff;

	const decoded = CommandClass.from({
		nodeId: basicCCSet.nodeId as number,
		data: serialized,
		context: {} as any,
	});
	t.true(decoded instanceof InvalidCC);
});
