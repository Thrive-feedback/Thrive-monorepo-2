import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const api = resolve(root, 'apps/api');
const web = resolve(root, 'apps/web');
const devTask =
  process.argv[2] === 'api'
    ? ['turbo', 'run', 'dev', '--filter=api']
    : ['turbo', 'run', 'dev'];

for (const app of [api, web]) {
  const localEnvironment = resolve(app, '.env');
  if (!existsSync(localEnvironment)) {
    copyFileSync(resolve(app, '.env.example'), localEnvironment);
  }
}

for (const [command, args, cwd] of [
  ['bun', ['install', '--frozen-lockfile'], root],
  ['docker', ['compose', 'up', '-d', '--wait', 'db'], root],
  ['bun', ['run', 'db:migrate:deploy'], api],
  ['bunx', devTask, root],
]) {
  const run = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (run.error) throw run.error;
  if (run.status !== 0) process.exit(run.status ?? 1);
}
