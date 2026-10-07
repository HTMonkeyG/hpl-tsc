import ts from "typescript";
import { HPL_BOOL, HPL_INT } from "../analysis/types.js";
import { isAssignableTo } from "../analysis/type-operations.js";
import {
  boolExpression, floatExpression, intExpression, noneExpression,
  objectExpression, runtimeCall, sliceExpression, stringExpression,
  symbolExpression,
} from "../ir/builders.js";
import type { BinaryOperator, Effect, TypedExpression } from "../ir/nodes.js";
import type { LoweringContext } from "./context.js";
import { getSymbolId, report, semanticType, span } from "./context.js";
import { indexReadOperation, lowerLength, propertyRead } from "./containers.js";
import { lowerCall, lowerNewExpression } from "./calls.js";

const operators = new Map<ts.SyntaxKind, BinaryOperator>([
  [ts.SyntaxKind.PlusToken, "+"], [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"], [ts.SyntaxKind.SlashToken, "/"],
  [ts.SyntaxKind.EqualsEqualsToken, "=="], [ts.SyntaxKind.EqualsEqualsEqualsToken, "=="],
  [ts.SyntaxKind.ExclamationEqualsToken, "!="], [ts.SyntaxKind.ExclamationEqualsEqualsToken, "!="],
  [ts.SyntaxKind.LessThanToken, "<"], [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanToken, ">"], [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
  [ts.SyntaxKind.AmpersandAmpersandToken, "and"], [ts.SyntaxKind.BarBarToken, "or"],
  [ts.SyntaxKind.InKeyword, "in"],
]);

const mappedOperators = new Map<ts.SyntaxKind, string>([
  [ts.SyntaxKind.PercentToken, "math.mod"], [ts.SyntaxKind.AsteriskAsteriskToken, "math.pow"],
  [ts.SyntaxKind.AmpersandToken, "math.bit_and"], [ts.SyntaxKind.BarToken, "math.bit_or"],
  [ts.SyntaxKind.CaretToken, "math.bit_xor"], [ts.SyntaxKind.LessThanLessThanToken, "math.left_shift"],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, "math.right_shift"],
]);

function effectOf(...expressions: readonly TypedExpression[]): Effect {
  return expressions.some(({ effect }) => effect === "call") ? "call"
    : expressions.some(({ effect }) => effect === "write") ? "write"
    : expressions.some(({ effect }) => effect === "read") ? "read" : "pure";
}

function lowerArray(context: LoweringContext, node: ts.ArrayLiteralExpression): TypedExpression {
  const elements: TypedExpression[] = [];
  for (const element of node.elements) {
    if (ts.isOmittedExpression(element) || ts.isSpreadElement(element)) {
      report(context, element, 4201, "Sparse arrays and array spread are not supported");
      continue;
    }
    elements.push(lowerExpression(context, element));
  }
  const type = semanticType(context, node);
  if (type.kind !== "slice") return runtimeCall("slices.new", elements, type, span(node));
  if (!elements.every((element) => isAssignableTo(element.type, type.element))) {
    report(context, node, 4206, "Array literal elements must share a single HPL type");
    return runtimeCall("slices.new", elements, type, span(node));
  }
  return sliceExpression(elements, type, span(node));
}

function lowerObject(context: LoweringContext, node: ts.ObjectLiteralExpression): TypedExpression {
  const fields: Array<{ name: string; value: TypedExpression }> = [];
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name) && !ts.isStringLiteralLike(property.name)) {
      report(context, property, 4202, "Object literals support only explicit identifier/string properties");
      continue;
    }
    fields.push({ name: property.name.text, value: lowerExpression(context, property.initializer) });
  }
  const type = semanticType(context, node);
  if (type.kind !== "object") {
    report(context, node, 4203, "Object literal must resolve to an interface/object type");
    return runtimeCall("maps.new", [], type, span(node));
  }
  return objectExpression(fields, type, span(node));
}

