import os from 'os';
import fs from 'fs';
import util from 'util';
import readline from 'readline';

import { API } from './api';
import { UploaderProvider } from './providers';
import { MultiBar, SingleBar, Presets } from 'cli-progress';
import { snooze } from '@au5ton/snooze';

import express from 'express';
import { UI } from 'bull-board';
import getPort from 'get-port';
import open from 'open';

import chalk from 'chalk';
import { Server } from 'http';
const info = chalk.grey
const success = chalk.greenBright.bold;
const pretty = chalk.cyanBright.bold;

export class App {
  csvFiles: string[];
  patchFiles: string[][];
  uploaderProvider: UploaderProvider;
  server?: Server;
  headless: boolean;
  localPort: number;

  constructor(options: AppOptions) {
    // Initialize data streams
    this.csvFiles = options.csvFiles || [];
    this.patchFiles = options.patchFiles || [];
    this.uploaderProvider = new UploaderProvider({
      api: options.api || new API(),
      csvFiles: options.csvFiles || [],
      redis: options.redis || 'redis://127.0.0.1:6379',
      jobs: options.jobs || os.cpus().length
    });
    this.headless = options.headless;
    this.localPort = options.localPort || 0;
  }

  async start(): Promise<void> {
    console.log(info('Starting application!'))
    // Setup UI
    const app = express()
    this.localPort = this.localPort || await getPort();
    app.use('/', UI)
    this.server = app.listen(this.localPort)
    
    console.log(info(`Listening on port: http://127.0.0.1:${this.localPort}`))
    if(!this.headless) {
        await open(`http://127.0.0.1:${this.localPort}`)
        console.log(info('Launched bull-board in browser'))
    }

    let i = 1
    let n = this.uploaderProvider.totalRecords;
    console.log(info('Copying rows to Bull/Redis for processing. Inspect upload progress there.'))
    const start_time = new Date();
    let mbars = new MultiBar({
      format: '{percentage}% |{bar}| {value}/{total} | ETA: {eta}s | Elapsed: {duration}s',
      fps: 30,
      clearOnComplete: false,
      hideCursor: false
    }, Presets.shades_classic)
    let pbar_copy   = mbars.create(n, 0, {});
    let pbar_upload = mbars.create(n, 0, {});
    this.uploaderProvider.allRows((res) => {
      pbar_copy.increment(1, { filename: 'copy to Bull/Redis' })
      i++
    })

    for(;;) {
      let remaining = await this.uploaderProvider.queue.count()
      pbar_upload.update(n - remaining, { filename: 'Bull/Redis queue progress' })
      if(remaining === 0 && i >= n) {
        mbars.stop()
        const delta = new Date().valueOf() - start_time.valueOf()
        const rate = n / (delta / 1000)
        console.log(success(
          `Upload finished in ${App.getRelativeTime(delta)} (${(delta/1000).toFixed(3)} seconds).\n` +
          `The average rate was ${rate.toFixed(2)} rows/second.`
          ))
        break;
      }
    }

    function waitForUser(query: string) {
      const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
      });

      return new Promise(resolve => rl.question(query, ans => {
          rl.close();
          resolve(ans);
      }))
    }

    console.log('Waiting for serverside queue to empty...');
    // Wait for serverside queue to empty
    while(await this.uploaderProvider.getServerQueueSize() === 0) {
      await snooze(5000);
    }
    console.log('Serverside queue has emptied!');

    //await waitForUser('Please wait for all of upload_queue to process before executing patchfiles. Press [Enter] to continue.');

    console.log(pretty('Executing patch files ...'));
    for(let item of this.patchFiles.flat()) {
      this.uploaderProvider.queue.add(JSON.parse(fs.readFileSync(item, { encoding: 'utf8' })), {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });
    }
  }

  // see: https://stackoverflow.com/a/8212878
  static getRelativeTime(ms: number): string {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();
  
    function numberEnding (num: number) {
      return (num > 1) ? 's' : '';
    }
  
    var temp = Math.floor(ms / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
      return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
      return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
      return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
      return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
      return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
  }
}

export interface AppOptions {
    api?: API;
    csvFiles?: string[];
    patchFiles?: string[][];
    redis?: string;
    jobs?: number;
    headless: boolean;
    localPort: number;
}