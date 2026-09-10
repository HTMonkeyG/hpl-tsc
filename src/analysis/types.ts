export const HPL_PRIMITIVE_NAMES = ["int", "float", "bool", "str", "none"] as const;
export type HplPrimitiveName = (typeof HPL_PRIMITIVE_NAMES)[number];

export interface IntType { readonly kind: "int" }
export interface FloatType { readonly kind: "float" }
export interface BoolType { readonly kind: "bool" }
export interface StrType { readonly kind: "str" }
export interface NoneType { readonly kind: "none" }
export interface SliceType {
  readonly kind: "slice";
  readonly element: HplSemanticType;
}
export interface MapType {
  readonly kind: "map";
  readonly key: HplSemanticType;
  readonly value: HplSemanticType;
}
export interface TupleType {
  readonly kind: "tuple";
  readonly elements: readonly HplSemanticType[];
  readonly rest?: HplSemanticType;
}
export interface SetType {
  readonly kind: "set";
  readonly element: HplSemanticType;
}
export interface ObjectProperty {
  readonly name: string;
  readonly type: HplSemanticType;
  readonly optional?: boolean;
  readonly readonly?: boolean;
}
export interface ObjectType {
  readonly kind: "object";
  readonly name?: string;
  readonly properties: readonly ObjectProperty[];
  readonly typeArguments?: readonly HplSemanticType[];
}
export interface OpaqueType {
  readonly kind: "opaque";
  readonly name: string;
  readonly typeArguments?: readonly HplSemanticType[];
}
export interface UnknownType {
  readonly kind: "unknown";
  readonly reason?: string;
}
export interface ErrorType {
  readonly kind: "error";
  readonly message?: string;
}

export type HplSemanticType =
  | IntType | FloatType | BoolType | StrType | NoneType
  | SliceType | MapType | TupleType | SetType | ObjectType | OpaqueType
  | UnknownType | ErrorType;
export type SemanticType = HplSemanticType;

/** Storage is an independent lowering concern and is never encoded in a semantic type. */
export type ValueConvention = "raw" | "ptr";
export type HplValueConvention = ValueConvention;

export const HPL_INT: IntType = Object.freeze({ kind: "int" });
export const HPL_FLOAT: FloatType = Object.freeze({ kind: "float" });
export const HPL_BOOL: BoolType = Object.freeze({ kind: "bool" });
export const HPL_STR: StrType = Object.freeze({ kind: "str" });
export const HPL_NONE: NoneType = Object.freeze({ kind: "none" });
export const HPL_UNKNOWN: UnknownType = Object.freeze({ kind: "unknown" });
export const HPL_ERROR: ErrorType = Object.freeze({ kind: "error" });

export function sliceType(element: HplSemanticType): SliceType {
  return { kind: "slice", element };
}
export function mapType(key: HplSemanticType, value: HplSemanticType): MapType {
  return { kind: "map", key, value };
}
export function tupleType(elements: readonly HplSemanticType[], rest?: HplSemanticType): TupleType {
  return rest === undefined ? { kind: "tuple", elements } : { kind: "tuple", elements, rest };
}
export function setType(element: HplSemanticType): SetType {
  return { kind: "set", element };
}
export function opaqueType(name: string, typeArguments?: readonly HplSemanticType[]): OpaqueType {
  return typeArguments === undefined ? { kind: "opaque", name } : { kind: "opaque", name, typeArguments };
}
export function unknownType(reason?: string): UnknownType {
  return reason === undefined ? HPL_UNKNOWN : { kind: "unknown", reason };
}
export function errorType(message?: string): ErrorType {
  return message === undefined ? HPL_ERROR : { kind: "error", message };
}

export function isSemanticType(value: unknown): value is HplSemanticType {
  if (typeof value !== "object" || value === null || !("kind" in value)) return false;
  const kind = (value as { readonly kind?: unknown }).kind;
  return typeof kind === "string" && [
    "int", "float", "bool", "str", "none", "slice", "map", "tuple",
    "set", "object", "opaque", "unknown", "error",
  ].includes(kind);
}

/** Compatibility API used by the original lowering pipeline. */
export const HPL_TYPE_NAMES = ["int", "float", "bool", "str"] as const;
export type HplType = (typeof HPL_TYPE_NAMES)[number];
export type HPLType = HplType;
export const HPL_TYPES = HPL_TYPE_NAMES;
export function isHplType(value: unknown): value is HplType {
  return typeof value === "string" && HPL_TYPE_NAMES.includes(value as HplType);
}
export function isNumericHplType(type: HplType | HplSemanticType): boolean {
  return typeof type === "string" ? type === "int" || type === "float" : type.kind === "int" || type.kind === "float";
}
export function hplTypeOf(value: number | boolean | string): HplType {
  if (typeof value === "boolean") return "bool";
  if (typeof value === "string") return "str";
  return Number.isInteger(value) ? "int" : "float";
}
export function semanticTypeOf(value: null | undefined | number | boolean | string): HplSemanticType {
  if (value === null || value === undefined) return HPL_NONE;
  const type = hplTypeOf(value);
  return type === "int" ? HPL_INT : type === "float" ? HPL_FLOAT : type === "bool" ? HPL_BOOL : HPL_STR;
}
