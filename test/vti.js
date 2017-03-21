var test = require('tape')
var VectorTileIndex = require('../lib/VectorTileIndex')
var level = require('memdb')
var data = require('./fixtures/polygon.json')

var db = level('vt')
var vti = VectorTileIndex({ item: data }, db, {
  zMin: 1,
  zMax: 3,
  bbox: [-179, -89, 179, 89]
})

vti.ready(function () {
  test('vti', function (t) {
    t.plan(4)
    db.get('3,1,2', function (err, data) {
      t.ifError(err)
      t.ok(data.length > 0)
    })
    db.get('0,0,0', function (err, data) {
      t.ok(err.notFound)
    })
    db.get('3,1,4', function (err, data) {
      t.ok(err.notFound)
    })
  })
})
