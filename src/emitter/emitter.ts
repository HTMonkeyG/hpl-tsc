import type {
  Block, Expression, FunctionId, LValue, Program, Registration, Statement,
  TypedExpression, TypedStatement,
} from "../ir/nodes.js";
import type { CompilerBehaviorOptions } from "../types.js";
import { allocateNames, type NameAllocator } from "../naming/names.js";
import { runOptimizationPipeline } from "../optimizer/pipeline.js";
import { emitBooleanLiteral, emitFloatLiteral, emitIntLiteral, emitStringLiteral } from "./literals.js";

const INDENT = "  ";

type EmitOptions = CompilerBehaviorOptions;

interface Context {
  readonly names: NameAllocator;
  readonly functions: ReadonlyMap<FunctionId, string>;
  readonly compact: boolean;
}

function assertSafeName(value: string, description: string): string {
  if (!value || /[\r\n|]/u.test(value)) throw new Error(`${description} must not contain a line separator`);
  return value;
}

function primitiveName(kind: TypedExpression["type"]["kind"]): string {
  return kind === "bool" ? "bool" : kind === "float" ? "float" : kind === "str" ? "str" : "int";
}

function emitLegacyExpression(expression: Expression): string {
  switch (expression.kind) {
    case "int": return emitIntLiteral(expression.value);
    case "float": return emitFloatLiteral(expression.value);
    case "bool": return emitBooleanLiteral(expression.value);
    case "string": return emitStringLiteral(expression.value);
    case "variable": return assertSafeName(expression.name, "Variable name");
    case "cast": return `${expression.targetType}(${emitLegacyExpression(expression.expression)})`;
    case "binary": return `(${emitLegacyExpression(expression.left)} ${expression.operator} ${emitLegacyExpression(expression.right)})`;
    case "unaryNot": return `(not ${emitLegacyExpression(expression.operand)})`;
    case "func": return `{func, ${assertSafeName(expression.name, "Function name")}(${expression.args.map(emitLegacyExpression).join(", ")})}`;
    case "selector": return `{selector, ${emitLegacyExpression(expression.target)}}`;
    case "score": return `{score, ${emitLegacyExpression(expression.target)}, ${emitLegacyExpression(expression.objective)}}`;
    case "command": return `{command, ${emitLegacyExpression(expression.command)}}`;
    case "ref": return `{ref, ${expression.refType}, ${emitLegacyExpression(expression.index)}}`;
  }
}

function emitTypedExpression(expression: TypedExpression, context: Context): string {
  const comma = context.compact ? "," : ", ";
  switch (expression.kind) {
    case "typedInt": return emitIntLiteral(expression.value);
    case "typedFloat": return emitFloatLiteral(expression.value);
    case "typedBool": return emitBooleanLiteral(expression.value);
    case "typedString": return emitStringLiteral(expression.value);
    case "typedNone": return "{func, object.make_none()}";
    case "typedSymbol": return context.names.get(expression.symbol, expression.name);
    case "typedCast": return `${primitiveName(expression.type.kind)}(${emitTypedExpression(expression.expression, context)})`;
    case "typedBinary": return `(${emitTypedExpression(expression.left, context)} ${expression.operator} ${emitTypedExpression(expression.right, context)})`;
    case "typedUnary": return expression.operator === "not" ? `(not ${emitTypedExpression(expression.operand, context)})` : `(0 - ${emitTypedExpression(expression.operand, context)})`;
    case "runtimeCall": return `{func, ${assertSafeName(expression.operation, "Runtime operation")}(${expression.args.map(item => emitTypedExpression(item, context)).join(comma)})}`;
    case "userCall": {
      const name = expression.name ?? context.functions.get(expression.functionId) ?? String(expression.functionId);
      const args = [emitStringLiteral(name), ...expression.args.map(item => emitTypedExpression(item, context))];
      return `{func, function.call(${args.join(comma)})}`;
    }
    case "typedSelector": return `{selector, ${emitTypedExpression(expression.target, context)}}`;
    case "typedScore": return `{score, ${emitTypedExpression(expression.target, context)}${comma}${emitTypedExpression(expression.objective, context)}}`;
    case "typedCommand": return `{command, ${emitTypedExpression(expression.command, context)}}`;
    case "typedRef": return `{ref, ${expression.refType ?? primitiveName(expression.type.kind)}${comma}${emitTypedExpression(expression.index, context)}}`;
    case "tuple": return `{func, tuple.new(${expression.elements.map(item => emitTypedExpression(item, context)).join(comma)})}`;
    case "args": return `{func, tuple.new(${expression.values.map(item => emitTypedExpression(item, context)).join(comma)})}`;
    case "slice": return `{func, slices.new(${expression.elements.map(item => emitTypedExpression(item, context)).join(comma)})}`;
    case "map": {
      const entries = expression.entries.flatMap(({ key, value }) => [emitTypedExpression(key, context), emitTypedExpression(value, context)]);
      return `{func, maps.new(${["False", ...entries].join(comma)})}`;
    }
    case "set": return `{func, set.new(${expression.elements.map(item => emitTypedExpression(item, context)).join(comma)})}`;
    case "object": {
      const fields = expression.fields.flatMap(({ name, value }) => [emitStringLiteral(name), emitTypedExpression(value, context)]);
      return `{func, maps.new(${["False", ...fields].join(comma)})}`;
    }
  }
}

