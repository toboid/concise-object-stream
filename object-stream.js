'use strict'

const stream = require('readable-stream')

function noop (chunk, callback) {
  callback(null, chunk)
}

function configureArgs (construct) {
  return function (options, transform, flush) {
    if (typeof options === 'function') {
      flush = transform
      transform = options
      options = {}
    }

    if (typeof transform !== 'function') {
      transform = noop
    }

    return construct(options, transform, flush)
  }
}

function isThenable (object) {
  return object && typeof object.then === 'function'
}

function appendResultToStream (stream, result, callback) {
  const promise = isThenable(result) ? result : Promise.resolve(result)

  promise.then((value) => {
    if (!value) {
      return callback(new Error('Transform did not callback or return a value/promise'))
    }

    stream.push(value)
    callback()
  }, callback)
}

module.exports = configureArgs(function (options, transform, flush) {
  const transformArgs = Object.assign({
    objectMode: true,
    transform: function (chunk, encoding, callback) {
      const result = transform.call(this, chunk, callback, this)

      // If `callback` param wasn't declared we expect a result
      if (transform.length < 2) {
        appendResultToStream(this, result, callback)
      }
    },
    flush: function (done) {
      if (typeof flush !== 'function') {
        return done()
      }

      // If `done` param wasn't declared we expect a result
      if (flush.length === 0) {
        const result = flush.call(this)
        appendResultToStream(this, result, done)
      } else {
        flush.call(this, (err, obj) => {
          if (obj) {
            this.push(obj)
          }

          done(err)
        })
      }
    }
  }, options)

  return new stream.Transform(transformArgs)
})

