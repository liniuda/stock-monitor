import { promises as fs } from "fs";
import path from "path";
import { DailyReview } from "./review-types";

const DATA_DIR = path.join(process.cwd(), "data", "simulation", "reviews");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readReview(date: string): Promise<DailyReview | null> {
  try {
    const file = path.join(DATA_DIR, `${date}.json`);
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as DailyReview;
  } catch {
    return null;
  }
}

export async function writeReview(review: DailyReview): Promise<void> {
  await ensureDir();
  const file = path.join(DATA_DIR, `${review.date}.json`);
  await fs.writeFile(file, JSON.stringify(review, null, 2), "utf-8");
}

export async function listReviewDates(): Promise<string[]> {
  try {
    await ensureDir();
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse(); // newest first
  } catch {
    return [];
  }
}

export async function updateOptimizationConfirm(
  date: string,
  optimizationId: string,
  confirmed: boolean
): Promise<DailyReview | null> {
  const review = await readReview(date);
  if (!review) return null;
  const opt = review.optimizations.find((o) => o.id === optimizationId);
  if (opt) {
    opt.confirmed = confirmed;
    await writeReview(review);
  }
  return review;
}
