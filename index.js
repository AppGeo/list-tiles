const SphericalMercator = require('@mapbox/sphericalmercator');
const merc = new SphericalMercator({
    size: 256
});
const IterStream = require('./stream');
const getBoundingBox= require('@turf/bbox').default;
const tilebelt = require('@mapbox/tilebelt');
const geojsonvt = require('geojson-vt');
const checkFeatures = require('./check-feature')
const EMPTY_ARRAY = [];
const DEFAULT_TEMPLATE = '/{z}/{x}/{y}'
class Result {
  constructor(done, value) {
    this.done = done;
    this.value = value;
  }
}
class TileGenerator {
  constructor(json, maxDepth=20, minDepth=6, template=DEFAULT_TEMPLATE){
    this.maxDepth = maxDepth;
    this.minDepth = minDepth;
    this.template = template;
    this.index = geojsonvt(json, { maxZoom: maxDepth });
    this.queue = [];
    this.populateQueue(json);
    if (this.template === DEFAULT_TEMPLATE) {
      this.format = this._format;
    }
  }
  populateQueue(json) {
    let bbox = json.bbox;
    if (!bbox) {
      bbox = getBoundingBox(json)
    }

    const {minX, minY, maxX, maxY} =  merc.xyz(bbox, this.minDepth);
    let x = minX -1 ;
    while (++x < maxX) {
      let y = minY - 1;
      while (++y < maxY) {
        const outline = this.index.getTile(this.minDepth, x, y);
        if (outline && outline.features && outline.features.length) {
          this.queue.push([x, y, this.minDepth])
        }
      }
    }
  }
  next() {
    if (!this.queue.length) {
      return new Result(true);
    }
    const tile = this.queue.pop();
    const children = this.getChildren(tile);
    if (children.length) {
       this.queue.push(...children);
    }
    return new Result(false, this.format(tile))
  }
  getChildren(tile) {
    if (tile[2] === this.maxDepth) {
      return EMPTY_ARRAY;
    }
    const children = tilebelt.getChildren(tile);

    if (tile.length > 3 && tile[3]) {
      for (const child of children) {
        child.push(true);
      }
      return children;
    }
    const out = [];
    for (const child of children) {
      const outline = this.index.getTile(child[2], child[0], child[1]);
      if (!outline || !outline.features || !outline.features.length) {
        // outside
        continue;
      }
      const rings = checkFeatures(outline.features);
      if (!rings || !rings.length) {
        child.push(true);
      }
      out.push(child);
    }
    return out;
  }
  _format(tile) {
    return `/${tile[2]}/${tile[0]}/${tile[1]}`;
  }
  format(tile) {
    return this.template
        .replace('{x}', tile[0])
        .replace('{y}', tile[1])
        .replace('{z}', tile[2]);
  }
  [Symbol.iterator]() {
    return this;
  }
  stream() {
    return new IterStream(this);
  }
  pipe(...args) {
    return this.stream().pipe(...args);
  }
}
module.exports = TileGenerator;
