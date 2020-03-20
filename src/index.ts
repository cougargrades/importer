#!/usr/bin/env node
import 'dotenv/config'

import chalk from 'chalk'
import program from 'commander'
import figlet from 'figlet'

import { App } from './app'
import { API } from './api'

const packagejson = require('../package.json')

program
    .version(packagejson.version)
    .description(packagejson.description)
    .arguments('<csv...>')
    .option('--host <url>','Use this host instead of the default.', '<none>')
    .option('--verify','When enabled, only validate the access token and exit.', false)
    .option('--redis', 'Redis information', 'redis://127.0.0.1:6379')
    .option('--token <access_token>','Specify your access token for upload permissions. Must have permissions to use: `PUT /api/private/CSV`. This can also be specified with the ACCESS_TOKEN environment variable.','<none>')
    .action(async csv => {
        let api = new API(program.token, true);
        if(program.verify) {
            let serverToken = await api.self();
            if(serverToken === null) {
                throw "This access token is invalid, or did not have permissions to access `GET /private/tokens/self`."
            }
            console.log(serverToken)
            process.exit(0);
        }
        if(program.host !== '<none>') {
            api.baseUrl = program.host;
        }
        if(program.token !== '<none>') {
            api.accessToken = program.token;
        }

        const app = new App({
            api: api,
            csvFiles: csv,
            redis: program.redis
        });
        app.start();
    })
    .parse(process.argv);

if(!process.argv.slice(2).length) {
    console.log(chalk.cyan(figlet.textSync('importer')))
    program.outputHelp()
    process.exit(0)
}