function lowerBinary(context: LoweringContext, node: ts.BinaryExpression): TypedExpression {
  const left = lowerExpression(context, node.left);
  const right = lowerExpression(context, node.right);
  const operator = operators.get(node.operatorToken.kind);
  if (operator) {
    const comparison = ["==", "!=", "<", "<=", ">", ">=", "in"].includes(operator);
    const logical = operator === "and" || operator === "or";
    const numericType = operator === "/" ? { kind: "float" as const }
      : left.type.kind === "int" && right.type.kind === "int" ? HPL_INT
      : semanticType(context, node);
    return {
      kind: "typedBinary",
      operator,
      left,
      right,
      type: comparison || logical ? HPL_BOOL : numericType,
      effect: effectOf(left, right),
      span: span(node),
    };
  }
  const operation = mappedOperators.get(node.operatorToken.kind);
  if (operation) return runtimeCall(operation, [left, right], semanticType(context, node), span(node));
  report(context, node, 4204, "Unsupported binary expression in value position");
  return intExpression(0, span(node));
}

export function lowerExpression(context: LoweringContext, node: ts.Expression): TypedExpression {
  if (ts.isNumericLiteral(node)) {
    const value = Number(node.text);
    return Number.isInteger(value) ? intExpression(value, span(node)) : floatExpression(value, span(node));
  }
  if (ts.isStringLiteralLike(node)) return stringExpression(node.text, span(node));
  if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) return boolExpression(node.kind === ts.SyntaxKind.TrueKeyword, span(node));
  if (node.kind === ts.SyntaxKind.NullKeyword) return noneExpression(span(node));
  if (ts.isIdentifier(node)) return symbolExpression(getSymbolId(context, node), semanticType(context, node), span(node), node.text);
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node)) return lowerExpression(context, node.expression);
  if (ts.isArrayLiteralExpression(node)) return lowerArray(context, node);
  if (ts.isObjectLiteralExpression(node)) return lowerObject(context, node);
  if (ts.isNewExpression(node)) return lowerNewExpression(context, node);
  if (ts.isCallExpression(node)) return lowerCall(context, node);
  if (ts.isBinaryExpression(node)) return lowerBinary(context, node);
  if (ts.isPrefixUnaryExpression(node)) {
    const operand = lowerExpression(context, node.operand);
    if (node.operator === ts.SyntaxKind.PlusToken) return operand;
    if (node.operator === ts.SyntaxKind.ExclamationToken) return { kind: "typedUnary", operator: "not", operand, type: HPL_BOOL, effect: operand.effect, span: span(node) };
    if (node.operator === ts.SyntaxKind.MinusToken) return { kind: "typedUnary", operator: "negate", operand, type: semanticType(context, node), effect: operand.effect, span: span(node) };
    if (node.operator === ts.SyntaxKind.TildeToken) return runtimeCall("math.bit_not", [operand], HPL_INT, span(node));
  }
  if (ts.isPropertyAccessExpression(node)) {
    const receiver = lowerExpression(context, node.expression);
    const length = lowerLength(context, node, receiver);
    if (length) return length;
    const property = propertyRead(context, node, receiver);
    if (property) return property;
  }
  if (ts.isElementAccessExpression(node) && node.argumentExpression) {
    const ownerType = semanticType(context, node.expression);
    const resultType = semanticType(context, node);
    const operation = indexReadOperation(context, node, ownerType, resultType);
    if (operation) {
      const receiver = lowerExpression(context, node.expression);
      let keyExpr = lowerExpression(context, node.argumentExpression);

      // For maps.ptr_get/maps.ptr_set with object types, wrap non-primitive keys with object.ref
      if ((operation === "maps.ptr_get" || operation === "maps.ptr_set") && ownerType.kind === "object") {
        keyExpr = runtimeCall("object.ref", [keyExpr], { kind: "int" }, span(node.argumentExpression));
      }

      return runtimeCall(operation, [receiver, keyExpr], resultType, span(node), "read");
    }
  }
  report(context, node, 4205, `Unsupported expression: ${ts.SyntaxKind[node.kind]}`);
  return intExpression(0, span(node));
}
