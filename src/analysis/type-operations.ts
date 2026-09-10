import type {
  HplSemanticType,
  ObjectProperty,
  ValueConvention,
} from "./types.js";

export function isPrimitiveType(type: HplSemanticType): boolean {
  return type.kind === "int" || type.kind === "float" || type.kind === "bool"
    || type.kind === "str" || type.kind === "none";
}

export function isReferenceType(type: HplSemanticType): boolean {
  return type.kind === "slice" || type.kind === "map" || type.kind === "tuple"
    || type.kind === "set" || type.kind === "object" || type.kind === "opaque";
}

export function conventionForType(type: HplSemanticType): ValueConvention {
  return isReferenceType(type) ? "ptr" : "raw";
}
export const containerConvention = conventionForType;

export function displayType(type: HplSemanticType): string {
  switch (type.kind) {
    case "int": case "float": case "bool": case "str": case "none":
      return type.kind;
    case "slice": return `slice<${displayType(type.element)}>`;
    case "map": return `map<${displayType(type.key)}, ${displayType(type.value)}>`;
    case "tuple": {
      const parts = type.elements.map(displayType);
      if (type.rest) parts.push(`...${displayType(type.rest)}[]`);
      return `[${parts.join(", ")}]`;
    }
    case "set": return `set<${displayType(type.element)}>`;
    case "object": return type.name ?? `{ ${type.properties.map(displayProperty).join("; ")} }`;
    case "opaque": return type.typeArguments?.length
      ? `${type.name}<${type.typeArguments.map(displayType).join(", ")}>`
      : type.name;
    case "unknown": return "unknown";
    case "error": return "<error>";
  }
}

function displayProperty(property: ObjectProperty): string {
  return `${property.readonly ? "readonly " : ""}${property.name}${property.optional ? "?" : ""}: ${displayType(property.type)}`;
}

function sameOptionalTypes(
  left: readonly HplSemanticType[] | undefined,
  right: readonly HplSemanticType[] | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return sameTypeLists(left, right);
}

function sameTypeLists(left: readonly HplSemanticType[], right: readonly HplSemanticType[]): boolean {
  return left.length === right.length && left.every((type, index) => isSameType(type, right[index]!));
}

export function isSameType(left: HplSemanticType, right: HplSemanticType): boolean {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "int": case "float": case "bool": case "str": case "none": case "unknown": case "error":
      return true;
    case "slice": case "set":
      return isSameType(left.element, (right as typeof left).element);
    case "map": {
      const other = right as typeof left;
      return isSameType(left.key, other.key) && isSameType(left.value, other.value);
    }
    case "tuple": {
      const other = right as typeof left;
      return sameTypeLists(left.elements, other.elements)
        && (left.rest === undefined || other.rest === undefined
          ? left.rest === other.rest
          : isSameType(left.rest, other.rest));
    }
    case "object": {
      const other = right as typeof left;
      if (left.name !== undefined || other.name !== undefined) return left.name === other.name && sameOptionalTypes(left.typeArguments, other.typeArguments);
      return left.properties.length === other.properties.length && left.properties.every((property) => {
        const candidate = other.properties.find(({ name }) => name === property.name);
        return candidate !== undefined && Boolean(property.optional) === Boolean(candidate.optional)
          && Boolean(property.readonly) === Boolean(candidate.readonly) && isSameType(property.type, candidate.type);
      });
    }
    case "opaque": {
      const other = right as typeof left;
      return left.name === other.name && sameOptionalTypes(left.typeArguments, other.typeArguments);
    }
  }
}

export function isAssignableTo(source: HplSemanticType, target: HplSemanticType): boolean {
  if (source.kind === "error" || target.kind === "error") return true;
  if (source.kind === "unknown" || target.kind === "unknown") return false;
  if (isSameType(source, target)) return true;
  if (source.kind === "int" && target.kind === "float") return true;
  if (source.kind === "slice" && target.kind === "slice") return isAssignableTo(source.element, target.element);
  if (source.kind === "set" && target.kind === "set") return isAssignableTo(source.element, target.element);
  if (source.kind === "map" && target.kind === "map") {
    return isSameType(source.key, target.key) && isAssignableTo(source.value, target.value);
  }
  if (source.kind === "tuple" && target.kind === "tuple") {
    if (source.elements.length < target.elements.length) return false;
    if (!target.rest && source.elements.length !== target.elements.length) return false;
    return target.elements.every((type, index) => isAssignableTo(source.elements[index]!, type))
      && (!target.rest || source.elements.slice(target.elements.length).every((type) => isAssignableTo(type, target.rest!)));
  }
  if (source.kind === "object" && target.kind === "object") {
    return target.properties.every((required) => {
      const actual = source.properties.find(({ name }) => name === required.name);
      return required.optional && !actual
        || actual !== undefined && (required.readonly || !actual.readonly) && isAssignableTo(actual.type, required.type);
    });
  }
  return false;
}

export const typeEquals = isSameType;
export const isTypeAssignable = isAssignableTo;
export const formatType = displayType;
