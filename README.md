# @lp-labs/token-bucket

Fractional local token accounting with cancellable burst reservations.

## Install

```sh
npm install @lp-labs/token-bucket
```

Zero runtime, peer, or sibling dependencies. Node 18+; strict TypeScript declarations and independent ESM/CommonJS builds. Version 0.1.0, MIT.

## Quickstart

```js
import { TokenBucket } from '@lp-labs/token-bucket';
let now = 0;
const bucket = new TokenBucket({ capacity: 4, refillPerSecond: 2, clock: () => now });
bucket.tryTake(4);
now = 250;
console.log(bucket.available); // 0.5
const reservation = bucket.reserve(0.5);
reservation?.cancel();
```

## API and contracts

Construct TokenBucket with positive finite capacity, nonnegative finite refillPerSecond,
and clock. initialTokens defaults to capacity and must be in [0, capacity].
available refreshes accounting before returning spendable tokens. tryTake(amount = 1)
returns false without spending when insufficient. reserve(amount = 1) returns a
Reservation or undefined when insufficient; delayFor(amount = 1) predicts a wait.
Amounts must be positive finite values no greater than capacity.

Clock values are monotonic milliseconds, supplied by the caller (for example performance.now). Backward/nonfinite clocks and invalid numeric options throw RangeError. Refill is fractional and capped; held reservations occupy capacity until committed or cancelled. Cancellation refunds exactly once; commit spends tokens and opens refill capacity. delayFor returns milliseconds or Infinity, not a scheduling guarantee. No timers, waiting queue, global server rate guarantee, distributed coordination, or adaptive/circuit-breaker policy. O(1) operations, O(active reservations) caller storage. Do not retain unused reservations indefinitely.

Arithmetic uses JavaScript floating-point precision, not fixed-point credit accounting.

## Full declarations

The complete public declarations below are generated from the package's strict source. All runtime exports, interfaces, options, return types and readonly state are listed here.

<!-- declarations -->

```ts
export interface TokenBucketOptions {
  capacity: number;
  refillPerSecond: number;
  clock: () => number;
  initialTokens?: number;
}
export interface Reservation {
  readonly amount: number;
  readonly state: 'reserved' | 'committed' | 'cancelled';
  commit(): boolean;
  cancel(): boolean;
}
export declare class TokenBucket {
  readonly capacity: number;
  readonly refillPerSecond: number;
  private tokens;
  private last;
  private held;
  private readonly clock;
  constructor(options: TokenBucketOptions);
  private refresh;
  private check;
  get available(): number;
  tryTake(amount?: number): boolean;
  delayFor(amount?: number): number;
  reserve(amount?: number): Reservation | undefined;
}
```

<!-- end declarations -->

## Development

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

All tests use deterministic clocks, immediate injected sleeps, or explicit promise gates rather than timing guesses. Package exports select ESM for import and CommonJS for require, with separate declaration trees. No runtime configuration files or global hooks.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
