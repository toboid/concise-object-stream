# concise-object-stream

[![Greenkeeper badge](https://badges.greenkeeper.io/toboid/concise-object-stream.svg)](https://greenkeeper.io/)

**A simplified API for working with node object streams**

[![Build Status](https://travis-ci.org/toboid/concise-object-stream.svg?branch=master)](https://travis-ci.org/toboid/concise-object-stream)
[![Coverage Status](https://coveralls.io/repos/github/toboid/concise-object-stream/badge.svg?branch=master)](https://coveralls.io/github/toboid/concise-object-stream?branch=master)
[![Dependencies](https://david-dm.org/toboid/concise-object-stream.svg)](https://github.com/toboid/concise-object-stream/blob/master/package.json)
[![npm version](https://badge.fury.io/js/concise-object-stream.svg)](https://badge.fury.io/js/concise-object-stream)

This module is inspired by Rod Vagg's [through2](https://github.com/rvagg/through2) module but by focusing purely on object streams is able to provide a more concise API, including support for returning a value or promise from a transform function.

## Getting started
Install via NPM
```
  npm i concise-object-stream --save
```

At it's simplest a transform stream can be created from function that returns the desired value to be queued or a promise for that value:

``` javascript
var objectStream = require('concise-object-stream')

getKeyStream()
    .pipe(objectStream.map(key => getObject(key)))
    .pipe(someOtherStream)
```

callback shorthand style is also supported:
``` javascript
getKeyStream()
    .pipe(objectStream.map((key, callback) => {
        const obj = getObject(key);
        callback(null, obj);
    }))
    .pipe(someOtherStream)
```

as is traditional style using `this`:
``` javascript
getKeyStream()
    .pipe(objectStream.map(function (key, callback) {
        const obj = getObject(key);
        this.push(obj);
        callback();
    }))
    .pipe(someOtherStream)
```

## API
`objectStream.map([options], [transform], [flush])`
### options
Options to be passed to the `stream.Transform` constructor, see [here](https://nodejs.org/api/stream.html#stream_new_stream_transform_options) for available options.
``` javascript
getKeyStream()
    .pipe(objectStream.map({highWaterMark: 6}, key => getObject(key)))
    .pipe(someOtherStream)
```

### transform
The transform function will be invoked with arguments `object` and `callback`.
`object` is the callback object on the stream, `callback` indicates the end of the transform function and signal any errors.

``` javascript
getKeyStream()
    .pipe(objectStream.map(function (key, callback) {
        const obj = getObject(key);
        this.push(obj);
        callback();
    }))
    .pipe(someOtherStream)
```

`callback` can also be called with an object as a shorthand for queuing a single object on the stream:
``` javascript
getKeyStream()
    .pipe(objectStream.map((key, callback) => {
        const obj = getObject(key);
        callback(null, obj);
    }))
    .pipe(someOtherStream)
```

Instead of using `callback` a value may be returned from the transform function, if the return value is a promise then this will be resolved and the result queued.
``` javascript
getKeyStream()
    .pipe(objectStream.map(key => getObject(key)))
    .pipe(someOtherStream)
```

If a transform function is not supplied it will default to a pass-through stream.

### flush
The flush function will be invoked with a single argument `done` which can be used to indicate the end of the flush function and signal any errors.

``` javascript
getKeyStream()
    .pipe(objectStream.map(function (key, callback) {
        const obj = getObject(key);
        this.push(obj);
        callback();
    }, function (done) {
        const finalObj = getFinalObj();
        this.push(obj);
        done();
    }))
    .pipe(someOtherStream)
```

Like the `callback` function, `done` supports a shorthand for queueing a single value:

``` javascript
getKeyStream()
    .pipe(objectStream.map((key, callback) => {
        const obj = getObject(key);
        callback(null, obj);
    }, done => {
        const finalObj = getFinalObj();
        done(null, obj);
    }))
    .pipe(someOtherStream)
```

`flush` also supports returning a value or promise, promises will be resolved and the result queued:
``` javascript
getKeyStream()
    .pipe(objectStream.map(key => getObject(key), () => getFinalObj()))
    .pipe(someOtherStream)
```

## License
MIT

