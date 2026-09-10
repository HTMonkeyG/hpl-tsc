import { HPL_BOOL, HPL_FLOAT, HPL_INT, HPL_NONE, HPL_STR, type HplSemanticType } from "../analysis/types.js";
import { conventionForType, isAssignableTo } from "../analysis/type-operations.js";
import type { SourceRange } from "../types.js";
import type {
  ArgsExpression, Block, CustomFunctionRegistration, Effect, FunctionId, LValue,
  MapEntry, MapExpression, ModuleBlock, ObjectExpression, ObjectField, Program,
  Registration, RuntimeCallExpression, SliceExpression, SymbolId, SystemEventRegistration,
  TupleExpression, TypedAssign, TypedBoolExpression, TypedBreak, TypedContinue,
  TypedCountFor, TypedExpression, TypedExpressionStatement, TypedFloatExpression,
  TypedIf, TypedIfBranch, TypedIntExpression, TypedNoneExpression, TypedReturn,
  SetExpression, TypedStatement, TypedStringExpression, TypedSymbolExpression,
  UserCallExpression,
} from "./nodes.js";

function requireNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} must not be empty`);
}
function requireType(expression: TypedExpression, expected: HplSemanticType, label: string): void {
  if (!isAssignableTo(expression.type, expected)) throw new Error(`${label} has an incompatible type`);
}
function requirePureId(value: string, label: string): void {
  requireNonEmpty(value, label);
  if (/\s/u.test(value)) throw new Error(`${label} must not contain whitespace`);
}

export function symbolId(value: string): SymbolId { requirePureId(value, "symbol ID"); return value as SymbolId; }
export function functionId(value: string): FunctionId { requirePureId(value, "function ID"); return value as FunctionId; }
export function block(statements: readonly TypedStatement[], span?: SourceRange): Block { return span ? { kind: "block", statements, span } : { kind: "block", statements }; }
export function moduleBlock(id: string, body: Block, registrations: readonly Registration[] = [], fileName?: string, span?: SourceRange): ModuleBlock {
  requireNonEmpty(id, "module ID");
  return { kind: "moduleBlock", id, body, registrations, ...(fileName ? { fileName } : {}), ...(span ? { span } : {}) };
}
export function typedProgram(modules: readonly ModuleBlock[]): Program { return { kind: "program", body: [], modules }; }

export function intExpression(value: number, span: SourceRange): TypedIntExpression {
  if (!Number.isSafeInteger(value)) throw new Error("int literal must be a safe integer");
  return { kind: "typedInt", value, type: HPL_INT, effect: "pure", span };
}
export function floatExpression(value: number, span: SourceRange): TypedFloatExpression {
  if (!Number.isFinite(value)) throw new Error("float literal must be finite");
  return { kind: "typedFloat", value, type: HPL_FLOAT, effect: "pure", span };
}
export function boolExpression(value: boolean, span: SourceRange): TypedBoolExpression { return { kind: "typedBool", value, type: HPL_BOOL, effect: "pure", span }; }
export function stringExpression(value: string, span: SourceRange): TypedStringExpression { return { kind: "typedString", value, type: HPL_STR, effect: "pure", span }; }
export function noneExpression(span: SourceRange): TypedNoneExpression { return { kind: "typedNone", type: HPL_NONE, effect: "pure", span }; }
export function symbolExpression(symbol: SymbolId, type: HplSemanticType, span: SourceRange, name?: string): TypedSymbolExpression {
  return { kind: "typedSymbol", symbol, type, effect: "read", span, ...(name ? { name } : {}) };
}

export function runtimeCall(operation: string, args: readonly TypedExpression[], type: HplSemanticType, span: SourceRange, effect: Effect = "call"): RuntimeCallExpression {
  requireNonEmpty(operation, "runtime operation"); return { kind: "runtimeCall", operation, args, type, effect, span };
}
export function userCall(id: FunctionId, args: readonly TypedExpression[], type: HplSemanticType, span: SourceRange, name?: string): UserCallExpression {
  return { kind: "userCall", functionId: id, args, type, effect: "call", span, ...(name ? { name } : {}) };
}
export function tupleExpression(elements: readonly TypedExpression[], type: HplSemanticType, span: SourceRange): TupleExpression {
  if (type.kind !== "tuple" || type.elements.length !== elements.length) throw new Error("tuple type must match element count");
  return { kind: "tuple", elements, type, effect: "pure", span };
}
export function argsExpression(values: readonly TypedExpression[], type: HplSemanticType, span: SourceRange): ArgsExpression {
  if (type.kind !== "tuple") throw new Error("argument pack requires tuple type"); return { kind: "args", values, type, effect: "pure", span };
}
export function sliceExpression(elements: readonly TypedExpression[], type: HplSemanticType, span: SourceRange): SliceExpression {
  if (type.kind !== "slice" || !elements.every((element) => isAssignableTo(element.type, type.element))) throw new Error("slice elements do not match slice type");
  return { kind: "slice", elements, type, effect: "pure", span };
}
export function mapExpression(entries: readonly MapEntry[], type: HplSemanticType, span: SourceRange): MapExpression {
  if (type.kind !== "map" || !entries.every(({ key, value }) => isAssignableTo(key.type, type.key) && isAssignableTo(value.type, type.value))) throw new Error("map entries do not match map type");
  return { kind: "map", entries, type, effect: "pure", span };
}
export function setExpression(elements: readonly TypedExpression[], type: HplSemanticType, span: SourceRange): SetExpression {
  if (type.kind !== "set" || !elements.every((element) => isAssignableTo(element.type, type.element))) throw new Error("set elements do not match set type");
  return { kind: "set", elements, type, effect: "pure", span };
}
export function objectExpression(fields: readonly ObjectField[], type: HplSemanticType, span: SourceRange): ObjectExpression {
  if (type.kind !== "object") throw new Error("object construction requires object type");
  const names = new Set<string>();
  for (const field of fields) { requireNonEmpty(field.name, "field name"); if (names.has(field.name)) throw new Error(`duplicate object field: ${field.name}`); names.add(field.name); }
  return { kind: "object", fields, type, effect: "pure", span };
}

export function symbolLValue(symbol: SymbolId, type: HplSemanticType, span: SourceRange, name?: string): LValue {
  return { kind: "symbolLValue", symbol, type, span, ...(name ? { name } : {}) };
}
export function assign(target: LValue, value: TypedExpression, span: SourceRange): TypedAssign {
  requireType(value, target.type, "assignment value"); return { kind: "typedAssign", target, value, span };
}
export function ifBranch(condition: TypedExpression, body: Block, span: SourceRange): TypedIfBranch {
  requireType(condition, HPL_BOOL, "if condition"); return { condition, body, span };
}
export function ifStatement(condition: TypedExpression, thenBody: Block, span: SourceRange, elifs?: readonly TypedIfBranch[], elseBody?: Block): TypedIf {
  requireType(condition, HPL_BOOL, "if condition");
  return { kind: "typedIf", condition, thenBody, span, ...(elifs?.length ? { elifs } : {}), ...(elseBody ? { elseBody } : {}) };
}
export function countFor(variable: SymbolId, count: TypedExpression, body: Block, span: SourceRange): TypedCountFor {
  requireType(count, HPL_INT, "count-for bound"); return { kind: "typedCountFor", variable, count, body, span };
}
export function returnStatement(span: SourceRange, value?: TypedExpression): TypedReturn { return value ? { kind: "typedReturn", value, span } : { kind: "typedReturn", span }; }
export function breakStatement(span: SourceRange): TypedBreak { return { kind: "typedBreak", span }; }
export function continueStatement(span: SourceRange): TypedContinue { return { kind: "typedContinue", span }; }
export function expressionStatement(expression: TypedExpression, span: SourceRange): TypedExpressionStatement { return { kind: "typedExpressionStmt", expression, span }; }

export function customFunction(functionId: FunctionId, parameters: readonly SymbolId[], body: Block, span: SourceRange, name?: string): CustomFunctionRegistration {
  if (new Set(parameters).size !== parameters.length) throw new Error("function parameter IDs must be unique");
  return { kind: "customFunction", functionId, parameters, body, span, ...(name ? { name } : {}) };
}
export function systemEvent(event: string, handler: FunctionId, arguments_: readonly TypedExpression[], span: SourceRange, listener?: string, onError?: string): SystemEventRegistration {
  requireNonEmpty(event, "system event");
  return { kind: "systemEvent", event, handler, arguments: arguments_, span, ...(listener ? { listener } : {}), ...(onError !== undefined ? { onError } : {}) };
}
export function valueConvention(type: HplSemanticType) { return conventionForType(type); }
