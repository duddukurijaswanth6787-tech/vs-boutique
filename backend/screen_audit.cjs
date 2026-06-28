const fs = require('fs');
const path = require('path');

const screenDir = path.join(__dirname, '..', 'mobile', 'src', 'screens');
const screens = fs.readdirSync(screenDir).filter(f => f.endsWith('.js'));

for (const file of screens) {
    const fp = path.join(screenDir, file);
    const content = fs.readFileSync(fp, 'utf8');

    const importsApi = content.includes("from '../services/api'");
    const usesStore = content.includes('useStore') || content.includes('../store/useStore');
    const hasApiCalls = /\bapi\.\w+/.test(content) || /\bfetch\(/.test(content);
    const handlesAuth = /\b(token|Token|Authorization|auth|isAuthenticated)\b/.test(content);
    const hasNavigation = /router\.(push|replace)|navigation\.navigate/.test(content);
    const usesRouter = content.includes('useRouter');
    const screenName = file.replace('.js', '');

    // Detect what auth-related screens do
    const redirectsToLogin = content.includes('push') && content.includes('login') || content.includes('Login');
    const checksSession = content.includes('isAuthenticated') || content.includes('getToken');

    const apisUsed = (content.match(/api\.\w+/g) || []).join(', ');

    console.log(screenName + ':');
    if (screenName === 'LoginScreen' || screenName === 'OtpScreen') {
        console.log('  AUTH FLOW SCREEN (already verified)');
    }
    console.log('  Imports API:    ' + (importsApi ? 'YES' : 'NO'));
    console.log('  Uses Store:     ' + (usesStore ? 'YES' : 'NO'));
    console.log('  API calls:      ' + (hasApiCalls ? 'YES (' + apisUsed + ')' : 'NO'));
    console.log('  Auth-aware:     ' + (handlesAuth ? 'YES' : 'NO'));
    console.log('  Router:         ' + (usesRouter ? 'YES' : 'NO'));
    console.log('');
}
