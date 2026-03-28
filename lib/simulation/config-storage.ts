import { promises as fs } from "fs";
import path from "path";
import { SimConfig, DEFAULT_CONFIG } from "./types";

const CONFIG_FILE = path.join(
  process.cwd(),
  "data",
  "simulation",
  "config.json"
);

export async function readConfig(): Promise<SimConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    const stored = JSON.parse(raw) as Partial<SimConfig>;
    // Merge with defaults so new fields always have values
    return { ...DEFAULT_CONFIG, ...stored };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeConfig(config: SimConfig): Promise<void> {
  const dir = path.dirname(CONFIG_FILE);
  await fs.mkdir(dir, { recursive: true });
  const tmp = CONFIG_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(config, null, 2), "utf-8");
  await fs.rename(tmp, CONFIG_FILE);
}

export interface OptimizationApplyResult {
  success: boolean;
  changes: Record<string, { from: unknown; to: unknown }>;
  message: string;
}

/**
 * Apply a confirmed optimization to the live config.
 * Parses the optimization ID prefix to determine which parameter to change.
 */
export async function applyOptimization(
  optimizationId: string
): Promise<OptimizationApplyResult> {
  const config = await readConfig();
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (optimizationId.startsWith("opt-stoploss")) {
    changes.STOP_LOSS_PCT = { from: config.STOP_LOSS_PCT, to: 0.07 };
    config.STOP_LOSS_PCT = 0.07;
  } else if (optimizationId.startsWith("opt-takeprofit")) {
    changes.TAKE_PROFIT_PCT = { from: config.TAKE_PROFIT_PCT, to: 0.12 };
    config.TAKE_PROFIT_PCT = 0.12;
  } else if (optimizationId.startsWith("opt-marketfilter")) {
    changes.MARKET_FILTER_ENABLED = {
      from: config.MARKET_FILTER_ENABLED,
      to: true,
    };
    config.MARKET_FILTER_ENABLED = true;
  } else if (optimizationId.startsWith("opt-concentration")) {
    changes.TOP_N_THRESHOLD = { from: config.TOP_N_THRESHOLD, to: 12 };
    config.TOP_N_THRESHOLD = 12;
  } else if (optimizationId.startsWith("opt-drawdown")) {
    changes.DYNAMIC_ALLOCATION_ENABLED = {
      from: config.DYNAMIC_ALLOCATION_ENABLED,
      to: true,
    };
    config.DYNAMIC_ALLOCATION_ENABLED = true;
  } else if (optimizationId.startsWith("opt-scorethreshold")) {
    changes.SCORE_EXIT_BUFFER = { from: config.SCORE_EXIT_BUFFER, to: 5 };
    config.SCORE_EXIT_BUFFER = 5;
  } else {
    return {
      success: false,
      changes: {},
      message: `未知优化类型: ${optimizationId}`,
    };
  }

  await writeConfig(config);

  const descriptions = Object.entries(changes)
    .map(([key, { from, to }]) => `${key}: ${from} → ${to}`)
    .join(", ");

  return {
    success: true,
    changes,
    message: `配置已更新: ${descriptions}`,
  };
}
