list-tiles
===

takes a .geojson and emits a list of all tiles that intersect it separated by new
lines down to the specified max zoom.

Useful if you want to download a bunch of tiles from s3 or something.

```bash
Options:
  -m, --min-depth  lowest resolution tile depth to enumerate           [number]
  -M, --max-depth  highest resolution tile depth to enumerate          [number]
  -t, --template   tile template to use for formatting
                                              [string] [default: "/{z}/{x}/{y}"]
  -g, --gzip       use gzip to compress output                         [boolean]
  -v, --version    Show version number                                 [boolean]
  -h, --help       Show help                                           [boolean]

Examples:
  list-tiles <options> path/to/file.geojson > out.csv
  list-tiles -M 20 -g my-file.geojson > out.csv.gz
  list-tiles -M 20 my-file.geojson | gzip > out.csv.gz
  list-tiles -M 16 -t something/{z}/{y}/{x}.jpeg my-file.geojson > out.csv
```

API usage
===

```js
const tileGenerator = new ListTiles(json, [ maxDepth=20, minDepth=6, template='/{z}/{x}/{y}']);
// tileGenerator is an iterable so you can do
for (const tile of tileGenerator) {
  console.log(tile);
}
// but apparently this can lead to memory leaks if you pipe the output to the wrong things so you might want to do what we do in bin.js

tileGenerator.pipe(process.stdout)

// or get the underlying readalbe stream with
tileGenerator.stream();
```
