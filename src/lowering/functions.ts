import ts from "typescript";
import { effectiveReturnType } from "../analysis/validator.js";
import {
  block, customFunction, intExpression, returnStatement, systemEvent,
  symbolExpression,
} from "../ir/builders.js";
import type { Registration, SymbolId } from "../ir/nodes.js";
import type { HplMethodDeclaration } from "../analysis/declaration-index.js";
import type { LoweringContext } from "./context.js";
import { getSymbolId, span } from "./context.js";
import { lowerStatement } from "./statements.js";

function fallsThrough(statements: readonly ReturnType<typeof lowerStatement>[number][]): boolean {
  const last = statements.at(-1);
  if (!last) return true;
  if (last.kind === "typedReturn") return false;
  if (last.kind === "typedIf" && last.elseBody) {
    return fallsThrough(last.thenBody.statements)
      || (last.elifs ?? []).some((branch) => fallsThrough(branch.body.statements))
      || fallsThrough(last.elseBody.statements);
  }
  return true;
}

export function lowerFunction(
  context: LoweringContext,
  method: HplMethodDeclaration,
): Registration {
  const declaration = method.declaration;
  const parameters: SymbolId[] = declaration.parameters.flatMap((parameter) =>
    ts.isIdentifier(parameter.name) ? [getSymbolId(context, parameter.name)] : []);
  context.frame = { declaration: method, returnType: method.returnType };
  const statements = declaration.body?.statements.flatMap((statement) => lowerStatement(context, statement)) ?? [];
  context.frame = undefined;
  if (method.returnType.kind === "none" && fallsThrough(statements)) statements.push(returnStatement(span(declaration), intExpression(0, span(declaration))));
  const body = block(statements, span(declaration.body ?? declaration));
  context.functions.set(method.id, {
    id: method.id,
    name: method.registeredName,
    parameters,
    returnType: effectiveReturnType(method.returnType),
  });
  if (method.kind === "function") return customFunction(method.id, parameters, body, span(declaration), method.registeredName);
  const eventParameter = parameters[0];
  const eventType = method.parameters[0];
  const arguments_ = eventParameter && eventType
    ? [symbolExpression(eventParameter, eventType, span(declaration.parameters[0]!), declaration.parameters[0] && ts.isIdentifier(declaration.parameters[0].name) ? declaration.parameters[0].name.text : undefined)]
    : [];
  const eventRegistration = systemEvent(method.event ?? "", method.id, arguments_, span(declaration), method.registeredName, "return 0");
  return { ...eventRegistration, body };
}
