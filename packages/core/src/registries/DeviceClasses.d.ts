export declare enum BasicDeviceClass {
    Controller = 1,
    "Static Controller" = 2,
    "End Node" = 3,
    "Routing End Node" = 4
}
export interface GenericDeviceClass {
    readonly key: number;
    readonly label: string;
    readonly zwavePlusDeviceType?: string;
    readonly requiresSecurity: boolean;
    readonly maySupportBasicCC: boolean;
}
export interface GenericDeviceClassWithSpecific extends GenericDeviceClass {
    readonly specific: SpecificDeviceClass[];
}
export type SpecificDeviceClass = GenericDeviceClass;
/** Returns the Generic Device Class for the given key */
export declare function getGenericDeviceClass(generic: number): GenericDeviceClass;
/** Returns all generic device classes and their specific subclasses */
export declare function getAllDeviceClasses(): readonly GenericDeviceClassWithSpecific[];
/** Returns the Specific Device Class for the given key */
export declare function getSpecificDeviceClass(generic: number, specific: number): SpecificDeviceClass;
//# sourceMappingURL=DeviceClasses.d.ts.map