import { type CCEncodingContext, type CommandClass } from "@zwave-js/cc";
import {
	type CommandClassInfo,
	type CommandClasses,
	type MaybeNotKnown,
	NOT_KNOWN,
	SecurityClass,
	SecurityManager,
	SecurityManager2,
	type SecurityManagers,
	dskToString,
	generateECDHKeyPair,
	isCCInfoEqual,
	securityClassOrder,
} from "@zwave-js/core";
import { TimedExpectation } from "@zwave-js/shared";
import { type KeyPair } from "@zwave-js/shared/bindings";
import type { CCIdToCapabilities } from "./CCSpecificCapabilities.js";
import type { MockController } from "./MockController.js";
import {
	type MockEndpointCapabilities,
	type MockNodeCapabilities,
	type PartialCCCapabilities,
	getDefaultMockEndpointCapabilities,
	getDefaultMockNodeCapabilities,
} from "./MockNodeCapabilities.js";
import {
	type LazyMockZWaveFrame,
	MOCK_FRAME_ACK_TIMEOUT,
	type MockZWaveAckFrame,
	type MockZWaveFrame,
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveAckFrame,
	createMockZWaveRequestFrame,
} from "./MockZWaveFrame.js";

const defaultCCInfo: CommandClassInfo = {
	isSupported: true,
	isControlled: false,
	secure: false,
	version: 1,
};

export interface MockNodeOptions {
	id: number;
	controller: MockController;
	capabilities?: Partial<MockNodeCapabilities> & {
		/** The CCs implemented by the root device of this node */
		commandClasses?: PartialCCCapabilities[];
		/** Additional, consecutive endpoints. The first one defined will be available at index 1. */
		endpoints?: (Partial<MockEndpointCapabilities> & {
			commandClasses?: PartialCCCapabilities[];
		})[];
	};
}

export interface MockEndpointOptions {
	index: number;
	node: MockNode;
	capabilities?: Partial<MockEndpointCapabilities> & {
		/** The CCs implemented by this endpoint */
		commandClasses?: PartialCCCapabilities[];
	};
}

export type NodePendingInclusion = Omit<MockNodeOptions, "controller"> & {
	/** Optional callback that is called when the node is created during inclusion */
	setup?: (node: MockNode) => void;
};

export class MockEndpoint {
	public constructor(options: MockEndpointOptions) {
		this.index = options.index;
		this.node = options.node;

		const { commandClasses = [], ...capabilities } = options.capabilities
			?? {};
		this.capabilities = {
			...getDefaultMockEndpointCapabilities(this.node.capabilities),
			...capabilities,
		};

		for (const cc of commandClasses) {
			if (typeof cc === "number") {
				this.addCC(cc, {});
			} else {
				const { ccId, ...ccInfo } = cc;
				this.addCC(ccId, ccInfo);
			}
		}
	}

	public readonly index: number;
	public readonly node: MockNode;
	public readonly capabilities: MockEndpointCapabilities;

	public readonly implementedCCs = new Map<
		CommandClasses,
		CommandClassInfo
	>();

	/** Adds information about a CC to this mock endpoint */
	public addCC(cc: CommandClasses, info: Partial<CommandClassInfo>): void {
		const original = this.implementedCCs.get(cc);
		const updated = Object.assign({}, original ?? defaultCCInfo, info);
		if (original == undefined || !isCCInfoEqual(original, updated)) {
			this.implementedCCs.set(cc, updated);
		}
	}

	/** Removes information about a CC from this mock node */
	public removeCC(cc: CommandClasses): void {
		this.implementedCCs.delete(cc);
	}
}

/** A mock node that can be used to test the driver as if it were speaking to an actual network */
export class MockNode {
	public static async create(options: MockNodeOptions): Promise<MockNode> {
		const node = new MockNode(options);
		await node.setupSecurity();
		return node;
	}

