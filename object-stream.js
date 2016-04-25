'use strict'

const stream = require('readable-stream')

function noop (chunk, callback) {
  callback(null, chunk)
}

function isFunction (object) {
  return typeof object === 'function'
}

function isThenable (object) {
  return object && isFunction(object.then)
}

function configureArgs (construct) {
  return function (options, transform, flush) {
    if (isFunction(options)) {
      flush = transform
      transform = options
      options = {}
    }

    if (!isFunction(transform)) {
      transform = noop
    }

    return construct(options, transform, flush)
  }
}

function wrapTransform (transform) {
  return function (chunk, encoding, callback) {
    const result = transform.call(this, chunk, callback, this)

    if (transform.length < 2) {
      return appendResultToStream(this, result, callback)
    }
  }
}

function wrapFlush (flush) {
  return function (done) {
    if (flush.length === 0) {
      const result = flush.call(this)
      return appendResultToStream(this, result, done)
    }

    flush.call(this, (err, obj) => {
      if (obj) {
        this.push(obj)
      }

      done(err)
    })
  }
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
    transform: wrapTransform(transform),
    flush: flush ? wrapFlush(flush) : null
  }, options)

  return new stream.Transform(transformArgs)
})

