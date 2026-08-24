import {
	type FLiRS,
	MAX_NODES,
	MAX_NODES_LR,
	type MessageOrCCLogEntry,
	MessagePriority,
	type MessageRecord,
	ZWaveDataRate,
	ZWaveError,
	ZWaveErrorCodes,
	encodeNodeID,
	logBuffer,
	parseNodeID,
	validatePayload,
} from "@zwave-js/core";
import {
	FunctionType,
	Message,
	type MessageBaseOptions,
	type MessageEncodingContext,
	MessageOrigin,
	type MessageParsingContext,
	type MessageRaw,
	MessageType,
	type SuccessIndicator,
	expectedCallback,
	expectedResponse,
	messageTypes,
	priority,
} from "@zwave-js/serial";
import {
	Bytes,
	type BytesView,
	getEnumMemberName,
	num2hex,
} from "@zwave-js/shared";

export enum NetworkRestoreCommand {
	Prepare = 0x00,
	RestoreHomeID = 0x01,
	RestoreDevice = 0x02,
	RestoreNeighbors = 0x03,
	RestoreRoutes = 0x04,
	Finalize = 0xff,
}

export enum NetworkRestoreStatus {
	OK = 0x00,
	Error = 0x01,
	Error_LongRangeNotSupported = 0x02,
	Error_SubcommandNotSupported = 0x04,
}

export enum NetworkRestoreRouteType {
	APR = 0x00,
	LWR = 0x01,
	NLWR = 0x02,
}

export interface NetworkRestoreRoute {
	type: NetworkRestoreRouteType;
	beam: FLiRS;
	speed: ZWaveDataRate;
	hops: number[];
}

function isNetworkRestoreCommand(
	command: number,
): command is NetworkRestoreCommand {
	return [
		NetworkRestoreCommand.Prepare,
		NetworkRestoreCommand.RestoreHomeID,
		NetworkRestoreCommand.RestoreDevice,
		NetworkRestoreCommand.RestoreNeighbors,
		NetworkRestoreCommand.RestoreRoutes,
		NetworkRestoreCommand.Finalize,
	].includes(command);
}

function isNetworkRestoreStatus(
	status: number,
): status is NetworkRestoreStatus {
	return [
		NetworkRestoreStatus.OK,
		NetworkRestoreStatus.Error,
		NetworkRestoreStatus.Error_LongRangeNotSupported,
		NetworkRestoreStatus.Error_SubcommandNotSupported,
	].includes(status);
}

function throwInvalidArgument(message: string): never {
	throw new ZWaveError(message, ZWaveErrorCodes.Argument_Invalid);
}

function validateNodeId(nodeId: number, max: number): void {
	if (!Number.isInteger(nodeId) || nodeId < 1 || nodeId > max) {
		throwInvalidArgument(`The node ID must be between 1 and ${max}`);
	}
}

function validateCallbackId(
	callbackId: number | undefined,
): asserts callbackId is number {
	if (
		callbackId == undefined
		|| !Number.isInteger(callbackId)
		|| callbackId < 1
		|| callbackId > 0xff
	) {
		throwInvalidArgument(
			"The callback ID must be an 8-bit unsigned integer greater than zero",
		);
	}
}

function validateRoute(route: NetworkRestoreRoute): void {
	if (
		route.type !== NetworkRestoreRouteType.APR
		&& route.type !== NetworkRestoreRouteType.LWR
		&& route.type !== NetworkRestoreRouteType.NLWR
	) {
		throwInvalidArgument("The route type is invalid");
	}
	if (
		route.beam !== false
		&& route.beam !== "250ms"
		&& route.beam !== "1000ms"
	) {
		throwInvalidArgument("The route beam type is invalid");
	}
	if (
		route.speed !== ZWaveDataRate["9k6"]
		&& route.speed !== ZWaveDataRate["40k"]
		&& route.speed !== ZWaveDataRate["100k"]
	) {
		throwInvalidArgument("The route speed is invalid");
	}
	if (
		route.hops.length > 4
		|| route.hops.some((nodeId) =>
			!Number.isInteger(nodeId) || nodeId < 1 || nodeId > MAX_NODES
		)
	) {
		throwInvalidArgument(
			`A route must contain at most four node IDs between 1 and ${MAX_NODES}`,
		);
	}
}

