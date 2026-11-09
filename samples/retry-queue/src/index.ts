export async function retry<T>(task: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try { return await task(); } catch (error) { last = error; }
  }
  throw last;
}
