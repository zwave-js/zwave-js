import {
	type NodeProtocolInfo,
	RouteProtocolDataRate,
	ZWaveDataRate,
	ZWaveError,
	ZWaveErrorCodes,
	encodeNodeBitMask,
	encodeNodeProtocolInfo,
} from "@zwave-js/core";
import type {
	MigrateNVMOptions,
	NVMJSON,
	NVMJSONNodeWithInfo,
} from "@zwave-js/nvmedit";
import {
	type NetworkRestoreRoute,
	NetworkRestoreRouteType,
} from "@zwave-js/serial/serialapi";
import { Bytes } from "@zwave-js/shared";

type NVMRoute = NonNullable<NVMJSONNodeWithInfo["lwr"]>;
type NetworkRestoreProtocolNode =
	& Omit<NodeProtocolInfo, "hasSpecificDeviceClass">
	& {
		genericDeviceClass: number;
		specificDeviceClass?: number | null;
	};

interface NetworkRestoreClassicNodePlan {
	nodeId: number;
	protocolData: Bytes;
	neighbors?: Bytes;
	routes?: NetworkRestoreRoute[];
}

interface NetworkRestoreNodePlan {
	nodeId: number;
	protocolData: Bytes;
}

export interface NetworkRestorePlan {
	homeId: number;
	controllerNodeId: number;
	classicNodes: NetworkRestoreClassicNodePlan[];
	longRangeNodes: NetworkRestoreNodePlan[];
	totalCommands: number;
}

function encodeNetworkRestoreProtocolData(
	node: NetworkRestoreProtocolNode,
	isLongRange: boolean,
): Bytes {
	const hasSpecificDeviceClass = node.specificDeviceClass != null;
	return Bytes.concat([
		encodeNodeProtocolInfo(
			{
				...node,
				hasSpecificDeviceClass,
			},
			isLongRange,
		),
		[node.genericDeviceClass, node.specificDeviceClass ?? 0],
	]);
}

function mapNetworkRestoreRouteSpeed(
	protocolRate: RouteProtocolDataRate,
): ZWaveDataRate {
	switch (protocolRate) {
		case RouteProtocolDataRate.Unspecified:
		case RouteProtocolDataRate.ZWave_9k6:
			return ZWaveDataRate["9k6"];
		case RouteProtocolDataRate.ZWave_40k:
			return ZWaveDataRate["40k"];
		case RouteProtocolDataRate.ZWave_100k:
			return ZWaveDataRate["100k"];
		default:
			throw new ZWaveError(
				`Cannot restore a Classic route with protocol data rate ${protocolRate}`,
				ZWaveErrorCodes.NVM_NotSupported,
			);
	}
}

function nvmRouteToNetworkRestoreRoute(
	route: NVMRoute,
	type: NetworkRestoreRouteType,
): NetworkRestoreRoute {
	return {
		type,
		beam: route.beaming,
		speed: mapNetworkRestoreRouteSpeed(route.protocolRate),
		hops: route.repeaterNodeIDs ?? [],
	};
}

export function canUseNetworkRestore(
	nvm: NVMJSON,
	options: MigrateNVMOptions | undefined,
	targetSupportsLongRange: boolean | undefined,
): boolean {
	if (
		(options?.preserveApplicationData ?? true)
		&& nvm.controller.applicationData
	) {
		return false;
	}
	if (
		(options?.preserveSUCUpdateEntries ?? true)
		&& nvm.controller.sucUpdateEntries.length > 0
	) {
		return false;
	}
	if (
		Object.keys(nvm.lrNodes ?? {}).length > 0
		&& targetSupportsLongRange === false
	) {
		return false;
	}
	return true;
}

export function createNetworkRestorePlan(
	nvm: NVMJSON,
	options: MigrateNVMOptions = {},
): NetworkRestorePlan {
	const preserveNeighbors = options.preserveNeighbors ?? true;
	const preserveRoutes = options.preserveRoutes ?? true;

	const classicNodes: NetworkRestoreClassicNodePlan[] = [];
	for (const [nodeIdString, node] of Object.entries(nvm.nodes)) {
		if (!("isListening" in node)) continue;

		const routes: NetworkRestoreRoute[] = [];
		if (preserveRoutes && node.lwr) {
			routes.push(nvmRouteToNetworkRestoreRoute(
				node.lwr,
				node.appRouteLock
					? NetworkRestoreRouteType.APR
					: NetworkRestoreRouteType.LWR,
			));
		}
		if (preserveRoutes && node.nlwr) {
			routes.push(nvmRouteToNetworkRestoreRoute(
				node.nlwr,
				NetworkRestoreRouteType.NLWR,
			));
		}

		classicNodes.push({
			nodeId: Number(nodeIdString),
			protocolData: encodeNetworkRestoreProtocolData(node, false),
			neighbors: preserveNeighbors
				? encodeNodeBitMask(node.neighbors)
				: undefined,
			routes: routes.length > 0 ? routes : undefined,
		});
	}
	classicNodes.sort((a, b) => a.nodeId - b.nodeId);

	const longRangeNodes: NetworkRestoreNodePlan[] = [];
	for (const [nodeIdString, node] of Object.entries(nvm.lrNodes ?? {})) {
		longRangeNodes.push({
			nodeId: Number(nodeIdString),
			protocolData: encodeNetworkRestoreProtocolData(node, true),
		});
	}
	longRangeNodes.sort((a, b) => a.nodeId - b.nodeId);

	return {
		homeId: Number.parseInt(nvm.controller.homeId, 16),
		controllerNodeId: nvm.controller.nodeId,
		classicNodes,
		longRangeNodes,
		totalCommands: 3
			+ classicNodes.length
			+ longRangeNodes.length
			+ classicNodes.filter((node) => node.neighbors).length
			+ classicNodes.filter((node) => node.routes).length,
	};
}
