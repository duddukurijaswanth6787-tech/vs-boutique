const registryService = require('./api-registry.service');

function _sanitizePath(p) {
  return p.replace(/:(\w+)/g, '{$1}').replace(/\/\//g, '/');
}

function _methodToFunctionName(method, p) {
  var segments = p.split('/').filter(Boolean);
  var last = segments[segments.length - 1] || '';
  var clean = last.replace(/:/g, '').replace(/-/g, '_');
  return method.toLowerCase() + clean.charAt(0).toUpperCase() + clean.slice(1);
}

function generateJavaScriptSdk(baseUrl) {
  baseUrl = baseUrl || 'https://api.example.com';
  var registry = registryService.getRegistry();
  var lines = [];
  lines.push('class ApiClient {');
  lines.push('  constructor(apiKey) {');
  lines.push("    this.baseUrl = '" + baseUrl + "';");
  lines.push('    this.headers = {');
  lines.push("      'Authorization': `Bearer ${apiKey}`,");
  lines.push("      'Content-Type': 'application/json'");
  lines.push('    };');
  lines.push('  }');
  lines.push('');

  for (var key in registry) {
    var info = registry[key];
    for (var i = 0; i < info.endpoints.length; i++) {
      var ep = info.endpoints[i];
      var funcName = _methodToFunctionName(ep.method, ep.path);
      var sanitized = _sanitizePath(ep.path);
      var params = ep.path.match(/:(\w+)/g) || [];
      var paramNames = params.map(function(p) { return p.replace(':', ''); });
      var args = paramNames.concat(ep.method === 'GET' || ep.method === 'DELETE' ? 'params = {}' : 'body = {}').join(', ');
      var urlStr = sanitized.replace(/\{(\w+)\}/g, '${' + '$1}');
      var bodyStr = (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH')
        ? ',\n      body: JSON.stringify(body)'
        : ',\n      params';
      lines.push('  async ' + funcName + '(' + args + ') {');
      lines.push('    const url = `' + '${this.baseUrl}' + urlStr + '`;');
      lines.push('    const res = await fetch(url, {');
      lines.push("      method: '" + ep.method + "',");
      lines.push('      headers: this.headers' + bodyStr);
      lines.push('    });');
      lines.push('    return res.json();');
      lines.push('  }');
      lines.push('');
    }
  }

  lines.push('}');
  lines.push('');
  lines.push('module.exports = ApiClient;');
  return lines.join('\n');
}

function generatePythonSdk(baseUrl) {
  baseUrl = baseUrl || 'https://api.example.com';
  var registry = registryService.getRegistry();
  var lines = [];
  lines.push('import requests');
  lines.push('');
  lines.push('');
  lines.push('class ApiClient:');
  lines.push('    def __init__(self, api_key):');
  lines.push("        self.base_url = '" + baseUrl + "'");
  lines.push('        self.headers = {');
  lines.push("            'Authorization': f'Bearer {api_key}',");
  lines.push("            'Content-Type': 'application/json'");
  lines.push('        }');
  lines.push('');

  for (var key in registry) {
    var info = registry[key];
    for (var i = 0; i < info.endpoints.length; i++) {
      var ep = info.endpoints[i];
      var funcName = _methodToFunctionName(ep.method, ep.path);
      var sanitized = _sanitizePath(ep.path);
      var params = ep.path.match(/:(\w+)/g) || [];
      var paramNames = params.map(function(p) { return p.replace(':', ''); });
      var pyArgs = paramNames.concat(ep.method === 'GET' || ep.method === 'DELETE' ? 'params=None' : 'body=None').join(', ');
      var urlStr = sanitized;
      for (var j = 0; j < paramNames.length; j++) {
        var pn = paramNames[j];
        urlStr = urlStr.replace('{' + pn + '}', "' + str(" + pn + ") + '");
      }
      urlStr = "f'" + urlStr + "'";
      var pyBody = ep.method === 'GET' || ep.method === 'DELETE' ? 'params=params' : 'json=body';
      lines.push('    def ' + funcName + '(self, ' + pyArgs + '):');
      lines.push('        url = self.base_url + ' + urlStr);
      lines.push('        res = requests.' + ep.method.toLowerCase() + '(url, headers=self.headers, ' + pyBody + ')');
      lines.push('        return res.json()');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateCurlExamples(baseUrl) {
  baseUrl = baseUrl || 'https://api.example.com';
  var registry = registryService.getRegistry();
  var examples = [];
  for (var key in registry) {
    var info = registry[key];
    for (var i = 0; i < info.endpoints.length; i++) {
      var ep = info.endpoints[i];
      var params = ep.path.match(/:(\w+)/g) || [];
      var samplePath = ep.path;
      for (var j = 0; j < params.length; j++) {
        samplePath = samplePath.replace(params[j], '{' + params[j].replace(':', '') + '}');
      }
      var bodyFlag = (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH')
        ? " \\\n  -d '{}'"
        : '';
      examples.push({
        method: ep.method,
        path: ep.path,
        curl: "curl -X " + ep.method + " '" + baseUrl + samplePath + "' \\\n  -H 'Authorization: Bearer <api-key>' \\\n  -H 'Content-Type: application/json'" + bodyFlag
      });
    }
  }
  return examples;
}

function getSdk(options) {
  options = options || {};
  var lang = options.language || 'javascript';
  var baseUrl = options.baseUrl || 'https://api.example.com';
  switch (lang) {
    case 'javascript': return generateJavaScriptSdk(baseUrl);
    case 'python': return generatePythonSdk(baseUrl);
    case 'curl': return generateCurlExamples(baseUrl);
    default: return generateJavaScriptSdk(baseUrl);
  }
}

module.exports = { getSdk, generateJavaScriptSdk, generatePythonSdk, generateCurlExamples };
