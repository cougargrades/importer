
import chalk from 'chalk';

import { API } from "./api";
import { CSVReader } from './reader';

const Queue = require('bull')
import Bull from 'bull';
import { setQueues } from 'bull-board';

const info = chalk.grey
const note = chalk.cyanBright;

export class UploaderProvider {
  public api: API;
  public readers: CSVReader[];
  public totalRecords: number = 0;
  public uploadedRecords: number = 0;
  public queue: Bull.Queue;
  public jobs: number;

  constructor(options: UploaderProviderOptions) {
    this.jobs = options.jobs;
    this.api = options.api;
    this.readers = options.csvFiles.map(e => new CSVReader(e))
    for (let reader of this.readers) {
      this.totalRecords += (reader.numberOfLines - 1); // don't include header row
    }
    this.queue = new Queue('@cougargrades/importer', {
      // limiter: {
      //     max: 100, // limit to 100 jobs
      //     duration: 5000 // every 5 seconds
      // },
      redis: options.redis
    });
    this.queue.clean(1, 'completed')
    this.queue.clean(1, 'wait')
    this.queue.clean(1, 'active')
    this.queue.clean(1, 'delayed')
    this.queue.clean(1, 'failed')
    setQueues([this.queue]);

    console.log(note(`Bull concurrency set to ${this.jobs}`))

    this.queue.process(this.jobs, async (job: Bull.Job) => {
      if(job.data['format'] === 'io.cougargrades.publicdata.patch') {
        let res = await this.api.post('/private/Patchfile', job.data);
        if (res.status === 200) {
          return await res.text()
        }
        else {
          await job.moveToFailed({ message: await res.text() })
        }
      }
      else {
        let res = await this.api.put('/private/GradeDistributionCSVRow', job.data);
        if (res.status === 200) {
          return await res.json()
        }
        else {
          await job.moveToFailed({ message: await res.text() })
        }
      }
    })
  }

  async allRows(callback: (data: Bull.Job<any>) => void) {
    // literally load every row into memory like a fucking madlad
    const payload = await Promise.all(this.readers.map(e => e.allRows()));
    for (let row of payload.flat()) {
      // add to redis synchronously (dont risk failed transfers)
      callback(
        await this.queue.add(row, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        })
      )
    }
    return
  }
}

export interface UploaderProviderOptions {
  api: API;
  csvFiles: string[];
  redis: string;
  jobs: number;
}