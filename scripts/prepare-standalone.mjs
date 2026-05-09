import fs from 'node:fs';
import path from 'node:path';

const appRoot = process.cwd();
const packageJsonPath = path.join(appRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const standaloneCandidates = [
  path.join(appRoot, '.next', 'standalone', 'apps', packageJson.name),
  path.join(appRoot, '.next', 'standalone'),
];

const standaloneRoot = standaloneCandidates.find((candidate) =>
  fs.existsSync(candidate),
);

if (!standaloneRoot) {
  throw new Error('Standalone output was not found after build');
}

const staticSource = path.join(appRoot, '.next', 'static');
const staticDestination = path.join(standaloneRoot, '.next', 'static');
const publicSource = path.join(appRoot, 'public');
const publicDestination = path.join(standaloneRoot, 'public');

if (fs.existsSync(staticSource)) {
  fs.mkdirSync(path.dirname(staticDestination), { recursive: true });
  fs.cpSync(staticSource, staticDestination, { recursive: true, force: true });
}

if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, publicDestination, { recursive: true, force: true });
}

console.log(`Prepared standalone assets in ${standaloneRoot}`);
