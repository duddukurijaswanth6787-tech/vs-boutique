const http = require('http');

const request = (url) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - start,
          data: JSON.parse(data)
        });
      });
    }).on('error', reject);
  });
};

async function test() {
  console.log("Fetching /boutiques/public...");
  let res1 = await request('http://localhost:3005/boutiques/public');
  console.log(`Time: ${res1.time}ms`);

  console.log("Fetching /boutiques/public/9713de00-8c88-48c2-9ecc-902b86954f96...");
  let res2 = await request('http://localhost:3005/boutiques/public/9713de00-8c88-48c2-9ecc-902b86954f96');
  console.log(`Time: ${res2.time}ms`);

  console.log("Fetching /reviews/boutique/9713de00-8c88-48c2-9ecc-902b86954f96...");
  let res3 = await request('http://localhost:3005/reviews/boutique/9713de00-8c88-48c2-9ecc-902b86954f96');
  console.log(`Time: ${res3.time}ms`);
}

test();
