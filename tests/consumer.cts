import { TokenBucket, type Reservation } from '@lp-labs/token-bucket';
const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1, clock: () => 0 });
const reservation: Reservation | undefined = bucket.reserve();
void reservation;
// @ts-expect-error clock is required
new TokenBucket({ capacity: 2, refillPerSecond: 1 });
// @ts-expect-error readonly capacity
bucket.capacity = 3;
