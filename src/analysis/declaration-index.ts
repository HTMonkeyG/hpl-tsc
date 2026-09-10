import path from "node:path";
import ts from "typescript";
import type { HplSemanticType } from "./types.js";
import { TypeResolver } from "./type-resolver.js";
import type { FunctionId } from "../ir/nodes.js";
import { functionId } from "../ir/builders.js";

export type HplMethodKind = "function" | "event";

export interface HplMethodDeclaration {
  readonly kind: HplMethodKind;
  readonly id: FunctionId;
  readonly classDeclaration: ts.ClassDeclaration;
  readonly declaration: ts.MethodDeclaration;
  readonly symbol: ts.Symbol;
  readonly parameters: readonly HplSemanticType[];
  readonly returnType: HplSemanticType;
  readonly registeredName: string;
  readonly event?: string;
}

export interface DeclarationIndex {
  readonly methods: readonly HplMethodDeclaration[];
  readonly bySymbol: ReadonlyMap<ts.Symbol, HplMethodDeclaration>;
  readonly classes: ReadonlySet<ts.ClassDeclaration>;
}

export interface DeclarationIndexReporter {
  (node: ts.Node, code: number, message: string): void;
}

function canonicalSymbol(checker: ts.TypeChecker, symbol: ts.Symbol | undefined): ts.Symbol | undefined {
  if (!symbol) return undefined;
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function classSymbol(checker: ts.TypeChecker, declaration: ts.ClassDeclaration): ts.Symbol | undefined {
  return declaration.name ? canonicalSymbol(checker, checker.getSymbolAtLocation(declaration.name)) : undefined;
}

function isHplFuncType(checker: ts.TypeChecker, type: ts.Type, seen = new Set<ts.Type>()): boolean {
  if (seen.has(type)) return false;
  seen.add(type);
  if (isHplNamespaceMember(canonicalSymbol(checker, type.getSymbol()), "HplFunc")) return true;
  return Boolean(type.flags & ts.TypeFlags.Object)
    && checker.getBaseTypes(type as ts.InterfaceType).some((base) => isHplFuncType(checker, base, seen));
}

function isHplNamespaceMember(symbol: ts.Symbol | undefined, member: string): boolean {
  if (!symbol || symbol.getName() !== member) return false;
  return (symbol.getDeclarations() ?? []).some((declaration) => {
    let current: ts.Node | undefined = declaration.parent;
    while (current) {
      if (ts.isModuleDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text === "hpl";
      current = current.parent;
    }
    return false;
  });
}

function decoratorCall(
  checker: ts.TypeChecker,
  declaration: ts.MethodDeclaration,
  report: DeclarationIndexReporter,
): { readonly kind: HplMethodKind; readonly call: ts.CallExpression } | undefined {
  const matches: Array<{ readonly kind: HplMethodKind; readonly call: ts.CallExpression }> = [];
  const decorators = ts.canHaveDecorators(declaration) ? ts.getDecorators(declaration) ?? [] : [];
  for (const decorator of decorators) {
    if (!ts.isCallExpression(decorator.expression)) continue;
    const call = decorator.expression;
    const signature = checker.getResolvedSignature(call);
    const target = signature?.getDeclaration()?.name;
    const symbol = canonicalSymbol(checker, target ? checker.getSymbolAtLocation(target) : undefined);
    if (isHplNamespaceMember(symbol, "hplFunc")) matches.push({ kind: "function", call });
    if (isHplNamespaceMember(symbol, "hplEvent")) matches.push({ kind: "event", call });
  }
  if (matches.length > 1) report(declaration, 3216, "An HPL method must have exactly one @hplFunc or @hplEvent decorator");
  return matches[0];
}

function isHplFuncBase(checker: ts.TypeChecker, declaration: ts.ClassDeclaration): boolean {
  const symbol = classSymbol(checker, declaration);
  if (!symbol) return false;
  const declared = checker.getDeclaredTypeOfSymbol(symbol);
  return Boolean(declared.flags & ts.TypeFlags.Object)
    && checker.getBaseTypes(declared as ts.InterfaceType).some((base) => isHplFuncType(checker, base));
}

function literalString(node: ts.Expression | undefined): string | undefined {
  return node && ts.isStringLiteralLike(node) ? node.text : undefined;
}

function stableFunctionId(declaration: ts.MethodDeclaration): FunctionId {
  const source = declaration.getSourceFile();
  const relative = path.relative(process.cwd(), source.fileName).replaceAll("\\", "/");
  return functionId(`${relative}@${declaration.getStart(source, false)}`);
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node) && Boolean(ts.getModifiers(node)?.some((modifier) => modifier.kind === kind));
}

export function buildDeclarationIndex(
  files: readonly ts.SourceFile[],
  checker: ts.TypeChecker,
  report: DeclarationIndexReporter,
): DeclarationIndex {
  const resolver = new TypeResolver(checker);
  const methods: HplMethodDeclaration[] = [];
  const classes = new Set<ts.ClassDeclaration>();
  const bySymbol = new Map<ts.Symbol, HplMethodDeclaration>();

  for (const file of files) {
    for (const statement of file.statements) {
      if (!ts.isClassDeclaration(statement)) continue;
      const container = isHplFuncBase(checker, statement);
      if (container) classes.add(statement);
      for (const member of statement.members) {
        if (!ts.isMethodDeclaration(member)) {
          if (container) report(member, 3202, "HplFunc containers may only contain decorated static methods");
          continue;
        }
        const decorated = decoratorCall(checker, member, report);
        if (!decorated) {
          if (container) report(member, 3202, "HplFunc containers may only contain decorated static methods");
          continue;
        }
        if (!container) {
          report(member, 3201, "@hplFunc and @hplEvent methods must be declared in a class extending hpl.HplFunc");
          continue;
        }
        if (!hasModifier(member, ts.SyntaxKind.StaticKeyword) || !member.body || !member.name || !ts.isIdentifier(member.name)) {
          report(member, 3203, "HPL methods must be named, implemented static methods");
          continue;
        }
        if (hasModifier(member, ts.SyntaxKind.AsyncKeyword) || member.asteriskToken) {
          report(member, 3204, "HPL methods cannot be async or generators");
          continue;
        }
        const symbol = canonicalSymbol(checker, checker.getSymbolAtLocation(member.name));
        const signature = checker.getSignatureFromDeclaration(member);
        if (!symbol || !signature) {
          report(member, 3205, "Unable to resolve HPL method declaration");
          continue;
        }
        const first = decorated.call.arguments[0];
        const second = decorated.call.arguments[1];
        let event: string | undefined;
        let registeredName = member.name.text;
        if (decorated.kind === "function") {
          if (decorated.call.arguments.length > 1) report(decorated.call, 3212, "@hplFunc accepts at most one name argument");
          if (first && literalString(first) === undefined) report(first, 3206, "@hplFunc name must be a string literal");
          registeredName = literalString(first) ?? registeredName;
        } else {
          if (decorated.call.arguments.length < 1 || decorated.call.arguments.length > 2) report(decorated.call, 3213, "@hplEvent requires an event and optional name");
          event = literalString(first);
          if (!event) report(first ?? decorated.call, 3207, "@hplEvent event must be a non-empty string literal");
          if (second && literalString(second) === undefined) report(second, 3208, "@hplEvent name must be a string literal");
          registeredName = literalString(second) ?? registeredName;
          if (member.parameters.length !== 1) report(member, 3209, "@hplEvent methods require exactly one parameter");
        }
        const parameters = member.parameters.map((parameter) => resolver.resolveNode(parameter));
        if (decorated.kind === "event" && parameters[0]
          && parameters[0].kind !== "object" && parameters[0].kind !== "map") {
          report(member.parameters[0] ?? member, 3210, "@hplEvent parameter must be an interface or object type");
        }
        const entry: HplMethodDeclaration = {
          kind: decorated.kind,
          id: stableFunctionId(member),
          classDeclaration: statement,
          declaration: member,
          symbol,
          parameters,
          returnType: resolver.resolve(signature.getReturnType()),
          registeredName,
          ...(event ? { event } : {}),
        };
        methods.push(entry);
        bySymbol.set(symbol, entry);
      }
    }
  }
  return { methods, bySymbol, classes };
}

export function findIndexedMethod(
  checker: ts.TypeChecker,
  index: DeclarationIndex,
  expression: ts.Expression,
): HplMethodDeclaration | undefined {
  const symbol = canonicalSymbol(checker, checker.getSymbolAtLocation(expression));
  return symbol ? index.bySymbol.get(symbol) : undefined;
}
