
import { API } from "./api";
import { CSVReader } from './reader';

export class UploaderProvider {
    public api: API;
    public readers: CSVReader[];
    public totalRecords: number = 0;
    public uploadedRecords: number = 0;
    private callback: any;

    constructor(csvFiles: string[]) {
        this.api = new API(process.env.ACCESS_TOKEN, true);
        this.readers = csvFiles.map(e => new CSVReader(e))
        for(let reader of this.readers) {
            this.totalRecords += (reader.numberOfLines - 1); // don't include header row
        }
    }

    each(callback: (data: any, filePath: any) => any) {
        for(let reader of this.readers) {
            reader.eachRow(async (row) => {
                try {
                    callback(await this.api.put('/private/CSV', row), reader.filePath)
                    this.uploadedRecords++;

                    if(this.uploadedRecords === this.totalRecords) {
                        process.exit(0)
                    }
                }
                catch(err) {
                    console.error(err)
                }
            })
        }
    }
}