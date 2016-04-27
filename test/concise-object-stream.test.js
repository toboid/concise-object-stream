'use strict'

const expect = require('chai').expect
const stream = require('readable-stream')
const concat = require('concat-stream')
const objectStream = require('../lib')

describe('map', function () {
  it('uses stream options', (done) => {
    const options = {highWaterMark: 5}
    const transformStream = objectStream.map(options, function (multiplier, callback) {
      expect(this._readableState.highWaterMark).to.eql(5)
      expect(this._writableState.highWaterMark).to.eql(5)
      callback()
    })
    .on('data', () => {})
    .on('end', done)

    transformStream.write()
    transformStream.end()
  })

  it('works with pipe', (done) => {
    const expected = [5, 10, 20]
    const sourceValues = [1, 2, 4]

    const source = stream.Readable({
      objectMode: true,
      read: function () {
        if (sourceValues.length) {
          this.push(sourceValues.shift())
        } else {
          this.push(null)
        }
      }
    })

    source
      .pipe(objectStream.map((multiplier, callback) => {
        callback(null, {value: multiplier * 5})
      }))
      .pipe(concat({encoding: 'object'}, function (actual) {
        expect(expected).to.eql(actual.map((a) => a.value))
        done()
      }))
  })

  describe('transform', function () {
    it('defaults to a pass through stream', (done) => {
      const throughStream = objectStream.map()
      .on('data', (obj) => {
        expect(obj).to.eql(1)
      })
      .on('end', () => {
        done()
      })

      throughStream.write(1)
      throughStream.end()
    })

    it('transforms an object stream with callback shorthand', (done) => {
      const expected = [5, 10, 20]
      const actual = []

      const multiplyBy5 = objectStream.map((multiplier, callback) => {
        callback(null, {value: multiplier * 5})
      })
      .on('data', (obj) => {
        actual.push(obj.value)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      multiplyBy5.write(1)
      multiplyBy5.write(2)
      multiplyBy5.write(4)
      multiplyBy5.end()
    })

    it('transforms object stream with callback', (done) => {
      const expected = [5, 10, 20]
      const actual = []

      const multiplyBy5 = objectStream.map(function (multiplier, callback) {
        this.push({value: multiplier * 5})
        callback()
      })
      .on('data', (obj) => {
        actual.push(obj.value)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      multiplyBy5.write(1)
      multiplyBy5.write(2)
      multiplyBy5.write(4)
      multiplyBy5.end()
    })

    it('transforms object stream with return value shorthand', (done) => {
      const expected = [5, 10, 20]
      const actual = []

      const multiplyBy5 = objectStream.map((multiplier) => ({value: multiplier * 5}))
      .on('data', (obj) => {
        actual.push(obj.value)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      multiplyBy5.write(1)
      multiplyBy5.write(2)
      multiplyBy5.write(4)
      multiplyBy5.end()
    })

    it('transforms object stream with promise shorthand', (done) => {
      const expected = [5, 10, 20]
      const actual = []

      const multiplyBy5 = objectStream.map((multiplier) => Promise.resolve({value: multiplier * 5}))
      .on('data', (obj) => {
        actual.push(obj.value)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      multiplyBy5.write(1)
      multiplyBy5.write(2)
      multiplyBy5.write(4)
      multiplyBy5.end()
    })

    it('errors when transform function has no callback or return value', (done) => {
      const invalidStream = objectStream.map((multiplier) => {})
      .on('data', () => {
        done('Stream did not error.')
      })
      .on('error', (error) => {
        expect(error).to.be.an('error')
        expect(error.message).to.eql('Transform did not callback or return a value/promise')
        done()
      })

      invalidStream.write(1)
      invalidStream.end()
    })
  })

  describe('flush', function () {
    it('supports flush callback shorthand', (done) => {
      const expected = [1, 2, 4, 'the end']
      const actual = []

      const throughStream = objectStream.map((object) => object, (callback) => {
        callback(null, 'the end')
      })
      .on('data', (obj) => {
        actual.push(obj)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      throughStream.write(1)
      throughStream.write(2)
      throughStream.write(4)
      throughStream.end()
    })

    it('supports flush callback', (done) => {
      const expected = [1, 2, 4, 'the end']
      const actual = []

      const throughStream = objectStream.map((object) => object, function (callback) {
        this.push('the end')
        callback()
      })
      .on('data', (obj) => {
        actual.push(obj)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      throughStream.write(1)
      throughStream.write(2)
      throughStream.write(4)
      throughStream.end()
    })

    it('supports flush with return value shorthand', (done) => {
      const expected = [1, 2, 4, 'the end']
      const actual = []

      const throughStream = objectStream.map((object) => object, () => 'the end')
      .on('data', (obj) => {
        actual.push(obj)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      throughStream.write(1)
      throughStream.write(2)
      throughStream.write(4)
      throughStream.end()
    })

    it('supports flush with promise shorthand', (done) => {
      const expected = [1, 2, 4, 'the end']
      const actual = []

      const throughStream = objectStream.map((object) => object, () => Promise.resolve('the end'))
      .on('data', (obj) => {
        actual.push(obj)
      })
      .on('end', () => {
        expect(expected).to.eql(actual)
        done()
      })

      throughStream.write(1)
      throughStream.write(2)
      throughStream.write(4)
      throughStream.end()
    })
  })
})
