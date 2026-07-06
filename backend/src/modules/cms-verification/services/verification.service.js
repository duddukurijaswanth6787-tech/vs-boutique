const fs = require('fs');
const path = require('path');
const uploadService = require('../../cms-uploads/services/upload.service');
const blueprintService = require('../../cms-blueprints/services/blueprint.service');

class VerificationService {
  /**
   * Run AST and regex structure verification checks on extracted codebase sandboxes
   * @param {string} uploadId - Ingested upload ID
   * @param {string} userId - User executing verification
   * @returns {Promise<Object>} Verification report
   */
  async verifyUpload(uploadId, userId) {
    const upload = await uploadService.getUploadStatus(uploadId);
    if (!upload) {
      throw new Error('Upload task not found.');
    }

    if (upload.status !== 'COMPLETED') {
      throw new Error(`Upload task is in status "${upload.status}" and cannot be verified yet.`);
    }

    const blueprint = await blueprintService.getBlueprint(upload.blueprintId);
    if (!blueprint) {
      throw new Error('Associated blueprint template not found.');
    }

    const sandboxPath = upload.sandboxPath;
    if (!sandboxPath || !fs.existsSync(sandboxPath)) {
      throw new Error('Sandbox extraction path does not exist on disk.');
    }

    console.warn(`🔍 [VERIFY] Initiating AST scan on: ${sandboxPath}`);

    // Gather all files recursively to perform quick AST regex parsing
    const filesList = this._getAllFiles(sandboxPath);
    
    const pagesCheck = [];
    const componentsCheck = [];
    const apisCheck = [];
    const envsCheck = [];
    const securityCheck = { passed: true, issues: [] };
    const seoCheck = { passed: true, issues: [] };

    // 1. VERIFY PAGES
    // Check blueprintPages route mapping
    const blueprintPages = blueprint.blueprintPages || [];
    for (const page of blueprintPages) {
      const route = page.route; // e.g. "/cart"
      const pageName = route === '/' ? 'index' : route.replace(/^\//, '').replace(/\//g, '_');
      
      // Page search candidates
      const searchRegex = new RegExp(`(pages|app)/${pageName}\\.(jsx|js|tsx|ts)`, 'i');
      const exists = filesList.some(f => searchRegex.test(f.replace(/\\/g, '/')));
      
      pagesCheck.push({
        route,
        title: page.title,
        status: exists ? 'PASSED' : 'FAILED',
        weight: 10
      });
    }

    // 2. VERIFY COMPONENTS
    // Check blueprintPages components mapping
    const blueprintComponents = [];
    blueprintPages.forEach(p => {
      if (p.components) blueprintComponents.push(...p.components);
    });

    for (const comp of blueprintComponents) {
      const compName = comp.componentName; // e.g. "Navbar"
      const searchRegex = new RegExp(`components/${compName}\\.(jsx|js|tsx|ts)`, 'i');
      let exists = filesList.some(f => searchRegex.test(f.replace(/\\/g, '/')));

      // Fallback: search source files content for declaration e.g. "function Navbar" or "const Navbar"
      if (!exists) {
        exists = this._searchFileContents(filesList, new RegExp(`(const|function)\\s+${compName}\\b`, 'i'));
      }

      componentsCheck.push({
        componentName: compName,
        status: exists ? 'PASSED' : 'FAILED',
        weight: 5
      });
    }

    // 3. VERIFY APIs
    const blueprintApis = blueprint.blueprintApis || [];
    for (const api of blueprintApis) {
      const apiSig = `${api.method} ${api.path}`;
      // Search source files for router definitions e.g. "router.post('/api/v1/cart/add'"
      const methodRegex = new RegExp(`\\.${api.method.toLowerCase()}\\(\\s*['"\`].*${api.path}.*['"\`]`, 'i');
      const exists = this._searchFileContents(filesList, methodRegex);

      apisCheck.push({
        path: api.path,
        method: api.method,
        status: exists ? 'PASSED' : 'FAILED',
        weight: 8
      });
    }

    // 4. VERIFY ENVIRONMENT VARIABLES
    const expectedEnvs = ['STRIPE_PUBLIC_KEY', 'JWT_SECRET'];
    for (const env of expectedEnvs) {
      const envRegex = new RegExp(`process\\.env\\.${env}\\b`);
      const exists = this._searchFileContents(filesList, envRegex) || filesList.some(f => f.endsWith('.env.example'));
      
      envsCheck.push({
        variable: env,
        status: exists ? 'PASSED' : 'FAILED',
        weight: 3
      });
    }

    // 5. SECURITY & SEO AUDITS
    // Check CSP headers configuration in code
    const hasCsp = this._searchFileContents(filesList, /contentsecuritypolicy/i);
    if (!hasCsp) {
      securityCheck.passed = false;
      securityCheck.issues.push('Missing Content-Security-Policy (CSP) headers configuration.');
    }

    // Check SEO og tags
    const hasOgTags = this._searchFileContents(filesList, /og:title/i);
    if (!hasOgTags) {
      seoCheck.passed = false;
      seoCheck.issues.push('Missing OpenGraph metadata tags (og:title / og:description).');
    }

    // Compute Weighted Score
    let totalScore = 0;
    let maxPossible = 0;

    const allChecks = [...pagesCheck, ...componentsCheck, ...apisCheck, ...envsCheck];
    allChecks.forEach(c => {
      maxPossible += c.weight;
      if (c.status === 'PASSED') {
        totalScore += c.weight;
      }
    });

    const scorePercent = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 100;

    const report = {
      uploadId,
      blueprintId: blueprint.id,
      isValid: scorePercent === 100,
      score: scorePercent,
      details: {
        pages: pagesCheck,
        components: componentsCheck,
        apis: apisCheck,
        envs: envsCheck,
        security: securityCheck,
        seo: seoCheck
      },
      verifiedBy: userId,
      verifiedAt: new Date().toISOString()
    };

    // Save report to local uploads DB
    const db = uploadService._readDb();
    const idx = db.uploads.findIndex(u => u.id === uploadId);
    if (idx !== -1) {
      db.uploads[idx].verificationReport = report;
      db.uploads[idx].status = scorePercent === 100 ? 'COMPLETED' : 'FAILED';
      if (scorePercent !== 100) {
        db.uploads[idx].errorDetails = `Verification failed with score ${scorePercent}%. Check report details.`;
      }
      uploadService._writeDb(db);
    }

    return report;
  }

  /**
   * Helper to scan directories recursively
   */
  _getAllFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        this._getAllFiles(fullPath, files);
      } else {
        // Only index code files to optimize performance
        if (/\.(jsx|js|tsx|ts|html|css|json|env|example)$/i.test(item)) {
          files.push(fullPath);
        }
      }
    }
    return files;
  }

  /**
   * Helper to parse file contents matching regex
   */
  _searchFileContents(files, regex) {
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (regex.test(content)) {
          return true;
        }
      } catch (e) { console.error('[Verification Service] _searchFileContents error:', e); }
    }
    return false;
  }
}

module.exports = new VerificationService();
