const cron = require("node-cron");
const { processExpenses } = require("../services/recurringService");

const startCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running cron job...");
    await processExpenses();
  });
};

module.exports = startCron;