	private constructor(options: MockNodeOptions) {
		this._options = options;
		this.id = options.id;
		this.controller = options.controller;

		// Storage for remembering which security classes are granted to which nodes
		const securityClasses = new Map<number, Map<SecurityClass, boolean>>();
		// We internally use this to keep track of our own granted security classes. Set that up here
		const ownSecurityClasses = new Map<SecurityClass, boolean>();
		securityClasses.set(this.id, ownSecurityClasses);
		for (const secClass of options.capabilities?.securityClasses ?? []) {
			ownSecurityClasses.set(secClass, true);
		}

		// Set up capabilities and endpoints
		const {
			commandClasses = [],
			endpoints = [],
			...capabilities
		} = options.capabilities ?? {};
		this.capabilities = {
			...getDefaultMockNodeCapabilities(),
			...capabilities,
		};

		for (const cc of commandClasses) {
			if (typeof cc === "number") {
				this.addCC(cc, {});
			} else {
				const { ccId, ...ccInfo } = cc;
				this.addCC(ccId, ccInfo);
			}
		}

		let index = 0;
		for (const endpoint of endpoints) {
			index++;
			this.endpoints.set(
				index,
				new MockEndpoint({
					index,
					node: this,
					capabilities: endpoint,
				}),
			);
		}

		const self = this;
		this.encodingContext = {
			homeId: this.controller.homeId,
			ownNodeId: this.id,
			hasSecurityClass(
				nodeId: number,
				securityClass: SecurityClass,
			): MaybeNotKnown<boolean> {
				return (
					securityClasses.get(nodeId)?.get(securityClass) ?? NOT_KNOWN
				);
			},
			setSecurityClass(
				nodeId: number,
				securityClass: SecurityClass,
				granted: boolean,
			): void {
				if (!securityClasses.has(nodeId)) {
					securityClasses.set(nodeId, new Map());
				}
				securityClasses.get(nodeId)!.set(securityClass, granted);
			},
			getHighestSecurityClass(
				nodeId: number,
			): MaybeNotKnown<SecurityClass> {
				const map = securityClasses.get(nodeId);
				if (!map?.size) return undefined;
				let missingSome = false;
				for (const secClass of securityClassOrder) {
					if (map.get(secClass) === true) return secClass;
					if (!map.has(secClass)) {
						missingSome = true;
					}
				}
				// If we don't have the info for every security class, we don't know the highest one yet
				return missingSome ? undefined : SecurityClass.None;
			},
			getSupportedCCVersion: (cc, nodeId, endpointIndex = 0) => {
				// Mock endpoints only care about the version they implement
				const endpoint = this.endpoints.get(endpointIndex);
				return (endpoint ?? this).implementedCCs.get(cc)?.version ?? 0;
			},
			// Mock nodes don't care about device configuration files
			getDeviceConfig: () => undefined,
			get securityManager() {
				return self.securityManagers.securityManager;
			},
			get securityManager2() {
				return self.securityManagers.securityManager2;
			},
			get securityManagerLR() {
				return self.securityManagers.securityManagerLR;
			},
		};
	}

	private _options: MockNodeOptions;

	public readonly id: number;
	public readonly controller: MockController;
	public readonly capabilities: MockNodeCapabilities;

	public securityManagers: SecurityManagers = {
		securityManager: undefined,
		securityManager2: undefined,
		securityManagerLR: undefined,
	};

	// These will be set during security setup
	public ecdhKeyPair!: KeyPair;
	public get dsk(): string {
		// The DSK is the first 16 bytes of the public key
		const dskBytes = this.ecdhKeyPair.publicKey.slice(1, 17);
		return dskToString(dskBytes);
	}
	public get s2Pin(): string {
		// The S2 PIN is the first group of 5 digits in the DSK
		return this.dsk.slice(0, 5);
	}

