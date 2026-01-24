# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Supabase account
- Vercel account (recommended) or any Node.js hosting

## Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
cp .env.example .env
```

### Required Variables:

1. **DATABASE_URL**: PostgreSQL connection string
2. **NEXT_PUBLIC_SUPABASE_URL**: Your Supabase project URL
3. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase anonymous key
4. **SUPABASE_SERVICE_ROLE_KEY**: Supabase service role key (keep secret!)
5. **GEMINI_API_KEY**: Google Gemini API key for AI features

### Optional (Recommended for Production):

- **SENTRY_DSN**: Error tracking
- **REDIS_URL**: For advanced rate limiting
- **NEXT_PUBLIC_GA_MEASUREMENT_ID**: Google Analytics

## Database Setup

1. **Run Prisma migrations:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Seed database (optional):**
   ```bash
   npx prisma db seed
   ```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Add environment variables in Vercel dashboard**

4. **Configure build settings:**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Option 2: Docker

1. **Build Docker image:**
   ```bash
   docker build -t taskflow .
   ```

2. **Run container:**
   ```bash
   docker run -p 3000:3000 --env-file .env taskflow
   ```

### Option 3: Traditional VPS

1. **Install dependencies:**
   ```bash
   npm install --production
   ```

2. **Build application:**
   ```bash
   npm run build
   ```

3. **Start with PM2:**
   ```bash
   pm2 start npm --name "taskflow" -- start
   ```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test database connection (`/api/health`)
- [ ] Verify authentication works
- [ ] Test file uploads (if applicable)
- [ ] Check error tracking is working
- [ ] Verify rate limiting is active
- [ ] Test on mobile devices
- [ ] Run security audit
- [ ] Set up database backups
- [ ] Configure CDN (if needed)
- [ ] Set up monitoring alerts

## Monitoring

### Health Check Endpoint

```
GET /api/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "api": "operational"
  }
}
```

### Recommended Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry
- **Performance**: Vercel Analytics, Google Analytics
- **Logs**: Logtail, Papertrail

## Security Considerations

1. **Never commit `.env` file**
2. **Use strong database passwords**
3. **Enable 2FA on all services**
4. **Regularly update dependencies**
5. **Monitor for security vulnerabilities**
6. **Use HTTPS only**
7. **Implement rate limiting**
8. **Regular security audits**

## Backup Strategy

### Database Backups

**Automated (Recommended):**
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**Manual:**
```bash
npx prisma db pull
```

### File Backups

If using file uploads, ensure regular backups of:
- User avatars
- Project attachments
- Page cover images

## Rollback Procedure

1. **Revert to previous deployment:**
   ```bash
   vercel rollback
   ```

2. **Rollback database migration:**
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

## Performance Optimization

1. **Enable caching headers**
2. **Use CDN for static assets**
3. **Optimize images**
4. **Enable compression**
5. **Monitor database query performance**
6. **Use connection pooling**

## Troubleshooting

### Build Fails

- Check Node.js version (18+)
- Verify all dependencies are installed
- Check for TypeScript errors

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check database is accessible
- Verify SSL settings

### Authentication Issues

- Verify Supabase keys are correct
- Check Supabase project is active
- Verify redirect URLs are configured

## Support

For issues or questions:
- Check documentation
- Review error logs
- Contact support team
