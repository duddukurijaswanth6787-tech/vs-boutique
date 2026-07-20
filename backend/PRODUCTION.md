# Production Deployment Checklist

## Environment Setup
- [ ] Set NODE_ENV=production
- [ ] Configure DATABASE_URL with production credentials
- [ ] Set JWT_SECRET (min 16 characters, use random generated)
- [ ] Configure CORS_ORIGIN with exact domain
- [ ] Set REDIS_PASSWORD
- [ ] Configure TRUST_PROXY_COUNT for load balancer

## Security
- [ ] Disable Swagger in production (ENABLE_SWAGGER=false)
- [ ] Enable HTTPS/TLS termination at load balancer
- [ ] Review and restrict CORS_ORIGIN
- [ ] Set appropriate THROTTLE_LIMIT
- [ ] Verify Helmet security headers
- [ ] Review file upload size limits

## Database
- [ ] Run prisma migrate deploy
- [ ] Verify all indexes are created
- [ ] Configure connection pooling
- [ ] Set up automated backups
- [ ] Test restore procedure

## Monitoring
- [ ] Verify /health endpoint responds
- [ ] Set up log aggregation
- [ ] Configure alerting for errors
- [ ] Monitor slow queries
- [ ] Set up uptime monitoring

## Performance
- [ ] Enable Redis caching
- [ ] Configure BullMQ workers
- [ ] Set appropriate NODE_OPTIONS for memory
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets

## Deployment
- [ ] Build Docker image
- [ ] Run database migrations
- [ ] Deploy with rolling update
- [ ] Verify health checks pass
- [ ] Monitor error rates post-deploy