	private async setupSecurity(): Promise<void> {
		this.ecdhKeyPair = await generateECDHKeyPair();

		const securityClasses = this._options.capabilities?.securityClasses;
		if (!securityClasses) return;

		// Set up security managers depending on the provided keys
		let securityManager: SecurityManager | undefined;
		if (
			securityClasses.has(SecurityClass.S0_Legacy)
			&& this._options.controller.securityManagers.securityManager
		) {
			securityManager = new SecurityManager({
				ownNodeId: this.id,
				networkKey:
					this._options.controller.securityManagers.securityManager
						.networkKey,
				// Use a high nonce timeout to allow debugging tests more easily
				nonceTimeout: 100000,
			});
			// Remember that the controller has the S0 key
			this.encodingContext.setSecurityClass(
				this.controller.ownNodeId,
				SecurityClass.S0_Legacy,
				true,
			);
		}

		let securityManager2: SecurityManager2 | undefined = undefined;
		if (
			this._options.controller.securityManagers.securityManager2
			&& [
				SecurityClass.S2_AccessControl,
				SecurityClass.S2_Authenticated,
				SecurityClass.S2_Unauthenticated,
			].some((secClass) => securityClasses.has(secClass))
		) {
			securityManager2 = await SecurityManager2.create();
			const controllerSm2 =
				this._options.controller.securityManagers.securityManager2;

			// Copy keys from the controller
			for (
				const secClass of [
					SecurityClass.S2_AccessControl,
					SecurityClass.S2_Authenticated,
					SecurityClass.S2_Unauthenticated,
				]
			) {
				const key = controllerSm2.getKeysForSecurityClass(secClass)
					?.pnk;
				if (key) {
					await securityManager2.setKey(secClass, key);
					// Remember that the controller has this
					this.encodingContext.setSecurityClass(
						this.controller.ownNodeId,
						secClass,
						true,
					);
				}
			}
		}
		if (securityManager && securityManager2) {
			// Copy S0 key over
			await securityManager2.setKey(
				SecurityClass.S0_Legacy,
				securityManager.networkKey,
			);
		}

		const securityManagerLR: SecurityManager2 | undefined = undefined;

		this.securityManagers = {
			securityManager,
			securityManager2,
			securityManagerLR,
		};
	}

	public encodingContext: CCEncodingContext;

	private behaviors: MockNodeBehavior[] = [];

	public readonly implementedCCs = new Map<
		CommandClasses,
		CommandClassInfo
	>();

	public readonly endpoints = new Map<number, MockEndpoint>();

	/** Can be used by behaviors to store controller related state */
	public readonly state = new Map<string, unknown>();

	/** Controls whether the node automatically ACKs CCs from the controller before handling them */
	public autoAckControllerFrames: boolean = true;

	private expectedControllerFrames: TimedExpectation<
		MockZWaveFrame,
		MockZWaveFrame
	>[] = [];

	/** Records the frames received from the controller to perform assertions on them */
	private receivedControllerFrames: MockZWaveFrame[] = [];
	/** Records the frames sent to the controller to perform assertions on them */
	private sentControllerFrames: MockZWaveFrame[] = [];

	/**
	 * Waits until the controller sends a frame matching the given predicate or a timeout has elapsed.
	 *
	 * @param predicate A predicate function to test incoming frames
	 * @param options Optional configuration
	 * @param options.timeout The number of milliseconds to wait. If the timeout elapses, the returned promise will be rejected. Default: 5000ms
	 * @param options.preventDefault If true, the default behavior will not be executed after the expectation is fulfilled. Default: false
	 */
	public async expectControllerFrame<
		T extends MockZWaveFrame = MockZWaveFrame,
	>(
		predicate: (msg: MockZWaveFrame) => msg is T,
		options?: {
			timeout?: number;
			preventDefault?: boolean;
			errorMessage?: string;
		},
	): Promise<T> {
		const {
			timeout = 5000,
			preventDefault = false,
			errorMessage =
				"The controller did not send the expected frame within the provided timeout!",
		} = options ?? {};
		const expectation = new TimedExpectation<
			MockZWaveFrame,
			MockZWaveFrame
		>(
			timeout,
			predicate,
			errorMessage,
			preventDefault,
		);
		try {
			this.expectedControllerFrames.push(expectation);
			return (await expectation) as T;
		} finally {
			const index = this.expectedControllerFrames.indexOf(expectation);
			if (index !== -1) {
				void this.expectedControllerFrames.splice(index, 1);
			}
		}
	}

