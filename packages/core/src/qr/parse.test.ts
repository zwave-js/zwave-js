import { test } from "vitest";

import { SecurityClass } from "../definitions/SecurityClass.js";
import { ZWaveErrorCodes } from "../error/ZWaveError.js";
import { assertZWaveError } from "../test/assertZWaveError.js";

import { QRCodeVersion, parseQRCodeString } from "./index.js";

function createDummyQR(firstDigits: string): string {
	return firstDigits + "0".repeat(52 - firstDigits.length);
}

const cases = [
	{
		code: createDummyQR(`90ab`),
		reason: `contains non-digits`,
	},
	{
		code: createDummyQR(`1100`),
		reason: `does not start with 90 ("Z")`,
	},
	{
		code: "900012345001",
		reason: "is too short",
	},
	{
		code: "900199999003090360850151462432730701509765221393752300100179303072022000881000020000900257",
		reason: "has an incorrect checksum",
	},
];

for (const { code, reason } of cases) {
	test(`QR code parsing -> throws when the QR code ${reason}`, async (t) => {
		await assertZWaveError(t.expect, () => parseQRCodeString(code), {
			errorCode: ZWaveErrorCodes.Security2CC_InvalidQRCode,
		});
	});
}

test("QR code parsing -> Example case: Acme Light Dimmer", async (t) => {
	const result = await parseQRCodeString(
		"900132782003515253545541424344453132333435212223242500100435301537022065520001000000300578",
	);
	t.expect(result).toStrictEqual({
		version: QRCodeVersion.SmartStart,
		securityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		requestedSecurityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		dsk: "51525-35455-41424-34445-31323-33435-21222-32425",
		applicationVersion: "2.66",
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x01,
		installerIconType: 0x0601,
		manufacturerId: 0xfff0,
		productType: 0x0064,
		productId: 0x0003,
	});
});

test("QR code parsing -> Example case: Oscorp Door Lock w. UUID", async (t) => {
	const result = await parseQRCodeString(
		"9001346230075152535455414243444531323334352122232425001016387007680220655210100000017002880642002122232425414243444511121314153132333435",
	);
	t.expect(result).toStrictEqual({
		version: QRCodeVersion.SmartStart,
		securityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
			SecurityClass.S2_AccessControl,
		],
		requestedSecurityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
			SecurityClass.S2_AccessControl,
		],
		dsk: "51525-35455-41424-34445-31323-33435-21222-32425",
		uuid: "52e67ea9a1d0868d2b717ab77a5b829b",
		applicationVersion: "1.32",
		genericDeviceClass: 0x40,
		specificDeviceClass: 0x03,
		installerIconType: 0x0300,
		manufacturerId: 0xfff1,
		productType: 0x03e8,
		productId: 0x0011,
	});
});

test("QR code parsing -> Example case: Acme Light Dimmer w/o SmartStart", async (t) => {
	const result = await parseQRCodeString(
		"900032782003515253545541424344453132333435212223242500100435301537022065520001000000300578",
	);
	t.expect(result).toStrictEqual({
		version: QRCodeVersion.S2,
		securityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		requestedSecurityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		dsk: "51525-35455-41424-34445-31323-33435-21222-32425",
		applicationVersion: "2.66",
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x01,
		installerIconType: 0x0601,
		manufacturerId: 0xfff0,
		productType: 0x0064,
		productId: 0x0003,
	});
});

