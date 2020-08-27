import fs from 'fs'
import path from 'path'
import parse from 'csv-parse'
import { GradeDistributionCSVRow } from '@cougargrades/types'

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

    allRows(): Promise<GradeDistributionCSVRow[]> {
        return new Promise((resolve: (value: GradeDistributionCSVRow[]) => any, reject) => {
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
                    // read the rows into the typed object
                    let formatted: GradeDistributionCSVRow[] = [];
                    for(let item of records) {
                        formatted.push(new GradeDistributionCSVRow(
                            item['TERM'],
                            item['SUBJECT'],
                            item['CATALOG_NBR'],
                            parseInt(item['CLASS_SECTION']),
                            item['COURSE_DESCR'],
                            item['INSTR_LAST_NAME'],
                            item['INSTR_FIRST_NAME'],
                            parseInt(item['A']),
                            parseInt(item['B']),
                            parseInt(item['C']),
                            parseInt(item['D']),
                            parseInt(item['F']),
                            parseInt(item['TOTAL_DROPPED']),
                            parseFloat(item['AVG_GPA'])
                        ));
                    }
                    // send it off
                    resolve(formatted);
                }
            })
            fs.createReadStream(path.resolve(this.filePath)).pipe(parser)
        })
    }
}