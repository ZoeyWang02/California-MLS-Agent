import { spawn } from "node:child_process";
import { join } from "node:path";

export interface MonthlyTrend {
  month: string;
  sales: number;
  avg_price: number;
  avg_dom: number;
  price_change_pct: number | null;
}

// The handbook's Week 5 trend example is Python (pandas/SQLAlchemy), not
// TypeScript. Rather than re-implementing it in SQL, this shells out to the
// venv's Python to run it as written, and parses the JSON it prints.
const PYTHON_BIN = join(process.cwd(), "venv", "Scripts", "python.exe");
const SCRIPT_PATH = join(process.cwd(), "python", "market_trend.py");

export function getPriceTrend(city: string, months = 24): Promise<MonthlyTrend[]> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, city, String(months)], { cwd: process.cwd() });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => { stdout += chunk; });
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`market_trend.py exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as MonthlyTrend[]);
      } catch (err) {
        reject(new Error(`Failed to parse market_trend.py output: ${(err as Error).message}`));
      }
    });
    proc.on("error", reject);
  });
}
