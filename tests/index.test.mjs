import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as library from '../dist/esm/index.js';
const { TokenBucket } = library;

test('fractional refill and capped burst', () => {
  let now = 0;
  const b = new TokenBucket({ capacity: 3, refillPerSecond: 2, clock: () => now });
  assert.equal(b.tryTake(3), true);
  now = 250;
  assert.equal(b.available, 0.5);
  now = 5000;
  assert.equal(b.available, 3);
});
test('insufficient take is atomic', () => {
  const b = new TokenBucket({ capacity: 2, refillPerSecond: 0, clock: () => 0 });
  assert.equal(b.tryTake(3 / 2), true);
  assert.equal(b.tryTake(), false);
  assert.equal(b.available, 0.5);
  assert.equal(b.delayFor(), Infinity);
});
test('reservation cancellation returns held capacity', () => {
  let t = 0;
  const b = new TokenBucket({ capacity: 2, refillPerSecond: 1, clock: () => t });
  const r = b.reserve(2);
  t = 5000;
  assert.equal(b.available, 0);
  assert.equal(r.cancel(), true);
  assert.equal(r.cancel(), false);
  assert.equal(r.state, 'cancelled');
  assert.equal(b.available, 2);
});
test('commit releases refill ceiling without refund', () => {
  let t = 0;
  const b = new TokenBucket({ capacity: 2, refillPerSecond: 1, clock: () => t });
  const r = b.reserve();
  assert.equal(r.commit(), true);
  assert.equal(r.cancel(), false);
  assert.equal(b.available, 1);
  t = 500;
  assert.equal(b.available, 1.5);
  assert.equal(b.delayFor(2), 500);
});
test('monotonic finite clock enforced', () => {
  let t = 1;
  const b = new TokenBucket({ capacity: 1, refillPerSecond: 1, clock: () => t });
  t = 0;
  assert.throws(() => b.available, RangeError);
  t = NaN;
  assert.throws(() => b.available, RangeError);
});
test('invalid inputs and unavailable reservation', () => {
  assert.throws(
    () => new TokenBucket({ capacity: 0, refillPerSecond: 1, clock: () => 0 }),
    RangeError,
  );
  const b = new TokenBucket({ capacity: 1, refillPerSecond: 1, clock: () => 0, initialTokens: 0 });
  assert.equal(b.reserve(), undefined);
  assert.throws(() => b.tryTake(-1), RangeError);
  assert.throws(() => b.delayFor(Infinity), RangeError);
});
