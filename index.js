/* global L */

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
var landStyle = {
  fill: true,
  weight: 1.2,
  fillColor: '#e1e1e1',
  color: '#343434',
  fillOpacity: 0.2,
  opacity: 0.4
}

var vectorTileOptions = {
  rendererFactory: L.canvas.tile,
  attribution: 'Natural Earth',
  vectorTileLayerStyles: {
    land110: function (prop, zoom) {
      if (zoom <= 3) {
        return landStyle
      } else {
        return []
      }
    },
    land50: function (prop, zoom) {
      if (zoom > 3 && zoom <= 5) {
        return landStyle
      } else {
        return []
      }
    },
    roads: {
      weight: 1,
      fillColor: '#676767',
      color: '#676767',
      fillOpacity: 0.2,
      opacity: 0.4
    },
    driveways: {
      weight: 0.4,
      fillColor: '#676767',
      color: '#676767',
      fillOpacity: 0.2,
      opacity: 0.4
    },
    addresses: {
      weight: 1,
      fillColor: '#636363',
      color: '#636363',
      fillOpacity: 0.2,
      opacity: 0.4,
      radius: 1
    }
  }
}

var sources = {
  land110: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson',
  land50: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson'
}

var leafletMap = L.map('leaflet-map', {
  center: [0, 0],
  zoom: 1,
  maxZoom: 5
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
    zMin: 0,
    zMax: 5,
    bbox: [-179, -89, 179, 89]
  })
}
