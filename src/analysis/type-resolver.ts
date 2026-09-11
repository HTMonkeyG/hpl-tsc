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
    const type = this.checker.getTypeAtLocation(node);
    return this.resolveWithProvenance(type, this.typeNodeForNode(node), 0);
  }

  public resolve(type: ts.Type, provenance?: ts.TypeNode): HplSemanticType {
    return this.resolveWithProvenance(type, provenance, 0);
  }

  public resolveSignatureReturn(signature: ts.Signature): HplSemanticType {
    return this.resolve(
      signature.getReturnType(),
      signature.getDeclaration()?.type,
    );
  }

  private resolveWithProvenance(
    type: ts.Type,
    provenance: ts.TypeNode | undefined,
    depth: number,
  ): HplSemanticType {
    if (provenance) {
      const restored = this.resolveTypeNode(provenance, type, depth);
      if (restored) return restored;
    }
    return this.resolveAtDepth(type, depth);
  }

  private typeNodeForNode(node: ts.Node): ts.TypeNode | undefined {
    if (ts.isTypeNode(node)) return node;
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) return node.type;
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      return this.checker.getResolvedSignature(node)?.getDeclaration()?.type;
    }
    const symbol = this.checker.getSymbolAtLocation(
      ts.isPropertyAccessExpression(node) ? node.name : node,
    );
    const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
    if (declaration && this.hasTypeNode(declaration)) return declaration.type;
    if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyDeclaration(node)
      || ts.isPropertySignature(node) || ts.isMethodDeclaration(node)
      || ts.isMethodSignature(node) || ts.isFunctionDeclaration(node)) return node.type;
    return undefined;
  }

  private hasTypeNode(node: ts.Node): node is ts.Node & { readonly type: ts.TypeNode } {
    return "type" in node && (node as { readonly type?: unknown }).type !== undefined;
  }

  private resolveTypeNode(
    node: ts.TypeNode,
    actualType: ts.Type,
    depth: number,
  ): HplSemanticType | undefined {
    if (depth > this.maxDepth) return unknownType("type resolution depth exceeded");
    if (ts.isParenthesizedTypeNode(node)) return this.resolveTypeNode(node.type, actualType, depth + 1);
    if (ts.isArrayTypeNode(node)) {
      return sliceType(this.resolveWithProvenance(this.checker.getTypeFromTypeNode(node.elementType), node.elementType, depth + 1));
    }
    if (ts.isTupleTypeNode(node)) {
      return tupleType(node.elements.map((element) => {
        const typeNode = ts.isNamedTupleMember(element) ? element.type : element;
        return this.resolveWithProvenance(this.checker.getTypeFromTypeNode(typeNode), typeNode, depth + 1);
      }));
    }
    if (!ts.isTypeReferenceNode(node)) return undefined;
    const symbol = this.checker.getSymbolAtLocation(node.typeName);
    const declaration = symbol?.declarations?.find(ts.isTypeAliasDeclaration);
    if (declaration && symbol && !this.isHplNamespaceMember(symbol)) {
      return this.resolveWithProvenance(actualType, declaration.type, depth + 1);
    }
    if (!symbol || !this.isHplNamespaceMember(symbol)) return undefined;
    const name = symbol.getName();
    if (name === "int") return HPL_INT;
    if (name === "float") return HPL_FLOAT;
    const args = node.typeArguments?.map((argument) =>
      this.resolveWithProvenance(this.checker.getTypeFromTypeNode(argument), argument, depth + 1)) ?? [];
    if (name === "slice") return sliceType(args[0] ?? unknownType("slice element"));
    if (name === "map") return mapType(args[0] ?? unknownType("map key"), args[1] ?? unknownType("map value"));
    if (name === "set") return setType(args[0] ?? unknownType("set element"));
    if (name === "tuple") {
      const first = node.typeArguments?.[0];
      if (first && ts.isTupleTypeNode(first)) {
        return tupleType(first.elements.map((element) => {
          const typeNode = ts.isNamedTupleMember(element) ? element.type : element;
          return this.resolveWithProvenance(this.checker.getTypeFromTypeNode(typeNode), typeNode, depth + 1);
        }));
      }
      const tuple = args[0];
      return tuple?.kind === "tuple" ? tuple : tupleType([], tuple);
    }
    return undefined;
  }

  private isHplNamespaceMember(symbol: ts.Symbol): boolean {
    return (symbol.declarations ?? []).some((declaration) => {
      for (let current: ts.Node | undefined = declaration.parent; current; current = current.parent) {
        if (ts.isModuleDeclaration(current) && ts.isIdentifier(current.name)) {
          return current.name.text === "hpl" && current.getSourceFile().isDeclarationFile;
        }
      }
      return false;
    });
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
    return type.isNumberLiteral() && Number.isInteger(type.value) ? HPL_INT : HPL_FLOAT;
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
    if (symbol && this.isHplNamespaceMember(symbol)) {
      if (name === "slice") return sliceType(arguments_[0] ?? unknownType("slice element"));
      if (name === "map") return mapType(arguments_[0] ?? unknownType("map key"), arguments_[1] ?? unknownType("map value"));
      if (name === "set") return setType(arguments_[0] ?? unknownType("set element"));
      if (name === "tuple") {
        const first = arguments_[0];
        return first?.kind === "tuple" ? first : tupleType([], first);
      }
    }
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
