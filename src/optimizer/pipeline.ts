import type { Program } from "../ir/nodes.js";
import type { OptimizationLevel } from "../types.js";
import { optimizeProgram } from "./optimizer.js";

export function runOptimizationPipeline(program: Program, level: OptimizationLevel): Program {
  return optimizeProgram(program, level);
}
