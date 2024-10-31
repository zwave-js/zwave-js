import {
	MessagePriority,
	ZWaveLogContainer,
	createDefaultTransportFormat,
	getDirectionPrefix,
} from "@zwave-js/core";
import {
	SpyTransport,
	assertLogInfo,
	assertMessage,
} from "@zwave-js/core/test";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise/index.js";
import colors from "ansi-colors";
import MockDate from "mockdate";
import { beforeAll, beforeEach, test } from "vitest";
import type { Driver } from "../driver/Driver.js";
import { createAndStartTestingDriver } from "../driver/DriverMock.js";
import { TransactionQueue } from "../driver/Queue.js";
import { Transaction } from "../driver/Transaction.js";
import { DriverLogger } from "./Driver.js";

interface TestContext {
	driver: Driver;
	driverLogger: DriverLogger;
	spyTransport: SpyTransport;
}

const test = ava as TestFn<TestContext>;

beforeAll(async (t) => {
	t.timeout(30000);

	const { driver } = await createAndStartTestingDriver({
		loadConfiguration: false,
		skipNodeInterview: true,
		skipControllerIdentification: true,
	});
	t.context.driver = driver;

	// Replace all defined transports with a spy transport
	const spyTransport = new SpyTransport();
	spyTransport.format = createDefaultTransportFormat(true, true);
	const driverLogger = new DriverLogger(
		driver,
		new ZWaveLogContainer({
			transports: [spyTransport],
		}),
	);
	// Uncomment this to debug the log outputs manually
	// wasSilenced = unsilence(driverLogger);

	t.context.driverLogger = driverLogger;
	t.context.spyTransport = spyTransport;

	MockDate.set(new Date().setHours(0, 0, 0, 0));
});

afterAll(async (t) => {
	const { driver, driverLogger } = t.context;
	await driver.destroy();

	// Don't spam the console when performing the other tests not related to logging
	driverLogger.container.updateConfiguration({ enabled: false });
	MockDate.reset();
});

beforeEach((t) => {
	t.context.spyTransport.spy.resetHistory();
});

interface CreateMessageOptions {
	type: MessageType;
	functionType: FunctionType;
}

interface CreateTransactionOptions extends CreateMessageOptions {
	priority: MessagePriority;
}

function createMessage(
	driver: Driver,
	options: Partial<CreateTransactionOptions>,
) {
	return new Message({
		type: options.type || MessageType.Request,
		functionType: options.functionType || (0x00 as any),
	});
}

function createTransaction(
	driver: Driver,
	options: Partial<CreateTransactionOptions>,
): Transaction {
	const message = createMessage(driver, options);
	const trns = new Transaction(driver, {
		message,
		parts: {} as any,
		promise: createDeferredPromise(),
		priority: options.priority || MessagePriority.Controller,
	});
	return trns;
}

test.sequential("print() logs short messages correctly", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print("Test");
	assertMessage(t, spyTransport, {
		message: `  Test`,
	});
});

test.sequential("print() logs long messages correctly", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print(
		"This is a very long message that should be broken into multiple lines maybe sometimes...",
	);
	assertMessage(t, spyTransport, {
		message:
			`  This is a very long message that should be broken into multiple lines maybe so
  metimes...`,
	});
});

test.sequential("print() logs with the given loglevel", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print("Test", "warn");
	assertLogInfo(t, spyTransport, { level: "warn" });
});

test.sequential("print() has a default loglevel of verbose", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print("Test");
	assertLogInfo(t, spyTransport, { level: "verbose" });
});

test.sequential(
	"print() prefixes the messages with the current timestamp and channel name",
	(t) => {
		const { driverLogger, spyTransport } = t.context;
		driverLogger.print("Whatever");
		assertMessage(t, spyTransport, {
			message: `00:00:00.000 DRIVER   Whatever`,
			ignoreTimestamp: false,
			ignoreChannel: false,
		});
	},
);

test.sequential("print() the timestamp is in a dim color", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print("Whatever");
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.startsWith(colors.gray("00:00:00.000")),
		ignoreTimestamp: false,
		ignoreChannel: false,
		ignoreColor: false,
	});
});

test.sequential("print() the channel name is in inverted gray color", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print("Whatever");
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.startsWith(colors.gray.inverse("DRIVER")),
		ignoreChannel: false,
		ignoreColor: false,
	});
});

test.sequential(
	"transaction() (for outbound messages) contains the direction",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		driverLogger.transaction(createTransaction(driver, {}));
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.startsWith(getDirectionPrefix("outbound")),
		});
	},
);
test.sequential(
	"transaction() (for outbound messages) contains the message type as a tag",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		driverLogger.transaction(
			createTransaction(driver, { type: MessageType.Request }),
		);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[REQ]"),
		});

		driverLogger.transaction(
			createTransaction(driver, { type: MessageType.Response }),
		);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[RES]"),
			callNumber: 1,
		});
	},
);

