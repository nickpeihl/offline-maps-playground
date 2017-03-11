/* global L */

var VectorTileIndex = require('./lib/VectorTileIndex.js')
var level = require('level-js')

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

var data = {
  shoreline: require('./sanjuan.json'),
  roads: require('./roads.json')
}

var map = L.map('map', {
  center: [48.532294, -123.083954],
  zoom: 12,
  maxZoom: 15
})

db.open(function onOpen () {
  layer = L.vectorGrid.leveldb(db, vectorTileOptions)
  layer.addTo(map)
})

L.easyButton({
  states: [{
    stateName: 'ready',
    icon: '<span class="icon">&check;</span>',
    title: 'Click to refresh the cache',
    onClick: function (control) {
      control.state('loading')
      var vti = VectorTileIndex(data, db, {
        zMin: 10,
        zMax: 15,
        bbox: [-123.214417, 48.434668, -122.953491, 48.630186]
      })
      vti.ready(function () {
        console.log('ready')
        control.state('ready')
        layer.redraw()
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
}).addTo(map)
