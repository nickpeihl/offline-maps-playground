var test = require('tape')
var reqData = require('../lib/ags-opendata-request')
var http = require('http')

test('404', function (t) {
  t.plan(1)
  var server = http.createServer(function (req, res) {
    res.statusCode = 404
    res.end()
  })
  server.listen(0, function () {
    var port = server.address().port
    reqData({
      url: 'http://localhost:' + port
    }, function (err, data) {
      t.ok(err)
      server.close()
    })
  })
})

// TODO make this test run faster somehow (spies?)
test('return data after backoff', function (t) {
  t.plan(2)
  var tries = 1
  var server = http.createServer(function (req, res) {
    if (tries) {
      console.log(tries)
      res.statusCode = 202
      tries--
      res.end()
    } else {
      res.statusCode = 200
      res.end('Woo data!')
    }
  })
  server.listen(0, function () {
    var port = server.address().port
    reqData({
      url: 'http://localhost:' + port
    }, function (err, data) {
      t.ifError(err)
      t.equal(data.toString(), 'Woo data!')
      server.close()
    })
  })
})
