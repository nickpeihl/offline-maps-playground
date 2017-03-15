/* global L, mapboxgl */

var VectorTileIndex = require('./lib/VectorTileIndex.js')
var level = require('level-js')
var reqData = require('./lib/ags-opendata-request')
var parallel = require('run-parallel')

//var L = require('leaflet')
//require('leaflet.vectorgrid').VectorGrid
require('./lib/Leaflet.VectorGrid.Leveldb')
require('leaflet-easybutton')

var db = level('vt')
var layer

var vectorTileOptions = {
  rendererFactory: L.canvas.tile,
  attribution: 'San Juan County GIS',
  vectorTileLayerStyles: {
    shoreline: {
      fill: true,
      weight: 1,
      fillColor: '#e1e1e1',
      color: '#343434',
      fillOpacity: 0.2,
      opacity: 0.4
    },
    roads: {
      weight: 1,
      fillColor: '#676767',
      color: '#676767',
      fillOpacity: 0.2,
      opacity: 0.4
    }
  }
}

var sources = {
  shoreline: 'http://data.sjcgis.org/datasets/1f8c6537e46d4c6aa6bd20ff466fb982_0.geojson?where=OBJECTID%20%3E%3D%20262',
  roads: 'http://data.sjcgis.org/datasets/167317f36825482abeae53637ad7a7f4_3.geojson?where=Island%20like%20\'%25San%20Juan%25\'&geometry={"xmin":-13838177.03790262,"ymin":6156211.922408805,"xmax":-13544658.849287685,"ymax":6247936.356350972,"spatialReference":{"wkid":102100}}'
}

var leafletMap = L.map('leaflet-map', {
  center: [48.532294, -123.083954],
  zoom: 12,
  maxZoom: 15
})

db.open(function onOpen () {
  layer = L.vectorGrid.leveldb(db, vectorTileOptions)
  layer.addTo(leafletMap)
})

L.easyButton({
  states: [{
    stateName: 'ready',
    icon: '<span class="icon">&check;</span>',
    title: 'Click to refresh the cache',
    onClick: function (control) {
      control.state('loading')
      loadData(sources, function (err, data) {
        if (err) throw err
        // TODO this code smells
        var layers = data.reduce(function (result, item) {
          result[item['name']] = item['data']
          return result
        }, {})
        var vti = bakeTiles(layers)
        vti.ready(function () {
          console.log('ready')
          control.state('ready')
          layer.redraw()
        })
      })
    }
  }, {
    stateName: 'loading',
    icon: '<span class="icon">&curren;</span>',
    title: 'Refreshing the cache...',
    onClick: function (control) {
      control.state('ready')
    }
  }]
}).addTo(leafletMap)

function loadData (sources, cb) {
  var fns = Object.keys(sources).map(function (source) {
    return function (cb) {
      reqData({ url: sources[source] }, function (err, data) {
        if (err) cb(err)
        cb(null, {
          name: source,
          data: data
        })
      })
    }
  })
  parallel(fns, cb)
}

function bakeTiles (data) {
  return VectorTileIndex(data, db, {
    zMin: 10,
    zMax: 15,
    bbox: [-123.214417, 48.434668, -122.953491, 48.630186]
  })
}
