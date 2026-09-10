import ts from "typescript";
import { conventionForType } from "../analysis/type-operations.js";
import type { HplSemanticType } from "../analysis/types.js";
import type { LValue, TypedExpression } from "../ir/nodes.js";
import { stringExpression, symbolLValue } from "../ir/builders.js";
import { RAW_PTR_SUPPORT } from "../catalog/runtime.js";
import type { LoweringContext } from "./context.js";
import { getSymbolId, report, semanticType, span } from "./context.js";
import { mapConvention, propertyType } from "./containers.js";

export interface ContainerLValue {
  readonly kind: "container";
  readonly object: TypedExpression;
  readonly key: TypedExpression;
  readonly valueType: HplSemanticType;
  readonly operation: string;
  readonly span: ReturnType<typeof span>;
}

export type LoweredLValue = LValue | ContainerLValue;
export type ExpressionLowerer = (context: LoweringContext, node: ts.Expression) => TypedExpression;

function isLength(node: ts.PropertyAccessExpression): boolean {
  return node.name.text === "length" || node.name.text === "size";
}

export function lowerLValue(
  context: LoweringContext,
  node: ts.Expression,
  lowerExpression: ExpressionLowerer,
): LoweredLValue | undefined {
  if (ts.isIdentifier(node)) return symbolLValue(getSymbolId(context, node), semanticType(context, node), span(node), node.text);
  if (ts.isPropertyAccessExpression(node)) {
    if (isLength(node)) {
      report(context, node, 4404, "Container length/size is read-only");
      return undefined;
    }
    const ownerType = semanticType(context, node.expression);
    const valueType = propertyType(ownerType, node.name.text);
    if (!valueType) {
      report(context, node, 4406, "Only declared interface/object properties are assignable");
      return undefined;
    }
    return {
      kind: "container",
      object: lowerExpression(context, node.expression),
      key: stringExpression(node.name.text, span(node.name)),
      valueType,
      operation: conventionForType(valueType) === "ptr" ? "maps.ptr_set" : "maps.set",
      span: span(node),
    };
  }
  if (ts.isElementAccessExpression(node) && node.argumentExpression) {
    const ownerType = semanticType(context, node.expression);
    const valueType = semanticType(context, node);
    let operation: string | undefined;
    if (ownerType.kind === "slice" || ownerType.kind === "tuple") operation = RAW_PTR_SUPPORT.slice.set[conventionForType(valueType)];
    if (ownerType.kind === "map") {
      const convention = mapConvention(context, node, ownerType.key, ownerType.value);
      if (convention) operation = RAW_PTR_SUPPORT.map.set[convention];
    }
    if (ownerType.kind === "object") operation = conventionForType(valueType) === "ptr" ? "maps.ptr_set" : "maps.set";
    if (!operation) {
      report(context, node, 4407, "Indexed assignment requires a compatible slice, tuple, map, or object");
      return undefined;
    }
    return {
      kind: "container",
      object: lowerExpression(context, node.expression),
      key: lowerExpression(context, node.argumentExpression),
      valueType,
      operation,
      span: span(node),
    };
  }
  report(context, node, 4408, "Unsupported assignment target");
  return undefined;
}
