import path from "node:path";
import ts from "typescript";

export interface ProgramInput {
  readonly entryFile: string;
  readonly project?: string;
  readonly declarationFiles?: readonly string[];
  readonly cwd?: string;
}

export interface ProgramContext {
  readonly program: ts.Program;
  readonly entryFile: ts.SourceFile;
  readonly diagnostics: readonly ts.Diagnostic[];
  readonly declarationFiles: readonly ts.SourceFile[];
  close(): void;
}

function normalize(fileName: string): string {
  return path.resolve(fileName).replaceAll("\\", "/").toLowerCase();
}

export function createProgramContext(input: ProgramInput): ProgramContext {
  const cwd = path.resolve(input.cwd ?? process.cwd());
  const entryName = path.resolve(cwd, input.entryFile);
  let rootNames = [entryName];
  let options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  };
  const configDiagnostics: ts.Diagnostic[] = [];
  if (input.project) {
    const configPath = path.resolve(cwd, input.project);
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    if (read.error) configDiagnostics.push(read.error);
    else {
      const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, path.dirname(configPath), undefined, configPath);
      rootNames = parsed.fileNames;
      options = { ...parsed.options, noEmit: true };
      configDiagnostics.push(...parsed.errors);
    }
  }
  rootNames = Array.from(new Set([
    ...rootNames.map(file => path.resolve(file)),
    entryName,
    ...(input.declarationFiles ?? []).map(file => path.resolve(cwd, file)),
  ]));
  const program = ts.createProgram({ rootNames, options });
  const entryFile = program.getSourceFile(entryName);
  if (!entryFile) throw new Error(`Entry file is not part of the TypeScript project: ${entryName}`);
  const wantedDeclarations = new Set((input.declarationFiles ?? []).map(file => normalize(path.resolve(cwd, file))));
  const declarationFiles = program.getSourceFiles().filter(file => wantedDeclarations.has(normalize(file.fileName)));
  const diagnostics = [...configDiagnostics, ...ts.getPreEmitDiagnostics(program)];
  return { program, entryFile, diagnostics, declarationFiles, close(): void {} };
}

export function collectTypeScriptDiagnostics(context: ProgramContext): readonly ts.Diagnostic[] {
  return context.diagnostics;
}
