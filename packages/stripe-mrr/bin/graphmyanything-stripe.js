#!/usr/bin/env node
import { runCli } from "../dist/cli/main.js";

runCli().then((code) => process.exit(code));