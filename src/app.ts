import os from 'os';
import fs from 'fs';
import util from 'util';

import { API } from './api';
import { UploaderProvider } from './providers';
import { MultiBar, SingleBar, Presets } from 'cli-progress';

import express from 'express';
import { UI } from 'bull-board';
import getPort from 'get-port';
import open from 'open';

import chalk from 'chalk';
import { Server } from 'http';
const info = chalk.grey
const success = chalk.greenBright.bold;
const pretty = chalk.cyanBright.bold;
const snooze = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class App {
  csvFiles: string[];
  patchFiles: string[][];
  uploaderProvider: UploaderProvider;
  server?: Server;

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
  }

  async start(): Promise<void> {
    console.log(info('Starting application!'))
    // Setup UI
    const app = express()
    const port = await getPort()
    app.use('/', UI)
    this.server = app.listen(port)
    
    console.log(info(`Listening on port: http://127.0.0.1:${port}`))
    await open(`http://127.0.0.1:${port}`)
    console.log(info('Launched bull-board in browser'))

    let i = 1
    let n = this.uploaderProvider.totalRecords
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

    console.log('Waiting 60 seconds to allow `upload_queue` to process first.');
    await snooze(60 * 1000);

    console.log(pretty('Executing patch files ...'));

    let patchpbar = new SingleBar({
      format: '{percentage}% |{bar}| {value}/{total} | ETA: {eta}s | Elapsed: {duration}s',
      fps: 30,
      clearOnComplete: false,
      hideCursor: false
    }, Presets.shades_classic);
    patchpbar.start(this.patchFiles.flat().length, 0);
    for(let i = 0; i < this.patchFiles.length; i++) {
      for(let j = 0; j < this.patchFiles[i].length; j++) {
        await this.uploaderProvider.api.post('/private/Patchfile', JSON.parse(fs.readFileSync(this.patchFiles[i][j], { encoding: 'utf8' })));
        patchpbar.increment();
      }
    }
    patchpbar.stop();
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
}