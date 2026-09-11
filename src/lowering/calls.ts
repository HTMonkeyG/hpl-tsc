import ts from "typescript";
import { HPL_BOOL, HPL_FLOAT, HPL_INT, HPL_NONE, HPL_STR, type HplSemanticType, mapType, opaqueType, setType, sliceType, unknownType } from "../analysis/types.js";
import { findDeclarationDescriptor } from "../mappings/declarations.js";
import { getStandardMapping } from "../mappings/standard.js";
import {
  boolExpression, intExpression, runtimeCall, stringExpression,
  userCall,
} from "../ir/builders.js";
import type { TypedExpression } from "../ir/nodes.js";
import type { LoweringContext } from "./context.js";
import { report, semanticType, span } from "./context.js";
import { findIndexedMethod } from "../analysis/declaration-index.js";
import { containerMemberSource, indexedType, mapConvention } from "./containers.js";
import { lowerExpression } from "./expressions.js";

function descriptorResult(
  context: LoweringContext,
  call: ts.CallExpression,
  result: { readonly kind: string; readonly numberKind?: "int" | "float"; readonly refKind?: string },
): HplSemanticType {
  const fallback = semanticType(context, call);
  if (result.kind === "number") return result.numberKind === "int" ? HPL_INT : HPL_FLOAT;
  if (result.kind === "boolean") return HPL_BOOL;
  if (result.kind === "string") return HPL_STR;
  if (result.kind === "void") return HPL_NONE;
  if (result.kind === "ref") {
    if (fallback.kind !== "unknown" && fallback.kind !== "error") return fallback;
    if (result.refKind === "slice") return sliceType(unknownType("declaration result element"));
    if (result.refKind === "map") return mapType(unknownType("declaration result key"), unknownType("declaration result value"));
    if (result.refKind === "set") return setType(unknownType("declaration result element"));
    return opaqueType(result.refKind ?? "HplObject");
  }
  return fallback;
}

function lowerArguments(context: LoweringContext, args: readonly ts.Expression[]): readonly TypedExpression[] {
  return args.map((argument) => lowerExpression(context, argument));
}

function directDeclarationCall(context: LoweringContext, node: ts.CallExpression): TypedExpression | undefined {
  const descriptor = findDeclarationDescriptor(context.checker, node);
  if (!descriptor) return undefined;
  const args = lowerArguments(context, node.arguments);
  const type = descriptorResult(context, node, descriptor.result);
  if (descriptor.intrinsic === "ref") {
    const first = node.arguments[0];
    if (!first || !ts.isStringLiteralLike(first) || args.length !== 2) {
      report(context, node, 4501, "hpl.ref requires a literal primitive type and an index");
      return intExpression(0, span(node));
    }
    const index = args[1] ?? intExpression(0, span(node));
    return { kind: "typedRef", index, refType: first.text as "int" | "bool" | "float" | "str", convention: "raw", type, effect: "read", span: span(node) };
  }
  if (descriptor.intrinsic === "command") return { kind: "typedCommand", command: args[0] ?? stringExpression("", span(node)), type, effect: "call", span: span(node) };
  if (descriptor.intrinsic === "selector") return { kind: "typedSelector", target: args[0] ?? stringExpression("", span(node)), type, effect: "read", span: span(node) };
  if (descriptor.intrinsic === "score") return { kind: "typedScore", target: args[0] ?? stringExpression("", span(node)), objective: args[1] ?? stringExpression("", span(node)), type, effect: "read", span: span(node) };
  if (descriptor.hplName) return runtimeCall(descriptor.hplName, args, type, span(node));
  return undefined;
}

function lowerUserCall(context: LoweringContext, node: ts.CallExpression): TypedExpression | undefined {
  const method = findIndexedMethod(context.checker, context.declarations, node.expression);
  if (!method) return undefined;
  if (method.kind === "event") {
    report(context, node, 4502, "@hplEvent methods cannot be called");
    return intExpression(0, span(node));
  }
  const values = lowerArguments(context, node.arguments);
  return userCall(method.id, values, method.returnType, span(node), method.registeredName);
}

function operationForMethod(
  context: LoweringContext,
  node: ts.CallExpression,
  ownerType: HplSemanticType,
  member: string,
): string | undefined {
  const source = containerMemberSource(ownerType);
  if (!source) return undefined;
  const descriptor = getStandardMapping(source, member);
  if (!descriptor?.hplFunction) return undefined;
  if (ownerType.kind === "slice" && ["push", "pop", "includes"].includes(member)) {
    const convention = ownerType.element.kind === "slice" || ownerType.element.kind === "map" || ownerType.element.kind === "tuple" || ownerType.element.kind === "set" || ownerType.element.kind === "object" || ownerType.element.kind === "opaque" ? "ptr" : "raw";
    const suffix = member === "push" ? "append" : member === "includes" ? "in" : "pop";
    return convention === "ptr" ? `slices.ptr_${suffix}` : `slices.${suffix}`;
  }
  if (ownerType.kind === "map" && ["get", "set"].includes(member)) {
    const convention = mapConvention(context, node, ownerType.key, ownerType.value);
    return convention ? `maps.${convention === "ptr" ? "ptr_" : ""}${member}` : undefined;
  }
  if (ownerType.kind === "map" && member === "has") return ownerType.key.kind === "slice" || ownerType.key.kind === "map" || ownerType.key.kind === "tuple" || ownerType.key.kind === "set" || ownerType.key.kind === "object" || ownerType.key.kind === "opaque" ? "maps.ptr_exist" : "maps.exist";
  if (ownerType.kind === "set" && ["add", "has", "delete"].includes(member)) {
    const ptr = ownerType.element.kind === "slice" || ownerType.element.kind === "map" || ownerType.element.kind === "tuple" || ownerType.element.kind === "set" || ownerType.element.kind === "object" || ownerType.element.kind === "opaque";
    const operation = member === "has" ? "exist" : member === "delete" ? "discard" : "add";
    return `set.${ptr ? "ptr_" : ""}${operation}`;
  }
  return descriptor.hplFunction;
}

