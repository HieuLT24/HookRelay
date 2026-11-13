import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type FailureState = { count: number; windowStartedAt: number; blockedUntil: number };

@Injectable()
export class LoginThrottleService {
  private readonly failures = new Map<string, FailureState>();
  private readonly maxFailures = 5;
  private readonly windowMs = 60_000;
  private readonly blockMs = 60_000;

  assertAllowed(ip: string, email: string): void {
    for (const key of [this.key('ip', ip), this.key('email', email)]) {
      const state = this.failures.get(key);
      if (state && state.blockedUntil > Date.now()) {
        throw new HttpException('Too many login attempts', HttpStatus.TOO_MANY_REQUESTS);
      }
    }
  }

  recordFailure(ip: string, email: string): void {
    for (const key of [this.key('ip', ip), this.key('email', email)]) {
      const now = Date.now();
      const current = this.failures.get(key);
      const state = !current || now - current.windowStartedAt >= this.windowMs
        ? { count: 0, windowStartedAt: now, blockedUntil: 0 }
        : current;
      state.count += 1;
      if (state.count >= this.maxFailures) state.blockedUntil = now + this.blockMs;
      this.failures.set(key, state);
    }
  }

  clear(ip: string, email: string): void {
    this.failures.delete(this.key('ip', ip));
    this.failures.delete(this.key('email', email));
  }

  private key(kind: string, value: string): string {
    return `${kind}:${value}`;
  }
}
