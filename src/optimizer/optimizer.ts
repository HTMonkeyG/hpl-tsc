import type {
  Block, LValue, ModuleBlock, Program, Registration, SymbolId, TypedExpression, TypedStatement,
} from "../ir/nodes.js";
import type { OptimizationLevel } from "../types.js";

function literal(expression: TypedExpression): expression is Extract<TypedExpression,
  { kind: "typedInt" | "typedFloat" | "typedBool" | "typedString" }> {
  return expression.kind === "typedInt" || expression.kind === "typedFloat"
    || expression.kind === "typedBool" || expression.kind === "typedString";
}

function foldUnary(expression: Extract<TypedExpression, { kind: "typedUnary" }>): TypedExpression {
  const operand = optimizeExpression(expression.operand);
  if (!literal(operand)) return { ...expression, operand };
  if (expression.operator === "not") return { ...expression, kind: "typedBool", value: !operand.value };
  if (typeof operand.value !== "number") return { ...expression, operand };
  const value = -operand.value;
  if (!Number.isFinite(value) || operand.kind === "typedInt" && (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647)) {
    return { ...expression, operand };
  }
  return operand.kind === "typedInt"
    ? { ...expression, kind: "typedInt", value }
    : { ...expression, kind: "typedFloat", value };
}

function numericBinary(operator: string, left: number, right: number): number | boolean | undefined {
  switch (operator) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/": return right === 0 ? undefined : left / right;
    case "<": return left < right;
    case ">": return left > right;
    case "<=": return left <= right;
    case ">=": return left >= right;
    default: return undefined;
  }
}

function foldBinary(expression: Extract<TypedExpression, { kind: "typedBinary" }>): TypedExpression {
  const left = optimizeExpression(expression.left);
  const right = optimizeExpression(expression.right);
  if (!literal(left) || !literal(right)) return { ...expression, left, right };
  let value: string | number | boolean | undefined;
  if (expression.operator === "==") value = left.value === right.value;
  else if (expression.operator === "!=") value = left.value !== right.value;
  else if (expression.operator === "+" && typeof left.value === "string" && typeof right.value === "string") value = left.value + right.value;
  else if (expression.operator === "and" && typeof left.value === "boolean" && typeof right.value === "boolean") value = left.value && right.value;
  else if (expression.operator === "or" && typeof left.value === "boolean" && typeof right.value === "boolean") value = left.value || right.value;
  else if (typeof left.value === "number" && typeof right.value === "number") value = numericBinary(expression.operator, left.value, right.value);
  if (value === undefined || typeof value === "number" && !Number.isFinite(value)) return { ...expression, left, right };
  if (typeof value === "boolean") return { ...expression, kind: "typedBool", value };
  if (typeof value === "string") return { ...expression, kind: "typedString", value };
  if (expression.type.kind === "int" && (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647)) {
    return { ...expression, left, right };
  }
  return Number.isInteger(value) && expression.type.kind === "int"
    ? { ...expression, kind: "typedInt", value }
    : { ...expression, kind: "typedFloat", value };
}

function foldedString(operand: Extract<TypedExpression,
  { kind: "typedInt" | "typedFloat" | "typedBool" | "typedString" }>): string {
  if (operand.kind === "typedBool") return operand.value ? "True" : "False";
  if (operand.kind === "typedFloat") {
    if (Object.is(operand.value, -0)) return "-0.0";
    return Number.isInteger(operand.value) ? `${operand.value}.0` : String(operand.value);
  }
  return String(operand.value);
}

function foldCast(expression: Extract<TypedExpression, { kind: "typedCast" }>): TypedExpression {
  const operand = optimizeExpression(expression.expression);
  if (!literal(operand)) return { ...expression, expression: operand };
  const value = operand.value;
  let folded: string | number | boolean | undefined;
  if (expression.type.kind === "str") folded = foldedString(operand);
  else if (expression.type.kind === "bool") folded = Boolean(value);
  else if (expression.type.kind === "float") {
    if (typeof value === "string" && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(value.trim())) {
      return { ...expression, expression: operand };
    }
    folded = Number(value);
  } else if (expression.type.kind === "int") {
    if (typeof value === "string" && !/^[+-]?\d+$/u.test(value)) return { ...expression, expression: operand };
    folded = Math.trunc(Number(value));
  }
  if (folded === undefined || typeof folded === "number" && !Number.isFinite(folded)) return { ...expression, expression: operand };
  if (expression.type.kind === "int" && typeof folded === "number"
    && (!Number.isSafeInteger(folded) || folded < -2147483648 || folded > 2147483647)) {
    return { ...expression, expression: operand };
  }
  if (typeof folded === "string") return { ...expression, kind: "typedString", value: folded };
  if (typeof folded === "boolean") return { ...expression, kind: "typedBool", value: folded };
  return expression.type.kind === "int"
    ? { ...expression, kind: "typedInt", value: folded }
    : { ...expression, kind: "typedFloat", value: folded };
}

