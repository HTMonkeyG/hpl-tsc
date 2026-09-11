import type { Writable } from "node:stream";
import type { DiagnosticSeverity, HplDiagnostic, SourceRange } from "../types.js";

export interface DiagnosticFormatOptions {
  readonly pretty?: boolean;
  readonly color?: boolean;
}

export interface DiagnosticReporterOptions extends DiagnosticFormatOptions {
  readonly stream?: Writable;
}

const ANSI = {
  reset: "[0m",
  bold: "[1m",
  cyan: "[36m",
  red: "[31m",
  yellow: "[33m",
  blue: "[34m"
} as const;

const severityColor: Record<DiagnosticSeverity, string> = {
  error: ANSI.red,
  warning: ANSI.yellow,
  info: ANSI.blue
};

function paint(text: string, color: string, enabled: boolean): string {
  return enabled ? `${color}${text}${ANSI.reset}` : text;
}

function location(diagnostic: HplDiagnostic): string {
  const file = diagnostic.file ?? "<unknown>";
  const start = diagnostic.range?.start;
  return start === undefined ? file : `${file}:${start.line}:${start.column}`;
}

/** How many source lines to show before and after the error span. */
const CONTEXT_LINES = 2;

function underlineForLine(
  line: number,
  range: SourceRange,
  text: string,
  gutterWidth: number,
  color: boolean,
  severity: DiagnosticSeverity,
): string | undefined {
  const { start, end } = range;
  if (line < start.line || line > end.line) return undefined;
  const from = line === start.line ? start.column : 1;
  const to = line === end.line ? end.column : text.length + 1;
  const caretStart = Math.max(1, from);
  const caretEnd = Math.max(caretStart + 1, to);
  const marker = `${" ".repeat(caretStart - 1)}${"^".repeat(caretEnd - caretStart)}`;
  return `${" ".repeat(gutterWidth)} | ${paint(marker, severityColor[severity], color)}`;
}

function codeFrame(diagnostic: HplDiagnostic, color: boolean): string[] {
  const source = diagnostic.source;
  const range = diagnostic.range;
  if (source === undefined || range === undefined) return [];

  const lines = source.split(/\r?\n/u);
  const startLine = range.start.line;
  const endLine = range.end.line;
  const first = Math.max(1, startLine - CONTEXT_LINES);
  const last = Math.min(lines.length, endLine + CONTEXT_LINES);
  const gutterWidth = String(last).length;

  const frame: string[] = [];
  for (let line = first; line <= last; line++) {
    const text = lines[line - 1] ?? "";
    frame.push(`${paint(String(line).padStart(gutterWidth), ANSI.cyan, color)} | ${text}`);
    const underline = underlineForLine(line, range, text, gutterWidth, color, diagnostic.severity);
    if (underline !== undefined) frame.push(underline);
  }
  return frame;
}

export function formatDiagnostic(
  diagnostic: HplDiagnostic,
  options: DiagnosticFormatOptions = {}
): string {
  const pretty = options.pretty ?? false;
  const color = pretty && (options.color ?? false);
  const label = `${diagnostic.severity} ${diagnostic.code}`;

  if (!pretty) {
    const hint = diagnostic.hint === undefined ? "" : ` Hint: ${diagnostic.hint}`;
    return `${location(diagnostic)} - ${label}: ${diagnostic.message}${hint}`;
  }

  const heading = [
    paint(location(diagnostic), ANSI.cyan, color),
    paint(label, `${ANSI.bold}${severityColor[diagnostic.severity]}`, color),
    diagnostic.message
  ].join(" - ");
  const frame = codeFrame(diagnostic, color);
  const hint = diagnostic.hint === undefined
    ? []
    : [paint(`hint: ${diagnostic.hint}`, ANSI.cyan, color)];
  return [heading, ...frame, ...hint].join("\n");
}

export function formatDiagnostics(
  diagnostics: readonly HplDiagnostic[],
  options: DiagnosticFormatOptions = {}
): string {
  const separator = options.pretty === true ? "\n\n" : "\n";
  return diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, options)).join(separator);
}

export class DiagnosticReporter {
  readonly #options: DiagnosticFormatOptions;
  readonly #stream: Writable;

  public constructor(options: DiagnosticReporterOptions = {}) {
    this.#stream = options.stream ?? process.stderr;
    this.#options = {
      pretty: options.pretty ?? false,
      color: options.color ?? false
    };
  }

  public report(diagnostic: HplDiagnostic): void {
    this.#stream.write(`${formatDiagnostic(diagnostic, this.#options)}\n`);
  }

  public reportAll(diagnostics: readonly HplDiagnostic[]): void {
    if (diagnostics.length === 0) return;
    this.#stream.write(`${formatDiagnostics(diagnostics, this.#options)}\n`);
  }
}
