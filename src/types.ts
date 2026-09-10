export type OptimizationLevel = 0 | 1 | 2;
/** @deprecated The rebuilt compiler always enforces strict prompt.md semantics. */
export type CompileMode = "strict";

export interface CompilerBehaviorOptions {
  readonly optimizationLevel?: OptimizationLevel;
  readonly strip?: boolean;
}

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface SourcePosition {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface HplDiagnostic {
  readonly code: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly file?: string;
  readonly range?: SourceRange;
  readonly source?: string;
  readonly hint?: string;
}

export interface EmittedFile {
  readonly path: string;
  readonly text: string;
}

export interface CompileOptions extends CompilerBehaviorOptions {
  readonly entryFile: string;
  readonly project?: string;
  readonly declarationFiles?: readonly string[];
  readonly cwd?: string;
}

export interface TranspileOptions extends CompilerBehaviorOptions {
  readonly fileName?: string;
  readonly declarationFiles?: readonly string[];
  readonly cwd?: string;
}

export interface CompileResult {
  readonly success: boolean;
  readonly outputText?: string;
  readonly diagnostics: readonly HplDiagnostic[];
  readonly emittedFiles: readonly EmittedFile[];
  readonly sourceFiles: readonly string[];
}
