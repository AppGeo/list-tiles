const SphericalMercator = require('@mapbox/sphericalmercator');
const merc = new SphericalMercator({
    size: 256
});
const getBoundingBox= require('@turf/bbox').default;
const tilebelt = require('@mapbox/tilebelt');
const geojsonvt = require('geojson-vt');
const checkFeatures = require('./check-feature')
const getBoundingBox = () => {};
const EMPTY_ARRAY = [];
const DEFAULT_TEMPLATE = '/{z}/{x}/{y}'
class TileGenerator {
  constructor(json, maxDepth=20, minDepth=6, template=DEFAULT_TEMPLATE){
    this.maxDepth = maxDepth;
    this.minDepth = minDepth;
    this.template = template;
    this.index = geojsonvt(json, { maxZoom: maxDepth });
    this.queue = [];
    this.populateQueue(json);
    if (this.template === DEFAULT_TEMPLATE) {
      this.log = this._log;
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
  run () {
    while(this.queue.length) {
      const tile = this.queue.pop();
      const children = this.getChildren(tile);
      if (children.length) {
         this.queue.push(...children);
      }
    }
  }
  getChildren(tile) {
    this.log(tile);
    if (tile[2] === this.maxDepth) {
      return EMPTY_ARRAY;
    }
    if (tile[2] + 1 === this.maxDepth) {
      return this.getPenultimateChildren(tile);
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
  getPenultimateChildren (tile) {
    let children = tilebelt.getChildren(tile);
    if (tile.length === 3 || !tile[3]) {
      for (const child of children) {
        const outline = this.index.getTile(child[2], child[0], child[1]);
        if (!outline || !outline.features || !outline.features.length) {
          continue;
        }
        this.log(child);
      }
    } else {
      for (const child of children) {
        this.log(child);
      }
    }
    return EMPTY_ARRAY;
  }
  _log(tile) {
    console.log(`/${tile[2]}/${tile[0]}/${tile[1]}`)
  }
  log(tile) {
    console.log(
      this.template
        .replace('{x}', tile[0])
        .replace('{y}', tile[1])
        .replace('{z}', tile[2])
      )
  }
}
module.exports = TileGenerator;
