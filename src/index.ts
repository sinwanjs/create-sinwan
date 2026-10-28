#!/usr/bin/env node
import { createProgram } from "./cli.ts";

await createProgram().parseAsync(process.argv);