function encodeRoute(route: NetworkRestoreRoute): Bytes {
	validateRoute(route);
	const ret = new Bytes(6);
	ret[0] = route.type;
	const beam = route.beam === "1000ms"
		? 0x02
		: route.beam === "250ms"
		? 0x01
		: 0x00;
	const speed = route.speed === ZWaveDataRate["100k"]
		? 0x02
		: route.speed === ZWaveDataRate["40k"]
		? 0x01
		: 0x00;
	ret[1] = (beam << 6) | speed;
	ret.set(route.hops, 2);
	return ret;
}

function parseRoute(payload: BytesView): NetworkRestoreRoute {
	validatePayload(
		payload.length === 6,
		payload[0] <= NetworkRestoreRouteType.NLWR,
		(payload[1] & 0b0011_1100) === 0,
		(payload[1] >>> 6) <= 0x02,
		(payload[1] & 0b11) <= 0x02,
	);

	const allHops = [...payload.subarray(2)];
	const firstEmptyHop = allHops.indexOf(0);
	if (firstEmptyHop >= 0) {
		validatePayload(
			allHops.slice(firstEmptyHop).every((nodeId) => nodeId === 0),
		);
	}
	const hops = allHops.filter((nodeId) => nodeId !== 0);
	validatePayload(hops.every((nodeId) => nodeId <= MAX_NODES));

	const beamBits = payload[1] >>> 6;
	const beam: FLiRS = beamBits === 0x02
		? "1000ms"
		: beamBits === 0x01
		? "250ms"
		: false;
	const speedBits = payload[1] & 0b11;
	const speed = speedBits === 0x02
		? ZWaveDataRate["100k"]
		: speedBits === 0x01
		? ZWaveDataRate["40k"]
		: ZWaveDataRate["9k6"];

	return {
		type: payload[0],
		beam,
		speed,
		hops,
	};
}

function testResponseForNetworkRestoreRequest(
	sent: Message,
	received: Message,
): boolean {
	return (
		sent instanceof NetworkRestoreRequest
		&& received instanceof NetworkRestoreResponse
		&& sent.command === received.command
	);
}

@messageTypes(MessageType.Request, FunctionType.NetworkRestore)
@priority(MessagePriority.Controller)
export class NetworkRestoreRequestBase extends Message {
	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): NetworkRestoreRequestBase {
		if (ctx.origin === MessageOrigin.Host) {
			return NetworkRestoreRequest.from(raw, ctx);
		}
		return NetworkRestoreCallback.from(raw, ctx);
	}
}

export interface NetworkRestoreRequestOptions {
	command: NetworkRestoreCommand;
}

@expectedResponse(testResponseForNetworkRestoreRequest)
@expectedCallback(FunctionType.NetworkRestore)
export class NetworkRestoreRequest extends NetworkRestoreRequestBase {
	public constructor(
		options: NetworkRestoreRequestOptions & MessageBaseOptions,
	) {
		super(options);
		this.command = options.command;
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): NetworkRestoreRequest {
		validatePayload(raw.payload.length >= 2);
		const command = raw.payload[0];
		validatePayload(isNetworkRestoreCommand(command));
		const commandPayload = raw.withPayload(raw.payload.subarray(1));

		switch (command) {
			case NetworkRestoreCommand.Prepare:
				return NetworkRestorePrepareRequest.from(commandPayload, ctx);
			case NetworkRestoreCommand.RestoreHomeID:
				return NetworkRestoreHomeIDRequest.from(commandPayload, ctx);
			case NetworkRestoreCommand.RestoreDevice:
				return NetworkRestoreDeviceRequest.from(commandPayload, ctx);
			case NetworkRestoreCommand.RestoreNeighbors:
				return NetworkRestoreNeighborsRequest.from(commandPayload, ctx);
			case NetworkRestoreCommand.RestoreRoutes:
				return NetworkRestoreRoutesRequest.from(commandPayload, ctx);
			case NetworkRestoreCommand.Finalize:
				return NetworkRestoreFinalizeRequest.from(commandPayload, ctx);
		}
		return validatePayload.fail("Invalid Network Restore command");
	}

