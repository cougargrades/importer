
import { API } from "./api";
import { CSVReader } from './reader';

const Queue = require('bull')
import { setQueues } from 'bull-board';

export class UploaderProvider {
    public api: API;
    public readers: CSVReader[];
    public totalRecords: number = 0;
    public uploadedRecords: number = 0;
    public queue: any;

    constructor(options: UploaderProviderOptions) {
        this.api = options.api;
        this.readers = options.csvFiles.map(e => new CSVReader(e))
        for(let reader of this.readers) {
            this.totalRecords += (reader.numberOfLines - 1); // don't include header row
        }
        // Limit queue to max 1.000 jobs per 5 seconds
        this.queue = new Queue('@cougargrades/importer', {
            limiter: {
                max: 20,
                duration: 5000
            },
            redis: options.redis
        });
        setQueues([this.queue]);

        this.queue.process(async (job: any) => {
            return await this.api.put('/private/CSV', job.data)
        })
    }

    each(callback: (data: any) => any) {
        for(let reader of this.readers) {
            reader.eachRow(async (row) => {
                let job = await this.queue.add(row)
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