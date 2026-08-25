import app from "./app";
import { initRiskScoreCronJob } from "./cron/riskScoreJob";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PharmaTrace Backend API running on port ${PORT}`);
  initRiskScoreCronJob();
});
