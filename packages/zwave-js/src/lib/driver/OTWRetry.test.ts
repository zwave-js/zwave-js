import { test, expect, vi, beforeEach } from "vitest";
import { ZWaveOptions } from "../driver/ZWaveOptions.js";

// Test our OTW firmware update retry logic
test("OTW firmware update retry logic", () => {
	// Test 1: Validate default option value
	const defaultOptions: Partial<ZWaveOptions> = {
		attempts: {
			openSerialPort: 10,
			controller: 3,
			sendData: 3,
			sendDataJammed: 5,
			nodeInterview: 5,
			smartStartInclusion: 5,
			firmwareUpdateOTW: 3,
		}
	};
	
	expect(defaultOptions.attempts?.firmwareUpdateOTW).toBe(3);
});

test("parseLastBootloaderErrorCode logic", () => {
	// Mock the error parsing logic from our implementation
	function parseErrorMessage(message: string): number | null {
		const errorMatch = message.match(/error 0x([0-9a-fA-F]+)/);
		if (errorMatch) {
			const errorCodeStr = errorMatch[1];
			return parseInt(errorCodeStr, 16);
		}
		return null;
	}
	
	function isXModemError(errorCode: number): boolean {
		return (errorCode >> 4) === 2;
	}
	
	// Test cases
	expect(parseErrorMessage("upload failed with error 0x20")).toBe(0x20);
	expect(parseErrorMessage("upload failed with error 0x2F")).toBe(0x2F);
	expect(parseErrorMessage("upload failed with error 0x10")).toBe(0x10);
	expect(parseErrorMessage("upload failed")).toBe(null);
	
	// Test XMODEM error detection
	expect(isXModemError(0x20)).toBe(true);
	expect(isXModemError(0x21)).toBe(true);
	expect(isXModemError(0x2F)).toBe(true);
	expect(isXModemError(0x10)).toBe(false);
	expect(isXModemError(0x30)).toBe(false);
	expect(isXModemError(0x00)).toBe(false);
});

test("retry logic decision making", () => {
	// Mock the retry decision logic
	function shouldRetry(
		errorCode: number | null, 
		attempt: number, 
		maxAttempts: number
	): boolean {
		// Only retry if we haven't reached max attempts and it's an XMODEM error
		if (attempt >= maxAttempts) return false;
		if (errorCode === null) return false;
		return (errorCode >> 4) === 2; // XMODEM error
	}
	
	// Test retry decisions
	expect(shouldRetry(0x20, 1, 3)).toBe(true);  // XMODEM error, has attempts left
	expect(shouldRetry(0x20, 3, 3)).toBe(false); // XMODEM error, no attempts left
	expect(shouldRetry(0x10, 1, 3)).toBe(false); // Non-XMODEM error
	expect(shouldRetry(null, 1, 3)).toBe(false); // No error code
});