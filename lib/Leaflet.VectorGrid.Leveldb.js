/* global L */

var Promise = require('bluebird')
var Pbf = require('pbf')
var VectorTile = require('vector-tile').VectorTile

L.VectorGrid.Leveldb = L.VectorGrid.extend({
  options: {},

  initialize: function (db, options) {
    this._db = Promise.promisifyAll(db)
    L.VectorGrid.prototype.initialize.call(this, options)
  },

  _getVectorTilePromise: function (coords) {
    return this._db.getAsync([coords.z, coords.x, coords.y].toString()).then(function (data) {
      var tile = new VectorTile(new Pbf(data))
      return tile
    }).catch(function (err) {
      if (err.message === 'NotFound') {
        return {layers: []}
      } else {
        console.error(err)
      }
    }).then(function (json) {
      for (var layerName in json.layers) {
        var feats = []
        for (var i = 0; i < json.layers[layerName].length; i++) {
          var feat = json.layers[layerName].feature(i)
          feat.geometry = feat.loadGeometry()
          feats.push(feat)
        }
        json.layers[layerName].features = feats
      }
      return json
    })
  }
})

L.vectorGrid.leveldb = function (db, options) {
  return new L.VectorGrid.Leveldb(db, options)
}
