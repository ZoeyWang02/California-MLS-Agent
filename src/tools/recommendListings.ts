import { spawn } from "node:child_process";
import { join } from "node:path";

export interface CompValidation {
  comp_price: number;
  list_price: number;
  comp_count: number;
  delta_pct: number | null;
}

export interface RecommendedListing {
  L_ListingID: string;
  L_Type_: string;
  L_City: string;
  L_Keyword2: number;
  LM_Dec_3: number;
  LM_Int2_3: number;
  YearBuilt: number;
  L_SystemPrice: number;
  L_Remarks: string;
  score: number;
  comp_validation: CompValidation;
}

// Week 7: hybrid scoring (structured + embedding similarity) and comp
// validation, per the handbook. Same shell-out-to-Python pattern as
// Week 5/6, since it reuses embeddings.py's OpenAI + DB helpers.
const PYTHON_BIN = join(process.cwd(), "venv", "Scripts", "python.exe");
const SCRIPT_PATH = join(process.cwd(), "python", "recommendations.py");

export function recommendSimilarListings(
  targetListingId: string,
  topK = 5
): Promise<RecommendedListing[]> {
  return new Promise((resolve, reject) => {
    const args = [SCRIPT_PATH, targetListingId, String(topK)];
    const proc = spawn(PYTHON_BIN, args, { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => { stdout += chunk; });
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`recommendations.py exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as RecommendedListing[]);
      } catch (err) {
        reject(new Error(`Failed to parse recommendations.py output: ${(err as Error).message}`));
      }
    });
    proc.on("error", reject);
  });
}