{
	const validQRCode =
		"900132782003515253545541424344453132333435212223242500100435301537022065520001000000300578";
	const expectedResult = {
		version: QRCodeVersion.SmartStart,
		securityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		requestedSecurityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		dsk: "51525-35455-41424-34445-31323-33435-21222-32425",
		applicationVersion: "2.66",
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x01,
		installerIconType: 0x0601,
		manufacturerId: 0xfff0,
		productType: 0x0064,
		productId: 0x0003,
	};

	test("QR code parsing -> handles surrounding whitespace", async (t) => {
		const result = await parseQRCodeString(`	${validQRCode}  `);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles garbage text before", async (t) => {
		const result = await parseQRCodeString(
			`some garbage text before ${validQRCode}`,
		);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles garbage text after", async (t) => {
		const result = await parseQRCodeString(
			`${validQRCode} some garbage after`,
		);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles extra digits after", async (t) => {
		const result = await parseQRCodeString(`${validQRCode}123456789`);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles whitespace in the middle", async (t) => {
		const qrWithSpaces =
			validQRCode.slice(0, 20)
			+ " "
			+ validQRCode.slice(20, 40)
			+ " "
			+ validQRCode.slice(40);
		const result = await parseQRCodeString(qrWithSpaces);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles newlines in the middle", async (t) => {
		const qrWithNewlines =
			validQRCode.slice(0, 30)
			+ "\n"
			+ validQRCode.slice(30, 60)
			+ "\n"
			+ validQRCode.slice(60);
		const result = await parseQRCodeString(qrWithNewlines);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles mixed whitespace in the middle", async (t) => {
		const qrWithMixedWhitespace =
			validQRCode.slice(0, 10)
			+ " "
			+ validQRCode.slice(10, 30)
			+ "\n"
			+ validQRCode.slice(30, 50)
			+ "\t"
			+ validQRCode.slice(50);
		const result = await parseQRCodeString(qrWithMixedWhitespace);
		t.expect(result).toStrictEqual(expectedResult);
	});

	test("QR code parsing -> handles multiple candidates", async (t) => {
		const result = await parseQRCodeString(
			`${validQRCode.slice(0, 14)}${validQRCode}${validQRCode.slice(
				5,
			)}90`,
		);
		t.expect(result).toStrictEqual(expectedResult);
	});
}

{
	// Based on the Acme Light Dimmer example, with the application version written
	// as a float (577.9999999999999 instead of 00578). The checksum covers the raw
	// string, as observed on affected labels.
	const floatArtifactQRCode =
		"9001468690035152535455414243444531323334352122232425001004353015370220655200010000003577.9999999999999";
	const expectedResult = {
		version: QRCodeVersion.SmartStart,
		securityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		requestedSecurityClasses: [
			SecurityClass.S2_Unauthenticated,
			SecurityClass.S2_Authenticated,
		],
		dsk: "51525-35455-41424-34445-31323-33435-21222-32425",
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x01,
		installerIconType: 0x0601,
		manufacturerId: 0xfff0,
		productType: 0x0064,
		productId: 0x0003,
	};

	test("QR code parsing -> stops at an invalid character in the application version", async (t) => {
		const result = await parseQRCodeString(floatArtifactQRCode);
		t.expect(result).toStrictEqual({
			...expectedResult,
			// 577 instead of 578 due to the truncation
			applicationVersion: "2.65",
		});
	});

	test("QR code parsing -> stops at an invalid character after a complete QR code", async (t) => {
		const result = await parseQRCodeString(
			"900140985003515253545541424344453132333435212223242500100435301537022065520001000000300578.9999999999999",
		);
		t.expect(result).toStrictEqual({
			...expectedResult,
			applicationVersion: "2.66",
		});
	});

	const invalidCases = [
		{
			// Checksum of the original Acme Light Dimmer QR code
			code: "9001327820035152535455414243444531323334352122232425001004353015370220655200010000003577.9999999999999",
			reason: "the checksum does not match the raw input",
		},
		{
			code: "900149438003515253545541424344.53132333435212223242500100435301537022065520001000000300578",
			reason: "the invalid character is in the DSK",
		},
		{
			code: "90013670400351525354554142434445313233343521222324250010043530153702206552000100000.9999999999999",
			reason: "the product ID is incomplete",
		},
		{
			code: "9001036400035152535455414243444531323334352122232425001004353015370220655200010000003.9999999999999",
			reason: "the application version has no digits",
		},
		{
			code: "900143877003515253545541424344453132333435212223242500100435.9999999999999",
			reason: "the ProductType TLV is incomplete",
		},
	];

	for (const { code, reason } of invalidCases) {
		test(`QR code parsing -> throws on invalid characters when ${reason}`, async (t) => {
			await assertZWaveError(t.expect, () => parseQRCodeString(code), {
				errorCode: ZWaveErrorCodes.Security2CC_InvalidQRCode,
			});
		});
	}
}
