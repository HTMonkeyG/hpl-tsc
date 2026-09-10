import type { Writable } from "node:stream";
import type { DiagnosticSeverity, HplDiagnostic } from "../types.js";

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

function sourceLine(diagnostic: HplDiagnostic): string | undefined {
  const line = diagnostic.range?.start.line;
  if (diagnostic.source === undefined || line === undefined) return undefined;
  return diagnostic.source.split(/\r?\n/u)[line - 1];
}

function codeFrame(diagnostic: HplDiagnostic, color: boolean): string[] {
  const text = sourceLine(diagnostic);
  const range = diagnostic.range;
  if (text === undefined || range === undefined) return [];

  const line = range.start.line;
  const gutter = String(line);
  const start = Math.max(1, range.start.column);
  const end = range.end.line === line ? Math.max(start + 1, range.end.column) : start + 1;
  const marker = `${" ".repeat(start - 1)}${"^".repeat(Math.max(1, end - start))}`;
  const padding = " ".repeat(gutter.length);

  return [
    `${paint(gutter, ANSI.cyan, color)} | ${text}`,
    `${padding} | ${paint(marker, severityColor[diagnostic.severity], color)}`
  ];
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
