import contrib from 'blessed-contrib';

import { API } from "./api";
import { CSVReader } from './reader';

export class LineDataProvider {
    private api: API;
    private lineData: any;
    private timer: NodeJS.Timer;
    private pollingRate: number; // default is 1000ms
    private callback: any;
    constructor(callback: (meta: any, lineData: contrib.Widgets.LineData) => any, pollingRate: number = 1000) {
        this.api = new API(process.env.ACCESS_TOKEN, true);

        this.lineData = {
            title: 'Graph',
            x: new Array(600).fill(0).map((val, i) => (new Date).valueOf() - i*this.pollingRate).map(e => new Date(e).toLocaleTimeString()), // fill with Date strings in descending order
            y: new Array(600).fill(0)
        }
        this.pollingRate = pollingRate;
        this.api.post('/private/queue');
        this.timer = setInterval(this.onInterval.bind(this), this.pollingRate);
        this.callback = callback;
    }

    onInterval(): void {
        this.api.get('/private/queue').then(meta => {
            // Adjust X-axis live
            this.lineData.x.splice(0, 1) // remove first element
            this.lineData.x.push(new Date().toLocaleTimeString())
            // Adjust Y-axis live
            this.lineData.y.splice(0, 1) // remove first element
            this.lineData.y.push(meta.current_size)
            // send back
            this.callback(meta, this.lineData)
        }).catch(err => console.log(err))
    }

    getLineData(): contrib.Widgets.LineData {
        return this.lineData;
    }
}

export class UploaderProvider {
    private api: API;
    private callback: any;
    private readers: CSVReader[];
    public totalRecords: number = 0;
    public uploadedRecords: number = 0;

    constructor(csvFiles: string[]) {
        this.api = new API(process.env.ACCESS_TOKEN, true);
        this.readers = csvFiles.map(e => new CSVReader(e))
        for(let reader of this.readers) {
            this.totalRecords += (reader.numberOfLines - 1); // don't include header row
        }
    }

    each(callback: (data: any) => any) {
        for(let reader of this.readers) {
            reader.eachRow(async (row) => {
                callback(await this.api.put('/private/CSV', row))
                this.uploadedRecords++;
            })
        }
    }
}