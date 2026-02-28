const { register } = require("tsconfig-paths");
const path = require("path");
const Module = require("module");

const distRoot = path.join(__dirname, "dist");
const projectRoot = path.resolve(__dirname, "../..");

// Register tsconfig path aliases pointing into dist/
register({
  baseUrl: distRoot,
  paths: {
    "@api/*": ["apps/api/src/*"],
    "@msp/shared": ["packages/shared/src"],
    "@msp/shared/*": ["packages/shared/src/*"],
    "@msp/domain": ["packages/domain/src"],
    "@msp/domain/*": ["packages/domain/src/*"],
    "@msp/application": ["packages/application/src"],
    "@msp/application/*": ["packages/application/src/*"],
    "@msp/infrastructure": ["packages/infrastructure/src"],
    "@msp/infrastructure/*": ["packages/infrastructure/src/*"],
  },
});

// Allow compiled workspace packages inside dist/ to resolve their
// node_modules from the original package locations.
const originalResolveFilename = Module._resolveFilename;
const packageDirs = [
  path.join(projectRoot, "packages/infrastructure"),
  path.join(projectRoot, "packages/domain"),
  path.join(projectRoot, "packages/application"),
  path.join(projectRoot, "packages/shared"),
  path.join(projectRoot, "apps/api"),
  projectRoot,
];

Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    // If normal resolution fails, try resolving from each package directory
    for (const dir of packageDirs) {
      try {
        return originalResolveFilename.call(
          this,
          request,
          { ...parent, paths: Module._nodeModulePaths(dir) },
          isMain,
          { ...options, paths: Module._nodeModulePaths(dir) },
        );
      } catch {
        // try next
      }
    }
    throw err;
  }
};
