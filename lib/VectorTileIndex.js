var geojsonvt = require('geojson-vt')
var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter
var vtpbf = require('vt-pbf')
var range = require('range').range
var series = require('run-series')

module.exports = VectorTileIndex
inherits(VectorTileIndex, EventEmitter)

function VectorTileIndex (data, db, options) {
  if (!(this instanceof VectorTileIndex)) return new VectorTileIndex(data, db, options)
  var self = this
  EventEmitter.call(self)
  self.db = db
  options = options || {}
  self.zMin = options.zMin || 0
  self.zMax = options.zMax || 14
  self.bbox = options.bbox || [-Infinity, -Infinity, Infinity, Infinity]
  self.data = data

  self.on('update', function () {
    if (self._pending) {
      self._pending = false
      self.regenerateIndex()
    }
  })
  self.on('error', function (err) {
    console.error(err)
  })
  self.regenerateIndex()
}

VectorTileIndex.prototype.regenerateIndex = function () {
  var self = this
  if (self._updating) {
    self._pending = true
    return
  }
  self._updating = true
  self._tileIndexes = {}

  for (var key in self.data) {
    self._tileIndexes[key] = geojsonvt(self.data[key], {
      maxZoom: self.zMax,
      indexMaxZoom: self.zMax
    })
  }

  var zRange = range(self.zMin, self.zMax + 1)
  series(zRange.map(function (z) {
    var tileBounds = getTileBounds(self.bbox, z)
    return function (done) {
      console.log(z, JSON.stringify(tileBounds))
      series(range(tileBounds.xMin, tileBounds.xMax + 1).map(function (x) {
        return function (done) {
          console.log(z, x)
          series(range(tileBounds.yMin, tileBounds.yMax + 1).map(function (y) {
            return function (done) {
              console.log(z, x, y)
              var pbfOptions = {}
              for (var i in self._tileIndexes) {
                var tile = self._tileIndexes[i].getTile(z, x, y)
                if (tile !== null) {
                  pbfOptions[i] = tile
                }
              }
              var pbf = vtpbf.fromGeojsonVt(pbfOptions)
              if (pbf.length > 0) {
                self.db.put([z, x, y], pbf, done)
              } else {
                done()
              }
            }
          }), done)
        }
      }), done)
    }
  }), function (err) {
    if (err) {
      self.emit(err)
    }
    self._updating = false
    self.emit('update')
  })
}

VectorTileIndex.prototype.ready = function (fn) {
  var self = this
  if (!self._updating) {
    process.nextTick(fn)
  } else {
    self.once('update', function () {
      self.ready(fn)
    })
  }
}

function getTileBounds (bbox, zoom) {
  return {
    xMin: lon2tile(bbox[0], zoom),
    xMax: lon2tile(bbox[2], zoom),
    yMin: lat2tile(bbox[3], zoom),
    yMax: lat2tile(bbox[1], zoom)
  }
}

// See http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Lon..2Flat._to_tile_numbers
function lon2tile (lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom))
}

function lat2tile (lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
}