test.sequential(
	"transaction() (for outbound messages) contains the function type as a tag",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		driverLogger.transaction(
			createTransaction(driver, {
				functionType: FunctionType.GetSerialApiInitData,
			}),
		);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[GetSerialApiInitData]"),
		});
	},
);

test.sequential(
	"transaction() (for outbound messages) contains the message priority",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		driverLogger.transaction(
			createTransaction(driver, {
				priority: MessagePriority.Controller,
			}),
		);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[P: Controller]"),
		});
	},
);

test.sequential(
	"transactionResponse() (for inbound messages) contains the direction",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		const msg = createMessage(driver, {});
		driverLogger.transactionResponse(msg, undefined, null as any);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.startsWith(getDirectionPrefix("inbound")),
		});
	},
);

test.sequential(
	"transactionResponse() (for inbound messages) contains the message type as a tag",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		let msg = createMessage(driver, {
			type: MessageType.Request,
		});
		driverLogger.transactionResponse(msg, undefined, null as any);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[REQ]"),
		});

		msg = createMessage(driver, {
			type: MessageType.Response,
		});
		driverLogger.transactionResponse(msg, undefined, null as any);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[RES]"),
			callNumber: 1,
		});
	},
);

test.sequential(
	"transactionResponse() (for inbound messages) contains the function type as a tag",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		const msg = createMessage(driver, {
			functionType: FunctionType.HardReset,
		});
		driverLogger.transactionResponse(msg, undefined, null as any);
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[HardReset]"),
		});
	},
);

test.sequential(
	"transactionResponse() (for inbound messages) contains the role (regarding the transaction) of the received message as a tag",
	(t) => {
		const { driver, driverLogger, spyTransport } = t.context;
		const msg = createMessage(driver, {
			functionType: FunctionType.HardReset,
		});
		driverLogger.transactionResponse(msg, undefined, "fatal_controller");
		assertMessage(t, spyTransport, {
			predicate: (msg) => msg.includes("[fatal_controller]"),
		});
	},
);

test.sequential("sendQueue() prints the send queue length", (t) => {
	const { driver, driverLogger, spyTransport } = t.context;
	const queue = new TransactionQueue();
	driverLogger.sendQueue(queue);
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("(0 messages)"),
	});

	queue.add(
		createTransaction(driver, {
			functionType: FunctionType.GetSUCNodeId,
		}),
	);
	driverLogger.sendQueue(queue);
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("(1 message)"),
		callNumber: 1,
	});

	queue.add(
		createTransaction(driver, {
			functionType: FunctionType.GetSUCNodeId,
		}),
	);
	driverLogger.sendQueue(queue);
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("(2 messages)"),
		callNumber: 2,
	});
});

test.sequential("sendQueue() prints the function type for each message", (t) => {
	const { driver, driverLogger, spyTransport } = t.context;
	const queue = new TransactionQueue();
	queue.add(
		createTransaction(driver, {
			functionType: FunctionType.GetSUCNodeId,
		}),
	);
	queue.add(
		createTransaction(driver, { functionType: FunctionType.HardReset }),
	);
	driverLogger.sendQueue(queue);

	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("GetSUCNodeId"),
	});
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("HardReset"),
	});
});

test.sequential("sendQueue() prints the message type for each message", (t) => {
	const { driver, driverLogger, spyTransport } = t.context;
	const queue = new TransactionQueue();
	queue.add(
		createTransaction(driver, {
			functionType: FunctionType.GetSUCNodeId,
			type: MessageType.Request,
		}),
	);
	queue.add(
		createTransaction(driver, {
			functionType: FunctionType.HardReset,
			type: MessageType.Response,
		}),
	);
	driverLogger.sendQueue(queue);

	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("· [REQ] GetSUCNodeId"),
	});
	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes("· [RES] HardReset"),
	});
});

test.sequential("primary tags are printed in inverse colors", (t) => {
	const { driver, driverLogger, spyTransport } = t.context;
	const msg = createMessage(driver, {
		functionType: FunctionType.HardReset,
		type: MessageType.Response,
	});
	driverLogger.transactionResponse(msg, undefined, null as any);

	const expected1 = colors.cyan(
		colors.bgCyan("[")
			+ colors.inverse("RES")
			+ colors.bgCyan("]")
			+ " "
			+ colors.bgCyan("[")
			+ colors.inverse("HardReset")
			+ colors.bgCyan("]"),
	);

	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes(expected1),
		ignoreColor: false,
	});
});

test.sequential("inline tags are printed in inverse colors", (t) => {
	const { driverLogger, spyTransport } = t.context;
	driverLogger.print(`This is a message [with] [inline] tags...`);

	const expected1 = colors.bgCyan("[")
		+ colors.inverse("with")
		+ colors.bgCyan("]")
		+ " "
		+ colors.bgCyan("[")
		+ colors.inverse("inline")
		+ colors.bgCyan("]");

	assertMessage(t, spyTransport, {
		predicate: (msg) => msg.includes(expected1),
		ignoreColor: false,
	});
});