	public readonly command: NetworkRestoreCommand;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		validateCallbackId(this.callbackId);
		this.payload = Bytes.concat([
			[this.command],
			this.payload,
			[this.callbackId],
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				command: getEnumMemberName(NetworkRestoreCommand, this.command),
				"callback id": this.callbackId ?? "(not set)",
			},
		};
	}
}

export class NetworkRestorePrepareRequest extends NetworkRestoreRequest {
	public constructor(options: MessageBaseOptions = {}) {
		super({
			...options,
			command: NetworkRestoreCommand.Prepare,
		});
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): NetworkRestorePrepareRequest {
		validatePayload(raw.payload.length === 1);
		return new this({ callbackId: raw.payload[0] });
	}
}

export interface NetworkRestoreHomeIDRequestOptions {
	homeId: number;
	controllerNodeId: number;
}

export class NetworkRestoreHomeIDRequest extends NetworkRestoreRequest {
	public constructor(
		options: NetworkRestoreHomeIDRequestOptions & MessageBaseOptions,
	) {
		super({
			...options,
			command: NetworkRestoreCommand.RestoreHomeID,
		});
		if (
			!Number.isInteger(options.homeId)
			|| options.homeId < 0
			|| options.homeId > 0xffff_ffff
		) {
			throwInvalidArgument(
				"The home ID must be a 32-bit unsigned integer",
			);
		}
		validateNodeId(options.controllerNodeId, MAX_NODES);

		this.homeId = options.homeId;
		this.controllerNodeId = options.controllerNodeId;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): NetworkRestoreHomeIDRequest {
		validatePayload(raw.payload.length === 6);
		return new this({
			homeId: raw.payload.readUInt32BE(0),
			controllerNodeId: raw.payload[4],
			callbackId: raw.payload[5],
		});
	}

	public readonly homeId: number;
	public readonly controllerNodeId: number;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = new Bytes(5);
		this.payload.writeUInt32BE(this.homeId, 0);
		this.payload[4] = this.controllerNodeId;
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = super.toLogEntry();
		return {
			...ret,
			message: {
				...ret.message,
				"home ID": num2hex(this.homeId),
				"controller node ID": this.controllerNodeId,
			},
		};
	}
}

export interface NetworkRestoreDeviceRequestOptions {
	nodeId: number;
	protocolData: BytesView;
}

export class NetworkRestoreDeviceRequest extends NetworkRestoreRequest {
	public constructor(
		options: NetworkRestoreDeviceRequestOptions & MessageBaseOptions,
	) {
		super({
			...options,
			command: NetworkRestoreCommand.RestoreDevice,
		});
		validateNodeId(options.nodeId, MAX_NODES_LR);
		if (options.protocolData.length !== 5) {
			throwInvalidArgument(
				"The protocol data must be exactly five bytes",
			);
		}

		this.nodeId = options.nodeId;
		this.protocolData = Bytes.from(options.protocolData);
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): NetworkRestoreDeviceRequest {
		validatePayload(raw.payload.length === ctx.nodeIdType + 6);
		const { nodeId, bytesRead } = parseNodeID(
			raw.payload,
			ctx.nodeIdType,
		);
		return new this({
			nodeId,
			protocolData: raw.payload.subarray(bytesRead, bytesRead + 5),
			callbackId: raw.payload[bytesRead + 5],
		});
	}

