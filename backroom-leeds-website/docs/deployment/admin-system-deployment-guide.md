# Admin Dashboard Deployment Guide

## Prerequisites
- Node.js 20.x
- npm 10.x
- Supabase Project
- Vercel Account (Recommended)

## Environment Configuration

### Required Environment Variables
```bash
# Authentication
AUTH_SECRET=           # Generate using `openssl rand -hex 32`
AUTH_ISSUER=           # Your domain (e.g., https://backroomleeds.com)
NEXTAUTH_URL=          # Production URL

# Database
SUPABASE_URL=          # Supabase Project URL
SUPABASE_SERVICE_KEY=  # Supabase Service Role Key

# Security
PASSWORD_PEPPER=       # Additional server-side password salt
JWT_SECRET=            # Long, random string for JWT signing

# 2FA
TOTP_ENCRYPTION_KEY=   # AES-256 encryption key for 2FA secrets
```

## Deployment Steps

### 1. Local Testing
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### 2. Production Deployment (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Post-Deployment Checklist

### Security Configuration
- [ ] Verify all environment variables
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring and logging
- [ ] Perform initial security scan

### Performance Optimization
- Enable server-side caching
- Configure CDN for static assets
- Optimize database indexes

## Rollback Procedure
```bash
# Revert to previous deployment
vercel rollback
```

## Monitoring and Logging
- Use Vercel Analytics
- Configure Sentry for error tracking
- Set up Slack/Discord alerts for critical errors

## Compliance Verification
- Confirm WCAG 2.1 AA compliance
- Validate GDPR data handling
- Review OWASP security standards

## Maintenance Window
Recommended monthly maintenance:
- Update dependencies
- Run security audits
- Review access logs
- Rotate encryption keys

## Troubleshooting
- Check Vercel deployment logs
- Review Supabase database connections
- Verify authentication middleware