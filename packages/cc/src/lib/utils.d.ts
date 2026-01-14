import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, type EndpointId, type GetAllEndpoints, type GetEndpoint, type GetNode, type GetValueDB, type HostIDs, type MaybeNotKnown, type NodeId, type QuerySecurityClasses, type SupportsCC } from "@zwave-js/core";
import { type ReadonlyObjectKeyMap } from "@zwave-js/shared";
import { type CCAPIHost, type CCAPINode } from "./API.js";
import { type AssociationAddress, AssociationCheckResult, type AssociationGroup } from "./_Types.js";
export declare function getAssociations(ctx: GetValueDB, endpoint: EndpointId & SupportsCC): ReadonlyMap<number, readonly AssociationAddress[]>;
export declare function getAllAssociations(ctx: GetValueDB, node: NodeId & GetAllEndpoints<EndpointId & SupportsCC>): ReadonlyObjectKeyMap<AssociationAddress, ReadonlyMap<number, readonly AssociationAddress[]>>;
export declare function checkAssociation(ctx: HostIDs & GetValueDB & GetNode<NodeId & SupportsCC & GetEndpoint<EndpointId & SupportsCC> & QuerySecurityClasses>, endpoint: EndpointId & SupportsCC & ControlsCC, group: number, destination: AssociationAddress): AssociationCheckResult;
export declare function getAssociationGroups(ctx: GetValueDB & GetDeviceConfig, endpoint: EndpointId & SupportsCC): ReadonlyMap<number, AssociationGroup>;
export declare function getAllAssociationGroups(ctx: GetValueDB & GetDeviceConfig, node: NodeId & GetAllEndpoints<EndpointId & SupportsCC>): ReadonlyMap<number, ReadonlyMap<number, AssociationGroup>>;
export declare function addAssociations(ctx: CCAPIHost<CCAPINode & SupportsCC & GetEndpoint<EndpointId & SupportsCC> & QuerySecurityClasses>, endpoint: EndpointId & SupportsCC & ControlsCC, group: number, destinations: AssociationAddress[]): Promise<void>;
export declare function removeAssociations(ctx: CCAPIHost, endpoint: EndpointId & SupportsCC & ControlsCC, group: number, destinations: AssociationAddress[]): Promise<void>;
export declare function getLifelineGroupIds(ctx: GetValueDB & GetDeviceConfig, endpoint: EndpointId & SupportsCC): number[];
export declare function configureLifelineAssociations(ctx: CCAPIHost<CCAPINode & SupportsCC & ControlsCC & GetAllEndpoints<EndpointId & SupportsCC & ControlsCC>>, endpoint: EndpointId & SupportsCC & ControlsCC): Promise<void>;
export declare function assignLifelineIssueingCommand(ctx: CCAPIHost<CCAPINode & SupportsCC & ControlsCC & GetEndpoint<EndpointId & SupportsCC> & QuerySecurityClasses>, endpoint: EndpointId, ccId: CommandClasses, ccCommand: number): Promise<void>;
export declare function doesAnyLifelineSendActuatorOrSensorReports(ctx: GetValueDB & GetDeviceConfig, node: NodeId & SupportsCC): MaybeNotKnown<boolean>;
//# sourceMappingURL=utils.d.ts.map