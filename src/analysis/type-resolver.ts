import ts from "typescript";
import {
  HPL_BOOL,
  HPL_ERROR,
  HPL_FLOAT,
  HPL_INT,
  HPL_NONE,
  HPL_STR,
  type HplSemanticType,
  type ObjectProperty,
  errorType,
  mapType,
  opaqueType,
  setType,
  sliceType,
  tupleType,
  unknownType,
} from "./types.js";

export interface TypeResolverOptions {
  /** Interfaces without this marker are represented structurally. */
  readonly opaqueTagName?: string;
  /** Caps recursion through aliases and recursive interfaces. */
  readonly maxDepth?: number;
}

export class TypeResolver {
  private readonly active = new Set<ts.Type>();
  private readonly maxDepth: number;
  private readonly opaqueTagName: string;

  public constructor(
    private readonly checker: ts.TypeChecker,
    options: TypeResolverOptions = {},
  ) {
    this.maxDepth = options.maxDepth ?? 32;
    this.opaqueTagName = options.opaqueTagName ?? "hplOpaque";
  }

  public resolveNode(node: ts.Node): HplSemanticType {
    return this.resolve(this.checker.getTypeAtLocation(node));
  }

  public resolve(type: ts.Type): HplSemanticType {
    return this.resolveAtDepth(type, 0);
  }

  private resolveAtDepth(type: ts.Type, depth: number): HplSemanticType {
    if (depth > this.maxDepth) return unknownType("type resolution depth exceeded");
    if (type.flags & ts.TypeFlags.Any) return unknownType("TypeScript any");
    if (type.flags & ts.TypeFlags.Unknown) return unknownType("TypeScript unknown");
    if (type.flags & ts.TypeFlags.Never) return HPL_ERROR;
    if (type.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Null)) return HPL_NONE;
    if (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) return HPL_BOOL;
    if (type.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral | ts.TypeFlags.TemplateLiteral)) return HPL_STR;
    if (type.flags & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) return this.resolveNumber(type);
    if (type.isUnion()) return this.resolveUnion(type, depth);
    if (type.isIntersection()) return unknownType("intersection type");
    if (!(type.flags & ts.TypeFlags.Object)) return unknownType(this.checker.typeToString(type));
    if (this.active.has(type)) return this.namedFallback(type);
    this.active.add(type);
    try {
      return this.resolveObject(type, depth);
    } finally {
      this.active.delete(type);
    }
  }

  private resolveNumber(type: ts.Type): HplSemanticType {
    if (type.isNumberLiteral()) return Number.isInteger(type.value) ? HPL_INT : HPL_FLOAT;
    const symbolName = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName();
    return symbolName === "int" || symbolName === "Int" ? HPL_INT : HPL_FLOAT;
  }

  private resolveUnion(type: ts.UnionType, depth: number): HplSemanticType {
    const resolved = type.types.map((member) => this.resolveAtDepth(member, depth + 1));
    if (resolved.some(({ kind }) => kind === "unknown" || kind === "error")) return unknownType("unsafe union");
    const first = resolved[0];
    if (!first) return HPL_ERROR;
    if (resolved.every(({ kind }) => kind === first.kind)) return first;
    if (resolved.every(({ kind }) => kind === "int" || kind === "float")) return HPL_FLOAT;
    return unknownType("union has no single HPL representation");
  }

  private resolveObject(type: ts.Type, depth: number): HplSemanticType {
    const reference = type as ts.TypeReference;
    if (this.checker.isArrayType(type)) {
      const element = this.typeArguments(reference)[0];
      return sliceType(element ? this.resolveAtDepth(element, depth + 1) : unknownType("array element"));
    }
    if (this.checker.isTupleType(type)) return this.resolveTuple(reference, depth);
    const symbol = type.aliasSymbol ?? type.getSymbol();
    const name = symbol?.getName();
    const arguments_ = this.typeArguments(reference).map((argument) => this.resolveAtDepth(argument, depth + 1));
    if (name === "Array" || name === "ReadonlyArray") return sliceType(arguments_[0] ?? unknownType("array element"));
    if (name === "Map" || name === "ReadonlyMap") return mapType(arguments_[0] ?? unknownType("map key"), arguments_[1] ?? unknownType("map value"));
    if (name === "Set" || name === "ReadonlySet") return setType(arguments_[0] ?? unknownType("set element"));
    if (symbol?.getJsDocTags().some(({ name: tag }) => tag === this.opaqueTagName)) return opaqueType(name ?? "anonymous", arguments_);
    const declarations = symbol?.getDeclarations() ?? [];
    if (declarations.some(ts.isInterfaceDeclaration) || declarations.some(ts.isTypeLiteralNode) || type.getProperties().length > 0) {
      return this.resolveStructuralObject(type, name, arguments_, depth);
    }
    return name ? opaqueType(name, arguments_) : unknownType("unidentified object");
  }

  private resolveTuple(type: ts.TypeReference, depth: number): HplSemanticType {
    const arguments_ = this.typeArguments(type);
    const target = type.target as ts.TupleType;
    const flags = target.elementFlags ?? [];
    const fixed: HplSemanticType[] = [];
    let rest: HplSemanticType | undefined;
    arguments_.forEach((argument, index) => {
      const resolved = this.resolveAtDepth(argument, depth + 1);
      if ((flags[index] ?? 0) & (ts.ElementFlags.Rest | ts.ElementFlags.Variadic)) rest = resolved;
      else fixed.push(resolved);
    });
    return tupleType(fixed, rest);
  }

  private resolveStructuralObject(type: ts.Type, name: string | undefined, args: readonly HplSemanticType[], depth: number): HplSemanticType {
    const properties: ObjectProperty[] = type.getProperties().map((symbol) => {
      const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
      const propertyType = declaration
        ? this.checker.getTypeOfSymbolAtLocation(symbol, declaration)
        : this.checker.getDeclaredTypeOfSymbol(symbol);
      return {
        name: symbol.getName(),
        type: this.resolveAtDepth(propertyType, depth + 1),
        ...(symbol.flags & ts.SymbolFlags.Optional ? { optional: true } : {}),
        ...(this.isReadonly(symbol) ? { readonly: true } : {}),
      };
    });
    return {
      kind: "object",
      ...(name && name !== "__type" ? { name } : {}),
      properties,
      ...(args.length ? { typeArguments: args } : {}),
    };
  }

  private typeArguments(type: ts.TypeReference): readonly ts.Type[] {
    try { return this.checker.getTypeArguments(type); } catch { return type.typeArguments ?? []; }
  }

  private isReadonly(symbol: ts.Symbol): boolean {
    return (symbol.getDeclarations() ?? []).some((declaration) =>
      (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration) || ts.isParameter(declaration))
      && declaration.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ReadonlyKeyword),
    );
  }

  private namedFallback(type: ts.Type): HplSemanticType {
    const name = type.aliasSymbol?.getName() ?? type.getSymbol()?.getName();
    return name ? opaqueType(name) : errorType("recursive anonymous type");
  }
}

export function resolveTypeScriptType(
  checker: ts.TypeChecker,
  typeOrNode: ts.Type | ts.Node,
  options?: TypeResolverOptions,
): HplSemanticType {
  const resolver = new TypeResolver(checker, options);
  return isTypeScriptType(typeOrNode) ? resolver.resolve(typeOrNode) : resolver.resolveNode(typeOrNode);
}

function isTypeScriptType(value: ts.Type | ts.Node): value is ts.Type {
  return typeof (value as ts.Type).getFlags === "function";
}

export const resolveTsType = resolveTypeScriptType;
