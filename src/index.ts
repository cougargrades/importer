#!/usr/bin/env node
import os from 'os'

import chalk from 'chalk'
import program from 'commander'

import { App } from './app'
import { API } from './api'
import * as bundle from './bundle';

const packagejson = require('../package.json')
const info = chalk.grey
const error = chalk.redBright
const success = chalk.greenBright.bold;

program
  .version(packagejson.version)
  .description(packagejson.description)
  .arguments('<bundle.tar.gz>')
  .option('--remotehost <url>','Use this host instead of the default.', '<none>')
  .option('--localport <port>', 'Use this host instead of the default.', '<none>')
  .option('--verify', 'When enabled, only validate the access token and exit.', false)
  .option('--jobs <integer>', 'Number of concurrent uploads to make. Defaults to # of CPU cores.', `${os.cpus().length}`)
  .option('--verbose', 'When enabled, certain logging will be more verbose.', false)
  .option('--redis <connection>', 'Redis information', 'redis://127.0.0.1:6379')
  .option('--token <access_token>','Specify your access token for upload permissions. Must have permissions to use: `PUT /api/private/CSV`. This can also be specified with the ACCESS_TOKEN environment variable.',`<none>`)
  .option('--headless', 'When enabled, a browser won\'t be opened to the job management page.')
  .action(async file => {
    let api = new API(program.token, true);
    if(program.remotehost !== '<none>') {
      api.baseUrl = program.remotehost;
    }
    if(program.token !== '<none>') {
      api.accessToken = program.token;
    }
    else if(process.env.ACCESS_TOKEN && process.env.ACCESS_TOKEN.length > 0 && process.env.ACCESS_TOKEN !== '<none>') {
      api.accessToken = process.env.ACCESS_TOKEN;
    }
    if(program.verbose) console.log(info(`Checking token: ${api.accessToken}`))
    let serverToken = await api.self();
    if(serverToken === null) {
      console.log(error('This access token is invalid, or did not have permissions to access `GET /private/tokens/self`.'))
      process.exit(1)
    }
    else {
      console.log(success('This access token has been validated.'))
      if(program.verify) {
        console.log(serverToken)
        process.exit(0)
      } 
    }

    const details = await bundle.extract(file)    
    const app = new App({
      api: api,
      csvFiles: details.csvFiles,
      patchFiles: details.patchFiles,
      redis: program.redis,
      jobs: parseInt(program.jobs),
      headless: program.headless,
      localPort: program.localport,
    });
    await app.start();
    await bundle.cleanup(details.root);
  })
  .parse(process.argv);
