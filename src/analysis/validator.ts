import ts from "typescript";
import type { DeclarationIndex, HplMethodDeclaration } from "./declaration-index.js";
import { isAssignableTo } from "./type-operations.js";
import { HPL_INT, type HplSemanticType } from "./types.js";
import type { HplDiagnostic, SourcePosition, SourceRange } from "../types.js";

export interface ValidationResult {
  readonly diagnostics: readonly HplDiagnostic[];
}

export function sourceRange(node: ts.Node): SourceRange {
  const source = node.getSourceFile();
  const start = node.getStart(source, false);
  const end = node.getEnd();
  const at = (offset: number): SourcePosition => {
    const location = source.getLineAndCharacterOfPosition(offset);
    return { offset, line: location.line + 1, column: location.character + 1 };
  };
  return { start: at(start), end: at(end) };
}

export function createDiagnostic(node: ts.Node, code: number, message: string): HplDiagnostic {
  const source = node.getSourceFile();
  return { code: `HPL${code}`, severity: "error", message, file: source.fileName, range: sourceRange(node), source: source.text };
}

export function validateDeclarations(index: DeclarationIndex): ValidationResult {
  const diagnostics: HplDiagnostic[] = [];
  const names = new Map<string, HplMethodDeclaration>();
  for (const method of index.methods) {
    validateMethod(method, diagnostics);
    const existing = names.get(method.registeredName);
    if (existing) diagnostics.push(createDiagnostic(method.declaration, 3214, `Duplicate HPL registration name '${method.registeredName}'`));
    else names.set(method.registeredName, method);
  }
  return { diagnostics };
}

function validateMethod(method: HplMethodDeclaration, diagnostics: HplDiagnostic[]): void {
  const { declaration } = method;
  if (!method.registeredName.trim()) diagnostics.push(createDiagnostic(declaration, 3215, "HPL registration name cannot be empty"));
  if (method.kind === "event" && declaration.parameters[0]
    && declaration.parameters[0].dotDotDotToken) {
    diagnostics.push(createDiagnostic(declaration.parameters[0], 3211, "@hplEvent parameter cannot be optional or rest"));
  }
  if (method.kind === "event" && declaration.parameters[0]
    && (declaration.parameters[0].questionToken || declaration.parameters[0].initializer)) {
    diagnostics.push(createDiagnostic(declaration.parameters[0], 3211, "@hplEvent parameter cannot be optional or rest"));
  }
}

export function validateReturnType(
  node: ts.ReturnStatement,
  actual: HplSemanticType,
  expected: HplSemanticType,
): HplDiagnostic | undefined {
  if (expected.kind === "none") return node.expression
    ? createDiagnostic(node, 3301, "A void HPL method cannot return a value")
    : undefined;
  if (!node.expression) return createDiagnostic(node, 3302, "A non-void HPL method must return a value");
  return isAssignableTo(actual, expected) ? undefined
    : createDiagnostic(node, 3303, "Returned expression is not assignable to the HPL method return type");
}

export function effectiveReturnType(type: HplSemanticType): HplSemanticType {
  return type.kind === "none" ? HPL_INT : type;
}
