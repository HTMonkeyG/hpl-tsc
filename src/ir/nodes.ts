import type { HplSemanticType, HplType, ValueConvention } from "../analysis/types.js";
import type { SourceRange } from "../types.js";

export type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type SymbolId = Brand<string, "SymbolId">;
export type FunctionId = Brand<string, "FunctionId">;
export type Effect = "pure" | "read" | "write" | "call";
export type SourceSpan = SourceRange;
export interface NodeMetadata { readonly span?: SourceRange; readonly type?: HplType }
export interface TypedMetadata { readonly span: SourceRange; readonly type: HplSemanticType; readonly effect: Effect }
export interface SymbolInfo { readonly id: SymbolId; readonly name?: string; readonly emittedName?: string; readonly origin?: SymbolId; readonly type: HplSemanticType; readonly convention: ValueConvention }
export interface FunctionInfo { readonly id: FunctionId; readonly name: string; readonly emittedName?: string; readonly parameters: readonly SymbolId[]; readonly returnType: HplSemanticType }

/** Compatibility root; typed modules can coexist while the old lowering pipeline migrates. */
export interface Program extends NodeMetadata {
  readonly kind: "program";
  readonly body: readonly Statement[];
  readonly modules?: readonly ModuleBlock[];
  readonly symbols?: ReadonlyMap<SymbolId, SymbolInfo>;
  readonly functions?: ReadonlyMap<FunctionId, FunctionInfo>;
}
export interface ModuleBlock { readonly kind: "moduleBlock"; readonly id: string; readonly fileName?: string; readonly registrations: readonly Registration[]; readonly body: Block; readonly span?: SourceRange }
export interface Block { readonly kind: "block"; readonly statements: readonly TypedStatement[]; readonly span?: SourceRange }
export interface CustomFunctionRegistration { readonly kind: "customFunction"; readonly functionId: FunctionId; readonly parameters: readonly SymbolId[]; readonly body: Block; readonly span: SourceRange; readonly name?: string }
export interface SystemEventRegistration { readonly kind: "systemEvent"; readonly event: string; readonly handler: FunctionId; readonly arguments: readonly TypedExpression[]; readonly body?: Block; readonly listener?: string; readonly onError?: string; readonly span: SourceRange }
export type Registration = CustomFunctionRegistration | SystemEventRegistration;

export type LValue = SymbolLValue | PropertyLValue | IndexLValue | TupleLValue;
export interface SymbolLValue { readonly kind: "symbolLValue"; readonly symbol: SymbolId; readonly name?: string; readonly type: HplSemanticType; readonly span: SourceRange }
export interface PropertyLValue { readonly kind: "propertyLValue"; readonly object: TypedExpression; readonly property: string; readonly operation?: string; readonly type: HplSemanticType; readonly span: SourceRange }
export interface IndexLValue { readonly kind: "indexLValue"; readonly object: TypedExpression; readonly index: TypedExpression; readonly operation?: string; readonly type: HplSemanticType; readonly span: SourceRange }
export interface TupleLValue { readonly kind: "tupleLValue"; readonly elements: readonly LValue[]; readonly type: HplSemanticType; readonly span: SourceRange }

export interface TypedAssign { readonly kind: "typedAssign"; readonly target: LValue; readonly value: TypedExpression; readonly span: SourceRange }
export interface TypedIfBranch { readonly condition: TypedExpression; readonly body: Block; readonly span: SourceRange }
export interface TypedIf { readonly kind: "typedIf"; readonly condition: TypedExpression; readonly thenBody: Block; readonly elifs?: readonly TypedIfBranch[]; readonly elseBody?: Block; readonly span: SourceRange }
export interface TypedCountFor { readonly kind: "typedCountFor"; readonly variable: SymbolId; readonly count: TypedExpression; readonly body: Block; readonly span: SourceRange }
export interface TypedReturn { readonly kind: "typedReturn"; readonly value?: TypedExpression; readonly span: SourceRange }
export interface TypedBreak { readonly kind: "typedBreak"; readonly span: SourceRange }
export interface TypedContinue { readonly kind: "typedContinue"; readonly span: SourceRange }
export interface TypedExpressionStatement { readonly kind: "typedExpressionStmt"; readonly expression: TypedExpression; readonly span: SourceRange }
export type TypedStatement = TypedAssign | TypedIf | TypedCountFor | TypedReturn | TypedBreak | TypedContinue | TypedExpressionStatement;

