import ts from "typescript";
import { conventionForType } from "../analysis/type-operations.js";
import { HPL_INT, HPL_STR, type HplSemanticType } from "../analysis/types.js";
import { runtimeCall, stringExpression } from "../ir/builders.js";
import type { TypedExpression } from "../ir/nodes.js";
import { RAW_PTR_SUPPORT } from "../catalog/runtime.js";
import type { LoweringContext } from "./context.js";
import { report, semanticType, span } from "./context.js";

export type ContainerKind = "slice" | "map" | "set" | "object";

export function containerKind(type: HplSemanticType): ContainerKind | undefined {
  if (type.kind === "slice" || type.kind === "map" || type.kind === "set" || type.kind === "object") return type.kind;
  return undefined;
}

export function containerMemberSource(type: HplSemanticType): "Array" | "Map" | "Set" | "string" | undefined {
  if (type.kind === "slice") return "Array";
  if (type.kind === "map" || type.kind === "object") return "Map";
  if (type.kind === "set") return "Set";
  if (type.kind === "str") return "string";
  return undefined;
}

export function indexedType(type: HplSemanticType): HplSemanticType | undefined {
  if (type.kind === "slice" || type.kind === "set") return type.element;
  if (type.kind === "map") return type.value;
  if (type.kind === "tuple") return type.elements[0] ?? type.rest;
  if (type.kind === "object") return undefined;
  return undefined;
}

export function lowerLength(
  context: LoweringContext,
  node: ts.PropertyAccessExpression,
  receiver: TypedExpression,
): TypedExpression | undefined {
  const type = semanticType(context, node.expression);
  if (node.name.text === "length" && (type.kind === "slice" || type.kind === "tuple")) return runtimeCall("slices.length", [receiver], HPL_INT, span(node), "read");
  if (node.name.text === "size" && type.kind === "map") return runtimeCall("maps.length", [receiver], HPL_INT, span(node), "read");
  if (node.name.text === "size" && type.kind === "set") return runtimeCall("set.length", [receiver], HPL_INT, span(node), "read");
  return undefined;
}

export function mapConvention(
  context: LoweringContext,
  node: ts.Node,
  keyType: HplSemanticType,
  valueType: HplSemanticType,
): "raw" | "ptr" | undefined {
  const key = conventionForType(keyType);
  const value = conventionForType(valueType);
  if (key !== value) {
    report(context, node, 4405, "HPL maps require key and value to use the same raw/ptr ABI convention");
    return undefined;
  }
  return key;
}

export function indexReadOperation(
  context: LoweringContext,
  node: ts.ElementAccessExpression | ts.PropertyAccessExpression,
  ownerType: HplSemanticType,
  resultType: HplSemanticType,
): string | undefined {
  if (ownerType.kind === "slice" || ownerType.kind === "tuple") return RAW_PTR_SUPPORT.slice.get[conventionForType(resultType)];
  if (ownerType.kind === "map") {
    const convention = mapConvention(context, node, ownerType.key, ownerType.value);
    return convention ? RAW_PTR_SUPPORT.map.get[convention] : undefined;
  }
  if (ownerType.kind === "object") return conventionForType(resultType) === "ptr" ? "maps.ptr_get" : "maps.get";
  report(context, node, 4403, "Index access requires a slice, tuple, map, or interface/object value");
  return undefined;
}

export function propertyType(type: HplSemanticType, name: string): HplSemanticType | undefined {
  return type.kind === "object" ? type.properties.find((property) => property.name === name)?.type : undefined;
}

export function propertyRead(
  context: LoweringContext,
  node: ts.PropertyAccessExpression,
  receiver: TypedExpression,
): TypedExpression | undefined {
  const ownerType = semanticType(context, node.expression);
  const resultType = propertyType(ownerType, node.name.text);
  if (!resultType) return undefined;
  const operation = indexReadOperation(context, node, ownerType, resultType);
  return operation ? runtimeCall(operation, [receiver, stringExpression(node.name.text, span(node.name))], resultType, span(node), "read") : undefined;
}

export function constructorOperation(type: HplSemanticType): string | undefined {
  if (type.kind === "slice") return "slices.new";
  if (type.kind === "map" || type.kind === "object") return "maps.new";
  if (type.kind === "set") return "set.new";
  return undefined;
}

export const STRING_KEY_TYPE = HPL_STR;
