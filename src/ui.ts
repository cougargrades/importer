
import blessed from 'blessed';
import contrib from 'blessed-contrib'

import { CSVReader } from './reader'
import { API } from './api'

const packagejson = require('../package.json')

export class UI {
    csvFiles: string[];
    screen: blessed.Widgets.Screen;

    constructor(csvFiles: string[]) {
        this.csvFiles = csvFiles;
        this.screen = blessed.screen({
            smartCSR: true
        });
        this.screen.title = packagejson.name;
        this.screen.key(['escape', 'q', 'C-c'], function(ch: any, key: any) {
            return process.exit(0);
        });
    }

    draw(): void {
        // Create a box perfectly centered horizontally and vertically.
        // var box = blessed.box({
        //     top: 'center',
        //     left: 'center',
        //     width: '50%',
        //     height: '50%',
        //     content: 'Hello {bold}world{/bold}!',
        //     tags: true,
        //     border: {
        //         type: 'line'
        //     },
        //     style: {
        //         fg: 'white',
        //         bg: 'magenta',
        //         border: {
        //             fg: '#f0f0f0'
        //         },
        //         hover: {
        //             bg: 'green'
        //         }
        //     }
        // });

        const line = contrib.line({
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
        this.screen.append(line)
        line.setData([{
            x: ['t1', 't2', 't3', 't4'],
            y: [5, 1, 7, 5]
        }])

        const log = contrib.log({
            bottom: 0,
            left: 'center',
            width: '100%',
            height: '50%',
            fg: 'green',
            selectedFg: 'green',
            label: 'Import Log',
            border: {
                type: 'line'
            },
        });

        log.log("new log line");
        
        // Append our box to the screen.
        this.screen.append(log);
    }
    
    render(): void {
        this.draw()
        this.screen.render()
    }
}