export function optimizeExpression(expression: TypedExpression): TypedExpression {
  switch (expression.kind) {
    case "typedCast": return foldCast(expression);
    case "typedUnary": return foldUnary(expression);
    case "typedBinary": return foldBinary(expression);
    case "runtimeCall": return { ...expression, args: expression.args.map(optimizeExpression) };
    case "userCall": return { ...expression, args: expression.args.map(optimizeExpression) };
    case "typedSelector": return { ...expression, target: optimizeExpression(expression.target) };
    case "typedScore": return { ...expression, target: optimizeExpression(expression.target), objective: optimizeExpression(expression.objective) };
    case "typedCommand": return { ...expression, command: optimizeExpression(expression.command) };
    case "typedRef": return { ...expression, index: optimizeExpression(expression.index) };
    case "tuple": return { ...expression, elements: expression.elements.map(optimizeExpression) };
    case "args": return { ...expression, values: expression.values.map(optimizeExpression) };
    case "slice": return { ...expression, elements: expression.elements.map(optimizeExpression) };
    case "map": return { ...expression, entries: expression.entries.map(({ key, value }) => ({ key: optimizeExpression(key), value: optimizeExpression(value) })) };
    case "set": return { ...expression, elements: expression.elements.map(optimizeExpression) };
    case "object": return { ...expression, fields: expression.fields.map(({ name, value }) => ({ name, value: optimizeExpression(value) })) };
    default: return expression;
  }
}

function optimizeLValue(value: LValue): LValue {
  switch (value.kind) {
    case "propertyLValue": return { ...value, object: optimizeExpression(value.object) };
    case "indexLValue": return { ...value, object: optimizeExpression(value.object), index: optimizeExpression(value.index) };
    case "tupleLValue": return { ...value, elements: value.elements.map(optimizeLValue) };
    default: return value;
  }
}

function optimizeStatement(statement: TypedStatement, inlineable: ReadonlySet<SymbolId>): TypedStatement {
  switch (statement.kind) {
    case "typedAssign": return { ...statement, target: optimizeLValue(statement.target), value: optimizeExpression(statement.value) };
    case "typedIf": return { ...statement, condition: optimizeExpression(statement.condition), thenBody: optimizeBlock(statement.thenBody, inlineable), ...(statement.elifs ? { elifs: statement.elifs.map(branch => ({ ...branch, condition: optimizeExpression(branch.condition), body: optimizeBlock(branch.body, inlineable) })) } : {}), ...(statement.elseBody ? { elseBody: optimizeBlock(statement.elseBody, inlineable) } : {}) };
    case "typedCountFor": return { ...statement, count: optimizeExpression(statement.count), body: optimizeBlock(statement.body, inlineable) };
    case "typedReturn": return statement.value ? { ...statement, value: optimizeExpression(statement.value) } : statement;
    case "typedExpressionStmt": return { ...statement, expression: optimizeExpression(statement.expression) };
    default: return statement;
  }
}

function countExpression(expression: TypedExpression, uses: Map<SymbolId, number>): void {
  if (expression.kind === "typedSymbol") { uses.set(expression.symbol, (uses.get(expression.symbol) ?? 0) + 1); return; }
  if (expression.kind === "typedCast") return countExpression(expression.expression, uses);
  if (expression.kind === "typedUnary") return countExpression(expression.operand, uses);
  if (expression.kind === "typedBinary") { countExpression(expression.left, uses); countExpression(expression.right, uses); return; }
  if (expression.kind === "runtimeCall" || expression.kind === "userCall") return expression.args.forEach(value => countExpression(value, uses));
  if (expression.kind === "typedSelector") return countExpression(expression.target, uses);
  if (expression.kind === "typedScore") { countExpression(expression.target, uses); countExpression(expression.objective, uses); return; }
  if (expression.kind === "typedCommand") return countExpression(expression.command, uses);
  if (expression.kind === "typedRef") return countExpression(expression.index, uses);
  if (expression.kind === "tuple" || expression.kind === "slice" || expression.kind === "set") return expression.elements.forEach(value => countExpression(value, uses));
  if (expression.kind === "args") return expression.values.forEach(value => countExpression(value, uses));
  if (expression.kind === "map") return expression.entries.forEach(({ key, value }) => { countExpression(key, uses); countExpression(value, uses); });
  if (expression.kind === "object") expression.fields.forEach(({ value }) => countExpression(value, uses));
}

