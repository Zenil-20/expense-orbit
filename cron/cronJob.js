const cron = require("node-cron");
const { processExpenses } = require("../services/recurringService");

const APP_TZ = process.env.TZ || "Asia/Kolkata";

const startCron = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log(`Running daily reminder cron (${APP_TZ})`);
      await processExpenses();
    },
    { timezone: APP_TZ }
  );
};

module.exports = startCron;
