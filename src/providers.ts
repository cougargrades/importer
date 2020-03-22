
import os from 'os';
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

    constructor(options: UploaderProviderOptions) {
        this.api = options.api;
        this.readers = options.csvFiles.map(e => new CSVReader(e))
        for(let reader of this.readers) {
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

        const x = this.cpuCount()
        console.log(note(`Bull concurrency set to ${x}`))

        this.queue.process(x, async (job: any) => {
            return await this.api.put('/private/CSV', job.data)
        })
    }

    cpuCount(): number {
        const cpu_count = os.cpus().length
        const cpus = Array.from(new Set(os.cpus().map(e => e.model)))
        console.log(info(`Logical cores: ${cpu_count}`))
        if(cpus.length === 1) {
            console.log(info(`Detected CPU: ${cpus[0]}`))
        }
        else {
            console.log(info(`Detected CPUs:`))
            for(let proc of cpus) {
                console.log(`\t- ${proc}`)
            }
        }

        return os.cpus().length
    }

    each(callback: (data: any) => any) {
        for(let reader of this.readers) {
            reader.eachRow(async (row) => {
                let job = await this.queue.add(row, {
                    attempts: 5,
                    backoff: {
                        type: 'fixed',
                        delay: 5000
                    }
                })
                callback(job)
            })
        }
    }
}

export interface UploaderProviderOptions {
    api: API;
    csvFiles: string[];
    redis: string;
}