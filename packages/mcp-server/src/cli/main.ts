import { runCharts } from "./charts.js";
import { runLocal } from "./local.js";
import { runLogout } from "./logout.js";
import { runStatus } from "./status.js";
import { runSync } from "./sync.js";
import { isHelpFlag, printCommandHelp, printRootHelp } from "./usage.js";

const COMMANDS = new Set(["sync", "status", "local", "logout", "charts"]);

export async function runCli(argv = process.argv): Promise<boolean> {
  const cmd = argv[2];
  if (isHelpFlag(cmd)) {
    printRootHelp();
    return true;
  }
  if (cmd && COMMANDS.has(cmd) && isHelpFlag(argv[3])) {
    printCommandHelp(cmd);
    return true;
  }
  if (!cmd || !COMMANDS.has(cmd)) return false;

  let code = 0;
  switch (cmd) {
    case "sync":
      code = await runSync();
      break;
    case "status":
      code = await runStatus();
      break;
    case "local":
      code = runLocal();
      break;
    case "logout":
      code = runLogout();
      break;
    case "charts":
      code = runCharts();
      break;
    default:
      return false;
  }
  if (code !== 0) process.exit(code);
  return true;
}