function staticOwner(node: ts.Expression): string | undefined {
  return ts.isIdentifier(node) ? node.text : undefined;
}

export function lowerCall(context: LoweringContext, node: ts.CallExpression): TypedExpression {
  const declaration = directDeclarationCall(context, node);
  if (declaration) return declaration;
  const user = lowerUserCall(context, node);
  if (user) return user;
  if (ts.isIdentifier(node.expression) && node.arguments.length === 1) {
    const value = lowerExpression(context, node.arguments[0]!);
    const target = node.expression.text === "String" ? HPL_STR
      : node.expression.text === "Boolean" ? HPL_BOOL
      : node.expression.text === "Number" ? HPL_FLOAT : undefined;
    if (target) return { kind: "typedCast", expression: value, type: target, effect: value.effect, span: span(node) };
  }
  if (ts.isPropertyAccessExpression(node.expression)) {
    const owner = node.expression.expression;
    const member = node.expression.name.text;
    const staticSource = staticOwner(owner);
    if (staticSource === "Math" || staticSource === "JSON" || staticSource === "Object") {
      const descriptor = getStandardMapping(staticSource, member);
      if (descriptor?.hplFunction) {
        return runtimeCall(
          descriptor.hplFunction,
          lowerArguments(context, node.arguments),
          descriptorResult(context, node, descriptor.result),
          span(node),
        );
      }
    }
    const ownerType = semanticType(context, owner);
    const operation = operationForMethod(context, node, ownerType, member);
    if (operation) {
      const descriptor = containerMemberSource(ownerType)
        ? getStandardMapping(containerMemberSource(ownerType)!, member)
        : undefined;
      const resultType = descriptor?.returnType === "receiver" ? ownerType
        : descriptor?.returnType === "element" ? indexedType(ownerType) ?? semanticType(context, node)
        : descriptor ? descriptorResult(context, node, descriptor.result)
        : semanticType(context, node);
      return runtimeCall(operation, [lowerExpression(context, owner), ...lowerArguments(context, node.arguments)], resultType, span(node));
    }
  }
  report(context, node, 4503, "Call expression has no supported HPL declaration or mapping");
  return intExpression(0, span(node));
}

export function lowerNewExpression(context: LoweringContext, node: ts.NewExpression): TypedExpression {
  const type = semanticType(context, node);
  const args = lowerArguments(context, node.arguments ?? []);
  if (type.kind === "slice") {
    if (args.length === 1 && node.arguments?.[0] && semanticType(context, node.arguments[0]).kind === "int") {
      return runtimeCall("slices.make", [args[0]!, intExpression(0, span(node))], type, span(node));
    }
    return runtimeCall("slices.new", args, type, span(node));
  }
  if (type.kind === "map") {
    const first = node.arguments?.[0];
    if (!first) return runtimeCall("maps.new", [boolExpression(false, span(node))], type, span(node));
    if (!ts.isArrayLiteralExpression(first)) {
      report(context, node, 4504, "Map constructor currently requires an array literal of [key, value] entries");
      return runtimeCall("maps.new", [boolExpression(false, span(node))], type, span(node));
    }
    const flattened: TypedExpression[] = [boolExpression(false, span(node))];
    for (const entry of first.elements) {
      if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 2) {
        report(context, entry, 4504, "Each Map constructor entry must be a [key, value] tuple literal");
        continue;
      }
      const key = entry.elements[0];
      const value = entry.elements[1];
      if (!key || !value || !ts.isExpression(key) || !ts.isExpression(value)) {
        report(context, entry, 4504, "Each Map constructor entry must be a [key, value] tuple literal");
        continue;
      }
      flattened.push(lowerExpression(context, key), lowerExpression(context, value));
    }
    return runtimeCall("maps.new", flattened, type, span(node));
  }
  if (type.kind === "set") {
    if (args.length > 1) report(context, node, 4505, "Set constructor accepts at most one iterable argument");
    if (node.arguments?.[0] && ts.isArrayLiteralExpression(node.arguments[0])) {
      return runtimeCall("set.new", node.arguments[0].elements.filter(ts.isExpression).map((item) => lowerExpression(context, item)), type, span(node));
    }
    if (args.length) report(context, node, 4506, "Set constructor currently requires an array literal iterable");
    return runtimeCall("set.new", [], type, span(node));
  }
  report(context, node, 4507, "Only Array, Map, and Set construction is supported");
  return intExpression(0, span(node));
}
