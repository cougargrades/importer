#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = __importDefault(require("commander"));
const figlet_1 = __importDefault(require("figlet"));
const ui_1 = require("./ui");
const packagejson = require('../package.json');
commander_1.default
    .version(packagejson.version)
    .description(packagejson.description)
    .arguments('<csv...>')
    .action(csv => {
    const ui = new ui_1.UI(csv);
    ui.render();
})
    .parse(process.argv);
if (!process.argv.slice(2).length) {
    console.log(chalk_1.default.cyan(figlet_1.default.textSync('importer')));
    commander_1.default.outputHelp();
    process.exit(0);
}