interface TypedExpressionBase extends TypedMetadata {}
export interface TypedIntExpression extends TypedExpressionBase { readonly kind: "typedInt"; readonly value: number }
export interface TypedFloatExpression extends TypedExpressionBase { readonly kind: "typedFloat"; readonly value: number }
export interface TypedBoolExpression extends TypedExpressionBase { readonly kind: "typedBool"; readonly value: boolean }
export interface TypedStringExpression extends TypedExpressionBase { readonly kind: "typedString"; readonly value: string }
export interface TypedNoneExpression extends TypedExpressionBase { readonly kind: "typedNone" }
export interface TypedSymbolExpression extends TypedExpressionBase { readonly kind: "typedSymbol"; readonly symbol: SymbolId; readonly name?: string }
export interface TypedCastExpression extends TypedExpressionBase { readonly kind: "typedCast"; readonly expression: TypedExpression }
export interface TypedBinaryExpression extends TypedExpressionBase { readonly kind: "typedBinary"; readonly operator: BinaryOperator; readonly left: TypedExpression; readonly right: TypedExpression }
export interface TypedUnaryExpression extends TypedExpressionBase { readonly kind: "typedUnary"; readonly operator: "not" | "negate"; readonly operand: TypedExpression }
export interface RuntimeCallExpression extends TypedExpressionBase { readonly kind: "runtimeCall"; readonly operation: string; readonly args: readonly TypedExpression[] }
export interface UserCallExpression extends TypedExpressionBase { readonly kind: "userCall"; readonly functionId: FunctionId; readonly args: readonly TypedExpression[]; readonly name?: string }
export interface TypedSelectorExpression extends TypedExpressionBase { readonly kind: "typedSelector"; readonly target: TypedExpression }
export interface TypedScoreExpression extends TypedExpressionBase { readonly kind: "typedScore"; readonly target: TypedExpression; readonly objective: TypedExpression }
export interface TypedCommandExpression extends TypedExpressionBase { readonly kind: "typedCommand"; readonly command: TypedExpression }
export interface TypedRefExpression extends TypedExpressionBase { readonly kind: "typedRef"; readonly index: TypedExpression; readonly refType?: "int" | "bool" | "float" | "str"; readonly convention: ValueConvention }
export interface TupleExpression extends TypedExpressionBase { readonly kind: "tuple"; readonly elements: readonly TypedExpression[] }
export interface ArgsExpression extends TypedExpressionBase { readonly kind: "args"; readonly values: readonly TypedExpression[] }
export interface SliceExpression extends TypedExpressionBase { readonly kind: "slice"; readonly elements: readonly TypedExpression[] }
export interface MapEntry { readonly key: TypedExpression; readonly value: TypedExpression }
export interface MapExpression extends TypedExpressionBase { readonly kind: "map"; readonly entries: readonly MapEntry[] }
export interface SetExpression extends TypedExpressionBase { readonly kind: "set"; readonly elements: readonly TypedExpression[] }
export type TypedSetExpression = SetExpression;
export interface ObjectField { readonly name: string; readonly value: TypedExpression }
export interface ObjectExpression extends TypedExpressionBase { readonly kind: "object"; readonly fields: readonly ObjectField[] }
export type TypedExpression = TypedIntExpression | TypedFloatExpression | TypedBoolExpression | TypedStringExpression | TypedNoneExpression | TypedSymbolExpression | TypedCastExpression | TypedBinaryExpression | TypedUnaryExpression | RuntimeCallExpression | UserCallExpression | TypedSelectorExpression | TypedScoreExpression | TypedCommandExpression | TypedRefExpression | TupleExpression | ArgsExpression | SliceExpression | MapExpression | SetExpression | ObjectExpression;

export interface Assign extends NodeMetadata { readonly kind: "assign"; readonly target: string; readonly value: Expression }
export interface IfBranch extends NodeMetadata { readonly condition: Expression; readonly body: readonly Statement[] }
export interface If extends NodeMetadata { readonly kind: "if"; readonly condition: Expression; readonly thenBody: readonly Statement[]; readonly elifs?: readonly IfBranch[]; readonly elseBody?: readonly Statement[] }
export interface CountFor extends NodeMetadata { readonly kind: "countFor"; readonly variable: string; readonly count: Expression; readonly body: readonly Statement[] }
export interface Return extends NodeMetadata { readonly kind: "return"; readonly value: Expression }
export interface Break extends NodeMetadata { readonly kind: "break" }
export interface Continue extends NodeMetadata { readonly kind: "continue" }
export interface ExpressionStmt extends NodeMetadata { readonly kind: "expressionStmt"; readonly expression: Expression }
export type Statement = Assign | If | CountFor | Return | Break | Continue | ExpressionStmt;

export interface IntExpression extends NodeMetadata { readonly kind: "int"; readonly value: number }
export interface FloatExpression extends NodeMetadata { readonly kind: "float"; readonly value: number }
export interface BoolExpression extends NodeMetadata { readonly kind: "bool"; readonly value: boolean }
export interface StringExpression extends NodeMetadata { readonly kind: "string"; readonly value: string }
export interface VariableExpression extends NodeMetadata { readonly kind: "variable"; readonly name: string }
export interface CastExpression extends NodeMetadata { readonly kind: "cast"; readonly targetType: HplType; readonly expression: Expression }
export type BinaryOperator = "+" | "-" | "*" | "/" | "==" | "!=" | "<" | ">" | "<=" | ">=" | "and" | "or" | "in";
export interface BinaryExpression extends NodeMetadata { readonly kind: "binary"; readonly operator: BinaryOperator; readonly left: Expression; readonly right: Expression }
export interface UnaryNotExpression extends NodeMetadata { readonly kind: "unaryNot"; readonly operand: Expression }
export interface FuncExpression extends NodeMetadata { readonly kind: "func"; readonly name: string; readonly args: readonly Expression[] }
export interface SelectorExpression extends NodeMetadata { readonly kind: "selector"; readonly target: Expression }
export interface ScoreExpression extends NodeMetadata { readonly kind: "score"; readonly target: Expression; readonly objective: Expression }
export interface CommandExpression extends NodeMetadata { readonly kind: "command"; readonly command: Expression }
export interface RefExpression extends NodeMetadata { readonly kind: "ref"; readonly refType: HplType; readonly index: Expression }
export type Expression = IntExpression | FloatExpression | BoolExpression | StringExpression | VariableExpression | CastExpression | BinaryExpression | UnaryNotExpression | FuncExpression | SelectorExpression | ScoreExpression | CommandExpression | RefExpression;
export type HplNode = Program | ModuleBlock | Block | Registration | Statement | TypedStatement | IfBranch | Expression | TypedExpression | LValue;
