import { isAbsolute, relative, resolve, sep } from 'node:path';

export function isWithin(root: string, target: string): boolean {
  const path = relative(resolve(root), resolve(target));
  return path === '' || (path !== '..' && !path.startsWith('..' + sep) && !isAbsolute(path));
}
