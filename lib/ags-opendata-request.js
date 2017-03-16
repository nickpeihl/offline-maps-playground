var xhr = require('xhr')
var xtend = require('xtend')
var backoff = require('backoff')

module.exports = function (opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
  }

  var xhrOpts = xtend(opts, { json: true })
  var xb = backoff.fibonacci({
    initialDelay: 1000,
    maxDelay: 30 * 1000
  })

  xb.on('backoff', function (n, d) {
    console.log('backoff', n, d)
  })

  xb.on('ready', function () {
    xhr(xhrOpts, function (err, res, body) {
      if (err) {
        cb(err)
      } else if (res.statusCode === 202) {
        xb.backoff()
      } else {
        xb.reset()
        cb(null, body)
      }
    })
  })
  xb.backoff()
}
