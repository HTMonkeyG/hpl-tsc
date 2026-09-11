import ts from "typescript";
import {
  assign, block, boolExpression, breakStatement, continueStatement, countFor,
  expressionStatement, ifBranch, ifStatement, intExpression, returnStatement, runtimeCall,
} from "../ir/builders.js";
import type { TypedExpression, TypedStatement } from "../ir/nodes.js";
import type { LoweringContext } from "./context.js";
import { getSymbol, getSymbolId, report, semanticType, span } from "./context.js";
import { lowerExpression } from "./expressions.js";
import { lowerLValue } from "./lvalues.js";
import { validateReturnType } from "../analysis/validator.js";
import { HPL_BOOL } from "../analysis/types.js";
import { isAssignableTo } from "../analysis/type-operations.js";

function lowerAssignment(context: LoweringContext, node: ts.BinaryExpression): TypedStatement[] | undefined {
  const operator = node.operatorToken.kind;
  const isAssignment = operator === ts.SyntaxKind.EqualsToken || operator === ts.SyntaxKind.PlusEqualsToken
    || operator === ts.SyntaxKind.MinusEqualsToken || operator === ts.SyntaxKind.AsteriskEqualsToken
    || operator === ts.SyntaxKind.SlashEqualsToken;
  if (!isAssignment) return undefined;
  const target = lowerLValue(context, node.left, lowerExpression);
  if (!target) return [];
  let value = lowerExpression(context, node.right);
  if (operator !== ts.SyntaxKind.EqualsToken) {
    const read = lowerExpression(context, node.left);
    const mapped = operator === ts.SyntaxKind.PlusEqualsToken ? "+" : operator === ts.SyntaxKind.MinusEqualsToken ? "-" : operator === ts.SyntaxKind.AsteriskEqualsToken ? "*" : "/";
    value = { kind: "typedBinary", operator: mapped, left: read, right: value, type: target.kind === "container" ? target.valueType : target.type, effect: read.effect === "pure" && value.effect === "pure" ? "pure" : "read", span: span(node) };
  }
  if (target.kind === "container") return [expressionStatement(runtimeCall(target.operation, [target.object, target.key, value], value.type, span(node), "write"), span(node))];
  if (!isAssignableTo(value.type, target.type)) {
    report(context, node.right, 4307, "Assignment value is not assignable to the target HPL type");
    return [];
  }
  return [assign(target, value, span(node))];
}

function lowerVariable(context: LoweringContext, node: ts.VariableStatement): TypedStatement[] {
  const statements: TypedStatement[] = [];
  for (const declaration of node.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
      report(context, declaration, 4301, "Variables require an identifier and initializer");
      continue;
    }
    const target = {
      kind: "symbolLValue" as const,
      symbol: getSymbolId(context, declaration.name),
      name: declaration.name.text,
      type: semanticType(context, declaration.name),
      span: span(declaration.name),
    };
    const value = lowerExpression(context, declaration.initializer);
    if (!isAssignableTo(value.type, target.type)) {
      report(context, declaration.initializer, 4307, "Assignment value is not assignable to the declared HPL type");
      continue;
    }
    statements.push(assign(target, value, span(declaration)));
  }
  return statements;
}

function lowerIf(context: LoweringContext, node: ts.IfStatement): TypedStatement {
  let condition = lowerExpression(context, node.expression);
  if (!isAssignableTo(condition.type, HPL_BOOL)) {
    report(context, node.expression, 4308, "If condition must be an HPL bool");
    condition = boolExpression(false, span(node.expression));
  }
  const thenBody = lowerBlock(context, node.thenStatement);
  const elifs = [];
  let alternate = node.elseStatement;
  while (alternate && ts.isIfStatement(alternate)) {
    const branchCondition = lowerExpression(context, alternate.expression);
    elifs.push(ifBranch(branchCondition, lowerBlock(context, alternate.thenStatement), span(alternate)));
    alternate = alternate.elseStatement;
  }
  return ifStatement(condition, thenBody, span(node), elifs, alternate ? lowerBlock(context, alternate) : undefined);
}

