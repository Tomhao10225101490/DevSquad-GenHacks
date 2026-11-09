export class TTLCache<T> {
  private values = new Map<string, { value: T; expiresAt: number }>();
  private now: () => number;
  constructor(now: () => number = Date.now) { this.now = now; }
  set(key: string, value: T, ttl: number): void {
    if (!Number.isFinite(ttl) || ttl < 0) throw new RangeError('ttl must be finite and non-negative');
    this.values.set(key, { value, expiresAt: this.now() + ttl });
  }
  get(key: string): T | undefined {
    const entry = this.values.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.values.delete(key);
      return undefined;
    }
    return entry.value;
  }
}
