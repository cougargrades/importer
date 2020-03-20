
import path from 'path';

import { API } from './api';
import { UploaderProvider } from './providers';

import express from 'express';
import { UI } from 'bull-board';
import getPort from 'get-port';
import open from 'open';

export class App {
    csvFiles: string[];
    uploaderProvider: UploaderProvider;

    constructor(options: AppOptions) {
        // Initialize data streams
        this.csvFiles = options.csvFiles || [];
        this.uploaderProvider = new UploaderProvider({
            api: options.api || new API(),
            csvFiles: options.csvFiles || [],
            redis: options.redis || 'redis://127.0.0.1:6379'
        });
    }

    async start(): Promise<void> {
        console.log('Starting application!')
        // Setup UI
        const app = express()
        const port = await getPort()
        app.use('/', UI)
        app.listen(port)
        console.log(`Listening on port: http://127.0.0.1:${port}`)
        await open(`http://127.0.0.1:${port}`)
        console.log('Launched bull-board in browser')

        let i = 1;
        let n = this.uploaderProvider.totalRecords;
        this.uploaderProvider.each((res) => {
            i++;    
            let message = `${(i/n * 100).toFixed(2)}% --- (${i} of ${n})`
            console.log(message)
        })
    }
}

export interface AppOptions {
    api?: API;
    csvFiles?: string[];
    redis?: string;
}