function countLValue(value: LValue, uses: Map<SymbolId, number>): void {
  if (value.kind === "propertyLValue") countExpression(value.object, uses);
  else if (value.kind === "indexLValue") { countExpression(value.object, uses); countExpression(value.index, uses); }
  else if (value.kind === "tupleLValue") value.elements.forEach(element => countLValue(element, uses));
}

function countStatement(statement: TypedStatement, uses: Map<SymbolId, number>, writes: Map<SymbolId, number>): void {
  if (statement.kind === "typedAssign") {
    if (statement.target.kind === "symbolLValue") writes.set(statement.target.symbol, (writes.get(statement.target.symbol) ?? 0) + 1);
    countLValue(statement.target, uses); countExpression(statement.value, uses); return;
  }
  if (statement.kind === "typedIf") {
    countExpression(statement.condition, uses); countBlock(statement.thenBody, uses, writes);
    statement.elifs?.forEach(branch => { countExpression(branch.condition, uses); countBlock(branch.body, uses, writes); });
    if (statement.elseBody) countBlock(statement.elseBody, uses, writes); return;
  }
  if (statement.kind === "typedCountFor") { writes.set(statement.variable, (writes.get(statement.variable) ?? 0) + 1); countExpression(statement.count, uses); countBlock(statement.body, uses, writes); return; }
  if (statement.kind === "typedReturn" && statement.value) countExpression(statement.value, uses);
  if (statement.kind === "typedExpressionStmt") countExpression(statement.expression, uses);
}

function countBlock(block: Block, uses: Map<SymbolId, number>, writes: Map<SymbolId, number>): void {
  block.statements.forEach(statement => countStatement(statement, uses, writes));
}

function replaceExpression(expression: TypedExpression, replacements: ReadonlyMap<SymbolId, TypedExpression>): TypedExpression {
  if (expression.kind === "typedSymbol") return replacements.get(expression.symbol) ?? expression;
  if (expression.kind === "typedCast") return { ...expression, expression: replaceExpression(expression.expression, replacements) };
  if (expression.kind === "typedUnary") return { ...expression, operand: replaceExpression(expression.operand, replacements) };
  if (expression.kind === "typedBinary") return { ...expression, left: replaceExpression(expression.left, replacements), right: replaceExpression(expression.right, replacements) };
  if (expression.kind === "runtimeCall" || expression.kind === "userCall") return { ...expression, args: expression.args.map(value => replaceExpression(value, replacements)) };
  if (expression.kind === "typedSelector") return { ...expression, target: replaceExpression(expression.target, replacements) };
  if (expression.kind === "typedScore") return { ...expression, target: replaceExpression(expression.target, replacements), objective: replaceExpression(expression.objective, replacements) };
  if (expression.kind === "typedCommand") return { ...expression, command: replaceExpression(expression.command, replacements) };
  if (expression.kind === "typedRef") return { ...expression, index: replaceExpression(expression.index, replacements) };
  if (expression.kind === "tuple" || expression.kind === "slice" || expression.kind === "set") return { ...expression, elements: expression.elements.map(value => replaceExpression(value, replacements)) };
  if (expression.kind === "args") return { ...expression, values: expression.values.map(value => replaceExpression(value, replacements)) };
  if (expression.kind === "map") return { ...expression, entries: expression.entries.map(({ key, value }) => ({ key: replaceExpression(key, replacements), value: replaceExpression(value, replacements) })) };
  if (expression.kind === "object") return { ...expression, fields: expression.fields.map(field => ({ ...field, value: replaceExpression(field.value, replacements) })) };
  return expression;
}

