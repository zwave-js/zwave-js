import type { Range } from "vscode-json-languageservice";

// Ported from the zwave-js config editor VS Code extension, with vscode.Range
// replaced by the framework-agnostic LSP Range.

export enum DiagnosticType {
	UnnecessaryImportOverride,
	ImportOverride,
	AllowedMinMaxConflict,
}

export type Diagnostic =
	| UnnecessaryImportOverrideDiagnostic
	| ImportOverrideDiagnostic
	| AllowedMinMaxConflictDiagnostic;

export interface UnnecessaryImportOverrideDiagnostic {
	type: DiagnosticType.UnnecessaryImportOverride;
	range: Range;
}

export interface ImportOverrideDiagnostic {
	type: DiagnosticType.ImportOverride;
	range: Range;
	value: any;
	originalValue: any;
}

export interface AllowedMinMaxConflictDiagnostic {
	type: DiagnosticType.AllowedMinMaxConflict;
	range: Range;
	localHasAllowed: boolean;
	templateHasAllowed: boolean;
}
