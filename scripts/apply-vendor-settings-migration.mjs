import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    process.env[key.trim()] = process.env[key.trim()] ?? value;
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const migrationSql = readFileSync(
  path.join(projectRoot, "supabase", "vendor_list_settings.sql"),
  "utf8"
).trim();

const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectRefMatch?.[1] ?? "your-project-id";

console.log("Run this SQL in the Supabase SQL editor:");
console.log("");
console.log(migrationSql);
console.log("");
console.log(`Supabase dashboard: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
