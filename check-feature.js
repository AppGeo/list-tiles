module.exports = (features) => {
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
