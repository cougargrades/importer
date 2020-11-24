import fs from 'fs'
import path from 'path'
import parse from 'csv-parse'
import { GradeDistributionCSVRow } from '@cougargrades/types/dist/GradeDistributionCSVRow'

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
        if (err) {
          reject(err)
        }
        else {
          // for every record
          for (let i = 0; i < records.length; i++) {
            // convert column names that have spaces to underscores
            for (let key of Object.keys(records[i])) {
              let sanitized_key = key.replace(/ /g, '_');
              if (sanitized_key !== key) {
                records[i][sanitized_key] = records[i][key];
                delete records[i][key];
              }
            }
          }

          const is_nullish = (x: any) => x === null || x === undefined || x === '' || isNaN(parseInt(x));

          // read the rows into the typed object
          let formatted: GradeDistributionCSVRow[] = [];
          for (let item of records) {
            formatted.push({
              TERM: item['TERM'],
              SUBJECT: item['SUBJECT'],
              CATALOG_NBR: item['CATALOG_NBR'],
              CLASS_SECTION: parseInt(item['CLASS_SECTION']),
              COURSE_DESCR: item['COURSE_DESCR'],
              INSTR_LAST_NAME: item['INSTR_LAST_NAME'],
              INSTR_FIRST_NAME: item['INSTR_FIRST_NAME'],
              A: is_nullish(item['A']) ? 0 : parseInt(item['A']),
              B: is_nullish(item['B']) ? 0 : parseInt(item['B']),
              C: is_nullish(item['C']) ? 0 : parseInt(item['C']),
              D: is_nullish(item['D']) ? 0 : parseInt(item['D']),
              F: is_nullish(item['F']) ? 0 : parseInt(item['F']),
              TOTAL_DROPPED: is_nullish(item['TOTAL_DROPPED']) ? 0 : parseInt(item['TOTAL_DROPPED']),
              AVG_GPA: is_nullish(item['AVG_GPA']) ? 0 : parseInt(item['AVG_GPA'])
            });
          }
          // send it off
          resolve(formatted);
        }
      })
      fs.createReadStream(path.resolve(this.filePath)).pipe(parser)
    })
  }
}