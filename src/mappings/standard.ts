import type {
  CallDescriptor,
  HplResultDescriptor,
  MappingDescriptor,
  MappingReturnSemantics,
  MappingReturnType,
  MappingSource,
} from "./registry.js";
import { MappingRegistry } from "./registry.js";
import { RAW_PTR_SUPPORT } from "../catalog/runtime.js";

const resultOf = (returnType: MappingReturnType): HplResultDescriptor => {
  switch (returnType) {
    case "void": return { kind: "void" };
    case "boolean": return { kind: "boolean" };
    case "integer": return { kind: "number", numberKind: "int" };
    case "number": return { kind: "number", numberKind: "float" };
    case "string": return { kind: "string" };
    case "array": return { kind: "ref", refKind: "slice" };
    case "map": return { kind: "ref", refKind: "map" };
    case "set": return { kind: "ref", refKind: "set" };
    case "json": return { kind: "ref", refKind: "object" };
    default: return { kind: "unknown" };
  }
};

const descriptor = (
  source: MappingSource,
  member: string,
  kind: MappingDescriptor["kind"],
  hplFunction: string | null,
  returnType: MappingReturnType,
  returnSemantics: MappingReturnSemantics = "value",
  mutatesReceiver = false,
  jsReturnDifference: string | null = null,
  lowererHandled = false,
  metadata: Partial<Pick<MappingDescriptor, "parameters" | "effects" | "mayThrow" | "returnAdapter" | "lowering" | "variants" | "typeParameters" | "overloads">> = {},
): MappingDescriptor => ({
  source,
  member,
  kind,
  hplFunction,
  hplName: hplFunction,
  returnType,
  returnSemantics,
  result: resultOf(returnType),
  mutatesReceiver,
  jsReturnDifference,
  returnAdapter: returnSemantics === "receiver" ? "receiver"
    : returnSemantics === "length-after-mutation" ? "array-length"
    : returnSemantics === "iterator-snapshot" ? "iterator-snapshot"
    : returnSemantics === "none" ? "discard" : "identity",
  lowering: "direct",
  effects: mutatesReceiver ? ["writes"] : ["reads"],
  ...metadata,
  ...(lowererHandled ? { lowererHandled: true } : {}),
  ...(kind === "property" || kind === "constant" ? { property: true } : {}),
  ...(returnSemantics === "receiver" ? { returnsReceiver: true } : {}),
  ...(returnSemantics === "length-after-mutation" ? { jsReturn: "arrayLength" as const } : {}),
  ...(returnSemantics === "none" ? { jsReturn: "discard" as const } : {}),
});

const d = descriptor;

