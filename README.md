list-tiles
===

takes a .geojson and emits a list of all tiles that intersect it separated by new
lines down to the specified max zoom.

Useful if you want to download a bunch of tiles from s3 or something.

```bash
Options:
  -m, --min-depth  lowest resolution tile depth to enumeriate           [number]
  -M, --max-depth  highest resolution tile depth to enumeriate          [number]
  -t, --template   tile template to use for formating
                                              [string] [default: "/{z}/{x}/{y}"]
  -v, --version    Show version number                                 [boolean]
  -h, --help       Show help                                           [boolean]

Examples:
  list-tiles <options> path/to/file.geojson > out.csv
```
