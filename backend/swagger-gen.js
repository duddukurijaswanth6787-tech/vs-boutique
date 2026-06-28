const fs = require('fs');
const path = require('path');
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'VS Boutique API',
    version: '1.0.0',
    description: 'API documentation for the VS Boutique platform (Admin, Owner, and Mobile)',
    contact: {
      name: 'VS Boutique Support'
    }
  },
  host: 'localhost:3000',
  tags: [
    { name: 'Auth', description: 'User authentication and password management' },
    { name: 'Boutique', description: 'Boutique profile management, discovery, and listings' },
    { name: 'Owner Portal', description: 'Boutique Owner portal endpoints (profile, staff, and services)' },
    { name: 'Designs', description: 'Boutique catalog designs and collections management' },
    { name: 'Bookings', description: 'Customer bookings, scheduling, and appointments' },
    { name: 'Orders', description: 'Order placements, tracking, status updates, and history' },
    { name: 'Payments', description: 'Payment processing, checkouts, refunds, and integrations' },
    { name: 'Payouts', description: 'Boutique commissions, payouts, and admin generation' },
    { name: 'Subscriptions', description: 'SaaS subscription plans, upgrades, and licensing' },
    { name: 'Support Tickets', description: 'Support, query tickets, and admin/owner communication' },
    { name: 'Notifications', description: 'Push notifications, campaigns, templates, and logs' },
    { name: 'Measurements', description: 'Customer sizing, measurements, and profiles' },
    { name: 'Dashboard', description: 'Dashboard analytics, metrics, and data charts' },
    { name: 'Admin Portal', description: 'General platform management and settings' },
    { name: 'Owners Admin', description: 'Super Admin owner invitations and management' },
    { name: 'Customers Admin', description: 'Super Admin customer records management' },
    { name: 'Marketplace Insights', description: 'Marketplace trends, stats, and business analytics' },
    { name: 'Reviews', description: 'Boutique reviews, ratings, and moderation' },
    { name: 'Admin', description: 'General administration endpoints (e.g. file uploads)' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/server.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('🔄 Autogen completed. Processing paths for custom categorization tags...');
  
  const filePath = path.join(__dirname, outputFile);
  if (fs.existsSync(filePath)) {
    const swaggerJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Categorize endpoints under proper tags based on path pattern
    Object.keys(swaggerJson.paths).forEach(pathKey => {
      let tag = 'Admin Portal';
      const lowerPath = pathKey.toLowerCase();
      
      if (lowerPath.startsWith('/auth')) tag = 'Auth';
      else if (lowerPath.startsWith('/boutiques')) tag = 'Boutique';
      else if (lowerPath.startsWith('/dashboard')) tag = 'Dashboard';
      else if (lowerPath.startsWith('/owners')) tag = 'Owners Admin';
      else if (lowerPath.startsWith('/owner')) tag = 'Owner Portal';
      else if (lowerPath.startsWith('/designs')) tag = 'Designs';
      else if (lowerPath.startsWith('/orders')) tag = 'Orders';
      else if (lowerPath.startsWith('/notifications')) tag = 'Notifications';
      else if (lowerPath.startsWith('/measurements')) tag = 'Measurements';
      else if (lowerPath.startsWith('/payments')) tag = 'Payments';
      else if (lowerPath.startsWith('/payouts')) tag = 'Payouts';
      else if (lowerPath.startsWith('/admin/customers')) tag = 'Customers Admin';
      else if (lowerPath.startsWith('/bookings')) tag = 'Bookings';
      else if (lowerPath.startsWith('/reviews')) tag = 'Reviews';
      else if (lowerPath.startsWith('/admin/marketplace-insights')) tag = 'Marketplace Insights';
      else if (lowerPath.startsWith('/subscriptions')) tag = 'Subscriptions';
      else if (lowerPath.startsWith('/tickets')) tag = 'Support Tickets';
      else if (lowerPath.startsWith('/admin')) tag = 'Admin Portal';
      else if (lowerPath.startsWith('/upload')) tag = 'Admin';
      
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
      methods.forEach(method => {
        if (swaggerJson.paths[pathKey][method]) {
          swaggerJson.paths[pathKey][method].tags = [tag];
        }
      });
    });
    
    fs.writeFileSync(filePath, JSON.stringify(swaggerJson, null, 2), 'utf8');
    console.log('✅ Swagger output file generated and categorized successfully!');
  }
  process.exit(0);
});
