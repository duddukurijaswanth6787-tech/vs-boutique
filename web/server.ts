import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configurations
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json());

// Database connection config
const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vs_boutique";
console.log('[Server] Connecting to database:', dbUrl);

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5000, // Timeout after 5s to trigger local fallback fast
});

let useFallback = false;

// Fallback in-memory database arrays
let fallbackUsers: any[] = [
  { id: 1, email: 'guest@vsboutique.com', password: '$2b$10$fallbackhashpasswordhere123' }
];
let fallbackMeasurements: any[] = [
  { id: 101, user_id: 1, profile_name: 'My Default Blouse', garment_type: 'Blouse', values: { bust: 36, waist: 30, hips: 38, length: 15 }, updated_at: new Date() },
  { id: 102, user_id: 1, profile_name: 'Festive Lehenga Sizing', garment_type: 'Lehenga', values: { bust: 38, waist: 32, hips: 40, length: 42 }, updated_at: new Date() }
];
let fallbackOrders: any[] = [
  { id: 201, user_id: 1, product_name: 'Handwoven Banarasi Saree', price: 8499, status: 'Processing', locked_measurements: { bust: 36, waist: 30, hips: 38, length: 15 }, created_at: new Date() }
];

async function initDb() {
  try {
    const client = await pool.connect();
    console.log('[Server] Connected to PostgreSQL successfully');

    // Enable pgcrypto extension for gen_random_uuid support
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"').catch(() => {});

    // Create users table if it doesn't exist (using UUID format)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add email and password columns if users table already exists without them
    try {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255)');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
      await client.query('ALTER TABLE users ALTER COLUMN phone DROP NOT NULL').catch(() => {});
      await client.query('ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)').catch(() => {});
    } catch (e) {
      console.log('[Server] Note: Email/Password columns already configured or altered.');
    }

    // Create measurement_profiles table referencing users(id) via UUID
    await client.query(`
      CREATE TABLE IF NOT EXISTS measurement_profiles (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        profile_name VARCHAR(255) NOT NULL,
        garment_type VARCHAR(50) NOT NULL,
        values JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create bespoke_orders table referencing users(id) via UUID
    await client.query(`
      CREATE TABLE IF NOT EXISTS bespoke_orders (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        locked_measurements JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create site_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default site settings if empty
    const settingsCheck = await client.query('SELECT COUNT(*) FROM site_settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO site_settings (key, value) VALUES 
        ('announcement_bar', '{"enabled": true, "text1": "FREE SHIPPING on orders above ₹999", "text2": "COD Available", "text3": "Easy Returns & Exchanges"}'),
        ('hero_banner', '{"title": "Exclusive Bridal Collection", "subtitle": "Tailored to your perfect silhouette with custom boutique master tailors.", "ctaText": "Book Tailoring Session"}'),
        ('general_settings', '{"codEnabled": true, "returnsEnabled": true, "supportPhone": "+91 9999999912"}')
      `);
      console.log('[Server] Seeded default site settings in PostgreSQL');
    }

    // Create default guest user if database is empty or doesn't have guest
    const guestId = '11111111-1111-1111-1111-111111111111';
    const userRes = await client.query('SELECT * FROM users WHERE email = $1', ['guest@vsboutique.com']);
    if (userRes.rows.length === 0) {
      const hashedPass = await bcrypt.hash('password123', 10);
      await client.query(
        'INSERT INTO users (id, email, password, phone) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [guestId, 'guest@vsboutique.com', hashedPass, '0000000000']
      );
      console.log('[Server] Initialized guest user in PostgreSQL');
    }

    client.release();
    console.log('[Server] Database schemas validated successfully.');
  } catch (error) {
    console.error('[Server] Database initialization failed. Seamless local fallback mode ENABLED.', error);
    useFallback = true;
  }
}

// Initialize database
initDb();

const DEFAULT_GUEST_ID = '11111111-1111-1111-1111-111111111111';

// JWT Authentication Middleware with Guest fallback and UUID safety validation
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  const fallbackToGuest = () => {
    req.user = { id: DEFAULT_GUEST_ID, email: 'guest@vsboutique.com' };
    next();
  };

  if (!token) {
    return fallbackToGuest();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'vsboutique_secret', (err: any, user: any) => {
    if (err || !user || !user.id) {
      return fallbackToGuest();
    }
    
    // Ensure the ID is a valid UUID structure to prevent PostgreSQL type mismatch crashes
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.warn('[Server] Legacy or invalid user ID format in token, falling back to Guest UUID.');
      return fallbackToGuest();
    }

    req.user = user;
    next();
  });
}

// ── AUTHENTICATION ENDPOINTS ───────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    let userId: any;

    if (useFallback) {
      const exists = fallbackUsers.some(u => u.email === email);
      if (exists) return res.status(400).json({ error: 'User already exists' });
      userId = fallbackUsers.length + 1;
      fallbackUsers.push({ id: userId, email, password: hash(password) });
    } else {
      const checkRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (checkRes.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }
      const insertRes = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
        [email, hashed]
      );
      userId = insertRes.rows[0].id;
    }

    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'vsboutique_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: userId, email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user: any = null;

    if (useFallback) {
      user = fallbackUsers.find(u => u.email === email);
    } else {
      const resDb = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (resDb.rows.length > 0) {
        user = resDb.rows[0];
      }
    }

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // For local fallback password comparison bypass check
    const match = useFallback ? (password === 'password123' || password) : await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'vsboutique_secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper simple hash for fallback register mock
function hash(val: string) { return val; }

// ── CUSTOM MEASUREMENT BLUEPRINTS ─────────────────
app.get('/api/measurements', authenticateToken, async (req: any, res: any) => {
  try {
    if (useFallback) {
      const userProfiles = fallbackMeasurements.filter(m => m.user_id === req.user.id);
      return res.json(userProfiles);
    }

    const result = await pool.query(
      'SELECT id, profile_name as "profileName", garment_type as "garmentType", values, updated_at as "updatedAt" FROM measurement_profiles WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/measurements', authenticateToken, async (req: any, res: any) => {
  const { id, profileName, garmentType, values } = req.body;
  if (!profileName || !garmentType || !values) {
    return res.status(400).json({ error: 'Missing required parameters profileName, garmentType, or values' });
  }

  try {
    if (useFallback) {
      if (id) {
        const idx = fallbackMeasurements.findIndex(m => m.id === Number(id) && m.user_id === req.user.id);
        if (idx !== -1) {
          fallbackMeasurements[idx] = { ...fallbackMeasurements[idx], profile_name: profileName, garment_type: garmentType, values, updated_at: new Date() };
          return res.json(fallbackMeasurements[idx]);
        }
      }
      const newProfile = { id: fallbackMeasurements.length + 101, user_id: req.user.id, profile_name: profileName, garment_type: garmentType, values, updated_at: new Date() };
      fallbackMeasurements.push(newProfile);
      return res.json(newProfile);
    }

    if (id) {
      const updateRes = await pool.query(
        'UPDATE measurement_profiles SET profile_name = $1, garment_type = $2, values = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING id, profile_name as "profileName", garment_type as "garmentType", values, updated_at as "updatedAt"',
        [profileName, garmentType, JSON.stringify(values), id, req.user.id]
      );
      if (updateRes.rows.length > 0) {
        return res.json(updateRes.rows[0]);
      }
    }

    const insertRes = await pool.query(
      'INSERT INTO measurement_profiles (user_id, profile_name, garment_type, values) VALUES ($1, $2, $3, $4) RETURNING id, profile_name as "profileName", garment_type as "garmentType", values, updated_at as "updatedAt"',
      [req.user.id, profileName, garmentType, JSON.stringify(values)]
    );
    res.json(insertRes.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/measurements/:id', authenticateToken, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    if (useFallback) {
      const len = fallbackMeasurements.length;
      fallbackMeasurements = fallbackMeasurements.filter(m => !(m.id === Number(id) && m.user_id === req.user.id));
      if (fallbackMeasurements.length < len) {
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Profile not found' });
    }

    const delRes = await pool.query('DELETE FROM measurement_profiles WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (delRes.rowCount !== null && delRes.rowCount > 0) {
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Profile not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── CUSTOM ORDERS PLACEMENT ────────────────────
app.post('/api/orders', authenticateToken, async (req: any, res: any) => {
  const { productName, price, lockedMeasurements } = req.body;
  if (!productName || !price || !lockedMeasurements) {
    return res.status(400).json({ error: 'Missing required parameters: productName, price, or lockedMeasurements' });
  }

  try {
    if (useFallback) {
      const newOrder = {
        id: fallbackOrders.length + 201,
        user_id: req.user.id,
        product_name: productName,
        price: Number(price),
        status: 'Processing',
        locked_measurements: lockedMeasurements,
        created_at: new Date()
      };
      fallbackOrders.push(newOrder);
      return res.json(newOrder);
    }

    const insertRes = await pool.query(
      'INSERT INTO bespoke_orders (user_id, product_name, price, status, locked_measurements) VALUES ($1, $2, $3, $4, $5) RETURNING id, product_name as "productName", price, status, locked_measurements as "lockedMeasurements", created_at as "createdAt"',
      [req.user.id, productName, price, 'Processing', JSON.stringify(lockedMeasurements)]
    );
    res.json(insertRes.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', authenticateToken, async (req: any, res: any) => {
  try {
    if (useFallback) {
      const userOrders = fallbackOrders.filter(o => o.user_id === req.user.id);
      return res.json(userOrders.map(o => ({
        id: o.id,
        productName: o.product_name,
        price: o.price,
        status: o.status,
        lockedMeasurements: o.locked_measurements,
        createdAt: o.created_at
      })));
    }

    const result = await pool.query(
      'SELECT id, product_name as "productName", price, status, locked_measurements as "lockedMeasurements", created_at as "createdAt" FROM bespoke_orders WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── STOREFRONT CONFIG & ANALYTICS ROUTES ────────
app.get('/api/site-settings', async (req: any, res: any) => {
  try {
    if (useFallback) {
      return res.json({
        announcement_bar: { enabled: true, text1: "FREE SHIPPING on orders above ₹999", text2: "COD Available", text3: "Easy Returns & Exchanges" },
        hero_banner: { title: "Exclusive Bridal Collection", subtitle: "Tailored to your perfect silhouette with custom boutique master tailors.", ctaText: "Book Tailoring Session" },
        general_settings: { codEnabled: true, returnsEnabled: true, supportPhone: "+91 9999999912" }
      });
    }
    const result = await pool.query('SELECT key, value FROM site_settings');
    const settings: any = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/site-settings', async (req: any, res: any) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Missing key or value' });
  }
  try {
    if (useFallback) {
      return res.json({ success: true, key, value });
    }
    await pool.query(
      'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [key, JSON.stringify(value)]
    );
    res.json({ success: true, key, value });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/storefront-reports', async (req: any, res: any) => {
  try {
    if (useFallback) {
      return res.json({
        totalSales: 15498,
        ordersCount: 2,
        customersCount: 1,
        categoryBreakdown: { Blouse: 1, Lehenga: 1, Saree: 0 },
        recentActivity: [
          { id: 201, type: 'order', label: 'Order placed for Handwoven Banarasi Saree (₹8,499)', time: 'Today' },
          { id: 102, type: 'measurement', label: 'Measurement profile created: Festive Lehenga Sizing', time: 'Yesterday' }
        ]
      });
    }

    // 1. Total sales value & counts
    const salesRes = await pool.query('SELECT COUNT(*) as count, SUM(price) as sales FROM bespoke_orders');
    const totalSales = Number(salesRes.rows[0].sales || 0);
    const ordersCount = Number(salesRes.rows[0].count || 0);

    // 2. Total registered users
    const usersRes = await pool.query('SELECT COUNT(*) as count FROM users');
    const customersCount = Number(usersRes.rows[0].count || 0);

    // 3. Category sizing distribution
    const categoryRes = await pool.query('SELECT garment_type, COUNT(*) as count FROM measurement_profiles GROUP BY garment_type');
    const categoryBreakdown: any = {};
    categoryRes.rows.forEach(r => {
      categoryBreakdown[r.garment_type] = Number(r.count);
    });

    // 4. Recent activity feed
    const recentOrders = await pool.query('SELECT id, product_name, price, created_at FROM bespoke_orders ORDER BY id DESC LIMIT 5');
    const recentActivity = recentOrders.rows.map(o => ({
      id: o.id,
      type: 'order',
      label: `Order placed for ${o.product_name} (₹${o.price})`,
      time: new Date(o.created_at).toLocaleDateString()
    }));

    res.json({
      totalSales,
      ordersCount,
      customersCount,
      categoryBreakdown,
      recentActivity
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/update-status', authenticateToken, async (req: any, res: any) => {
  const { orderId, status } = req.body;
  if (!orderId || !status) {
    return res.status(400).json({ error: 'Missing orderId or status' });
  }
  try {
    if (useFallback) {
      const idx = fallbackOrders.findIndex(o => o.id === Number(orderId));
      if (idx !== -1) {
        fallbackOrders[idx].status = status;
        return res.json(fallbackOrders[idx]);
      }
      return res.status(404).json({ error: 'Order not found' });
    }
    const updateRes = await pool.query(
      'UPDATE bespoke_orders SET status = $1 WHERE id = $2 RETURNING id, product_name as "productName", price, status, locked_measurements as "lockedMeasurements", created_at as "createdAt"',
      [status, orderId]
    );
    if (updateRes.rows.length > 0) {
      return res.json(updateRes.rows[0]);
    }
    res.status(404).json({ error: 'Order not found' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── FULL-STACK EXPRESS MIDDLEWARE CONFIG ─────────
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  // Vite Dev middleware mode injection
  console.log('[Server] Integrating Vite Dev server in middlewareMode');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  // Serve static dist folder in production
  console.log('[Server] Serving static content from dist/ folder');
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Full-stack server running successfully at http://localhost:${PORT}`);
});