	public readonly nodeId: number;
	public readonly protocolData: Bytes;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		validateNodeId(
			this.nodeId,
			ctx.nodeIdType === 1 ? MAX_NODES : MAX_NODES_LR,
		);
		this.payload = Bytes.concat([
			encodeNodeID(this.nodeId, ctx.nodeIdType),
			this.protocolData,
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = super.toLogEntry();
		return {
			...ret,
			message: {
				...ret.message,
				"node ID": this.nodeId,
				"protocol data": logBuffer(this.protocolData),
			},
		};
	}
}

export interface NetworkRestoreNeighborsRequestOptions {
	nodeId: number;
	neighbors: BytesView;
}

export class NetworkRestoreNeighborsRequest extends NetworkRestoreRequest {
	public constructor(
		options: NetworkRestoreNeighborsRequestOptions & MessageBaseOptions,
	) {
		super({
			...options,
			command: NetworkRestoreCommand.RestoreNeighbors,
		});
		validateNodeId(options.nodeId, MAX_NODES);
		if (options.neighbors.length !== 29) {
			throwInvalidArgument(
				"The neighbors bit mask must be exactly 29 bytes",
			);
		}

		this.nodeId = options.nodeId;
		this.neighbors = Bytes.from(options.neighbors);
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): NetworkRestoreNeighborsRequest {
		validatePayload(raw.payload.length === ctx.nodeIdType + 30);
		const { nodeId, bytesRead } = parseNodeID(
			raw.payload,
			ctx.nodeIdType,
		);
		return new this({
			nodeId,
			neighbors: raw.payload.subarray(bytesRead, bytesRead + 29),
			callbackId: raw.payload[bytesRead + 29],
		});
	}

	public readonly nodeId: number;
	public readonly neighbors: Bytes;

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([
			encodeNodeID(this.nodeId, ctx.nodeIdType),
			this.neighbors,
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = super.toLogEntry();
		return {
			...ret,
			message: {
				...ret.message,
				"node ID": this.nodeId,
				neighbors: logBuffer(this.neighbors),
			},
		};
	}
}

export interface NetworkRestoreRoutesRequestOptions {
	nodeId: number;
	routes: NetworkRestoreRoute[];
}

export class NetworkRestoreRoutesRequest extends NetworkRestoreRequest {
	public constructor(
		options: NetworkRestoreRoutesRequestOptions & MessageBaseOptions,
	) {
		super({
			...options,
			command: NetworkRestoreCommand.RestoreRoutes,
		});
		validateNodeId(options.nodeId, MAX_NODES);
		if (options.routes.length > 3) {
			throwInvalidArgument(
				"At most three routes can be restored per node",
			);
		}
		if (
			new Set(options.routes.map((route) => route.type)).size
				!== options.routes.length
		) {
			throwInvalidArgument("Each route type may only be restored once");
		}
		options.routes.forEach(validateRoute);

		this.nodeId = options.nodeId;
		this.routes = options.routes.map((route) => ({
			...route,
			hops: [...route.hops],
		}));
	}

	public static from(
		raw: MessageRaw,
		ctx: MessageParsingContext,
	): NetworkRestoreRoutesRequest {
		validatePayload(raw.payload.length >= ctx.nodeIdType + 2);
		const { nodeId, bytesRead } = parseNodeID(
			raw.payload,
			ctx.nodeIdType,
		);
		const routeCount = raw.payload[bytesRead];
		validatePayload(
			routeCount <= 3,
			raw.payload.length === bytesRead + 2 + routeCount * 6,
		);

		const routes: NetworkRestoreRoute[] = [];
		for (let i = 0; i < routeCount; i++) {
			const offset = bytesRead + 1 + i * 6;
			routes.push(parseRoute(raw.payload.subarray(offset, offset + 6)));
		}

		return new this({
			nodeId,
			routes,
			callbackId: raw.payload.at(-1),
		});
	}

