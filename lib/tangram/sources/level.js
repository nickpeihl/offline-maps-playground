/* global Tangram */

var Promise = require('bluebird')

export class LevelSource extends Tangram.debug.DataSource {
  constructor (source, sources) {
    super(source, sources)
    this._db = Promise.promisifyAll(source.db)

    if (this._db === null) {
      throw Error('Must provide a leveldb instance')
    }
  }

  _load (dest) {
    let sourceData = dest.source_data
    let coords = dest.coords
    sourceData.db = this._db
    return new Promise((resolve, reject) => {
      sourceData.error = null

      let promise = sourceData.db.getAsync([coords.z, coords.x, coords.y].toString())

      promise.then((data) => {
        this.parseSourceData(dest, sourceData, data)
        resolve(dest)
      }).catch((err) => {
        sourceData.error = err.stack
        resolve(dest)
      })
    })
  }

  parseSourceData (dest, source, data) {
    throw new Error('Method parseSourceData must be implemented in sublcass')
  }
}

export class LevelTileSource extends LevelSource {
  constructor (source, sources) {
    super(source, sources)
    this.tiled = true
    this.parseBounds(source)

    this.builds_geometry_tiles = true
    this.tms = true
  }

  // Get bounds from source config parameters
  parseBounds (source) {
    if (Array.isArray(source.bounds) && source.bounds.length === 4) {
      this.bounds = source.bounds
      let [w, s, e, n] = this.bounds
      this.bounds_meters = {
        min: Tangram.debug.Geo.latLngToMeters([w, n]),
        max: Tangram.debug.Geo.latLngToMeters([e, s])
      }
      this.bounds_tiles = { min: {}, max: {} } // max tile bounds per zoom (lazily evaluated)
    }
  }

  // Returns false if tile is outside data source's bounds, true if within
  checkBounds (coords) {
    // Check tile bounds
    if (this.bounds) {
      coords = Tangram.debug.Geo.wrapTile(coords, { x: true })

      let min = this.bounds_tiles.min[coords.z]
      if (!min) {
        min = this.bounds_tiles.min[coords.z] = Tangram.debug.Geo.tileForMeters(this.bounds_meters.min, coords.z)
      }

      let max = this.bounds_tiles.max[coords.z]
      if (!max) {
        max = this.bounds_tiles.max[coords.z] = Tangram.debug.Geo.tileForMeters(this.bounds_meters.max, coords.z)
      }

      if (coords.x < min.x || coords.x > max.x ||
          coords.y < min.y || coords.y > max.y) {
        return false
      }
    }
    return true
  }

  includesTile (coords, styleZoom) {
    if (!super.includesTile(coords, styleZoom)) {
      return false
    }

    // Check tile bounds
    if (!this.checkBounds(coords)) {
      return false
    }
    return true
  }
}
