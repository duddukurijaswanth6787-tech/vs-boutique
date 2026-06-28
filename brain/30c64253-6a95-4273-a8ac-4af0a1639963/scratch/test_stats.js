const http = require('http');

http.get('http://localhost:3000/dashboard/stats', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const stats = JSON.parse(data);
            console.log('Dashboard Stats:', JSON.stringify(stats, null, 2));
            if (stats.trends) {
                console.log('✅ Trends found in response');
            } else {
                console.error('❌ Trends NOT found in response');
            }
        } catch (e) {
            console.error('Failed to parse response:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error connecting to server:', err.message);
    console.log('Make sure the backend server is running on port 5000');
});