export const STANDARD_MAPPINGS: readonly MappingDescriptor[] = Object.freeze([
  d("Array", "constructor", "constructor", "slices.new", "array", "pointer", false,
    "Array(singleNumber) creates holes in JS; the lowerer must use slices.make for that form."),
  d("Array", "literal", "literal", "slices.new", "array", "pointer"),
  d("Array", "make", "literal", "slices.make", "array", "pointer", false,
    "HPL fills every slot with a value; JS sparse arrays have holes."),
  d("Array", "length", "property", "slices.length", "integer"),
  d("Array", "index", "property", null, "element", "value", false,
    "Index reads and writes require raw/ptr dispatch and assignment handling in the lowerer.", true,
    { typeParameters: ["T"], lowering: "dispatch-value-convention", mayThrow: true,
      variants: RAW_PTR_SUPPORT.slice.get,
      parameters: [{ name: "receiver", role: "receiver", convention: "ptr" }, { name: "index", role: "index", convention: "raw" }] }),
  d("Array", "push", "method", "slices.append", "integer", "length-after-mutation", true,
    "HPL returns true, while JS returns the new length; the lowerer must synthesize the length result and repeat for multiple arguments."),
  d("Array", "pop", "method", "slices.pop", "element", "value", true),
  d("Array", "slice", "method", "slices.sub", "array", "pointer", false,
    "HPL requires normalized explicit bounds and rejects negative/out-of-range bounds; JS clamps and accepts omitted/negative bounds."),
  d("Array", "includes", "method", "slices.in", "boolean", "value", false,
    "HPL has no fromIndex parameter and uses Python equality rather than JS SameValueZero."),
  d("Array", "reverse", "method", "slices.reverse", "receiver", "receiver", true,
    "HPL returns true, while JS returns the receiver; the lowerer must preserve and return the receiver."),
  d("Array", "sort", "method", "slices.sort", "receiver", "receiver", true,
    "HPL accepts only a reverse flag and returns true; JS accepts a comparator, uses string ordering by default, and returns the receiver."),
  d("Array", "concat", "method", "slices.concat", "array", "pointer", false,
    "HPL accepts only slice pointers; JS also appends non-array values and honors spreadability."),

  d("Map", "constructor", "constructor", "maps.new", "map", "pointer", false,
    "HPL maps.new expects an ordered flag followed by flattened key/value arguments; the lowerer must flatten JS entry iterables."),
  d("Map", "size", "property", "maps.length", "integer"),
  d("Map", "get", "method", "maps.get", "element", "value", false,
    "HPL throws for a missing key, while JS returns undefined.", false,
    { typeParameters: ["K", "V"], lowering: "dispatch-value-convention", mayThrow: true,
      variants: { raw: RAW_PTR_SUPPORT.map.get.raw, ptr: RAW_PTR_SUPPORT.map.get.ptr },
      parameters: [{ name: "receiver", role: "receiver", convention: "ptr" }, { name: "key", role: "key", convention: "dispatch" }] }),
  d("Map", "set", "method", "maps.set", "receiver", "receiver", true,
    "HPL returns true, while JS returns the receiver; the lowerer must preserve and return the receiver.", false,
    { typeParameters: ["K", "V"], lowering: "dispatch-value-convention", mayThrow: true,
      variants: { raw: RAW_PTR_SUPPORT.map.set.raw, ptr: RAW_PTR_SUPPORT.map.set.ptr },
      parameters: [{ name: "receiver", role: "receiver", convention: "ptr" }, { name: "key", role: "key", convention: "dispatch" }, { name: "value", role: "value", convention: "dispatch" }] }),
  d("Map", "has", "method", "maps.exist", "boolean", "value", false, null, false,
    { lowering: "dispatch-value-convention", variants: { raw: RAW_PTR_SUPPORT.map.has.raw, ptr: RAW_PTR_SUPPORT.map.has.ptr },
      parameters: [{ name: "receiver", role: "receiver", convention: "ptr" }, { name: "key", role: "key", convention: "dispatch" }] }),
  d("Map", "delete", "method", "maps.del", "boolean", "value", true,
    "HPL throws if the key is missing and otherwise returns true; JS returns whether the key existed."),
  d("Map", "clear", "method", "maps.clear", "void", "none", true,
    "HPL returns true, while JS returns undefined; discard the HPL result."),
  d("Map", "keys", "method", "maps.keys", "array", "iterator-snapshot", false,
    "HPL returns a snapshot slice, while JS returns a live iterator."),
  d("Map", "values", "method", "maps.values", "array", "iterator-snapshot", false,
    "HPL returns a snapshot slice, while JS returns a live iterator."),

  d("Set", "constructor", "constructor", "set.new", "set", "pointer", false,
    "HPL expects variadic elements; the lowerer must expand the JS iterable argument."),
  d("Set", "size", "property", "set.length", "integer"),
  d("Set", "add", "method", "set.add", "receiver", "receiver", true,
    "HPL returns true, while JS returns the receiver; the lowerer must preserve and return the receiver."),
  d("Set", "has", "method", "set.exist", "boolean"),
  d("Set", "delete", "method", "set.discard", "boolean", "value", true,
    "HPL always returns true; JS returns whether the value existed, so the lowerer must check existence before discarding."),
  d("Set", "clear", "method", "set.clear", "void", "none", true,
    "HPL returns true, while JS returns undefined; discard the HPL result."),

  d("string", "length", "property", "strings.length", "integer"),
  d("string", "toLowerCase", "method", "strings.lower", "string"),
  d("string", "toUpperCase", "method", "strings.upper", "string"),
  d("string", "trim", "method", "strings.strip", "string", "value", false,
    "Python/HPL and JavaScript whitespace sets differ at some Unicode code points."),
  d("string", "startsWith", "method", "strings.startswith", "boolean"),
  d("string", "endsWith", "method", "strings.endswith", "boolean"),
  d("string", "indexOf", "method", "strings.find", "integer"),
  d("string", "lastIndexOf", "method", "strings.rfind", "integer", "value", false,
    "Optional-position semantics differ; the lowerer must normalize a supplied JS position to HPL start/end bounds."),
  d("string", "slice", "method", "strings.sub", "string", "value", false,
    "HPL requires normalized explicit bounds and rejects negative/reversed/out-of-range bounds; JS slice normalizes them."),
  d("string", "substring", "method", "strings.sub", "string", "value", false,
    "The lowerer must clamp bounds and swap them when start > end before calling HPL."),
  d("string", "replace", "method", "strings.replace", "string", "value", false,
    "HPL replacement is literal/Python-style and defaults to all matches; JS string replacement replaces only the first match and also supports regex/replacer functions."),
  d("string", "split", "method", "strings.split", "array", "pointer", false,
    "HPL uses Python separator/maxsplit semantics; JS supports regex separators and a result-length limit."),

  d("Math", "abs", "static-method", "math.abs", "number"),
  d("Math", "ceil", "static-method", "math.ceil", "integer"),
  d("Math", "floor", "static-method", "math.floor", "integer"),
  d("Math", "round", "static-method", "math.round", "number", "value", false,
    "Tie-breaking and negative-zero behavior differ from JavaScript Math.round."),
  d("Math", "trunc", "static-method", "math.trunc", "integer"),
  d("Math", "max", "static-method", "math.max", "number", "value", false,
    "HPL is binary; the lowerer must fold variadic JS calls and provide the JS empty-call identity."),
  d("Math", "min", "static-method", "math.min", "number", "value", false,
    "HPL is binary; the lowerer must fold variadic JS calls and provide the JS empty-call identity."),
  d("Math", "sqrt", "static-method", "math.sqrt", "number"),
  d("Math", "pow", "static-method", "math.pow", "number"),
  d("Math", "exp", "static-method", "math.exp", "number"),
  d("Math", "log", "static-method", "math.log", "number"),
  d("Math", "log10", "static-method", "math.log10", "number"),
  d("Math", "sin", "static-method", "math.sin", "number"),
  d("Math", "cos", "static-method", "math.cos", "number"),
  d("Math", "tan", "static-method", "math.tan", "number"),
  d("Math", "asin", "static-method", "math.asin", "number"),
  d("Math", "acos", "static-method", "math.acos", "number"),
  d("Math", "atan", "static-method", "math.atan", "number"),
  d("Math", "atan2", "static-method", "math.atan2", "number"),
  d("Math", "PI", "constant", "math.pi", "number", "value", false,
    "HPL exposes the constant as a zero-argument function; the lowerer must emit a call."),
  d("Math", "E", "constant", "math.e", "number", "value", false,
    "HPL exposes the constant as a zero-argument function; the lowerer must emit a call."),
  d("Math", "random", "static-method", "random.random", "number"),

  d("JSON", "parse", "static-method", "json.loads", "json", "pointer", false,
    "JSON primitives may still be represented through HPL's object-reference convention."),
  d("JSON", "stringify", "static-method", "json.dumps", "string", "value", false,
    "HPL defaults to ASCII escaping and Python JSON options; JS replacer/space and unsupported-value behavior differ."),
  d("Object", "keys", "static-method", "maps.keys", "array", "pointer", false,
    "Only HPL map-backed objects are supported; JS key ordering/coercion and non-object handling differ."),
  d("Object", "values", "static-method", "maps.values", "array", "pointer", false,
    "Only HPL map-backed objects are supported; JS key ordering/coercion and non-object handling differ."),

  d("operator", "%", "operator", "math.mod", "number", "value", false,
    "JavaScript remainder and HPL/Python modulo differ for operands with opposite signs."),
  d("operator", "**", "operator", "math.pow", "number", "value", false,
    "HPL math.pow coerces to floating point and may raise where JavaScript returns Infinity or NaN."),
  d("operator", "&", "operator", "math.bit_and", "integer", "value", false,
    "JavaScript coerces Number operands to signed 32-bit integers; HPL requires integers without JS ToInt32 coercion."),
  d("operator", "|", "operator", "math.bit_or", "integer", "value", false,
    "JavaScript coerces Number operands to signed 32-bit integers; HPL requires integers without JS ToInt32 coercion."),
  d("operator", "^", "operator", "math.bit_xor", "integer", "value", false,
    "JavaScript coerces Number operands to signed 32-bit integers; HPL requires integers without JS ToInt32 coercion."),
  d("operator", "~", "operator", "math.bit_not", "integer", "value", false,
    "JavaScript coerces Number operands to signed 32-bit integers; HPL requires an integer without JS ToInt32 coercion."),
  d("operator", "<<", "operator", "math.left_shift", "integer", "value", false,
    "JavaScript masks the shift count to five bits and uses signed 32-bit operands; HPL does neither."),
  d("operator", ">>", "operator", "math.right_shift", "integer", "value", false,
    "JavaScript masks the shift count to five bits and uses signed 32-bit operands; HPL does neither."),
  d("operator", ">>>", "operator", null, "integer", "value", false,
    "HPL has no unsigned-right-shift builtin; the lowerer must synthesize JS uint32 coercion and shifting.", true),
]);

