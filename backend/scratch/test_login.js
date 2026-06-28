const axios = require('axios');

async function main() {
  try {
    const res = await axios.post('http://localhost:3000/auth/login', {
      username: 'superadmin',
      password: 'admin@123'
    });
    console.log('Login Response:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.log('Login Failed:', err.response.status, err.response.data);
    } else {
      console.log('Login Error:', err.message);
    }
  }
}

main();
