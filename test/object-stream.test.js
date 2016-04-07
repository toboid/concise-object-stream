'use strict';

const _ = require('lodash');
const expect = require('chai').expect;
const concat = require('concat-stream');
const objectStream = require('../object-stream');

describe('object-stream', function () {
    it('uses stream options', done => {
        const options = {highWaterMark: 5};
        const multiplyBy5 = objectStream(options, function (multiplier, callback) {
            expect(this._readableState.highWaterMark).to.eql(5);
            expect(this._writableState.highWaterMark).to.eql(5);
            callback();
        })
        .on('data', () => {})
        .on('end', () => {
            done();
        });

        multiplyBy5.write(1);
        multiplyBy5.end();
    });

    it('works with pipe', () => {
        const expected = [5, 10, 20];

        const multiplyBy5 = objectStream((multiplier, callback) => {
            callback(null, {value: multiplier * 5});
        })
        .pipe(concat({encoding: 'object'}, function (actual) {
            expect(expected).to.eql(actual);
            done();
        }));

        multiplyBy5.write(1);
        multiplyBy5.write(2);
        multiplyBy5.write(4);
        multiplyBy5.end();
    });

    describe('transform', function () {
        it('defaults to a pass through stream', done => {
            const multiplyBy5 = objectStream()
                .on('data', obj => {
                    expect(obj).to.eql(1);
                })
                .on('end', () => {
                    done();
                })

            multiplyBy5.write(1);
            multiplyBy5.end();
        });
        
        it('transforms an object stream with callback shorthand', done => {
            const expected = [5, 10, 20];
            const actual = [];

            const multiplyBy5 = objectStream((multiplier, callback) => {
                callback(null, {value: multiplier * 5});
            })
            .on('data', obj => {
                actual.push(obj.value);
            })
            .on('end', () => {
                expect(expected).to.eql(actual);
                done();
            })

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('transforms object stream with callback', done => {
            const expected = [5, 10, 20];
            const actual = [];

            const multiplyBy5 = objectStream(function(multiplier, callback) {
                this.push({value: multiplier * 5});
                callback();
            })
            .on('data', obj => {
                actual.push(obj.value);
            })
            .on('end', () => {
                expect(expected).to.eql(actual);
                done();
            })

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('transforms object stream with return value shorthand', done => {
            const expected = [5, 10, 20];
            const actual = [];

            const multiplyBy5 = objectStream(multiplier => ({value: multiplier * 5}))
                .on('data', obj => {
                    actual.push(obj.value);
                })
                .on('end', () => {
                    expect(expected).to.eql(actual);
                    done();
                });

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('transforms object stream with promise shorthand', done => {
            const expected = [5, 10, 20];
            const actual = [];

            const multiplyBy5 = objectStream(multiplier => Promise.resolve({value: multiplier * 5}))
                .on('data', obj => {
                    actual.push(obj.value);
                })
                .on('end', () => {
                    expect(expected).to.eql(actual);
                    done();
                });

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('errors when transform function has no callback or return value', done => {
            const multiplyBy5 = objectStream(multiplier => {})
                .on('data', () => {
                    done('Stream did not error.');
                })
                .on('error', error => {
                    expect(error).to.eql('Transform function did not callback or return a value/promise');
                    done();
                });

            multiplyBy5.write(1);
            multiplyBy5.end();
        });
    });

    describe('flush', function () {
        it('supports flush callback shorthand', done => {
            const expected = [5, 10, 20, 'the end'];
            const actual = [];

            const multiplyBy5 = objectStream(multiplier => multiplier * 5, callback => {
                callback(null, 'the end');
            })
            .on('data', obj => {
                actual.push(obj);
            })
            .on('end', () => {
                expect(expected).to.eql(actual);
                done();
            })

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('supports flush callback', done => {
            const expected = [5, 10, 20, 'the end'];
            const actual = [];

            const multiplyBy5 = objectStream(multiplier => multiplier * 5, function (callback) {
                this.push('the end');
                callback();
            })
            .on('data', obj => {
                actual.push(obj);
            })
            .on('end', () => {
                expect(expected).to.eql(actual);
                done();
            })

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('supports flush with return value shorthand', done => {
            const expected = [5, 10, 20, 'the end'];
            const actual = [];

            const multiplyBy5 = objectStream(multiplier => multiplier * 5, () => 'the end')
                .on('data', obj => {
                    actual.push(obj);
                })
                .on('end', () => {
                    expect(expected).to.eql(actual);
                    done();
                })

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });

        it('supports flush with promise shorthand', done => {
            const expected = [5, 10, 20, 'the end'];
            const actual = [];

            const multiplyBy5 = objectStream(multiplier => multiplier * 5, () => Promise.resolve('the end'))
                .on('data', obj => {
                    actual.push(obj);
                })
                .on('end', () => {
                    expect(expected).to.eql(actual);
                    done();
                })

            multiplyBy5.write(1);
            multiplyBy5.write(2);
            multiplyBy5.write(4);
            multiplyBy5.end();
        });
    });
});
