import ts from "typescript";
import type { HplResultDescriptor, MappingEffect, MappingParameterDescriptor } from "./registry.js";
import { DYNAMIC_API_NAMES } from "../catalog/runtime.js";

export type HplPrimitive = "int" | "bool" | "float" | "str";
export type HplCallKind = "intrinsic" | "function";

export interface HplParameterDescriptor {
  readonly name: string;
  readonly optional: boolean;
  readonly rest: boolean;
  readonly type: string;
}

export interface HplCallDescriptor {
  readonly apiName: string;
  readonly kind: HplCallKind;
  readonly parameters: readonly HplParameterDescriptor[];
  readonly returnType: string;
  readonly hplReturns?: string;
  readonly result?: HplResultDescriptor;
  readonly parameterConventions?: readonly MappingParameterDescriptor[];
  readonly effects?: readonly MappingEffect[];
  readonly mayThrow?: boolean;
}

export const DECLARED_DYNAMIC_APIS: ReadonlySet<string> = new Set(DYNAMIC_API_NAMES);

export interface HplRefCallDescriptor extends HplCallDescriptor {
  readonly apiName: "ref";
  readonly kind: "intrinsic";
  readonly refType: HplPrimitive;
}

export type HplDescriptor = HplCallDescriptor | HplRefCallDescriptor;

interface HplMetadata {
  readonly kind: HplCallKind;
  readonly apiName: string;
  readonly returns?: string;
}

interface TrustedDeclarations {
  readonly sourceFile: ts.SourceFile;
  readonly checker: ts.TypeChecker;
  readonly namespace: ts.Symbol;
}

function getTagText(tag: ts.JSDocTag): string | undefined {
  const comment = tag.comment;
  if (typeof comment === "string") return comment.trim() || undefined;
  if (!comment) return undefined;
  const text = comment.map((part) => part.text).join("").trim();
  return text || undefined;
}

function readMetadata(symbol: ts.Symbol): HplMetadata | undefined {
  const tags = symbol.getJsDocTags();
  const intrinsic = tags.find((tag) => tag.name === "hplIntrinsic");
  const func = tags.find((tag) => tag.name === "hplFunc");
  const source = intrinsic ?? func;
  if (!source) return undefined;
  const apiName = source.text?.map((part) => part.text).join("").trim();
  if (!apiName) return undefined;
  const returns = tags
    .filter((tag) => tag.name === "hplReturns")
    .map((tag) => tag.text?.map((part) => part.text).join("").trim())
    .find(Boolean);
  return {
    kind: intrinsic ? "intrinsic" : "function",
    apiName,
    ...(returns ? { returns } : {}),
  };
}

function parameterDescriptor(
  checker: ts.TypeChecker,
  declaration: ts.SignatureDeclaration,
  parameter: ts.Symbol,
): HplParameterDescriptor {
  const node = parameter.valueDeclaration as ts.ParameterDeclaration | undefined;
  const type = checker.getTypeOfSymbolAtLocation(parameter, node ?? declaration);
  return {
    name: parameter.getName(),
    optional: Boolean(node?.questionToken || node?.initializer),
    rest: Boolean(node?.dotDotDotToken),
    type: checker.typeToString(type, node ?? declaration, ts.TypeFormatFlags.NoTruncation),
  };
}

function descriptorFromSignature(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  signature: ts.Signature,
): HplCallDescriptor | undefined {
  const metadata = readMetadata(symbol);
  const declaration = signature.getDeclaration();
  if (!metadata || !declaration) return undefined;
  const hplResult = resolvedResult(metadata.returns);
  return {
    apiName: metadata.apiName,
    kind: metadata.kind,
    parameters: signature.parameters.map((parameter) =>
      parameterDescriptor(checker, declaration, parameter),
    ),
    returnType: checker.typeToString(
      signature.getReturnType(),
      declaration,
      ts.TypeFormatFlags.NoTruncation,
    ),
    ...(metadata.returns ? { hplReturns: metadata.returns } : {}),
    result: hplResult,
    effects: metadata.kind === "function" ? ["reads"] : [],
    mayThrow: false,
  };
}

function collectSymbol(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  output: Map<string, HplCallDescriptor[]>,
): void {
  const declarations = symbol.getDeclarations() ?? [];
  const location = symbol.valueDeclaration ?? declarations[0];
  if (!location) return;
  const signatures = checker.getSignaturesOfType(
    checker.getTypeOfSymbolAtLocation(symbol, location),
    ts.SignatureKind.Call,
  );
  for (const signature of signatures) {
    const descriptor = descriptorFromSignature(checker, symbol, signature);
    if (!descriptor) continue;
    const current = output.get(descriptor.apiName) ?? [];
    current.push(descriptor);
    output.set(descriptor.apiName, current);
  }
}

function walkNamespace(
  checker: ts.TypeChecker,
  namespace: ts.Symbol,
  output: Map<string, HplCallDescriptor[]>,
): void {
  for (const symbol of checker.getExportsOfModule(namespace)) {
    collectSymbol(checker, symbol, output);
    if (symbol.flags & ts.SymbolFlags.NamespaceModule) {
      walkNamespace(checker, symbol, output);
    }
  }
}

