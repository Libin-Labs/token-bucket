import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TokenBucket } from '../dist/esm/index.js';

test('multiple reservations preserve the total capacity invariant', () => {
  let time = 0;
  const bucket = new TokenBucket({ capacity: 5, refillPerSecond: 2, clock: () => time });
  const a = bucket.reserve(2);
  const b = bucket.reserve(2);
  assert.equal(bucket.available, 1);
  assert.equal(bucket.delayFor(2), Infinity);
  time = 10000;
  assert.equal(bucket.available, 1);
  a.cancel();
  assert.equal(bucket.available, 3);
  b.commit();
  assert.equal(bucket.available, 3);
  time = 11000;
  assert.equal(bucket.available, 5);
  assert.equal(bucket.tryTake(5), true);
  assert.equal(a.commit(), false);
  assert.equal(b.cancel(), false);
});

test('failed clock observation does not settle a reservation', () => {
  let time = 10;
  const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 0, clock: () => time });
  const reservation = bucket.reserve();
  time = 9;
  assert.throws(() => reservation.cancel(), RangeError);
  assert.equal(reservation.state, 'reserved');
  time = 10;
  assert.equal(reservation.cancel(), true);
  assert.equal(bucket.available, 1);
});

test('extreme finite clocks do not produce NaN with zero refill', () => {
  let time = -Number.MAX_VALUE;
  const bucket = new TokenBucket({ capacity: 1, refillPerSecond: 0, clock: () => time });
  bucket.tryTake();
  time = Number.MAX_VALUE;
  assert.equal(bucket.available, 0);
});
