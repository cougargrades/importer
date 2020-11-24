import os from 'os';
import fs, { read } from 'fs';
import path from 'path';
import util from 'util';
import tar from 'tar';

export interface ExtractDetails {
  root: string;
  csvFiles: string[];
  patchFiles: string[][];
}

export async function extract(location: string): Promise<ExtractDetails> {
  // create promise-based versions of stdlib
  const mkdtemp = util.promisify(fs.mkdtemp);
  const readdir = util.promisify(fs.readdir);
  // create temporary directory
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'io.cougargrades.importer'));
  // extract to temporary directory
  await tar.extract({
    file: location,
    cwd: tempDir
  })

  // create Patchfile nested structure
  let patchFiles = [];
  let allPatches = await readdir(path.join(tempDir, 'io.cougargrades.publicdata.patch'));
  allPatches.filter(e => e.endsWith('.json')).sort()
  let subsectionUpperBound = parseInt(allPatches.reverse()[0].split('-')[1]);
  for(let i = 0; i <= subsectionUpperBound; i++) {
    patchFiles.push(allPatches.filter(e => e.split('-')[1] === `${i}`))
  }

  for(let i = 0; i < patchFiles.length; i++) {
    for(let j = 0; j < patchFiles[i].length; j++) {
      patchFiles[i][j] = path.join(path.join(tempDir, 'io.cougargrades.publicdata.patch', patchFiles[i][j]));
    }
  }

  return {
    root: tempDir,
    csvFiles: (await readdir(path.join(tempDir, 'edu.uh.grade_distribution'))).filter(e => e.endsWith('.csv')).map(e => path.join(tempDir, 'edu.uh.grade_distribution', e)),
    patchFiles: patchFiles,
  };
}

export async function cleanup(location: string) {
  console.log(`Cleaning up: ${location}`);
  const rmdir = util.promisify(fs.rmdir);

  await rmdir(location, { recursive: true });
}
