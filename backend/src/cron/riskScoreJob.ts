import cron from "node-cron";
import { recomputePlatformRiskScores } from "../services/aiService";

export function initRiskScoreCronJob() {
  // Schedule platform-wide risk score recomputation every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("[CRON] Running scheduled platform-wide AI risk score recomputation...");
    try {
      const result = await recomputePlatformRiskScores();
      console.log(`[CRON] Recomputed risk scores for ${result.computedCount} batches.`);
    } catch (err: any) {
      console.error("[CRON] Error recomputing risk scores:", err.message);
    }
  });

  console.log("Scheduled AI Risk Score Cron Job initialized (every 15 minutes).");
}