	/**
	 * Waits until the controller sends an ACK frame or a timeout has elapsed.
	 *
	 * @param timeout The number of milliseconds to wait. If the timeout elapses, the returned promise will be rejected
	 */
	public expectControllerACK(
		timeout: number,
		errorMessage?: string,
	): Promise<MockZWaveAckFrame> {
		return this.expectControllerFrame(
			(msg): msg is MockZWaveAckFrame =>
				msg.type === MockZWaveFrameType.ACK,
			{ timeout, errorMessage },
		);
	}

	/**
	 * Sends a {@link MockZWaveFrame} to the {@link MockController}
	 */
	public async sendToController(
		frame: LazyMockZWaveFrame,
	): Promise<MockZWaveAckFrame | undefined> {
		this.controller["air"].add({
			source: this.id,
			onTransmit: (frame) => {
				this.sentControllerFrames.push(frame);
			},
			...frame,
		});

		if (frame.type === MockZWaveFrameType.Request && frame.ackRequested) {
			return await this.expectControllerACK(MOCK_FRAME_ACK_TIMEOUT);
		}
	}

	/** Gets called when a {@link MockZWaveFrame} is received from the {@link MockController} */
	public async onControllerFrame(frame: MockZWaveFrame): Promise<void> {
		this.receivedControllerFrames.push(frame);

		// Ack the frame if desired
		if (
			this.autoAckControllerFrames
			&& frame.type === MockZWaveFrameType.Request
		) {
			void this.ackControllerRequestFrame(frame);
		}

		// Handle message buffer. Check for pending expectations first.
		const handlers = this.expectedControllerFrames.filter(
			(e) => !e.predicate || e.predicate(frame),
		);

		// Resolve all matching expectations
		for (const handler of handlers) {
			handler.resolve(frame);
		}

		// If any handler has preventDefault set, skip default behaviors
		if (handlers.some((h) => h.preventDefault)) {
			return;
		}

		if (frame.type === MockZWaveFrameType.Request) {
			let cc = frame.payload;
			let response: MockNodeResponse | undefined;

			// Transform incoming frames with hooks, e.g. to support unwrapping encapsulated CCs
			for (const behavior of this.behaviors) {
				if (behavior.transformIncomingCC) {
					cc = await behavior.transformIncomingCC(
						this.controller,
						this,
						cc,
					);
				}
			}

			// Figure out what to do with the frame
			for (const behavior of this.behaviors) {
				response = await behavior.handleCC?.(
					this.controller,
					this,
					cc,
				);
				if (response) break;
			}

			// If no behavior handled the frame, or we're supposed to stop, stop
			if (!response || response.action === "stop") return;

			// Transform responses with hooks, e.g. to support Supervision or other encapsulation
			for (const behavior of this.behaviors) {
				if (behavior.transformResponse) {
					response = await behavior.transformResponse(
						this.controller,
						this,
						cc,
						response,
					);
				}
			}

			// Finally send a CC to the controller if we're supposed to
			if (response.action === "sendCC") {
				await this.sendToController(
					createMockZWaveRequestFrame(response.cc, {
						ackRequested: response.ackRequested,
					}),
				);
			} else if (response.action === "ack") {
				// Or ack the frame
				await this.ackControllerRequestFrame(frame);
			}
		}
	}

	/**
	 * Sends an ACK frame to the {@link MockController}
	 */
	public async ackControllerRequestFrame(
		frame?: MockZWaveRequestFrame,
	): Promise<void> {
		await this.sendToController(
			createMockZWaveAckFrame({
				repeaters: frame?.repeaters,
			}),
		);
	}

	/** Adds information about a CC to this mock node */
	public addCC(cc: CommandClasses, info: Partial<CommandClassInfo>): void {
		const original = this.implementedCCs.get(cc);
		const updated = Object.assign({}, original ?? defaultCCInfo, info);
		if (original == undefined || !isCCInfoEqual(original, updated)) {
			this.implementedCCs.set(cc, updated);
		}
	}

	/** Removes information about a CC from this mock node */
	public removeCC(cc: CommandClasses): void {
		this.implementedCCs.delete(cc);
	}

