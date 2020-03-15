#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = __importDefault(require("commander"));
const figlet_1 = __importDefault(require("figlet"));
const packagejson = require('../package.json');
console.log(chalk_1.default.cyan(figlet_1.default.textSync('importer')));
commander_1.default
    .version(packagejson.version)
    .description(packagejson.description)
    .option('-p, --peppers', 'Add peppers')
    .option('-P, --pineapple', 'Add pineapple')
    .option('-b, --bbq', 'Add bbq sauce')
    .option('-c, --cheese <type>', 'Add the specified type of cheese [marble]')
    .option('-C, --no-cheese', 'You do not want any cheese')
    .parse(process.argv);
if (!process.argv.slice(2).length) {
    commander_1.default.outputHelp();
    process.exit(0);
}
