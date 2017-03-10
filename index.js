/* global L */

var VectorTileIndex = require('./lib/VectorTileIndex.js')
var level = require('level-js')
var data = require('./sanjuan.json')
//var L = require('leaflet')
//require('leaflet.vectorgrid').VectorGrid
require('./lib/Leaflet.VectorGrid.Leveldb')

var map = L.map('map', {
  center: [48.532294,-123.083954],
  zoom: 12,
  maxZoom: 15
})
var defaultBase = L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibnBlaWhsIiwiYSI6InVmU21qeVUifQ.jwa9V6XsmccKsEHKh5QfmQ', {
  attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
  maxZoom: 18
})
defaultBase.addTo(map)

var vectorTileOptions = {
  rendererFactory: L.canvas.tile,
  attribution: 'San Juan County GIS',
  vectorTileLayerStyles: {
    data: {
      weight: 1,
      fillColor: '#9bc2c4',
      fillOpacity: 0.6,
      fill: true,
      stroke: true
    }
  }
}

var db = level('vt')

db.open(function onOpen () {
  var vti = VectorTileIndex(data, db, {
    zMin: 10,
    zMax: 15,
    bbox: [-123.214417, 48.434668, -122.953491, 48.630186]
  })
  vti.ready(function () {
    console.log('ready')
    var layer = L.vectorGrid.leveldb(db, vectorTileOptions)
    layer.addTo(map)
  })
})
