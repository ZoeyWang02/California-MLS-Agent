import { spawn } from "node:child_process";
import { join } from "node:path";

export interface RagResult {
  answer: string;
  sources: string[];
}

// Week 8: RAG over knowledge/*.md, per the handbook's chunk/index/retrieve/
// generate pipeline. Same shell-out-to-Python pattern as Weeks 5-7.
const PYTHON_BIN = join(process.cwd(), "venv", "Scripts", "python.exe");
const SCRIPT_PATH = join(process.cwd(), "python", "rag.py");

export function ragAnswer(query: string): Promise<RagResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, query], { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => { stdout += chunk; });
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`rag.py exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as RagResult);
      } catch (err) {
        reject(new Error(`Failed to parse rag.py output: ${(err as Error).message}`));
      }
    });
    proc.on("error", reject);
  });
}
