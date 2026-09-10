export { compile, transpileSource } from "./compiler/compile.js";
export { createProgramContext, collectTypeScriptDiagnostics } from "./compiler/program.js";
export { buildModuleGraph } from "./compiler/module-graph.js";
export { lowerProgram } from "./lowering/lower.js";
export { emitProgram } from "./emitter/emitter.js";
export { DiagnosticReporter, formatDiagnostic, formatDiagnostics } from "./diagnostics/reporter.js";
export type { CompileOptions, CompileResult, CompilerBehaviorOptions, DiagnosticSeverity, EmittedFile, HplDiagnostic, OptimizationLevel, SourcePosition, SourceRange, TranspileOptions } from "./types.js";
export type { Block, Expression, FunctionId, Program, Registration, Statement, SymbolId, TypedExpression, TypedStatement } from "./ir/nodes.js";
