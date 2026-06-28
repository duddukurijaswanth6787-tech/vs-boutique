const axios = require('axios');

async function main() {
  try {
    const res = await axios({
      method: 'OPTIONS',
      url: 'http://10.10.1.25:3000/auth/login',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    console.log('OPTIONS Status:', res.status);
    console.log('OPTIONS Headers:', res.headers);
  } catch (err) {
    if (err.response) {
      console.log('OPTIONS Failed:', err.response.status, err.response.headers);
    } else {
      console.log('OPTIONS Error:', err.message);
    }
  }
}

main();
