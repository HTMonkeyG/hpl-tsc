import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { emitProgram } from "../emitter/emitter.js";
import { lowerProgram } from "../lowering/lower.js";
import type { CompileOptions, CompileResult, HplDiagnostic, SourcePosition, TranspileOptions } from "../types.js";
import { collectTypeScriptDiagnostics, createProgramContext } from "./program.js";

function position(source: ts.SourceFile, offset: number): SourcePosition {
  const value = source.getLineAndCharacterOfPosition(offset);
  return { offset, line: value.line + 1, column: value.character + 1 };
}

function fromTypeScriptDiagnostic(item: ts.Diagnostic): HplDiagnostic {
  const source = item.file;
  const start = item.start;
  const end = start === undefined ? undefined : start + (item.length ?? 1);
  return {
    code: `TS${item.code}`,
    severity: item.category === ts.DiagnosticCategory.Error ? "error" : item.category === ts.DiagnosticCategory.Warning ? "warning" : "info",
    message: ts.flattenDiagnosticMessageText(item.messageText, "\n"),
    ...(source ? { file: source.fileName, source: source.text } : {}),
    ...(source && start !== undefined && end !== undefined ? { range: { start: position(source, start), end: position(source, end) } } : {}),
  };
}

function defaultDeclarations(): string[] {
  const packageRoot = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  return [
    path.join(packageRoot, "libhpl.d.ts"),
    path.join(packageRoot, "libminecraftne.d.ts"),
  ];
}

function result(diagnostics: readonly HplDiagnostic[], sourceFiles: readonly string[], outputText?: string): CompileResult {
  const success = !diagnostics.some(item => item.severity === "error") && outputText !== undefined;
  return { success, diagnostics, emittedFiles: [], sourceFiles, ...(outputText === undefined ? {} : { outputText }) };
}

export function compile(options: CompileOptions): CompileResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const entryFile = path.resolve(cwd, options.entryFile);
  const context = createProgramContext({ entryFile, cwd, ...(options.project ? { project: options.project } : {}), declarationFiles: options.declarationFiles ?? defaultDeclarations() });
  try {
    const diagnostics = collectTypeScriptDiagnostics(context).map(fromTypeScriptDiagnostic);
    const sourceFiles = context.program.getSourceFiles().filter(file => !file.isDeclarationFile).map(file => file.fileName);
    if (diagnostics.some(item => item.severity === "error")) return result(diagnostics, sourceFiles);
    const lowered = lowerProgram(context.program, context.entryFile);
    const allDiagnostics = [...diagnostics, ...lowered.diagnostics];
    if (!lowered.program || allDiagnostics.some(item => item.severity === "error")) return result(allDiagnostics, sourceFiles);
    return result(allDiagnostics, sourceFiles, emitProgram(lowered.program, options));
  } finally {
    context.close();
  }
}

export function transpileSource(source: string, options: TranspileOptions = {}): CompileResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const fileName = path.resolve(cwd, options.fileName ?? "input.ts");
  const compilerOptions: ts.CompilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, skipLibCheck: true, noEmit: true };
  const declarations = options.declarationFiles ?? defaultDeclarations();
  const host = ts.createCompilerHost(compilerOptions, true);
  const originalSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreate) => path.resolve(name) === fileName
    ? ts.createSourceFile(fileName, source, languageVersion, true, ts.ScriptKind.TS)
    : originalSourceFile(name, languageVersion, onError, shouldCreate);
  host.fileExists = name => path.resolve(name) === fileName || ts.sys.fileExists(name);
  host.readFile = name => path.resolve(name) === fileName ? source : ts.sys.readFile(name);
  const program = ts.createProgram({ rootNames: [fileName, ...declarations.map(item => path.resolve(cwd, item))], options: compilerOptions, host });
  const sourceFile = program.getSourceFile(fileName);
  if (!sourceFile) throw new Error("Unable to create in-memory TypeScript source file");
  const diagnostics = ts.getPreEmitDiagnostics(program).map(fromTypeScriptDiagnostic);
  if (diagnostics.some(item => item.severity === "error")) return result(diagnostics, [fileName]);
  const lowered = lowerProgram(program, sourceFile);
  const allDiagnostics = [...diagnostics, ...lowered.diagnostics];
  return result(allDiagnostics, [fileName], lowered.program ? emitProgram(lowered.program, options) : undefined);
}
