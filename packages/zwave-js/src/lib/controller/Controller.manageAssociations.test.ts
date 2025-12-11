import {
	AssociationCCValues,
	AssociationCheckResult,
	AssociationGroupInfoCCValues,
	BasicCommand,
	utils as ccUtils,
} from "@zwave-js/cc";
import { CommandClasses, SecurityClass } from "@zwave-js/core";
import { createTestingHost } from "@zwave-js/host";
import { test } from "vitest";
import { type CreateTestNodeOptions, createTestNode } from "../test/mocks.js";

test("associations between insecure nodes are allowed", (t) => {
	// This test simulates two Zooz ZEN76 switches, included insecurely
	const host = createTestingHost();

	const commandClasses: CreateTestNodeOptions["commandClasses"] = {
		[CommandClasses["Association Group Information"]]: {
			version: 1,
		},
		[CommandClasses.Association]: {
			version: 3,
		},
		[CommandClasses["Multi Channel Association"]]: {
			version: 4,
		},
		[CommandClasses.Basic]: {
			version: 2,
		},
		[CommandClasses["Binary Switch"]]: {
			version: 2,
		},
	};

	const node2 = createTestNode(host, {
		id: 2,
		commandClasses,
	});
	host.setNode(node2.id, node2);

	node2.setSecurityClass(SecurityClass.S0_Legacy, false);
	node2.setSecurityClass(SecurityClass.S2_AccessControl, false);
	node2.setSecurityClass(SecurityClass.S2_Authenticated, false);
	node2.setSecurityClass(SecurityClass.S2_Unauthenticated, false);

	const node3 = createTestNode(host, {
		id: 3,
		commandClasses,
	});
	host.setNode(node3.id, node3);

	node3.setSecurityClass(SecurityClass.S0_Legacy, false);
	node3.setSecurityClass(SecurityClass.S2_AccessControl, false);
	node3.setSecurityClass(SecurityClass.S2_Authenticated, false);
	node3.setSecurityClass(SecurityClass.S2_Unauthenticated, false);

	// Node 2, group 2 sends Basic CC Set
	const groupId = 2;
	const commands = new Map<CommandClasses, number[]>([
		[CommandClasses.Basic, [BasicCommand.Set]],
	]);
	host.getValueDB(node2.id).setValue(
		AssociationGroupInfoCCValues.commands(groupId).endpoint(0),
		commands,
	);

	t.expect(
		ccUtils.checkAssociation(host, node2, groupId, {
			nodeId: 3,
		}),
	).toBe(AssociationCheckResult.OK);
});

test("addAssociations with security class mismatch should throw without skipAssociationCheck", async (t) => {
	// This test simulates a scenario with mismatched security classes
	const host = createTestingHost();

	const commandClasses: CreateTestNodeOptions["commandClasses"] = {
		[CommandClasses["Association Group Information"]]: {
			version: 1,
		},
		[CommandClasses.Association]: {
			version: 2, // Version 2 requires security class match
		},
		[CommandClasses.Basic]: {
			version: 2,
		},
	};

	const node2 = createTestNode(host, {
		id: 2,
		commandClasses,
	});
	host.setNode(node2.id, node2);

	// Node 2 has S0 security
	node2.setSecurityClass(SecurityClass.S0_Legacy, true);
	node2.setSecurityClass(SecurityClass.S2_AccessControl, false);
	node2.setSecurityClass(SecurityClass.S2_Authenticated, false);
	node2.setSecurityClass(SecurityClass.S2_Unauthenticated, false);

	const node3 = createTestNode(host, {
		id: 3,
		commandClasses,
	});
	host.setNode(node3.id, node3);

	// Node 3 has no security (mismatch with node 2)
	node3.setSecurityClass(SecurityClass.S0_Legacy, false);
	node3.setSecurityClass(SecurityClass.S2_AccessControl, false);
	node3.setSecurityClass(SecurityClass.S2_Authenticated, false);
	node3.setSecurityClass(SecurityClass.S2_Unauthenticated, false);

	// Set up 2 association groups for node 2
	host.getValueDB(node2.id).setValue(
		AssociationCCValues.groupCount.endpoint(0),
		2,
	);

	// Node 2, group 2 sends Basic CC Set
	const groupId = 2;
	const commands = new Map<CommandClasses, number[]>([
		[CommandClasses.Basic, [BasicCommand.Set]],
	]);
	host.getValueDB(node2.id).setValue(
		AssociationGroupInfoCCValues.commands(groupId).endpoint(0),
		commands,
	);

	// Without skipAssociationCheck, this should throw
	await t.expect(
		ccUtils.addAssociations(
			host,
			node2,
			groupId,
			[{ nodeId: 3 }],
		),
	).rejects.toThrow();
});

test("addAssociations with security class mismatch should succeed with skipAssociationCheck", async (t) => {
	// This test simulates a scenario with mismatched security classes
	const host = createTestingHost();

	const commandClasses: CreateTestNodeOptions["commandClasses"] = {
		[CommandClasses["Association Group Information"]]: {
			version: 1,
		},
		[CommandClasses.Association]: {
			version: 2, // Version 2 requires security class match
		},
		[CommandClasses.Basic]: {
			version: 2,
		},
	};

	const node2 = createTestNode(host, {
		id: 2,
		commandClasses,
	});
	host.setNode(node2.id, node2);

	// Node 2 has S0 security
	node2.setSecurityClass(SecurityClass.S0_Legacy, true);
	node2.setSecurityClass(SecurityClass.S2_AccessControl, false);
	node2.setSecurityClass(SecurityClass.S2_Authenticated, false);
	node2.setSecurityClass(SecurityClass.S2_Unauthenticated, false);

	const node3 = createTestNode(host, {
		id: 3,
		commandClasses,
	});
	host.setNode(node3.id, node3);

	// Node 3 has no security (mismatch with node 2)
	node3.setSecurityClass(SecurityClass.S0_Legacy, false);
	node3.setSecurityClass(SecurityClass.S2_AccessControl, false);
	node3.setSecurityClass(SecurityClass.S2_Authenticated, false);
	node3.setSecurityClass(SecurityClass.S2_Unauthenticated, false);

	// Set up 2 association groups for node 2
	host.getValueDB(node2.id).setValue(
		AssociationCCValues.groupCount.endpoint(0),
		2,
	);

	// Node 2, group 2 sends Basic CC Set
	const groupId = 2;
	const commands = new Map<CommandClasses, number[]>([
		[CommandClasses.Basic, [BasicCommand.Set]],
	]);
	host.getValueDB(node2.id).setValue(
		AssociationGroupInfoCCValues.commands(groupId).endpoint(0),
		commands,
	);

	// With skipAssociationCheck, this should not throw the "not allowed" error
	// It will fail at sendCommand because we're using a mock, but that's expected
	try {
		await ccUtils.addAssociations(
			host,
			node2,
			groupId,
			[{ nodeId: 3 }],
			{ skipAssociationCheck: true },
		);
		// If it succeeds (unlikely with mock), that's fine
	} catch (error: any) {
		// Make sure the error is NOT the association check error
		t.expect(error.message).not.toContain("not allowed");
		// It should be the sendCommand error
		t.expect(error.message).toContain("sendCommand");
	}
});
