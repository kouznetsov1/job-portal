import { getCronScheduleInfo } from "../schedulers/job-sync";

const info = getCronScheduleInfo();

console.log("=== Job Sync Scheduler Information ===\n");
console.log(`Cron Expression: ${info.cron}`);
console.log(`Description: ${info.description}\n`);
console.log(`Current Time: ${new Date().toLocaleString("sv-SE")}`);
console.log(
  `Next Run: ${info.nextRun.toLocaleString("sv-SE")} (${Math.ceil((info.nextRun.getTime() - Date.now()) / 1000 / 60)} minutes from now)\n`,
);
console.log("Upcoming 5 runs:");
info.upcomingRuns.forEach((run, i) => {
  console.log(`  ${i + 1}. ${run.toLocaleString("sv-SE")}`);
});
