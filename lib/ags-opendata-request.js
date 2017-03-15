var xhr = require('xhr')
var xtend = require('xtend')
var backoff = require('backoff')

module.exports = function (opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
  }

  var xhrOpts = xtend(opts, { json: true })

  var call = backoff.call(xhr, xhrOpts, function (err, res, body) {
    console.log('Num retries: ' + call.getNumRetries())

    if (err) {
      cb(err)
    } else {
      if (res.statusCode === 202) {
        cb('processing')
      } else if (res.statusCode === 200){
        cb(null, res.body)
      } else {
        cb(new Error('Returned ' + res.statusCode))
      }
    }
  })

  call.retryIf(function (err) { return err === 'processing' })
  call.setStrategy(new backoff.FibonacciStrategy({
    initialDelay: 1000,
    maxDelay: 30000
  }))
  call.failAfter(10)
  call.start()
}
