import fs from 'fs'
import path from 'path'
import parse from 'csv-parse'

export class CSVReader {
    filePath: string;
    numberOfLines: number;
    constructor(filePath: string) {
        this.filePath = filePath;
        this.numberOfLines = fs.readFileSync(this.filePath).toString().split('\n').length // sorta hacky
    }
    
    // old way, can have weird race conditions upstream
    async eachRow(callback: (row: object) => any) {
        const parser = parse({
            columns: true
        })
        fs.createReadStream(path.resolve(this.filePath)).pipe(parser)

        for await (const record of parser) {
            callback(record)
        }
    }

    allRows(): Promise<object[]> {
        return new Promise((resolve, reject) => {
            const parser = parse({
                columns: true
            }, (err, records) => {
                if(err) {
                    reject(err)
                }
                else {
                    // for every record
                    for(let i = 0; i < records.length; i++) {
                        // convert column names that have spaces to underscores
                        for(let key of Object.keys(records[i])) {
                            let sanitized_key = key.replace(/ /g, '_');
                            if(sanitized_key !== key) {
                                records[i][sanitized_key] = records[i][key];
                                delete records[i][key];
                            }
                        }
                    }
                    // send it off
                    resolve(records)
                }
            })
            fs.createReadStream(path.resolve(this.filePath)).pipe(parser)
        })
    }
}