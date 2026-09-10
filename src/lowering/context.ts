import path from "node:path";
import ts from "typescript";
import { TypeResolver } from "../analysis/type-resolver.js";
import type { DeclarationIndex, HplMethodDeclaration } from "../analysis/declaration-index.js";
import type { HplSemanticType } from "../analysis/types.js";
import type { FunctionId, FunctionInfo, SymbolId, SymbolInfo } from "../ir/nodes.js";
import { symbolId } from "../ir/builders.js";
import type { CompileMode, HplDiagnostic } from "../types.js";
import { createDiagnostic, sourceRange } from "../analysis/validator.js";

export interface FunctionFrame {
  readonly declaration: HplMethodDeclaration;
  readonly returnType: HplSemanticType;
}

export interface LoweringContext {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly resolver: TypeResolver;
  readonly mode: CompileMode;
  readonly declarations: DeclarationIndex;
  readonly diagnostics: HplDiagnostic[];
  readonly symbolIds: Map<ts.Symbol, SymbolId>;
  readonly symbols: Map<SymbolId, SymbolInfo>;
  readonly functions: Map<FunctionId, FunctionInfo>;
  readonly sourceRoot: string;
  loopDepth: number;
  frame: FunctionFrame | undefined;
}

function canonicalSymbol(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): ts.Symbol | undefined {
  if (!symbol) return undefined;
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function hash(text: string): string {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(36);
}

export function createLoweringContext(
  program: ts.Program,
  declarations: DeclarationIndex,
  diagnostics: HplDiagnostic[],
  mode: CompileMode,
): LoweringContext {
  return {
    program,
    checker: program.getTypeChecker(),
    resolver: new TypeResolver(program.getTypeChecker()),
    mode,
    declarations,
    diagnostics,
    symbolIds: new Map(),
    symbols: new Map(),
    functions: new Map(),
    sourceRoot: program.getCurrentDirectory(),
    loopDepth: 0,
    frame: undefined,
  };
}

export function report(context: LoweringContext, node: ts.Node, code: number, message: string): void {
  context.diagnostics.push(createDiagnostic(node, code, message));
}

export function span(node: ts.Node) { return sourceRange(node); }

export function semanticType(context: LoweringContext, node: ts.Node): HplSemanticType {
  return context.resolver.resolveNode(node);
}

export function getSymbol(context: LoweringContext, node: ts.Node): ts.Symbol | undefined {
  return canonicalSymbol(context.checker, context.checker.getSymbolAtLocation(node));
}

export function getSymbolId(context: LoweringContext, identifier: ts.Identifier): SymbolId {
  const symbol = getSymbol(context, identifier);
  const source = identifier.getSourceFile();
  const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0] ?? identifier;
  const relative = path.relative(context.sourceRoot, declaration.getSourceFile().fileName).replaceAll("\\", "/");
  const id = symbolId(`s_${hash(`${relative}:${declaration.getStart()}:${identifier.text}`)}`);
  if (!symbol) return id;
  const known = context.symbolIds.get(symbol);
  if (known) return known;
  context.symbolIds.set(symbol, id);
  const type = semanticType(context, identifier);
  context.symbols.set(id, { id, name: identifier.text, type, convention: type.kind === "slice" || type.kind === "map" || type.kind === "tuple" || type.kind === "set" || type.kind === "object" || type.kind === "opaque" ? "ptr" : "raw" });
  return id;
}
