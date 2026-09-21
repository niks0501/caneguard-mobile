const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const expoRoot = path.dirname(require.resolve('expo/package.json'));
const routeGenerationModule = path.join(
  expoRoot,
  'node_modules/@expo/cli/build/src/start/server/type-generation/routes.js',
);

if (!fs.existsSync(routeGenerationModule)) {
  throw new Error(`Expo typed-route generator not found at ${routeGenerationModule}`);
}

const { setupTypedRoutes } = require(routeGenerationModule);

setupTypedRoutes({
  projectRoot,
  routerDirectory: path.join(projectRoot, 'src/app'),
  typesDirectory: path.join(projectRoot, '.expo/types'),
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