function createTrustedDeclarations(
  declarationText: string,
  fileName: string,
): TrustedDeclarations {
  const options: ts.CompilerOptions = {
    noLib: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
  const host = ts.createCompilerHost(options, true);
  const sourceFile = ts.createSourceFile(
    fileName,
    declarationText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
    name === fileName
      ? sourceFile
      : originalGetSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
  host.fileExists = (name) => name === fileName;
  host.readFile = (name) => (name === fileName ? declarationText : undefined);
  const program = ts.createProgram([fileName], options, host);
  const checkedSource = program.getSourceFile(fileName);
  if (!checkedSource) throw new Error(`Unable to load trusted declaration file: ${fileName}`);
  const checker = program.getTypeChecker();
  const hplDeclaration = checkedSource.statements.find(
    (statement): statement is ts.ModuleDeclaration =>
      ts.isModuleDeclaration(statement) && ts.isIdentifier(statement.name) && statement.name.text === "hpl",
  );
  const namespace = hplDeclaration && checker.getSymbolAtLocation(hplDeclaration.name);
  if (!namespace) throw new Error("Trusted declarations must contain `declare namespace hpl`");
  return { sourceFile: checkedSource, checker, namespace };
}

export function parseHplDeclarations(
  declarationText: string,
  fileName = "libhpl.d.ts",
): ReadonlyMap<string, readonly HplCallDescriptor[]> {
  const trusted = createTrustedDeclarations(declarationText, fileName);
  const descriptors = new Map<string, HplCallDescriptor[]>();
  walkNamespace(trusted.checker, trusted.namespace, descriptors);
  return descriptors;
}

export function findHplCalls(
  declarations: ReadonlyMap<string, readonly HplCallDescriptor[]>,
  apiName: string,
): readonly HplCallDescriptor[] {
  return declarations.get(apiName) ?? [];
}

export function findHplCall(
  declarations: ReadonlyMap<string, readonly HplCallDescriptor[]>,
  apiName: string,
): HplCallDescriptor | undefined {
  return findHplCalls(declarations, apiName)[0];
}

export function findHplRefOverload(
  declarations: ReadonlyMap<string, readonly HplCallDescriptor[]>,
  refType: HplPrimitive,
): HplRefCallDescriptor | undefined {
  const descriptor = findHplCalls(declarations, "ref").find((candidate) => {
    const typeParameter = candidate.parameters[0];
    return typeParameter?.type === JSON.stringify(refType);
  });
  return descriptor
    ? { ...descriptor, apiName: "ref", kind: "intrinsic", refType }
    : undefined;
}

export interface ResolvedHplCallDescriptor extends HplCallDescriptor {
  readonly intrinsic?: "ref" | "command" | "selector" | "score";
  readonly hplName?: string;
  readonly result: {
    readonly kind: "void" | "boolean" | "number" | "string" | "ref" | "unknown";
    readonly numberKind?: "int" | "float";
    readonly refKind?: "opaque";
  };
}

function resolvedResult(value: string | undefined): ResolvedHplCallDescriptor["result"] {
  if (value === "int") return { kind: "number", numberKind: "int" };
  if (value === "float") return { kind: "number", numberKind: "float" };
  if (value === "bool") return { kind: "boolean" };
  if (value === "str") return { kind: "string" };
  if (value === "pointer") return { kind: "ref", refKind: "opaque" };
  return { kind: "unknown" };
}

/** Resolves a call from the trusted hpl namespace by JSDoc metadata. */
export function findDeclarationDescriptor(
  checker: ts.TypeChecker,
  call: ts.CallExpression,
): ResolvedHplCallDescriptor | undefined {
  const signature = checker.getResolvedSignature(call);
  const declaration = signature?.getDeclaration();
  const symbol = declaration?.name ? checker.getSymbolAtLocation(declaration.name) : undefined;
  if (!signature || !symbol) return undefined;
  const descriptor = descriptorFromSignature(checker, symbol, signature);
  if (!descriptor) return undefined;
  const intrinsic = descriptor.kind === "intrinsic"
    && ["ref", "command", "selector", "score"].includes(descriptor.apiName)
    ? descriptor.apiName as "ref" | "command" | "selector" | "score"
    : undefined;
  return {
    ...descriptor,
    ...(intrinsic ? { intrinsic } : {}),
    ...(descriptor.kind === "function" ? { hplName: descriptor.apiName } : {}),
    result: resolvedResult(descriptor.hplReturns),
  };
}

export function createHplDeclarationLookup(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ReadonlyMap<string, readonly HplCallDescriptor[]> {
  const declaration = sourceFile.statements.find(
    (statement): statement is ts.ModuleDeclaration =>
      ts.isModuleDeclaration(statement) && ts.isIdentifier(statement.name) && statement.name.text === "hpl",
  );
  const namespace = declaration && checker.getSymbolAtLocation(declaration.name);
  if (!namespace) throw new Error("SourceFile does not declare the global `hpl` namespace");
  const descriptors = new Map<string, HplCallDescriptor[]>();
  walkNamespace(checker, namespace, descriptors);
  return descriptors;
}
