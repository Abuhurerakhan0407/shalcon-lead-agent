import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const src = new URL('../source.tar.gz.b64', import.meta.url);
const tmp = '/tmp/shalcon-source.tar.gz';
fs.writeFileSync(tmp, Buffer.from(fs.readFileSync(src, 'utf8').trim(), 'base64'));
execFileSync('tar', ['-xzf', tmp, '-C', process.cwd()], { stdio: 'inherit' });
