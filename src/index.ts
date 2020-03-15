#!/usr/bin/env node
import 'dotenv/config'

import chalk from 'chalk'
import program from 'commander'
import figlet from 'figlet'

import { UI } from './ui'

const packagejson = require('../package.json')

program
    .version(packagejson.version)
    .description(packagejson.description)
    .arguments('<csv...>')
    .option('--host <url>','Use this host instead of the default.', '<none>')
    .action(csv => {
        const ui = new UI(csv);
        if(program.host !== '<none>') {
            ui.uploaderProvider.api.baseUrl = program.host;
        }
        ui.render();
    })
    .parse(process.argv);

if(!process.argv.slice(2).length) {
    console.log(chalk.cyan(figlet.textSync('importer')))
    program.outputHelp()
    process.exit(0)
}