export const standardMappingRegistry = new MappingRegistry(STANDARD_MAPPINGS);

export const getStandardMapping = (
  source: MappingSource,
  member: string,
): MappingDescriptor | undefined => standardMappingRegistry.get(source, member);

export const requireStandardMapping = (
  source: MappingSource,
  member: string,
): MappingDescriptor => standardMappingRegistry.require(source, member);

const MEMBER_SOURCES = ["Array", "Map", "Set", "string"] as const;
const STATIC_SOURCES = ["Array", "Map", "Set", "Math", "JSON", "Object"] as const;

const normalizeMemberSource = (typeText: string): MappingSource | undefined => {
  const normalized = typeText.replace(/\s/g, "");
  if (normalized === "string" || normalized === "String") return "string";
  if (normalized === "any[]" || normalized === "unknown[]" ||
      normalized.startsWith("Array<") || normalized.startsWith("ReadonlyArray<") ||
      /\[]$/.test(normalized)) return "Array";
  if (normalized.startsWith("Map<") || normalized.startsWith("ReadonlyMap<")) return "Map";
  if (normalized.startsWith("Set<") || normalized.startsWith("ReadonlySet<")) return "Set";
  return undefined;
};

/** Adapter used by the lowerer for instance properties and methods. */
export const getStandardMember = (
  typeText: string,
  member: string,
): CallDescriptor | undefined => {
  const source = normalizeMemberSource(typeText);
  if (!source || !(MEMBER_SOURCES as readonly MappingSource[]).includes(source)) return undefined;
  return standardMappingRegistry.getCallable(source, member);
};

/** Adapter used by the lowerer for globals such as Math, JSON, and Object. */
export const getStandardStatic = (
  owner: string,
  member: string,
): CallDescriptor | undefined => {
  if (!(STATIC_SOURCES as readonly string[]).includes(owner)) return undefined;
  return standardMappingRegistry.getCallable(owner as MappingSource, member);
};