	public defineBehavior(...behaviors: MockNodeBehavior[]): void {
		// New behaviors must override existing ones, so we insert at the front of the array
		this.behaviors.unshift(...behaviors);
	}

	/** Asserts that a frame matching the given predicate was received from the controller */
	public assertReceivedControllerFrame(
		predicate: (frame: MockZWaveFrame) => boolean,
		options?: {
			noMatch?: boolean;
			errorMessage?: string;
		},
	): void {
		const { errorMessage, noMatch } = options ?? {};
		const index = this.receivedControllerFrames.findIndex(predicate);
		if (index === -1 && !noMatch) {
			throw new Error(
				`Node ${this.id} did not receive a Z-Wave frame matching the predicate!${
					errorMessage ? ` ${errorMessage}` : ""
				}`,
			);
		} else if (index > -1 && noMatch) {
			throw new Error(
				`Node ${this.id} received a Z-Wave frame matching the predicate, but this was not expected!${
					errorMessage ? ` ${errorMessage}` : ""
				}`,
			);
		}
	}

	/** Forgets all recorded frames received from the controller */
	public clearReceivedControllerFrames(): void {
		this.receivedControllerFrames = [];
	}

	/** Asserts that a frame matching the given predicate was sent to the controller */
	public assertSentControllerFrame(
		predicate: (frame: MockZWaveFrame) => boolean,
		options?: {
			noMatch?: boolean;
			errorMessage?: string;
		},
	): void {
		const { errorMessage, noMatch } = options ?? {};
		const index = this.sentControllerFrames.findIndex(predicate);
		if (index === -1 && !noMatch) {
			throw new Error(
				`Node ${this.id} did not send a Z-Wave frame matching the predicate!${
					errorMessage ? ` ${errorMessage}` : ""
				}`,
			);
		} else if (index > -1 && noMatch) {
			throw new Error(
				`Node ${this.id} sent a Z-Wave frame matching the predicate, but this was not expected!${
					errorMessage ? ` ${errorMessage}` : ""
				}`,
			);
		}
	}

	/** Forgets all recorded frames sent to the controller */
	public clearSentControllerFrames(): void {
		this.sentControllerFrames = [];
	}

	public getCCCapabilities<T extends CommandClasses>(
		ccId: T,
		endpointIndex?: number,
	): Partial<CCIdToCapabilities<T>> | undefined {
		let ccInfo: CommandClassInfo | undefined;
		if (endpointIndex) {
			const endpoint = this.endpoints.get(endpointIndex);
			ccInfo = endpoint?.implementedCCs.get(ccId);
		} else {
			ccInfo = this.implementedCCs.get(ccId);
		}
		if (ccInfo) {
			const { isSupported, isControlled, version, secure, ...ret } =
				ccInfo;
			return ret;
		}
	}
}

/** What the mock node should do after receiving a controller frame */
export type MockNodeResponse = {
	// Send a CC
	action: "sendCC";
	cc: CommandClass;
	ackRequested?: boolean; // Defaults to false
} | {
	// Acknowledge the incoming frame
	action: "ack";
} | {
	// do nothing
	action: "stop";
} | {
	// indicate success to the sending node
	action: "ok";
} | {
	// indicate failure to the sending node
	action: "fail";
};

export interface MockNodeBehavior {
	/** Gets called before the `handleCC` handlers and can transform an incoming `CommandClass` into another */
	transformIncomingCC?: (
		controller: MockController,
		self: MockNode,
		cc: CommandClass,
	) => Promise<CommandClass> | CommandClass;

	/** Gets called when a CC from the controller is received. Returns an action to be performed in response, or `undefined` if there is nothing to do. */
	handleCC?: (
		controller: MockController,
		self: MockNode,
		receivedCC: CommandClass,
	) => Promise<MockNodeResponse | undefined> | MockNodeResponse | undefined;

	/** Gets called after the `onControllerFrame` handlers and can transform one `MockNodeResponse` into another */
	transformResponse?: (
		controller: MockController,
		self: MockNode,
		receivedCC: CommandClass,
		response: MockNodeResponse,
	) => Promise<MockNodeResponse> | MockNodeResponse;
}
