# @cougargrades/importer

[![npm](https://img.shields.io/npm/v/@cougargrades/importer)](https://www.npmjs.com/@cougargrades/importer)

Imports data into cougargrades.io

Rewritten in TypeScript to supersede the original Python importer tool.

Original tool: https://github.com/cougargrades/importer-python

## Demo

not yet ;-)

## Usage

- Install the command-line tool with npm:

    `npm install -g @cougargrades/importer`

- For arguments, run:

    `cougarimport --help`

## Prerequisites
- A standalone [Redis](https://redis.io/) instance. Start one with:
    
    `docker run -d --restart unless-stopped -p 6379:6379 redis:latest `

- Node.js 10
- An `access_token` for the cougargrades.io API (v2.0.0)
