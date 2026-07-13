/** A single allowed option (dropdown choice) as indexed for search */
export interface CorpusOption {
	value: number;
	label: string;
}

/** Human-facing semantics used to build the embedding text and for lexical matching */
export interface CorpusSemantics {
	label?: string;
	description?: string;
	unit?: string;
	purpose?: string;
	optionLabels: string[];
}

/** Structural fields used for compatibility scoring and diffing, not for embeddings */
export interface CorpusStructure {
	valueSize?: number;
	minValue?: number;
	maxValue?: number;
	defaultValue?: number;
	unsigned?: boolean;
	readOnly?: boolean;
	writeOnly?: boolean;
	allowManualEntry?: boolean;
	options: CorpusOption[];
}

export interface DeviceContext {
	manufacturer?: string;
	manufacturerId?: string;
	deviceLabel?: string;
	deviceDescription?: string;
	productType?: string;
	productId?: string;
}

export interface ParameterCorpusRecord {
	kind: "parameter";
	/** Stable identifier: `${relativeFile}#${parameterNumber}[bitmask]:${arrayIndex}` */
	id: string;
	file: string;
	relativeFile: string;
	/** 1-based line of the parameter's entry in `file` */
	line: number;
	parameterNumber: number;
	valueBitMask?: number;
	/** Raw `$if` condition, kept verbatim and never evaluated by the corpus builder */
	condition?: string;
	/** Raw `$import` specifier as written in the source, if any */
	rawImport?: string;
	/** Resolved absolute path of the imported template file, if `rawImport` is set and resolvable */
	templateFile?: string;
	/** The `#selector` portion of `rawImport`, if any */
	templateName?: string;
	device: DeviceContext;
	semantics: CorpusSemantics;
	structure: CorpusStructure;
	semanticHash: string;
	/** Text that was hashed into `semanticHash` / would be sent to the embedding provider.
	 * Deliberately excludes `device` so identical template usages across many devices
	 * collapse to a single cached embedding. */
	semanticText: string;
}

export interface TemplateCorpusRecord {
	kind: "template";
	/** Stable identifier: `${relativeFile}#${templateName}` */
	id: string;
	file: string;
	relativeFile: string;
	/** 1-based line of the template's top-level key in `file` */
	line: number;
	templateName: string;
	/** `~/`-rooted import specifier other files can use to reference this template */
	importSpecifier: string;
	/** Number of concrete parameter definitions that import this template */
	referenceCount: number;
	semantics: CorpusSemantics;
	structure: CorpusStructure;
	semanticHash: string;
	semanticText: string;
}

export type CorpusRecord = ParameterCorpusRecord | TemplateCorpusRecord;

export interface CorpusWarning {
	file: string;
	message: string;
}

export interface Corpus {
	parameters: ParameterCorpusRecord[];
	templates: TemplateCorpusRecord[];
	warnings: CorpusWarning[];
}
