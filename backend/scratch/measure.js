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

async function run() {
  console.log("=== API PERFORMANCE AUDIT ===");
  try {
    // 1. Audit public list
    const listRes = await request('http://localhost:3005/boutiques/public');
    console.log(`GET /boutiques/public: Status: ${listRes.status}, Network Time: ${listRes.time}ms, Items: ${listRes.data.length}`);

    if (listRes.data.length > 0) {
      const firstBoutique = listRes.data[0];
      const id = firstBoutique.id || firstBoutique._id;
      
      console.log(`Selected Boutique ID: ${id} (${firstBoutique.name})`);

      // 2. Audit boutique details
      const detailRes = await request(`http://localhost:3005/boutiques/public/${id}`);
      console.log(`GET /boutiques/public/${id}: Status: ${detailRes.status}, Network Time: ${detailRes.time}ms`);

      // 3. Audit boutique reviews
      const reviewsRes = await request(`http://localhost:3005/reviews/boutique/${id}`);
      console.log(`GET /reviews/boutique/${id}: Status: ${reviewsRes.status}, Network Time: ${reviewsRes.time}ms, Reviews Count: ${reviewsRes.data?.data?.length || 0}`);
    } else {
      console.log("No boutiques found in database to run detailed checks.");
    }
  } catch (err) {
    console.error("Audit failed:", err.message);
  }
}

run();
