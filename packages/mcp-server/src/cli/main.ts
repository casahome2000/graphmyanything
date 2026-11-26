import { runCharts } from "./charts.js";
import { runLocal } from "./local.js";
import { runLogout } from "./logout.js";
import { runSelfTest } from "./self-test.js";
import { runStatus } from "./status.js";
import { runSync } from "./sync.js";
import { isHelpFlag, printCommandHelp, printRootHelp } from "./usage.js";

const SETUP_ALIASES = new Set(["setup", "install"]);

const COMMANDS = new Set([
  "sync",
  "status",
  "local",
  "logout",
  "charts",
  "doctor",
  ...SETUP_ALIASES,
]);

export async function runCli(argv = process.argv): Promise<boolean> {
  const cmd = argv[2];
  if (isHelpFlag(cmd)) {
    printRootHelp();
    return true;
  }
  const helpCmd = cmd === "install" ? "setup" : cmd;
  if (cmd && COMMANDS.has(cmd) && isHelpFlag(argv[3])) {
    printCommandHelp(helpCmd ?? cmd);
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
    case "doctor":
      code = await runSelfTest();
      break;
    case "setup":
    case "install": {
      let clientArg: string | undefined;
      let yes = false;
      let skipSync = false;
      for (const a of argv.slice(3)) {
        if (a === "--yes" || a === "-y") yes = true;
        else if (a === "--no-sync") skipSync = true;
        else if (!a.startsWith("-")) clientArg = a;
      }
      const { runSetup } = await import("../setup/run.js");
      code = await runSetup({ clientArg, yes, skipSync });
      break;
    }
    default:
      return false;
  }
  if (code !== 0) process.exit(code);
  return true;
}