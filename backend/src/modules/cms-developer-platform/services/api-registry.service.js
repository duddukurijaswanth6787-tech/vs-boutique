var path = require('path');
var fs = require('fs');

var cached = null;

function scanServerJs() {
  var serverPath = path.join(__dirname, '../../../server.js');
  var content = fs.readFileSync(serverPath, 'utf8');

  var lines = content.split('\n');
  var registrations = [];
  var modulesDir = path.join(__dirname, '../../modules');

  var appUseRegex = /app\.use\(['"]([^'"]+)['"]/;
  var requireRegex = /require\(['"]([^'"]+)['"]\)/;
  var varNameRegex = /,\s*(\w[\w]*)/g;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line.startsWith('app.use(')) continue;

    var pathMatch = line.match(appUseRegex);
    if (!pathMatch) continue;
    var basePath = pathMatch[1];

    var requireMatch = line.match(requireRegex);
    if (requireMatch) {
      registrations.push({ basePath: basePath, modulePath: requireMatch[1] });
      continue;
    }

    var varMatch = line.match(varNameRegex);
    if (varMatch) {
      for (var j = 1; j < varMatch.length; j++) {
        var varName = varMatch[j].replace(',', '').trim();
        if (varName && varName !== 'authLimiter' && varName !== 'uploadLimiter' && varName !== 'apiLimiter' && !varName.endsWith('Limiter')) {
          var resolvedPath = _resolveVarToModulePath(varName, modulesDir);
          if (resolvedPath) {
            registrations.push({ basePath: basePath, modulePath: resolvedPath, varName: varName });
            break;
          }
        }
      }
    }
  }

  return registrations;
}

function _resolveVarToModulePath(varName, modulesDir) {
  var routerPatterns = [
    varName + 'Router',
    varName.replace(/Router$/, '') + '.routes',
    varName
  ];

  var entries;
  try { entries = fs.readdirSync(modulesDir); } catch { return null; }

  for (var i = 0; i < entries.length; i++) {
    var moduleDir = path.join(modulesDir, entries[i]);
    var routesDir = path.join(moduleDir, 'routes');
    try {
      var files = fs.readdirSync(routesDir);
      for (var j = 0; j < files.length; j++) {
        if (files[j].endsWith('.routes.js')) {
          var content = fs.readFileSync(path.join(routesDir, files[j]), 'utf8');
          if (content.indexOf('var ' + varName + ' =') !== -1 ||
              content.indexOf('const ' + varName + ' =') !== -1 ||
              content.indexOf('let ' + varName + ' =') !== -1 ||
              content.indexOf('module.exports = ' + varName) !== -1 ||
              content.indexOf('module.exports.' + varName) !== -1) {
            return './modules/' + entries[i] + '/routes/' + files[j].replace('.js', '');
          }
        }
      }
    } catch (e) { console.error('[ApiRegistry] findRouteModule error:', e); }
  }
  return null;
}

function findRouteFiles(baseDir) {
  var results = [];
  function walk(dir) {
    try {
      var entries = fs.readdirSync(dir, { withFileTypes: true });
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var full = path.join(dir, e.name);
        if (e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.')) {
          walk(full);
        } else if (e.isFile() && e.name.endsWith('.routes.js')) {
          results.push(full);
        }
      }
    } catch (e) { console.error('[ApiRegistry] walk error:', e); }
  }
  walk(baseDir);
  return results;
}

function extractRoutesFromFile(filePath) {
  var content = fs.readFileSync(filePath, 'utf8');
  var routes = [];
  var regex = /(?:router|\.)(get|post|put|patch|delete|head|options)\(['"]([^'"]+)['"]/g;
  var m;
  while ((m = regex.exec(content)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2] });
  }
  return routes;
}

function buildRegistry() {
  var registrations = scanServerJs();
  var modulesDir = path.join(__dirname, '../../modules');
  var routeFiles = findRouteFiles(modulesDir);
  var routeMap = {};

  for (var i = 0; i < registrations.length; i++) {
    var reg = registrations[i];
    var resolved = path.resolve(path.join(__dirname, '../../..', reg.modulePath));
    var filePath = resolved;
    if (!filePath.endsWith('.js')) filePath += '.js';

    var exists = fs.existsSync(filePath);
    if (!exists) {
      for (var j = 0; j < routeFiles.length; j++) {
        if (routeFiles[j] === filePath || routeFiles[j].indexOf(path.dirname(filePath)) === 0) {
          filePath = routeFiles[j];
          exists = true;
          break;
        }
      }
    }

    if (exists) {
      var innerRoutes = extractRoutesFromFile(filePath);
      var endpoints = [];
      for (var k = 0; k < innerRoutes.length; k++) {
        var r = innerRoutes[k];
        var fullPath = (reg.basePath + r.path).replace(/\/\//g, '/').replace(/\/$/g, '') || reg.basePath;
        endpoints.push({ method: r.method, path: fullPath });
      }
      routeMap[reg.basePath] = { basePath: reg.basePath, modulePath: reg.modulePath, endpoints: endpoints };
    }
  }

  return routeMap;
}

function getRegistry() {
  if (!cached) cached = buildRegistry();
  return cached;
}

function refreshRegistry() {
  cached = null;
  return getRegistry();
}

function getRouteCount() {
  var registry = getRegistry();
  var total = 0;
  for (var key in registry) {
    total += registry[key].endpoints.length;
  }
  return total;
}

function getMethodCount() {
  var registry = getRegistry();
  var counts = { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0, HEAD: 0, OPTIONS: 0 };
  for (var key in registry) {
    for (var i = 0; i < registry[key].endpoints.length; i++) {
      var method = registry[key].endpoints[i].method;
      if (counts[method] !== undefined) counts[method]++;
    }
  }
  return counts;
}

module.exports = { getRegistry, refreshRegistry, getRouteCount, getMethodCount };
