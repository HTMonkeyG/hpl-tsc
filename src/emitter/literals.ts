const HPL_ESCAPES: Readonly<Record<string, string>> = {
  "\\": "\\\\",
  "'": "\\'",
  "\n": "\\n",
  "\t": "\\t",
  "\r": "\\r",
  "": "\\a",
  "\b": "\\b",
  "\f": "\\f",
  "\v": "\\v",
  "\0": "\\0",
};

export function emitIntLiteral(value: number): string {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`HPL integer literal must be a safe integer: ${value}`);
  }
  if (value < -2147483648 || value > 2147483647) {
    throw new RangeError(`HPL integer literal is outside the 32-bit range: ${value}`);
  }
  return Object.is(value, -0) ? "0" : String(value);
}

export function emitFloatLiteral(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`HPL float literal must be finite: ${value}`);
  }
  if (Object.is(value, -0)) return "(0 - 0.0)";
  if (Number.isInteger(value)) return `${value}.0`;

  const rendered = String(value);
  const match = /^(-?)(\d+(?:\.\d+)?)[eE]([+-]?\d+)$/.exec(rendered);
  if (!match) return rendered;

  const [, sign = "", coefficient = "", exponentText = "0"] = match;
  const exponent = Number(exponentText);
  const [whole = "0", fraction = ""] = coefficient.split(".");
  const digits = whole + fraction;
  const decimalIndex = whole.length + exponent;
  if (decimalIndex <= 0) return `${sign}0.${"0".repeat(-decimalIndex)}${digits}`;
  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${"0".repeat(decimalIndex - digits.length)}.0`;
  }
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

export function emitBooleanLiteral(value: boolean): string {
  return value ? "True" : "False";
}

export function escapeHplString(value: string): string {
  let escaped = "";
  for (const character of value) escaped += HPL_ESCAPES[character] ?? character;
  return escaped;
}

export function emitStringLiteral(value: string): string {
  return `'${escapeHplString(value)}'`;
}
