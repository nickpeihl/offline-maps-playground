/* global Tangram */

var LevelTileSource = require('./level').LevelTileSource
var Pbf = require('pbf')
var VectorTile = require('vector-tile').VectorTile

// import LevelSource from './level'
// import Pbf from 'pbf'
// import {VectorTile} from 'vector-tile'

export class MVTLevelSource extends LevelTileSource {
  constructor (source, sources) {
    super(source, sources)
  }

  parseSourceData (tile, source, data) {
    var buffer = new Pbf(data)
    source.data = new VectorTile(buffer)
    source.layers = this.toGeoJSON(source.data)

    delete source.data
  }

  toGeoJSON (json) {
    for (var layerName in json.layers) {
      var feats = []
      var layer = json.layers[layerName]

      for (var i = 0; i < layer.length; i++) {
        var feat = layer.feature(i)
        feat.geometry = feat.loadGeometry()
        feats.push(feat)
      }
      layer.features = feats
    }
    return json
  }
}

// TODO Waiting on https://github.com/tangrams/tangram/issues/252
Tangram.debug.DataSource.register(MVTLevelSource, 'MVTLevel')
