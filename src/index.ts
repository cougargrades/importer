#!/usr/bin/env node

import chalk from 'chalk'
import program from 'commander'
import figlet from 'figlet'

const packagejson = require('../package.json')

console.log(chalk.cyan(figlet.textSync('importer')))

program
    .version(packagejson.version)
    .description(packagejson.description)
    .option('-p, --peppers', 'Add peppers')
    .option('-P, --pineapple', 'Add pineapple')
    .option('-b, --bbq', 'Add bbq sauce')
    .option('-c, --cheese <type>', 'Add the specified type of cheese [marble]')
    .option('-C, --no-cheese', 'You do not want any cheese')
    .parse(process.argv);

if(!process.argv.slice(2).length) {
    program.outputHelp()
    process.exit(0)
}
