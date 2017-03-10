var VectorTileIndex = require('./')
var level = require('level-js')
var data = require('./sanjuan.json')

var db = level('vt')

var vti = VectorTileIndex(data, db, {
  zMin: 10,
  zMax: 15
})
vti.ready(function () {
  console.log('ready')
})
