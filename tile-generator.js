var SphericalMercator = require('@mapbox/sphericalmercator')
var tilebelt = require('@mapbox/tilebelt');
const json= require('./urban.json');
var geojsonvt = require('geojson-vt');
const DEFAULT_MAX_DEPTH = 20;
const DEFUALT_START_ZOOM = 6;
const passedArg1 = parseInt(process.argv[2], 10);
let MAX_DEPTH = DEFAULT_MAX_DEPTH;
if (passedArg1 === passedArg1) {
  MAX_DEPTH = passedArg1;
}
const passedArg2 = parseInt(process.argv[3], 10);
let START_ZOOM = DEFUALT_START_ZOOM;
if (passedArg2 === passedArg2) {
  START_ZOOM = passedArg2;
}
var index = geojsonvt(json, { maxZoom: MAX_DEPTH });

const checkTile = (z, x, y) => {
  var output = index.getTile(z, x, y);
  return output && output.features && output.features.length;
}
const checkFeatures = (features) => {
  const out = [];
  for (const feature of features) {
    const geom = feature.geometry;
    // type 3 is a polygon, if it isn't a polygon we dont want it
    if (feature.type !== 3) {
      continue;
    }
    // if there isn't any points in the geometry we can skip it
    if (!geom.length) {
      continue;
    }
    // if the geometry is more complex then a single ring it's not a square
    // so we can use it
    if (geom.length > 1) {
      out.push(geom);
      continue;
    }
    const ring = geom[0];
    // if the ring is more complex then a simple square it's good, we can keep it
    // remember that with geojson the first point is repeated so a square has 5 points
    if (ring.length !== 5) {
      out.push([ring]);
      continue;
    }
    let safe = false;
    // check the coordinates -64 is the lowest value and
    // 4160 is the highest one
    // if all the cooridantes are one or the other then we know it's a
    // square covering the whole tile, so conversly as long as just one
    // is not one of those values it's not a pure square and it's thus
    // on the boarder
    for (const cord of ring) {
      if (cord[0] !== -64 && cord[0] !== 4160) {
        safe = true;
        break;
      }
      if (cord[1] !== -64 && cord[1] !== 4160) {
        safe = true;
        break;
      }
    }

    if (safe) {
      out.push([ring]);
    } else {
      return;
    }
  }
  return out;
};
var merc = new SphericalMercator({
    size: 256
});

class Tile {
  constructor(x, y, z, inside = false) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.inside = inside;
  }
  getChildren() {
    this.log();
    if (this.z === MAX_DEPTH) {
      return [];
    }
    if (this.z + 1 === MAX_DEPTH) {
      return this.getPenultimateChildren();
    }
    const children = tilebelt.getChildren([this.x, this.y, this.z]);

    if (this.inside) {
      return children.map(([x, y, z]) => new Tile(x, y, z, true));
    }
    const out = [];
    for (const [x, y, z] of children) {
      const outline = index.getTile(z, x, y);
      if (!outline || !outline.features || !outline.features.length) {
        // outside
        continue;
      }
      const rings = checkFeatures(outline.features);
      if (!rings || !rings.length) {
        out.push(new Tile(x, y, z, true))
      } else {
        out.push(new Tile(x, y, z))
      }
    }
    return out;
  }
  getPenultimateChildren () {
    let children = tilebelt.getChildren([this.x, this.y, this.z]);
    if (!this.inside) {
      children = children.filter(([x, y, z]) => {
        const outline = index.getTile(z, x, y);
        return outline && outline.features && outline.features.length;
      })
    }
    for (const [x, y, z] of children) {
      this._log(z, x, y)
    }
    return [];
  }
  log() {
    this._log(this.z, this.x, this.y)
  }
  _log(z, x, y) {
    console.log(`/${z}/${x}/${y}`)
  }
}

const getBounds = (zoom) => merc.xyz(json.bbox, zoom);

const queue = [];

const fillQueue = (z) => {
  const {minX, minY, maxX, maxY} = getBounds(z);
  let x = minX -1 ;
  while (++x < maxX) {
    let y = minY - 1;
    while (++y < maxY) {
      const outline = index.getTile(z, x, y);
      if (outline && outline.features && outline.features.length) {
        queue.push(new Tile(x, y, z))
      }
    }
  }
}
const handleTile = (tile) => {
  const children = tile.getChildren();
  queue.push(...children);
}
const run = () => {
  fillQueue(START_ZOOM);
  while (queue.length) {
    handleTile(queue.pop());
  }
}
run();