function lvalueName(value: LValue, context: Context): string | undefined {
  if (value.kind === "symbolLValue") return context.names.get(value.symbol, value.name);
  return undefined;
}

function assignmentLines(target: LValue, value: TypedExpression, context: Context): readonly string[] {
  const direct = lvalueName(target, context);
  if (direct) return [`${direct} = ${emitTypedExpression(value, context)}`];
  if (target.kind === "propertyLValue") {
    const operation = target.operation ?? "maps.set";
    return [`{func, ${operation}(${emitTypedExpression(target.object, context)}, ${emitStringLiteral(target.property)}, ${emitTypedExpression(value, context)})}`];
  }
  if (target.kind === "indexLValue") {
    const operation = target.operation ?? "slices.set";
    return [`{func, ${operation}(${emitTypedExpression(target.object, context)}, ${emitTypedExpression(target.index, context)}, ${emitTypedExpression(value, context)})}`];
  }
  if (target.kind === "tupleLValue") {
    return target.elements.flatMap((element, index) => assignmentLines(element, {
      ...value,
      kind: "runtimeCall",
      operation: "tuple.get",
      args: [value, { ...value, kind: "typedInt", value: index }],
      effect: "read",
      type: element.type,
    }, context));
  }
  return [];
}

function pushTypedBlock(block: Block, depth: number, lines: string[], context: Context): void {
  for (const statement of block.statements) pushTypedStatement(statement, depth, lines, context);
}

function pushTypedStatement(statement: TypedStatement, depth: number, lines: string[], context: Context): void {
  const prefix = context.compact ? "" : INDENT.repeat(depth);
  const push = (line: string): void => { lines.push(prefix + line); };
  switch (statement.kind) {
    case "typedAssign": for (const line of assignmentLines(statement.target, statement.value, context)) push(line); return;
    case "typedIf":
      push(`if ${emitTypedExpression(statement.condition, context)}:`);
      pushTypedBlock(statement.thenBody, depth + 1, lines, context);
      for (const branch of statement.elifs ?? []) { push(`elif ${emitTypedExpression(branch.condition, context)}:`); pushTypedBlock(branch.body, depth + 1, lines, context); }
      if (statement.elseBody) { push("else:"); pushTypedBlock(statement.elseBody, depth + 1, lines, context); }
      push("fi"); return;
    case "typedCountFor": push(`for ${context.names.get(statement.variable)}, ${emitTypedExpression(statement.count, context)}:`); pushTypedBlock(statement.body, depth + 1, lines, context); push("rof"); return;
    case "typedReturn": push(statement.value ? `return ${emitTypedExpression(statement.value, context)}` : "return 0"); return;
    case "typedBreak": push("break"); return;
    case "typedContinue": push("continue"); return;
    case "typedExpressionStmt": push(emitTypedExpression(statement.expression, context)); return;
  }
}

