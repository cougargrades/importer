#!/usr/bin/env node

import chalk from 'chalk'
import program from 'commander'
import figlet from 'figlet'

import { UI } from './ui'

const packagejson = require('../package.json')

program
    .version(packagejson.version)
    .description(packagejson.description)
    .arguments('<csv...>')
    .action(csv => {
        const ui = new UI(csv);
        ui.render();
    })
    .parse(process.argv);

if(!process.argv.slice(2).length) {
    console.log(chalk.cyan(figlet.textSync('importer')))
    program.outputHelp()
    process.exit(0)
}
