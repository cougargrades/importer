import fs from 'fs'
import path from 'path'
import readline from 'readline'
import parse from 'csv-parse'

export class CSVReader {
    filePath: string;
    numberOfLines: number;
    constructor(filePath: string) {
        this.filePath = filePath;
        this.numberOfLines = fs.readFileSync(this.filePath).toString().split('\n').length // sorta hacky
    }
    
    async eachRow(callback: (row: object) => any) {
        const parser = parse({
            columns: true
        })
        fs.createReadStream(path.resolve(this.filePath)).pipe(parser)

        for await (const record of parser) {
            callback(record)
        }
    }
}