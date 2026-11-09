import { resolve } from 'node:path';

export function isWithin(root: string, target: string): boolean {
  return resolve(target).startsWith(resolve(root));
}
