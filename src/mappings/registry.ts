export type MappingSource =
  | "Array" | "Map" | "Set" | "string" | "Math" | "JSON" | "Object" | "operator";
export type MappingKind =
  | "constructor" | "literal" | "property" | "method" | "static-method" | "constant" | "operator";
export type MappingReturnType =
  | "void" | "boolean" | "number" | "integer" | "string" | "receiver" | "element"
  | "unknown" | "array" | "map" | "set" | "json";
export type MappingReturnSemantics =
  | "value" | "pointer" | "receiver" | "mutation-status" | "length-after-mutation"
  | "iterator-snapshot" | "none";
export type HplValueConvention = "raw" | "ptr";
export type MappingEffect = "reads" | "writes" | "allocates" | "throws";
export type ReturnAdapter = "identity" | "receiver" | "array-length" | "discard" | "iterator-snapshot" | "custom";
export type LoweringStrategy =
  | "direct" | "dispatch-value-convention" | "normalize-bounds" | "flatten-entries"
  | "expand-iterable" | "fold-variadic" | "synthesize";

export interface HplResultDescriptor {
  readonly kind: "void" | "boolean" | "number" | "string" | "ref" | "unknown";
  readonly numberKind?: "int" | "float";
  readonly refKind?: "slice" | "map" | "set" | "tuple" | "object" | "opaque";
  readonly convention?: HplValueConvention;
}
export interface MappingParameterDescriptor {
  readonly name: string;
  readonly type?: string;
  readonly optional?: boolean;
  readonly rest?: boolean;
  readonly convention?: HplValueConvention | "dispatch";
  readonly role?: "receiver" | "key" | "value" | "index" | "argument";
}
export interface MappingOverloadDescriptor {
  readonly typeParameters?: readonly string[];
  readonly parameters: readonly MappingParameterDescriptor[];
  readonly result: HplResultDescriptor;
  readonly hplFunction?: string;
}
export interface MappingDescriptor {
  readonly source: MappingSource;
  readonly member: string;
  readonly kind: MappingKind;
  readonly hplFunction: string | null;
  /** Compatibility aliases consumed by the current lowerer. */
  readonly hplName: string | null;
  readonly returnType: MappingReturnType;
  readonly returnSemantics: MappingReturnSemantics;
  readonly result: HplResultDescriptor;
  readonly mutatesReceiver: boolean;
  readonly jsReturnDifference: string | null;
  readonly overloads?: readonly MappingOverloadDescriptor[];
  readonly typeParameters?: readonly string[];
  readonly parameters?: readonly MappingParameterDescriptor[];
  readonly effects?: readonly MappingEffect[];
  readonly mayThrow?: boolean;
  readonly returnAdapter?: ReturnAdapter;
  readonly lowering?: LoweringStrategy;
  readonly variants?: Readonly<Partial<Record<HplValueConvention, string>>>;
  readonly property?: boolean;
  readonly lowererHandled?: boolean;
  readonly returnsReceiver?: boolean;
  readonly jsReturn?: "arrayLength" | "discard" | "custom";
}
export type CallDescriptor = MappingDescriptor & { readonly hplFunction: string; readonly hplName: string };
export type MappingQuery = Readonly<Partial<Pick<MappingDescriptor, "source" | "member" | "kind">>>;
const keyOf = (source: MappingSource, member: string): string => `${source}\0${member}`;
export function isCallDescriptor(value: MappingDescriptor | undefined): value is CallDescriptor {
  return value !== undefined && value.hplFunction !== null && value.hplName !== null;
}
export class MappingRegistry {
  private readonly byKey = new Map<string, MappingDescriptor>();
  constructor(descriptors: readonly MappingDescriptor[] = []) { this.registerAll(descriptors); }
  register(descriptor: MappingDescriptor): this {
    const key = keyOf(descriptor.source, descriptor.member);
    if (this.byKey.has(key)) throw new Error(`Duplicate mapping descriptor: ${descriptor.source}.${descriptor.member}`);
    this.byKey.set(key, Object.freeze({ ...descriptor }));
    return this;
  }
  registerAll(descriptors: readonly MappingDescriptor[]): this {
    for (const descriptor of descriptors) this.register(descriptor);
    return this;
  }
  get(source: MappingSource, member: string): MappingDescriptor | undefined { return this.byKey.get(keyOf(source, member)); }
  getCallable(source: MappingSource, member: string): CallDescriptor | undefined {
    const value = this.get(source, member); return isCallDescriptor(value) ? value : undefined;
  }
  require(source: MappingSource, member: string): MappingDescriptor {
    const value = this.get(source, member);
    if (!value) throw new Error(`No mapping descriptor for ${source}.${member}`);
    return value;
  }
  has(source: MappingSource, member: string): boolean { return this.byKey.has(keyOf(source, member)); }
  query(query: MappingQuery = {}): readonly MappingDescriptor[] {
    return this.all().filter(value =>
      (query.source === undefined || value.source === query.source) &&
      (query.member === undefined || value.member === query.member) &&
      (query.kind === undefined || value.kind === query.kind));
  }
  all(): readonly MappingDescriptor[] { return [...this.byKey.values()]; }
}
