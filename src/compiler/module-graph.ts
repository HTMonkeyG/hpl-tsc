import path from "node:path";
import ts from "typescript";

export interface ModuleGraphIssue {
  readonly file?: ts.SourceFile;
  readonly node?: ts.ImportDeclaration;
  readonly message: string;
}

export interface ModuleGraph {
  readonly orderedFiles: readonly ts.SourceFile[];
  readonly issues: readonly ModuleGraphIssue[];
}

function normalize(fileName: string): string {
  return path.resolve(fileName).replaceAll("\\", "/").toLowerCase();
}

export function buildModuleGraph(program: ts.Program, entryFile: ts.SourceFile): ModuleGraph {
  const orderedFiles: ts.SourceFile[] = [];
  const issues: ModuleGraphIssue[] = [];
  const state = new Map<string, "visiting" | "visited">();
  const stack: ts.SourceFile[] = [];
  const options = program.getCompilerOptions();
  const visit = (file: ts.SourceFile): void => {
    const key = normalize(file.fileName);
    if (state.get(key) === "visited") return;
    if (state.get(key) === "visiting") {
      const first = stack.findIndex(item => normalize(item.fileName) === key);
      const cycle = [...stack.slice(Math.max(first, 0)), file].map(item => path.basename(item.fileName)).join(" -> ");
      issues.push({ file, message: `Runtime module cycle: ${cycle}` });
      return;
    }
    state.set(key, "visiting");
    stack.push(file);
    for (const statement of file.statements) {
      if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        issues.push({ file, node: statement, message: "Only string-literal module specifiers are supported" });
        continue;
      }
      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith("hpl-tsc/")) {
        issues.push({ file, node: statement, message: `Runtime package import '${specifier}' cannot be bundled to HPL` });
        continue;
      }
      const resolved = ts.resolveModuleName(specifier, file.fileName, options, ts.sys).resolvedModule;
      const dependency = resolved && program.getSourceFile(resolved.resolvedFileName);
      if (!dependency) {
        issues.push({ file, node: statement, message: `Cannot resolve module '${specifier}'` });
        continue;
      }
      if (!dependency.isDeclarationFile) visit(dependency);
    }
    stack.pop();
    state.set(key, "visited");
    orderedFiles.push(file);
  };
  visit(entryFile);
  return { orderedFiles, issues };
}
