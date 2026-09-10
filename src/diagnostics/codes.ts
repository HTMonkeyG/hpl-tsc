export const DiagnosticCodes = {
  moduleGraph: "HPL1101",
  unsupportedSyntax: "HPL2101",
  unsupportedExpression: "HPL2105",
  unsupportedDeclaration: "HPL2107",
  unsupportedStatement: "HPL2108",
  invalidType: "HPL2201",
  unsafeConvention: "HPL2204",
  invalidVariable: "HPL2302",
  invalidContainer: "HPL2401",
  invalidLoop: "HPL3101",
  invalidControlFlow: "HPL3103",
  invalidDecorator: "HPL3201",
  duplicateRegistration: "HPL3202",
  invalidFunction: "HPL3203",
  eventNotCallable: "HPL3204",
  unsupportedCall: "HPL4101",
  invalidIntrinsic: "HPL4401",
  emissionError: "HPL9003",
  internalError: "HPL9999",
} as const;

export type DiagnosticCode =
  (typeof DiagnosticCodes)[keyof typeof DiagnosticCodes];
