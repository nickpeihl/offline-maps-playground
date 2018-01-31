/* global L */

var VectorTileIndex = require('./lib/VectorTileIndex.js')
var level = require('level-js')
var request = require('xhr-request')
var parallel = require('run-parallel')

// var L = require('leaflet')
// require('leaflet.vectorgrid').VectorGrid
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

var placeStyle = {
  weight: 1,
  fillColor: '#636363',
  color: '#636363',
  fillOpacity: 1,
  opacity: 1,
  radius: 1.2
}

var boundaryStyle = {
  weight: 1,
  fillColor: '#676767',
  color: '#676767',
  fillOpacity: 0.2,
  opacity: 0.4
}

var stateBoundaryStyle = {
  weight: 0.4,
  fillColor: '#676767',
  color: '#676767',
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
      if (zoom > 3 && zoom <= 8) {
        return landStyle
      } else {
        return []
      }
    },
    popPlaces110: function (prop, zoom) {
      if (zoom <= 3) {
        return placeStyle
      } else {
        return []
      }
    },
    popPlaces50: function (prop, zoom) {
      if (zoom > 3 && zoom <= 8) {
        return placeStyle
      } else {
        return []
      }
    },
    boundary110: function (prop, zoom) {
      if (zoom <= 3) {
        return boundaryStyle
      } else {
        return []
      }
    },
    boundary50: function (prop, zoom) {
      if (zoom > 3 && zoom <= 5) {
        return boundaryStyle
      } else {
        return []
      }
    },
    statesProvinces50: function (prop, zoom) {
      if (zoom > 3 && zoom <= 5) {
        return stateBoundaryStyle
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
  land50: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
  popPlaces110: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_populated_places_simple.geojson',
  popPlaces50: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_populated_places_simple.geojson',
  boundary110: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_boundary_lines_land.geojson',
  boundary50: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_boundary_lines_land.geojson',
  statesProvinces50: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_1_states_provinces_lines.geojson'
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
  states: [
    {
      stateName: 'ready',
      icon: '<span class="icon">&check;</span>',
      title: 'Click to refresh the cache',
      onClick: function (control) {
        control.state('loading')
        getData(sources, function (err, data) {
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
    },
    {
      stateName: 'loading',
      icon: '<span class="icon">&curren;</span>',
      title: 'Refreshing the cache...',
      onClick: function (control) {
        control.state('ready')
      }
    }
  ]
}).addTo(leafletMap)

function getData (sources, cb) {
  var fns = Object.keys(sources).map(function (source) {
    return function (cb) {
      request(
        sources[source],
        {
          json: true
        },
        function (err, data, res) {
          if (err) cb(err)
          if (res.statusCode === 404) {
            cb(new Error(`URL ${sources[source]} returned 404 Not Found`))
          }
          cb(null, {
            name: source,
            data: data
          })
        }
      )
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
