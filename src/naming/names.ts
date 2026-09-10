import type { Program, SymbolId, SymbolInfo } from "../ir/nodes.js";

const RESERVED = new Set([
  "int", "bool", "str", "float", "ref", "selector", "score", "command", "func",
  "return", "if", "else", "elif", "fi", "for", "continue", "break", "rof",
  "and", "or", "not", "in", "True", "False", "args",
]);

function sanitize(value: string): string {
  let name = value.normalize("NFKC").replace(/[^A-Za-z0-9_]/gu, "_");
  if (!name) name = "value";
  if (/^[0-9]/u.test(name)) name = `_${name}`;
  if (RESERVED.has(name)) name = `${name}_value`;
  return name;
}

function sortedSymbols(symbols: ReadonlyMap<SymbolId, SymbolInfo> | undefined): readonly SymbolInfo[] {
  const values = symbols ? [...symbols.values()] : [];
  return values.sort((left, right) => String(left.id).localeCompare(String(right.id)));
}

function derivedRoot(info: SymbolInfo, symbols: ReadonlyMap<SymbolId, SymbolInfo> | undefined): string {
  const own = info.name?.trim();
  const source = info.origin ? symbols?.get(info.origin)?.name?.trim() : undefined;
  return sanitize(own || source || "source");
}

export class NameAllocator {
  readonly #names = new Map<SymbolId, string>();
  readonly #used = new Set<string>();
  readonly #strip: boolean;
  #strippedIndex = 0;

  constructor(program: Program, strip = false) {
    this.#strip = strip;
    let anonymousIndex = 0;
    const derivedIndices = new Map<string, number>();
    for (const info of sortedSymbols(program.symbols)) {
      const source = info.name?.trim();
      let preferred: string;
      if (strip) preferred = `_${this.#strippedIndex++}`;
      else if (info.emittedName) preferred = info.emittedName;
      else if (info.origin) {
        const root = derivedRoot(info, program.symbols);
        const index = derivedIndices.get(root) ?? 0;
        derivedIndices.set(root, index + 1);
        preferred = `${root}_${index}`;
      } else preferred = source || `tmpvar_${anonymousIndex++}`;
      this.#names.set(info.id, this.#claim(preferred));
    }
  }

  #claim(preferred: string): string {
    const root = sanitize(preferred);
    let candidate = root;
    for (let suffix = 2; this.#used.has(candidate); suffix++) candidate = `${root}_${suffix}`;
    this.#used.add(candidate);
    return candidate;
  }

  get(id: SymbolId, fallback?: string): string {
    const known = this.#names.get(id);
    if (known) return known;
    const name = this.#claim(this.#strip ? `_${this.#strippedIndex++}` : fallback ?? String(id));
    this.#names.set(id, name);
    return name;
  }
}

export function allocateNames(program: Program, strip = false): NameAllocator {
  return new NameAllocator(program, strip);
}

export { sanitize as sanitizeName };
