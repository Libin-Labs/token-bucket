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
export class TokenBucket {
  readonly capacity: number;
  readonly refillPerSecond: number;
  private tokens: number;
  private last: number;
  private held = 0;
  private readonly clock: () => number;
  constructor(options: TokenBucketOptions) {
    const { capacity, refillPerSecond, clock, initialTokens = capacity } = options;
    if (
      !Number.isFinite(capacity) ||
      capacity <= 0 ||
      !Number.isFinite(refillPerSecond) ||
      refillPerSecond < 0 ||
      !Number.isFinite(initialTokens) ||
      initialTokens < 0 ||
      initialTokens > capacity
    )
      throw new RangeError('Invalid bucket parameters');
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.clock = clock;
    this.tokens = initialTokens;
    this.last = clock();
    if (!Number.isFinite(this.last)) throw new RangeError('Clock must be finite');
  }
  private refresh(): void {
    const now = this.clock();
    if (!Number.isFinite(now) || now < this.last)
      throw new RangeError('Clock must be monotonic milliseconds');
    const elapsed = now - this.last;
    const seconds = Number.isFinite(elapsed) ? elapsed / 1000 : now / 1000 - this.last / 1000;
    const refill = this.refillPerSecond === 0 ? 0 : seconds * this.refillPerSecond;
    this.tokens = Math.min(this.capacity - this.held, this.tokens + refill);
    this.last = now;
  }
  private check(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0 || amount > this.capacity)
      throw new RangeError('Amount must be positive and within capacity');
  }
  get available(): number {
    this.refresh();
    return this.tokens;
  }
  tryTake(amount = 1): boolean {
    this.check(amount);
    this.refresh();
    if (this.tokens < amount) return false;
    this.tokens -= amount;
    return true;
  }
  delayFor(amount = 1): number {
    this.check(amount);
    this.refresh();
    if (this.tokens >= amount) return 0;
    if (amount > this.capacity - this.held || this.refillPerSecond === 0) return Infinity;
    return ((amount - this.tokens) / this.refillPerSecond) * 1000;
  }
  reserve(amount = 1): Reservation | undefined {
    if (!this.tryTake(amount)) return undefined;
    this.held += amount;
    let state: Reservation['state'] = 'reserved';
    const finish = (cancel: boolean): boolean => {
      if (state !== 'reserved') return false;
      this.refresh();
      this.held -= amount;
      if (cancel) this.tokens += amount;
      state = cancel ? 'cancelled' : 'committed';
      return true;
    };
    return Object.freeze({
      amount,
      get state() {
        return state;
      },
      commit: () => finish(false),
      cancel: () => finish(true),
    });
  }
}
