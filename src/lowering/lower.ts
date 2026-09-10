import path from "node:path";
import ts from "typescript";
import { buildDeclarationIndex } from "../analysis/declaration-index.js";
import { validateDeclarations } from "../analysis/validator.js";
import { buildModuleGraph } from "../compiler/module-graph.js";
import { moduleBlock, typedProgram } from "../ir/builders.js";
import type { Program } from "../ir/nodes.js";
import type { CompileMode, HplDiagnostic } from "../types.js";
import { createLoweringContext, report, span } from "./context.js";
import { lowerFunction } from "./functions.js";
import { lowerStatement } from "./statements.js";

export interface LoweringResult {
  readonly program?: Program;
  readonly diagnostics: readonly HplDiagnostic[];
}

export function lowerProgram(
  program: ts.Program,
  entryFile: ts.SourceFile,
  mode: CompileMode = "strict",
): LoweringResult {
  const diagnostics: HplDiagnostic[] = [];
  const graph = buildModuleGraph(program, entryFile);
  const checker = program.getTypeChecker();
  const index = buildDeclarationIndex(graph.orderedFiles, checker, (node, code, message) => {
    const context = createLoweringContext(program, { methods: [], bySymbol: new Map(), classes: new Set() }, diagnostics, mode);
    report(context, node, code, message);
  });
  diagnostics.push(...validateDeclarations(index).diagnostics);
  const context = createLoweringContext(program, index, diagnostics, mode);
  for (const issue of graph.issues) {
    if (issue.node) report(context, issue.node, 4101, issue.message);
    else diagnostics.push({ code: "HPL4101", severity: "error", message: issue.message, ...(issue.file ? { file: issue.file.fileName, source: issue.file.text } : {}) });
  }
  const modules = graph.orderedFiles.map((file) => {
    const registrations = index.methods
      .filter(({ declaration }) => declaration.getSourceFile() === file)
      .map((method) => lowerFunction(context, method));
    const statements = file.statements.flatMap((statement) => lowerStatement(context, statement));
    const relative = path.relative(program.getCurrentDirectory(), file.fileName).replaceAll("\\", "/");
    return moduleBlock(relative || path.basename(file.fileName), { kind: "block", statements, span: span(file) }, registrations, file.fileName, span(file));
  });
  if (diagnostics.some(({ severity }) => severity === "error")) return { diagnostics };
  return {
    program: {
      ...typedProgram(modules),
      symbols: context.symbols,
      functions: context.functions,
    },
    diagnostics,
  };
}