function replaceLValue(value: LValue, replacements: ReadonlyMap<SymbolId, TypedExpression>): LValue {
  if (value.kind === "propertyLValue") return { ...value, object: replaceExpression(value.object, replacements) };
  if (value.kind === "indexLValue") return { ...value, object: replaceExpression(value.object, replacements), index: replaceExpression(value.index, replacements) };
  if (value.kind === "tupleLValue") return { ...value, elements: value.elements.map(element => replaceLValue(element, replacements)) };
  return value;
}

function replaceStatement(
  statement: TypedStatement,
  replacements: ReadonlyMap<SymbolId, TypedExpression>,
  inlineable: ReadonlySet<SymbolId>,
): TypedStatement {
  if (statement.kind === "typedAssign") return { ...statement, target: replaceLValue(statement.target, replacements), value: optimizeExpression(replaceExpression(statement.value, replacements)) };
  if (statement.kind === "typedIf") return { ...statement, condition: optimizeExpression(replaceExpression(statement.condition, replacements)), thenBody: inlineBlock(statement.thenBody, inlineable, replacements), ...(statement.elifs ? { elifs: statement.elifs.map(branch => ({ ...branch, condition: optimizeExpression(replaceExpression(branch.condition, replacements)), body: inlineBlock(branch.body, inlineable, replacements) })) } : {}), ...(statement.elseBody ? { elseBody: inlineBlock(statement.elseBody, inlineable, replacements) } : {}) };
  if (statement.kind === "typedCountFor") return { ...statement, count: optimizeExpression(replaceExpression(statement.count, replacements)), body: inlineBlock(statement.body, inlineable, replacements) };
  if (statement.kind === "typedReturn") return statement.value ? { ...statement, value: optimizeExpression(replaceExpression(statement.value, replacements)) } : statement;
  if (statement.kind === "typedExpressionStmt") return { ...statement, expression: optimizeExpression(replaceExpression(statement.expression, replacements)) };
  return statement;
}

function safeInlineValue(expression: TypedExpression): boolean {
  return expression.effect === "pure" && (
    expression.kind === "typedInt"
    || expression.kind === "typedFloat"
    || expression.kind === "typedBool"
    || expression.kind === "typedString"
  );
}

function inlineBlock(
  block: Block,
  inlineable: ReadonlySet<SymbolId>,
  inherited: ReadonlyMap<SymbolId, TypedExpression> = new Map(),
): Block {
  const replacements = new Map<SymbolId, TypedExpression>(inherited); const statements: TypedStatement[] = [];
  for (const statement of block.statements) {
    const value = statement.kind === "typedAssign"
      ? optimizeExpression(replaceExpression(statement.value, replacements))
      : undefined;
    if (statement.kind === "typedAssign" && statement.target.kind === "symbolLValue" && value && safeInlineValue(value)
      && inlineable.has(statement.target.symbol)) {
      replacements.set(statement.target.symbol, value); continue;
    }
    statements.push(replaceStatement(statement, replacements, inlineable));
  }
  return { ...block, statements };
}

function inlineableSymbols(block: Block): ReadonlySet<SymbolId> {
  const uses = new Map<SymbolId, number>(); const writes = new Map<SymbolId, number>();
  countBlock(block, uses, writes);
  return new Set([...writes].filter(([symbol, count]) => count === 1 && uses.get(symbol) === 1).map(([symbol]) => symbol));
}

function optimizeBlock(block: Block, inherited?: ReadonlySet<SymbolId>): Block {
  const inlineable = inherited ?? inlineableSymbols(block);
  return inlineBlock({ ...block, statements: block.statements.map(statement => optimizeStatement(statement, inlineable)) }, inlineable);
}

function optimizeRegistration(registration: Registration): Registration {
  return registration.kind === "customFunction"
    ? { ...registration, body: optimizeBlock(registration.body) }
    : { ...registration, arguments: registration.arguments.map(optimizeExpression), ...(registration.body ? { body: optimizeBlock(registration.body) } : {}) };
}

function optimizeModule(module: ModuleBlock): ModuleBlock {
  return { ...module, body: optimizeBlock(module.body), registrations: module.registrations.map(optimizeRegistration) };
}

export function optimizeProgram(program: Program, optimizationLevel: OptimizationLevel = 2): Program {
  return optimizationLevel >= 2 && program.modules ? { ...program, modules: program.modules.map(optimizeModule) } : program;
}
