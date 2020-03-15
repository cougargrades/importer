
import chalk from 'chalk'

import blessed from 'blessed';
import contrib from 'blessed-contrib'

import { CSVReader } from './reader'
import { API } from './api'
import { LineDataProvider, UploaderProvider } from './providers';

const packagejson = require('../package.json')

export class UI {
    csvFiles: string[];
    lineProvider: LineDataProvider;
    uploaderProvider: UploaderProvider;
    
    screen: blessed.Widgets.Screen;
    line: any;
    log: any;

    constructor(csvFiles: string[]) {
        // Initialize data streams
        this.csvFiles = csvFiles;
        this.lineProvider = new LineDataProvider(this.onRealTimeUpdate.bind(this), 5000);
        this.uploaderProvider = new UploaderProvider(csvFiles);

        // Setup UI
        this.screen = blessed.screen({
            smartCSR: true
        });
        this.screen.title = packagejson.name;
        this.screen.key(['escape', 'q', 'C-c'], function(ch: any, key: any) {
            return process.exit(0);
        });
    }

    onRealTimeUpdate(meta:any, data: any): void {
        this.log.log(chalk.yellow(`upload_queue_meta: ${meta}`))
        //let latestEntry = data.x[data.x.length-1];
        //this.line.setData(data);
        //this.log.log(latestEntry);
    }

    draw(): void {
        this.line = contrib.line({
            top: 0,
            left: 'center',
            width: '100%',
            height: '50%',
            style: {
                line: 'yellow',
                text: 'green',
                baseline: 'black'
            },
            border: {
                type: 'line'
            },
            wholeNumbersOnly: true,
            label: 'Pending Imports'
        })
        this.screen.append(this.line)

        this.log = contrib.log({
            bottom: 0,
            left: 'center',
            width: '100%',
            height: '80%',
            fg: 'green',
            selectedFg: 'green',
            label: 'Import Log',
            border: {
                type: 'line'
            },
        });

        this.uploaderProvider.each((res) => {
            
            let i = this.uploaderProvider.uploadedRecords;
            let n = this.uploaderProvider.totalRecords;
            let message = `${i/n * 100}% --- ${res.data} (${i} of ${n})`

            if(res.success) {
                this.log.log(chalk.cyan(message))
            }
            else {
                this.log.log(chalk.redBright(message))
            }
        })
        
        // Append our box to the screen.
        this.screen.append(this.log);
    }
    
    render(): void {
        this.draw()
        this.screen.render()
    }
}