function lowerFor(context: LoweringContext, node: ts.ForStatement): TypedStatement[] {
  const declaration = node.initializer && ts.isVariableDeclarationList(node.initializer)
    && node.initializer.declarations.length === 1 ? node.initializer.declarations[0] : undefined;
  const identifier = declaration && ts.isIdentifier(declaration.name) ? declaration.name : undefined;
  const condition = node.condition;
  const increment = node.incrementor;
  const sameConditionSymbol = identifier && condition && ts.isBinaryExpression(condition)
    && ts.isIdentifier(condition.left) && getSymbol(context, condition.left) === getSymbol(context, identifier);
  const sameIncrementSymbol = identifier && increment
    && (ts.isPrefixUnaryExpression(increment) || ts.isPostfixUnaryExpression(increment))
    && increment.operator === ts.SyntaxKind.PlusPlusToken && ts.isIdentifier(increment.operand)
    && getSymbol(context, increment.operand) === getSymbol(context, identifier);
  const valid = identifier && declaration?.initializer && ts.isNumericLiteral(declaration.initializer)
    && Number(declaration.initializer.text) === 0 && condition && ts.isBinaryExpression(condition)
    && condition.operatorToken.kind === ts.SyntaxKind.LessThanToken && sameConditionSymbol && sameIncrementSymbol;
  if (!valid || !identifier || !condition || !ts.isBinaryExpression(condition)) {
    report(context, node, 4302, "Only canonical for (let i = 0; i < count; i++) loops are supported");
    return [];
  }
  const bound = lowerExpression(context, condition.right);
  if (bound.type.kind !== "int") {
    report(context, condition.right, 4303, "Canonical for loop bound must be an HPL int");
    return [];
  }
  context.loopDepth++;
  const body = lowerBlock(context, node.statement);
  context.loopDepth--;
  return [countFor(getSymbolId(context, identifier), bound, body, span(node))];
}

export function lowerBlock(context: LoweringContext, node: ts.Statement): ReturnType<typeof block> {
  return block(ts.isBlock(node) ? node.statements.flatMap((statement) => lowerStatement(context, statement)) : lowerStatement(context, node), span(node));
}

export function lowerStatement(context: LoweringContext, node: ts.Statement): TypedStatement[] {
  if (ts.isBlock(node)) return node.statements.flatMap((statement) => lowerStatement(context, statement));
  if (ts.isVariableStatement(node)) return lowerVariable(context, node);
  if (ts.isExpressionStatement(node)) {
    if (ts.isBinaryExpression(node.expression)) {
      const assignment = lowerAssignment(context, node.expression);
      if (assignment) return assignment;
    }
    return [expressionStatement(lowerExpression(context, node.expression), span(node))];
  }
  if (ts.isIfStatement(node)) return [lowerIf(context, node)];
  if (ts.isForStatement(node)) return lowerFor(context, node);
  if (ts.isReturnStatement(node)) {
    const value = node.expression ? lowerExpression(context, node.expression) : undefined;
    if (context.frame) {
      const diagnostic = validateReturnType(node, value?.type ?? { kind: "none" }, context.frame.returnType);
      if (diagnostic) context.diagnostics.push(diagnostic);
      if (context.frame.returnType.kind === "none") return [returnStatement(span(node), intExpression(0, span(node)))];
    }
    return [returnStatement(span(node), value ?? intExpression(0, span(node)))];
  }
  if (ts.isBreakStatement(node)) {
    if (!context.loopDepth) report(context, node, 4304, "break is only valid inside a canonical for loop");
    return [breakStatement(span(node))];
  }
  if (ts.isContinueStatement(node)) {
    if (!context.loopDepth) report(context, node, 4305, "continue is only valid inside a canonical for loop");
    return [continueStatement(span(node))];
  }
  if (ts.isEmptyStatement(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)
    || ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return [];
  if (ts.isClassDeclaration(node) && context.declarations.classes.has(node)) return [];
  report(context, node, 4306, `Unsupported statement: ${ts.SyntaxKind[node.kind]}`);
  return [];
}
