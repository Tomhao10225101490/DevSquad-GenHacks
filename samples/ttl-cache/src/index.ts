export class TTLCache<T> {
  private values = new Map<string, { value: T; expiresAt: number }>();
  private now: () => number;
  constructor(now: () => number = Date.now) { this.now = now; }
  set(key: string, value: T, ttl: number): void {
    this.values.set(key, { value, expiresAt: this.now() + ttl });
  }
  get(key: string): T | undefined {
    return this.values.get(key)?.value;
  }
}
