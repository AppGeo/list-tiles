#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const TileGenerator = require('./');
const fs = require('fs');
const argv = yargs(hideBin(process.argv))
  .alias('v', 'version')
  .alias('h', 'help')
  .alias('m', 'min-depth')
  .number('m')
  .describe('m', 'lowest resolution tile depth to enumerate')
  .alias('M', 'max-depth')
  .number('M')
  .describe('M', 'highest resolution tile depth to enumerate')
  .alias('t', 'template')
  .describe('t', 'tile template to use for formatting')
  .default('t', '/{z}/{x}/{y}')
  .string('t')
  .demandCommand(1)
  .example('$0 <options> path/to/file.geojson > out.csv')
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
genrator.pipe(process.stdout);
