#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { compile } from "./compiler/compile.js";
import { DiagnosticReporter } from "./diagnostics/reporter.js";
import type { HplDiagnostic } from "./types.js";

const HELP = `用法: hpl-tsc [选项] <input.ts>

选项:
  -p, --project <文件>  使用指定的 tsconfig.json
  -o, --outFile <文件>  指定输出文件（默认与输入同名，扩展名为 .hpl）
      --noEmit          只检查，不写入输出文件
  -O, --optimize <级别>  优化级别 0、1 或 2（默认 0）
  -s, --strip           去除非公开符号名称
      --pretty          美化诊断信息（终端中同时启用颜色）
      --help            显示帮助
      --version         显示版本
`;

type RawDiagnostic = {
  readonly code: string | number;
  readonly category?: string;
  readonly severity?: string;
  readonly message: string;
  readonly fileName?: string;
  readonly file?: string;
  readonly start?: number;
  readonly length?: number;
  readonly range?: HplDiagnostic["range"];
  readonly source?: string;
  readonly hint?: string;
};

type RawCompileResult = {
  readonly outputText?: string;
  readonly diagnostics: readonly RawDiagnostic[];
};

type RuntimeCompileOptions = {
  readonly entryFile: string;
  readonly project?: string;
  readonly optimizationLevel: 0 | 1 | 2;
  readonly strip: boolean;
};

function fail(message: string): never {
  process.stderr.write(`hpl-tsc: ${message}\n可运行 "hpl-tsc --help" 查看用法。\n`);
  process.exitCode = 2;
  throw new Error("CLI_ARGUMENT_ERROR");
}

function position(source: string, offset: number) {
  const prefix = source.slice(0, Math.max(0, offset));
  const lines = prefix.split(/\r?\n/u);
  return { offset, line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

async function normalizeDiagnostic(item: RawDiagnostic): Promise<HplDiagnostic> {
  const file = item.file ?? item.fileName;
  let source = item.source;
  if (source === undefined && file !== undefined) {
    try { source = await readFile(file, "utf8"); } catch { /* 诊断仍可不带代码帧输出。 */ }
  }
  const range = item.range ?? (source !== undefined && item.start !== undefined
    ? { start: position(source, item.start), end: position(source, item.start + (item.length ?? 1)) }
    : undefined);
  const level = item.severity ?? item.category;
  const severity = level === "error" || level === "warning" ? level : "info";
  return {
    code: String(item.code), severity, message: item.message,
    ...(file === undefined ? {} : { file }),
    ...(range === undefined ? {} : { range }),
    ...(source === undefined ? {} : { source }),
    ...(item.hint === undefined ? {} : { hint: item.hint }),
  };
}

async function version(): Promise<string> {
  let directory = path.dirname(fileURLToPath(import.meta.url));
  for (;;) {
    try {
      const text = await readFile(path.join(directory, "package.json"), "utf8");
      return (JSON.parse(text) as { version: string }).version;
    } catch (error) {
      const parent = path.dirname(directory);
      if (parent === directory) throw error;
      directory = parent;
    }
  }
}

async function main(): Promise<void> {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2), allowPositionals: true, strict: true,
      options: {
        project: { type: "string", short: "p" },
        outFile: { type: "string", short: "o" },
        optimize: { type: "string", short: "O" },
        strip: { type: "boolean", short: "s" },
        noEmit: { type: "boolean" },
        pretty: { type: "boolean" }, help: { type: "boolean" },
        version: { type: "boolean" },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(message);
  }

  const values = parsed.values as {
    readonly project?: string;
    readonly outFile?: string;
    readonly optimize?: string;
    readonly strip?: boolean;
    readonly noEmit?: boolean;
    readonly pretty?: boolean;
    readonly help?: boolean;
    readonly version?: boolean;
  };
  if (values.help) { process.stdout.write(HELP); return; }
  if (values.version) { process.stdout.write(`${await version()}\n`); return; }
  if (parsed.positionals.length === 0) fail("缺少输入文件 input.ts");
  if (parsed.positionals.length > 1) fail("只能指定一个输入文件");
  const optimization = Number(values.optimize ?? "0");
  if (optimization !== 0 && optimization !== 1 && optimization !== 2) fail("--optimize 必须是 0、1 或 2");

  const input = path.resolve(parsed.positionals[0]!);
  const options: RuntimeCompileOptions = {
    entryFile: input,
    optimizationLevel: optimization,
    strip: values.strip ?? false,
    ...(values.project === undefined ? {} : { project: path.resolve(values.project) }),
  };
  const result = (compile as unknown as (options: RuntimeCompileOptions) => RawCompileResult)(options);
  const diagnostics = await Promise.all(result.diagnostics.map(normalizeDiagnostic));
  new DiagnosticReporter({
    pretty: values.pretty ?? false,
    color: (values.pretty ?? false) && Boolean(process.stderr.isTTY),
  }).reportAll(diagnostics);
  if (diagnostics.some((item) => item.severity === "error") || result.outputText === undefined) {
    process.exitCode = 1;
    return;
  }
  if (!values.noEmit) {
    const output = path.resolve(values.outFile ?? `${input.slice(0, -path.extname(input).length)}.hpl`);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, result.outputText, "utf8");
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error && error.message === "CLI_ARGUMENT_ERROR") return;
  process.stderr.write(`hpl-tsc: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
