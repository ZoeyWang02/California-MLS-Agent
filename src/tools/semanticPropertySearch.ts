import { spawn } from "node:child_process";
import { join } from "node:path";

export interface SemanticListingResult {
  L_ListingID: string;
  L_Type_: string;
  L_City: string;
  L_Keyword2: number;
  LM_Dec_3: number;
  LM_Int2_3: number;
  YearBuilt: number;
  L_SystemPrice: number;
  L_Remarks: string;
}

// Week 6: like Week 5's price trend, the handbook's own example (OpenAI
// embeddings + scikit-learn cosine similarity) is Python, so this shells
// out to python/embeddings.py rather than reimplementing it in TS.
const PYTHON_BIN = join(process.cwd(), "venv", "Scripts", "python.exe");
const SCRIPT_PATH = join(process.cwd(), "python", "embeddings.py");

export function semanticPropertySearch(
  query: string,
  city?: string,
  candidateLimit = 50
): Promise<SemanticListingResult[]> {
  return new Promise((resolve, reject) => {
    const args = [SCRIPT_PATH, query, city ?? "", String(candidateLimit)];
    const proc = spawn(PYTHON_BIN, args, { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => { stdout += chunk; });
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`embeddings.py exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as SemanticListingResult[]);
      } catch (err) {
        reject(new Error(`Failed to parse embeddings.py output: ${(err as Error).message}`));
      }
    });
    proc.on("error", reject);
  });
}
