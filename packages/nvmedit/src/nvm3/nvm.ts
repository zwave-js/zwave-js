import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core/safe";
import { pick } from "@zwave-js/shared/safe";
import { ApplicationVersionFile800ID } from "../files";
import {
	FLASH_MAX_PAGE_SIZE_700,
	FLASH_MAX_PAGE_SIZE_800,
	NVM3_COUNTER_SIZE,
	NVM3_OBJ_HEADER_SIZE_LARGE,
	NVM3_OBJ_HEADER_SIZE_SMALL,
	NVM3_PAGE_HEADER_SIZE,
	NVM3_WORD_SIZE,
	ObjectType,
	PageStatus,
	PageWriteSize,
	ZWAVE_APPLICATION_NVM_SIZE,
	ZWAVE_PROTOCOL_NVM_SIZE,
	ZWAVE_SHARED_NVM_SIZE,
} from "./consts";
import {
	type NVM3Object,
	compressObjects,
	fragmentLargeObject,
	writeObject,
} from "./object";
import { type NVM3Page, readPage, writePageHeader } from "./page";
import { dumpObject, dumpPage } from "./utils";

function comparePages(p1: NVM3Page, p2: NVM3Page) {
	if (p1.header.eraseCount === p2.header.eraseCount) {
		return p1.header.offset - p2.header.offset;
	} else {
		return p1.header.eraseCount - p2.header.eraseCount;
	}
}

export interface NVMMeta {
	sharedFileSystem: boolean;
	pageSize: number;
	deviceFamily: number;
	writeSize: PageWriteSize;
	memoryMapped: boolean;
}

export interface NVM3Pages {
	/** All application pages in the NVM */
	applicationPages: NVM3Page[];
	/** All application pages in the NVM */
	protocolPages: NVM3Page[];
}

export interface NVM3Objects {
	/** A compressed map of application-level NVM objects */
	applicationObjects: Map<number, NVM3Object>;
	/** A compressed map of protocol-level NVM objects */
	protocolObjects: Map<number, NVM3Object>;
}

export function parseNVM(
	buffer: Buffer,
	verbose: boolean = false,
): NVM3Pages & NVM3Objects {
	let offset = 0;
	const pages: NVM3Page[] = [];
	while (offset < buffer.length) {
		const { page, bytesRead } = readPage(buffer, offset);
		if (verbose) dumpPage(page);
		pages.push(page);
		offset += bytesRead;
	}

	// 800 series has a shared NVM for protocol and application data.
	// We can distinguish between the two, because the application version is stored in a different file ID

	const isSharedFileSystem = pages.some(
		(p) => p.objects.some((o) => o.key === ApplicationVersionFile800ID),
	);
	// By convention, we only use the applicationPages in that case
	let applicationPages: NVM3Page[];
	let protocolPages: NVM3Page[];

	if (isSharedFileSystem) {
		applicationPages = pages;
		protocolPages = [];
	} else {
		applicationPages = pages.filter(
			(p) => p.header.offset < ZWAVE_APPLICATION_NVM_SIZE,
		);
		protocolPages = pages.filter(
			(p) => p.header.offset >= ZWAVE_APPLICATION_NVM_SIZE,
		);
	}

	// The pages are written in a ring buffer, find the one with the lowest erase count and start reading from there in order
	applicationPages.sort(comparePages);
	protocolPages.sort(comparePages);

	// Build a compressed view of the NVM objects
	const applicationObjects = compressObjects(
		applicationPages.reduce<NVM3Object[]>(
			(acc, page) => acc.concat(page.objects),
			[],
		),
	);

	const protocolObjects = compressObjects(
		protocolPages.reduce<NVM3Object[]>(
			(acc, page) => acc.concat(page.objects),
			[],
		),
	);

	if (verbose) {
		console.log();
		console.log();
		console.log("Application objects:");
		applicationObjects.forEach((obj) => dumpObject(obj, true));
		console.log();
		console.log("Protocol objects:");
		protocolObjects.forEach((obj) => dumpObject(obj, true));
	}

	return {
		applicationPages,
		protocolPages,
		applicationObjects,
		protocolObjects,
	};
}

export type EncodeNVMOptions = Partial<NVMMeta>;