function pushLegacyStatement(statement: Statement, depth: number, lines: string[], compact: boolean): void {
  const prefix = compact ? "" : INDENT.repeat(depth);
  switch (statement.kind) {
    case "assign": lines.push(`${prefix}${assertSafeName(statement.target, "Assignment target")} = ${emitLegacyExpression(statement.value)}`); return;
    case "if":
      lines.push(`${prefix}if ${emitLegacyExpression(statement.condition)}:`); for (const child of statement.thenBody) pushLegacyStatement(child, depth + 1, lines, compact);
      for (const branch of statement.elifs ?? []) { lines.push(`${prefix}elif ${emitLegacyExpression(branch.condition)}:`); for (const child of branch.body) pushLegacyStatement(child, depth + 1, lines, compact); }
      if (statement.elseBody) { lines.push(`${prefix}else:`); for (const child of statement.elseBody) pushLegacyStatement(child, depth + 1, lines, compact); }
      lines.push(`${prefix}fi`); return;
    case "countFor": lines.push(`${prefix}for ${assertSafeName(statement.variable, "Loop variable")}, ${emitLegacyExpression(statement.count)}:`); for (const child of statement.body) pushLegacyStatement(child, depth + 1, lines, compact); lines.push(`${prefix}rof`); return;
    case "return": lines.push(`${prefix}return ${emitLegacyExpression(statement.value)}`); return;
    case "break": lines.push(`${prefix}break`); return;
    case "continue": lines.push(`${prefix}continue`); return;
    case "expressionStmt": lines.push(`${prefix}${emitLegacyExpression(statement.expression)}`); return;
  }
}

function quoteCommandArgument(value: string): string {
  return JSON.stringify(value).replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
}

function functionNames(program: Program): ReadonlyMap<FunctionId, string> {
  return new Map([...(program.functions?.values() ?? [])].map(info => [info.id, info.emittedName ?? info.name]));
}

function registrationName(registration: Registration, context: Context): string {
  if (registration.kind === "customFunction") return registration.name ?? context.functions.get(registration.functionId) ?? String(registration.functionId);
  return registration.listener ?? context.functions.get(registration.handler) ?? String(registration.handler);
}

function emitRegistration(registration: Registration, context: Context): string {
  const code: string[] = [];
  if (registration.kind === "customFunction") {
    registration.parameters.forEach((parameter, index) => code.push(`${context.names.get(parameter)} = {func, tuple.get(args, ${index})}`));
    pushTypedBlock(registration.body, 0, code, { ...context, compact: true });
    const body = code.join(" | ");
    return `{command, ${emitStringLiteral(`customfunction add ${quoteCommandArgument(registrationName(registration, context))} ${quoteCommandArgument(body)}`)}}`;
  }
  if (registration.body) {
    for (const argument of registration.arguments) {
      if (argument.kind === "typedSymbol") code.push(`${context.names.get(argument.symbol, argument.name)} = args`);
    }
    pushTypedBlock(registration.body, 0, code, { ...context, compact: true });
  } else {
    code.push(emitTypedExpression({
      kind: "userCall", functionId: registration.handler, args: registration.arguments,
      name: registrationName(registration, context), type: { kind: "int" }, effect: "call", span: registration.span,
    }, { ...context, compact: true }), "return 0");
  }
  const onError = registration.onError ?? "return 0";
  const command = `systemevent listen ${quoteCommandArgument(registration.event)} ${quoteCommandArgument(registrationName(registration, context))} ${quoteCommandArgument(code.join(" | "))} ${quoteCommandArgument(onError)}`;
  return `{command, ${emitStringLiteral(command)}}`;
}

export function emitProgram(program: Program, options: EmitOptions = {}): string {
  const level = options.optimizationLevel ?? 0;
  const optimized = runOptimizationPipeline(program, level);
  const context: Context = { names: allocateNames(optimized, options.strip ?? false), functions: functionNames(optimized), compact: level >= 1 };
  const lines: string[] = [];
  if (optimized.modules?.length) {
    for (const module of optimized.modules) {
      for (const registration of module.registrations) lines.push(emitRegistration(registration, context));
      pushTypedBlock(module.body, 0, lines, context);
    }
  } else {
    for (const statement of optimized.body) pushLegacyStatement(statement, 0, lines, context.compact);
  }
  if (!lines.length) return "";
  return context.compact ? `${lines.join("|")}\n` : `${lines.join("\n")}\n`;
}

export function emitExpression(expression: Expression): string {
  return emitLegacyExpression(expression);
}
