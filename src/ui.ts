
import path from 'path';
import * as cliProgress from 'cli-progress';

import { UploaderProvider } from './providers';

export class UI {
    csvFiles: string[];
    uploaderProvider: UploaderProvider;
    multibar: cliProgress.MultiBar;
    bars: Map<string, cliProgress.SingleBar>;

    constructor(csvFiles: string[]) {
        // Initialize data streams
        this.csvFiles = csvFiles;
        this.uploaderProvider = new UploaderProvider(csvFiles);
        
        // Setup UI
        this.multibar = new cliProgress.MultiBar({
            clearOnComplete: false,
            hideCursor: false
        }, cliProgress.Presets.shades_classic)
        this.bars = new Map<string, cliProgress.SingleBar>();

        // create the progress bars
        for(let file of csvFiles) {
            let reader = this.uploaderProvider.readers.filter(e => path.basename(e.filePath) === path.basename(file))[0]
            this.bars.set(path.basename(file), this.multibar.create(reader.numberOfLines - 1, 0, undefined));
        }
    }

    render(): void {
        this.uploaderProvider.each((res, filePath) => {
            this.bars.get(path.basename(filePath))?.increment(1, { filename: path.basename(filePath) });

            // let i = this.uploaderProvider.uploadedRecords;
            // let n = this.uploaderProvider.totalRecords;
            // let message = `${i/n * 100}% --- ${res.data} (${i} of ${n})`
        })
    }
}