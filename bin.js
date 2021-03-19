#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { createGzip } = require('zlib');
const TileGenerator = require('./');
const fs = require('fs');
const argv = yargs(hideBin(process.argv))
  .alias('v', 'version')
  .alias('h', 'help')
  .alias('m', 'min-depth')
  .number('m')
  .describe('m', 'lowest resolution tile depth to list')
  .default('m', 6)
  .alias('M', 'max-depth')
  .number('M')
  .describe('M', 'highest resolution tile depth to list')
  .default('M', 20)
  .alias('t', 'template')
  .describe('t', 'tile template to use')
  .default('t', '/{z}/{x}/{y}')
  .string('t')
  .alias('g', 'gzip')
  .describe('g', 'use gzip to compress output')
  .boolean('g')
  .demandCommand(1)
  .example('$0 <options> path/to/file.geojson > out.csv')
  .example('$0 -g file.json > out.csv.gz', 'use the built in gzip')
  .example('$0 file.json | gzip > out.csv.gz', 'use the system gzip, probably faster')
  .example('$0 -M 16 -t something/{z}/{y}/{x}.jpeg -- my-file.geojson > out.csv')
  .argv;

try {
  var txt = fs.readFileSync(argv._[0]);
} catch(e) {
  console.error(`no such file "${argv[0]}"`);
  process.exit(2);
}
try {
  var json = JSON.parse(txt);
} catch (e) {
  console.error('invalid json object');
  process.exit(3);
}
const genrator = new TileGenerator(json, argv.M, argv.m, argv.t);
if (argv.g) {
  genrator.pipe(createGzip({
    level: 9
  })).pipe(process.stdout)
} else {
  genrator.pipe(process.stdout);
}
