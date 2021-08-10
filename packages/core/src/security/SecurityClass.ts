import type { Maybe } from "../values/Primitive";

export enum SecurityClass {
	Temporary = -2,
	None = -1,
	S2_Unauthenticated = 0,
	S2_Authenticated = 1,
	S2_AccessControl = 2,
	S0_Legacy = 7,
}

/** Tests if the given security class is S2 */
export function securityClassIsS2(
	secClass: SecurityClass,
): secClass is
	| SecurityClass.S2_Unauthenticated
	| SecurityClass.S2_Authenticated
	| SecurityClass.S2_AccessControl {
	return (
		secClass >= SecurityClass.S2_Unauthenticated &&
		secClass <= SecurityClass.S2_AccessControl
	);
}

/** An array of security classes, ordered from high (index 0) to low (index > 0) */
export const securityClassOrder = [
	SecurityClass.S2_AccessControl,
	SecurityClass.S2_Authenticated,
	SecurityClass.S2_Unauthenticated,
	SecurityClass.S0_Legacy,
] as const;

export interface SecurityClassOwner {
	readonly id: number;
	readonly securityClasses: Map<SecurityClass, boolean>;
	getHighestSecurityClass(): SecurityClass | undefined;
	hasSecurityClass(securityClass: SecurityClass): Maybe<boolean>;
}

export function getHighestSecurityClass(
	securityClasses: SecurityClass[],
): SecurityClass {
	for (const cls of securityClassOrder) {
		if (securityClasses.includes(cls)) return cls;
	}
	return SecurityClass.None;
}