	public readonly nodeId: number;
	public readonly routes: NetworkRestoreRoute[];

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.concat([
			encodeNodeID(this.nodeId, ctx.nodeIdType),
			[this.routes.length],
			...this.routes.map(encodeRoute),
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		const ret = super.toLogEntry();
		const message: MessageRecord = {
			command: getEnumMemberName(NetworkRestoreCommand, this.command),
			"callback id": this.callbackId ?? "(not set)",
			"node ID": this.nodeId,
			routes: this.routes.length,
		};
		for (const route of this.routes) {
			message[getEnumMemberName(NetworkRestoreRouteType, route.type)] =
				`${route.hops.length ? route.hops.join(" -> ") : "direct"}, ${
					getEnumMemberName(ZWaveDataRate, route.speed)
				}, ${route.beam || "no beam"}`;
		}
		return {
			...ret,
			message,
		};
	}
}

export class NetworkRestoreFinalizeRequest extends NetworkRestoreRequest {
	public constructor(options: MessageBaseOptions = {}) {
		super({
			...options,
			command: NetworkRestoreCommand.Finalize,
		});
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): NetworkRestoreFinalizeRequest {
		validatePayload(raw.payload.length === 1);
		return new this({ callbackId: raw.payload[0] });
	}
}

export interface NetworkRestoreResponseOptions {
	command: NetworkRestoreCommand;
	wasAccepted: boolean;
}

@messageTypes(MessageType.Response, FunctionType.NetworkRestore)
export class NetworkRestoreResponse extends Message
	implements SuccessIndicator
{
	public constructor(
		options: NetworkRestoreResponseOptions & MessageBaseOptions,
	) {
		super(options);
		if (!isNetworkRestoreCommand(options.command)) {
			throwInvalidArgument("The network restore command is invalid");
		}
		this.command = options.command;
		this.wasAccepted = options.wasAccepted;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): NetworkRestoreResponse {
		validatePayload(
			raw.payload.length === 2,
			isNetworkRestoreCommand(raw.payload[0]),
		);
		return new this({
			command: raw.payload[0],
			wasAccepted: raw.payload[1] !== 0,
		});
	}

	public readonly command: NetworkRestoreCommand;
	public readonly wasAccepted: boolean;

	public isOK(): boolean {
		return this.wasAccepted;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([
			this.command,
			this.wasAccepted ? 1 : 0,
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				command: getEnumMemberName(NetworkRestoreCommand, this.command),
				accepted: this.wasAccepted,
			},
		};
	}
}

export interface NetworkRestoreCallbackOptions {
	status: NetworkRestoreStatus;
}

export class NetworkRestoreCallback extends NetworkRestoreRequestBase
	implements SuccessIndicator
{
	public constructor(
		options: NetworkRestoreCallbackOptions & MessageBaseOptions,
	) {
		super(options);
		validateCallbackId(options.callbackId);
		if (!isNetworkRestoreStatus(options.status)) {
			throwInvalidArgument("The network restore status is invalid");
		}
		this.callbackId = options.callbackId;
		this.status = options.status;
	}

	public static from(
		raw: MessageRaw,
		_ctx: MessageParsingContext,
	): NetworkRestoreCallback {
		validatePayload(
			raw.payload.length === 2,
			isNetworkRestoreStatus(raw.payload[1]),
		);
		return new this({
			callbackId: raw.payload[0],
			status: raw.payload[1],
		});
	}

	public readonly status: NetworkRestoreStatus;

	public isOK(): boolean {
		return this.status === NetworkRestoreStatus.OK;
	}

	public serialize(ctx: MessageEncodingContext): Promise<Bytes> {
		this.payload = Bytes.from([this.callbackId!, this.status]);
		return super.serialize(ctx);
	}

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				"callback id": this.callbackId!,
				status: getEnumMemberName(NetworkRestoreStatus, this.status),
			},
		};
	}
}