export function encodeNVM(
	/** A compressed map of application-level NVM objects */
	applicationObjects: Map<number, NVM3Object>,
	/** A compressed map of protocol-level NVM objects */
	protocolObjects: Map<number, NVM3Object>,
	options?: EncodeNVMOptions,
): Buffer {
	const {
		deviceFamily = 2047,
		writeSize = PageWriteSize.WRITE_SIZE_16,
		memoryMapped = true,
	} = options ?? {};
	const maxPageSize = options?.sharedFileSystem
		? FLASH_MAX_PAGE_SIZE_800
		: FLASH_MAX_PAGE_SIZE_700;
	const pageSize = Math.min(
		options?.pageSize ?? maxPageSize,
		maxPageSize,
	);

	const createEmptyPage = (): Buffer => {
		const ret = Buffer.alloc(pageSize, 0xff);
		writePageHeader({
			version: 0x01,
			eraseCount: 0,
			encrypted: false,
			deviceFamily,
			memoryMapped,
			pageSize,
			status: PageStatus.OK,
			writeSize,
		}).copy(ret, 0);
		return ret;
	};

	const writeObjects = (
		pages: Buffer[],
		objects: Map<number, NVM3Object>,
	) => {
		// Keep track where we are at with writing in the pages
		let pageIndex = -1;
		let offsetInPage = -1;
		let remainingSpace = -1;
		let currentPage!: Buffer;
		const nextPage = () => {
			pageIndex++;
			if (pageIndex >= pages.length) {
				throw new ZWaveError(
					"Not enough pages!",
					ZWaveErrorCodes.NVM_NoSpace,
				);
			}
			currentPage = pages[pageIndex];
			offsetInPage = NVM3_PAGE_HEADER_SIZE;
			remainingSpace = pageSize - offsetInPage;
		};
		const incrementOffset = (by: number) => {
			const alignedDelta = (by + NVM3_WORD_SIZE - 1)
				& ~(NVM3_WORD_SIZE - 1);

			offsetInPage += alignedDelta;
			remainingSpace = pageSize - offsetInPage;
		};

		nextPage();
		for (const obj of objects.values()) {
			let fragments: NVM3Object[] | undefined;

			if (obj.type === ObjectType.Deleted) continue;
			if (
				(obj.type === ObjectType.CounterSmall
					&& remainingSpace
						< NVM3_OBJ_HEADER_SIZE_SMALL + NVM3_COUNTER_SIZE)
				|| (obj.type === ObjectType.DataSmall
					&& remainingSpace
						< NVM3_OBJ_HEADER_SIZE_SMALL + (obj.data?.length ?? 0))
			) {
				// Small objects cannot be fragmented and need to go on the next page
				nextPage();
			} else if (
				obj.type === ObjectType.CounterLarge
				|| obj.type === ObjectType.DataLarge
			) {
				// Large objects may be fragmented

				// We need to start a new page, if the remaining space is not enough for
				// the object header plus additional data
				if (remainingSpace <= NVM3_OBJ_HEADER_SIZE_LARGE) {
					nextPage();
				}

				fragments = fragmentLargeObject(
					obj as any,
					remainingSpace,
					pageSize - NVM3_PAGE_HEADER_SIZE,
				);
			}
			if (!fragments) fragments = [obj];

			for (const fragment of fragments) {
				const objBuffer = writeObject(fragment);
				objBuffer.copy(currentPage, offsetInPage);
				incrementOffset(objBuffer.length);

				// Each following fragment needs to be written to a different page^
				if (fragments.length > 1) nextPage();
			}
		}
	};

	if (options?.sharedFileSystem) {
		const pages: Buffer[] = [];
		for (let i = 0; i < ZWAVE_SHARED_NVM_SIZE / pageSize; i++) {
			pages.push(createEmptyPage());
		}

		const objects = new Map([
			...applicationObjects,
			...protocolObjects,
		]);
		writeObjects(pages, objects);

		return Buffer.concat(pages);
	} else {
		const applicationPages: Buffer[] = [];
		for (let i = 0; i < ZWAVE_APPLICATION_NVM_SIZE / pageSize; i++) {
			applicationPages.push(createEmptyPage());
		}

		const protocolPages: Buffer[] = [];
		for (let i = 0; i < ZWAVE_PROTOCOL_NVM_SIZE / pageSize; i++) {
			protocolPages.push(createEmptyPage());
		}

		writeObjects(applicationPages, applicationObjects);
		writeObjects(protocolPages, protocolObjects);

		return Buffer.concat([...applicationPages, ...protocolPages]);
	}
}

export function getNVMMeta(page: NVM3Page, sharedFileSystem: boolean): NVMMeta {
	return {
		sharedFileSystem,
		...pick(page.header, [
			"pageSize",
			"writeSize",
			"memoryMapped",
			"deviceFamily",
		]),
	};
}
