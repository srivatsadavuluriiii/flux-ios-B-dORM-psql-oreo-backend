---
trigger: model_decision
description: 
globs: 
---
# Flux Backend Development: Phase-by-Phase Checkpoint System with Railway Deployment

Based on the search results and your tech stack (Svelte, Railway, Supabase Auth, PostgreSQL, Redis, Google Gemini 2.5 Flash, PhonePe, Blynk.io, Hyperledger Fabric), here's the comprehensive checkpoint-based system with Railway deployment steps integrated:
- Remeber to update .env file regularly after each step.

## Phase 1: Core Infrastructure & Database Setup (Weeks 1-2)

### Checkpoint 1.1: Project Foundation Setup
**Deliverables:**
```
✅ Package.json with Bun configuration
✅ Basic Svelte project structure with @sveltejs/adapter-node
✅ TypeScript configuration
✅ Environment configuration (.env.local, .env.example)
✅ Railway deployment configuration (railway.json)
✅ Basic middleware.ts setup
```

**Railway Deployment Steps:**
1. **Install Railway CLI:**
   ```bash
   bun add -g @railway/cli
   railway login
   ```

2. **Initialize Railway Project:**
   ```bash
   cd /path/to/flux-backend
   railway init
   # Select "Empty Project"
   # Set project name as "flux-backend"
   ```

3. **Configure Svelte for Railway:**
   ```bash
   bun add @sveltejs/adapter-node --save-dev
   ```
   Update `svelte.config.js`:
   ```javascript
   import adapter from '@sveltejs/adapter-node';
   ```

4. **Set Initial Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   ```

**Testing Criteria:**
- `bun install` works without errors
- `bun dev` starts development server
- TypeScript compilation successful
- Railway deployment successful: `railway up`

---

### Checkpoint 1.2: Database Infrastructure
**Deliverables:**
```
✅ Railway PostgreSQL connection (lib/database/postgres.ts)
✅ Redis connection setup (lib/database/redis.ts)
✅ Database connection pooling (lib/database/connection-pool.ts)
✅ Initial schema migrations (001_initial_schema.sql)
✅ Database query builder utilities (lib/database/query-builder.ts)
```

**Railway Deployment Steps:**
1. **Add PostgreSQL Database:**
   ```bash
   railway add
   # Select "PostgreSQL"
   ```

2. **Add Redis Database:**
   ```bash
   railway add
   # Select "Redis"
   ```

3. **Configure Database Variables:**
   ```bash
   railway variables set DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   railway variables set REDIS_URL=${{Redis.REDIS_URL}}
   ```

4. **Deploy with Database Connections:**
   ```bash
   railway up
   ```

5. **Verify Database Connections:**
   ```bash
   railway logs
   # Check for successful database connections
   ```

**Testing Criteria:**
- Database connections established successfully on Railway
- Connection pooling works under load
- Migration system functional in production
- Railway dashboard shows healthy database services

---

### Checkpoint 1.3: Core Middleware Stack
**Deliverables:**
```
✅ Error handling middleware (lib/middleware/error-handler.ts)
✅ Request logging middleware (lib/middleware/request-logger.ts)
✅ CORS configuration (lib/middleware/cors-middleware.ts)
✅ Security headers (lib/middleware/security-headers.ts)
✅ Compression middleware (lib/middleware/compression.ts)
```

**Railway Deployment Steps:**
1. **Configure Domain for Testing:**
   - Go to Railway project settings
   - Under "Environment" → "Generate Domain"
   - Copy generated URL

2. **Set CORS Environment Variables:**
   ```bash
   railway variables set CORS_ORIGIN=https://your-generated-domain.railway.app
   railway variables set NODE_ENV=production
   ```

3. **Deploy Middleware Stack:**
   ```bash
   railway up
   ```

4. **Test Endpoints:**
   ```bash
   # Test health endpoint
   curl https://your-generated-domain.railway.app/api/health
   ```

**Testing Criteria:**
- Railway deployment successful with middleware
- Generated domain accessible
- Security headers present in Railway deployment
- CORS configured for Railway domain

---

## Phase 2: Authentication System (Weeks 3-4)

### Checkpoint 2.1: Supabase Auth Integration
**Deliverables:**
```
✅ Supabase client configuration (lib/database/supabase.ts)
✅ Authentication middleware (lib/middleware/auth-middleware.ts)
✅ JWT token management (lib/services/auth/jwt-manager.ts)
✅ Session management (lib/services/auth/session-manager.ts)
✅ Basic auth routes (app/api/v1/auth/signup/route.ts, signin/route.ts)
```

**Railway Deployment Steps:**
1. **Set Supabase Environment Variables:**
   ```bash
   railway variables set NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   railway variables set SUPABASE_ANON_KEY=your_anon_key
   railway variables set JWT_SECRET=random_32_character_string
   ```

2. **Configure Auth Redirect URLs:**
   - Add Railway domain to Supabase Auth URLs:
   ```
   https://your-generated-domain.railway.app/**
   ```

3. **Deploy Auth System:**
   ```bash
   railway up
   ```

4. **Test Auth Endpoints:**
   ```bash
   # Test signup endpoint
   curl -X POST https://your-generated-domain.railway.app/api/v1/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"testpass123"}'
   ```

**Testing Criteria:**
- Auth endpoints accessible on Railway
- Supabase integration working in production
- JWT tokens generated correctly
- Railway logs show successful auth operations

---

### Checkpoint 2.2: OAuth Providers Setup
**Deliverables:**
```
✅ GitHub OAuth integration (app/api/v1/auth/oauth/github/)
✅ Google OAuth integration (app/api/v1/auth/oauth/google/)
✅ OAuth provider configurations (lib/services/auth/oauth-providers.ts)
✅ OAuth callback handling
✅ Multi-provider user account linking
```

**Railway Deployment Steps:**
1. **Set OAuth Environment Variables:**
   ```bash
   railway variables set GITHUB_CLIENT_ID=your_github_client_id
   railway variables set GITHUB_CLIENT_SECRET=your_github_client_secret
   railway variables set GOOGLE_CLIENT_ID=your_google_client_id
   railway variables set GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

2. **Configure OAuth Redirect URIs:**
   - GitHub: `https://your-generated-domain.railway.app/api/v1/auth/oauth/github/callback`
   - Google: `https://your-generated-domain.railway.app/api/v1/auth/oauth/google/callback`

3. **Deploy OAuth Integration:**
   ```bash
   railway up
   ```

4. **Test OAuth Flows:**
   - Visit OAuth initiation URLs in browser
   - Verify callback handling works

**Testing Criteria:**
- OAuth flows complete successfully on Railway
- Callback URLs work correctly
- User data syncs properly

---

### Checkpoint 2.3: User Data Synchronization
**Deliverables:**
```
✅ Supabase Edge Functions setup (supabase/functions/auth-sync/)
✅ User sync to Railway PostgreSQL (app/api/v1/auth/sync-user/route.ts)
✅ User profile management (app/api/v1/auth/profile/route.ts)
✅ Auth webhook handler (app/api/v1/auth/webhook/route.ts)
✅ User tables in Railway database
```

**Railway Deployment Steps:**
1. **Set Webhook Environment Variables:**
   ```bash
   railway variables set WEBHOOK_SECRET=your_webhook_secret
   railway variables set RAILWAY_API_URL=https://your-generated-domain.railway.app
   ```

2. **Configure Supabase Webhooks:**
   - Set webhook URL: `https://your-generated-domain.railway.app/api/v1/auth/webhook`

3. **Deploy User Sync System:**
   ```bash
   railway up
   ```

4. **Test User Sync:**
   ```bash
   # Monitor Railway logs during user registration
   railway logs --follow
   ```

**Testing Criteria:**
- User data syncs between Supabase and Railway PostgreSQL
- Webhooks trigger correctly
- Railway logs show successful sync operations

---

## Phase 3: Core API Layer (Weeks 5-7)

### Checkpoint 3.1: Expense Management APIs
**Deliverables:**
```
✅ Expense CRUD operations (app/api/v1/expenses/route.ts)
✅ Category management (app/api/v1/expenses/categories/)
✅ Expense analytics (app/api/v1/expenses/analytics/)
✅ Bulk operations (app/api/v1/expenses/bulk/)
✅ Search functionality (app/api/v1/expenses/search/)
✅ Database schema for expenses and categories
```

**Railway Deployment Steps:**
1. **Run Database Migrations:**
   ```bash
   # Update package.json build script:
   # "build": "NODE_ENV=production svelte-kit build && bun run migrate:deploy"
   railway variables set DATABASE_MIGRATE=true
   ```

2. **Set File Upload Environment Variables:**
   ```bash
   railway variables set UPLOAD_MAX_SIZE=10485760  # 10MB
   railway variables set ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
   ```

3. **Deploy Expense APIs:**
   ```bash
   railway up
   ```

4. **Test API Endpoints:**
   ```bash
   # Test expense creation
   curl -X POST https://your-generated-domain.railway.app/api/v1/expenses \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"amount":100,"description":"Test expense","category_id":"uuid"}'
   ```

**Testing Criteria:**
- All expense CRUD operations work on Railway
- Database schema applied successfully
- File uploads work (if implemented)
- Railway performance metrics show acceptable response times

---

### Checkpoint 3.2: Group Management System
**Deliverables:**
```
✅ Group CRUD operations (app/api/v1/groups/route.ts)
✅ Member management (app/api/v1/groups/[id]/members/)
✅ Group expenses (app/api/v1/groups/[id]/expenses/)
✅ Settlement system (app/api/v1/groups/[id]/settlements/)
✅ Balance calculations (app/api/v1/groups/[id]/balances/)
✅ Database schema for groups and relationships
```

**Railway Deployment Steps:**
1. **Set Group Management Variables:**
   ```bash
   railway variables set MAX_GROUP_MEMBERS=50
   railway variables set GROUP_INVITE_EXPIRY=168  # 7 days in hours
   ```

2. **Deploy Group System:**
   ```bash
   railway up
   ```

3. **Test Group Operations:**
   ```bash
   # Test group creation
   curl -X POST https://your-generated-domain.railway.app/api/v1/groups \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Group","description":"Testing group functionality"}'
   ```

4. **Monitor Railway Metrics:**
   - Check CPU/RAM usage in Railway dashboard
   - Monitor database connections

**Testing Criteria:**
- Group management works on Railway
- Database relationships properly established
- Railway metrics show healthy resource usage

---

### Checkpoint 3.3: Core Services Layer
**Deliverables:**
```
✅ Validation middleware (lib/middleware/validation-middleware.ts)
✅ Rate limiting (lib/middleware/rate-limiting.ts)
✅ Cache middleware (lib/middleware/cache-middleware.ts)
✅ Business logic services for expenses and groups
✅ Validation schemas (lib/utils/validation/schemas.ts)
```

**Railway Deployment Steps:**
1. **Configure Rate Limiting:**
   ```bash
   railway variables set RATE_LIMIT_WINDOW=900000  # 15 minutes
   railway variables set RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Set Redis Cache Configuration:**
   ```bash
   railway variables set CACHE_TTL_DEFAULT=3600  # 1 hour
   railway variables set CACHE_TTL_AUTH=1800     # 30 minutes
   ```

3. **Deploy Service Layer:**
   ```bash
   railway up
   ```

4. **Test Rate Limiting:**
   ```bash
   # Make multiple rapid requests to test rate limiting
   for i in {1..10}; do
     curl https://your-generated-domain.railway.app/api/v1/expenses
   done
   ```

**Testing Criteria:**
- Rate limiting works correctly
- Redis caching improves response times
- Railway Redis metrics show cache hits
- Validation prevents invalid requests

---

## Phase 4: External Service Integrations (Weeks 8-10)

### Checkpoint 4.1: AI Services Integration (Gemini)
**Deliverables:**
```
✅ Gemini client setup (lib/services/ai/gemini-client.ts)
✅ OCR processing (app/api/v1/ocr/process-receipt/route.ts)
✅ Expense categorization (app/api/v1/ai/categorize/route.ts)
✅ AI insights generation (app/api/v1/ai/insights/route.ts)
✅ Chat assistant (app/api/v1/ai/chat/route.ts)
✅ Batch processing capabilities
```

**Railway Deployment Steps:**
1. **Set Gemini API Configuration:**
   ```bash
   railway variables set GEMINI_API_KEY=your_gemini_api_key
   railway variables set GEMINI_MODEL=gemini-2.5-flash
   railway variables set AI_REQUEST_TIMEOUT=30000  # 30 seconds
   ```

2. **Configure File Upload for OCR:**
   ```bash
   railway variables set OCR_MAX_FILE_SIZE=5242880  # 5MB
   railway variables set OCR_SUPPORTED_FORMATS=image/jpeg,image/png,image/webp
   ```

3. **Deploy AI Integration:**
   ```bash
   railway up
   ```

4. **Test AI Endpoints:**
   ```bash
   # Test OCR processing
   curl -X POST https://your-generated-domain.railway.app/api/v1/ocr/process-receipt \
     -H "Authorization: Bearer your_jwt_token" \
     -F "image=@test-receipt.jpg"
   ```

5. **Monitor Railway Performance:**
   - Check response times for AI calls
   - Monitor memory usage during AI processing

**Testing Criteria:**
- Gemini API integration works on Railway
- OCR processing handles images correctly
- AI responses cached properly in Redis
- Railway performance acceptable for AI workloads

---

### Checkpoint 4.2: Payment System Integration (PhonePe)
**Deliverables:**
```
✅ PhonePe client setup (lib/services/payments/phonepe-client.ts)
✅ Payment order creation (app/api/v1/payments/phonepe/create-order/)
✅ Payment verification (app/api/v1/payments/phonepe/verify/)
✅ Webhook handling (app/api/v1/payments/phonepe/webhook/)
✅ Settlement processing (app/api/v1/payments/settlements/)
✅ Payment security and compliance
```

**Railway Deployment Steps:**
1. **Set PhonePe Configuration:**
   ```bash
   railway variables set PHONEPE_MERCHANT_ID=your_merchant_id
   railway variables set PHONEPE_SALT_KEY=your_salt_key
   railway variables set PHONEPE_SALT_INDEX=your_salt_index
   railway variables set PHONEPE_ENVIRONMENT=production  # or sandbox
   railway variables set PHONEPE_CALLBACK_URL=https://your-generated-domain.railway.app/api/v1/payments/phonepe/callback
   ```

2. **Configure Webhook Security:**
   ```bash
   railway variables set PHONEPE_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **Deploy Payment System:**
   ```bash
   railway up
   ```

4. **Configure PhonePe Webhooks:**
   - Set webhook URL: `https://your-generated-domain.railway.app/api/v1/payments/phonepe/webhook`

5. **Test Payment Flow:**
   ```bash
   # Test payment order creation
   curl -X POST https://your-generated-domain.railway.app/api/v1/payments/phonepe/create-order \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"amount":100,"currency":"INR","orderId":"test_order_1"}'
   ```

**Testing Criteria:**
- PhonePe integration works on Railway
- Payment webhooks processed correctly
- Security measures prevent fraud
- Railway logs show payment processing events

---

### Checkpoint 4.3: IoT Integration (Blynk.io)
**Deliverables:**
```
✅ Blynk client setup (lib/services/iot/blynk-client.ts)
✅ Device management (app/api/v1/iot/devices/)
✅ Data synchronization (app/api/v1/iot/sync/)
✅ Automation rules (app/api/v1/iot/automation/)
✅ Event processing (app/api/v1/iot/events/)
✅ Device diagnostics
```

**Railway Deployment Steps:**
1. **Set Blynk Configuration:**
   ```bash
   railway variables set BLYNK_AUTH_TOKEN=your_blynk_auth_token
   railway variables set BLYNK_SERVER_URL=https://blynk.cloud
   railway variables set IOT_SYNC_INTERVAL=300000  # 5 minutes
   ```

2. **Configure IoT Event Processing:**
   ```bash
   railway variables set IOT_EVENT_QUEUE_SIZE=1000
   railway variables set IOT_BATCH_PROCESSING=true
   ```

3. **Deploy IoT Integration:**
   ```bash
   railway up
   ```

4. **Test IoT Endpoints:**
   ```bash
   # Test device registration
   curl -X POST https://your-generated-domain.railway.app/api/v1/iot/devices \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"device_name":"Smart Meter","device_type":"utility_meter"}'
   ```

5. **Monitor IoT Data Flow:**
   ```bash
   railway logs --filter="iot"
   ```

**Testing Criteria:**
- Blynk.io integration works on Railway
- IoT data syncs reliably
- Event processing handles real-time data
- Railway metrics show stable IoT operations

---

## Phase 5: Advanced Features (Weeks 11-13)

### Checkpoint 5.1: Blockchain Integration (Hyperledger Fabric)
**Deliverables:**
```
✅ Hyperledger client setup (lib/services/blockchain/hyperledger-client.ts)
✅ Transaction recording (app/api/v1/blockchain/record/)
✅ Audit trail system (app/api/v1/blockchain/audit/)
✅ Smart contracts (app/api/v1/blockchain/smart-contracts/)
✅ Consensus management
✅ Network monitoring
```

**Railway Deployment Steps:**
1. **Set Hyperledger Configuration:**
   ```bash
   railway variables set HYPERLEDGER_NETWORK_URL=your_network_url
   railway variables set HYPERLEDGER_CERT_PATH=/app/certs/hyperledger
   railway variables set HYPERLEDGER_CHANNEL_NAME=flux-channel
   railway variables set HYPERLEDGER_CHAINCODE_NAME=flux-expenses
   ```

2. **Configure Blockchain Storage:**
   ```bash
   railway variables set BLOCKCHAIN_STORAGE_PATH=/app/blockchain-data
   ```

3. **Deploy Blockchain Integration:**
   ```bash
   railway up
   ```

4. **Test Blockchain Operations:**
   ```bash
   # Test transaction recording
   curl -X POST https://your-generated-domain.railway.app/api/v1/blockchain/record \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"transaction_id":"tx_123","amount":100,"participants":["user1","user2"]}'
   ```

**Testing Criteria:**
- Hyperledger integration works on Railway
- Transactions recorded immutably
- Blockchain network accessible
- Railway handles blockchain resource requirements

---

### Checkpoint 5.2: Notification System
**Deliverables:**
```
✅ Push notification service (lib/services/notifications/push-service.ts)
✅ Email service (lib/services/notifications/email-service.ts)
✅ SMS service (lib/services/notifications/sms-service.ts)
✅ Template engine (lib/services/notifications/template-engine.ts)
✅ Delivery management (app/api/v1/notifications/)
✅ User preferences system
```

**Railway Deployment Steps:**
1. **Set Notification Service Configuration:**
   ```bash
   railway variables set SMTP_HOST=your_smtp_host
   railway variables set SMTP_PORT=587
   railway variables set SMTP_USER=your_smtp_user
   railway variables set SMTP_PASSWORD=your_smtp_password
   railway variables set SMS_API_KEY=your_sms_api_key
   railway variables set PUSH_NOTIFICATION_KEY=your_push_key
   ```

2. **Configure Notification Queue:**
   ```bash
   railway variables set NOTIFICATION_QUEUE_SIZE=10000
   railway variables set NOTIFICATION_RETRY_ATTEMPTS=3
   ```

3. **Deploy Notification System:**
   ```bash
   railway up
   ```

4. **Test Notification Delivery:**
   ```bash
   # Test email notification
   curl -X POST https://your-generated-domain.railway.app/api/v1/notifications/email \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"to":"test@example.com","template":"expense_reminder","data":{"amount":100}}'
   ```

**Testing Criteria:**
- All notification channels work on Railway
- Email/SMS delivery successful
- Notification queue processes efficiently
- Railway handles notification load

---

### Checkpoint 5.3: Analytics and Reporting
**Deliverables:**
```
✅ Analytics engine (lib/services/analytics/)
✅ Business intelligence (app/api/v1/admin/analytics/)
✅ Reporting system (lib/services/analytics/reporting-engine.ts)
✅ Performance metrics (app/api/v1/metrics/)
✅ User analytics dashboard
✅ Export functionality
```

**Railway Deployment Steps:**
1. **Set Analytics Configuration:**
   ```bash
   railway variables set ANALYTICS_RETENTION_DAYS=365
   railway variables set ANALYTICS_BATCH_SIZE=1000
   railway variables set EXPORT_MAX_RECORDS=50000
   ```

2. **Configure Report Generation:**
   ```bash
   railway variables set REPORT_STORAGE_PATH=/app/reports
   railway variables set REPORT_CLEANUP_DAYS=30
   ```

3. **Deploy Analytics System:**
   ```bash
   railway up
   ```

4. **Test Analytics Endpoints:**
   ```bash
   # Test analytics data
   curl -X GET https://your-generated-domain.railway.app/api/v1/analytics/expenses \
     -H "Authorization: Bearer your_jwt_token" \
     -G -d "start_date=2025-01-01" -d "end_date=2025-12-31"
   ```

**Testing Criteria:**
- Analytics queries perform well
- Reports generate successfully
- Export functionality works
- Railway metrics show healthy database performance

---

## Phase 6: Monitoring & Optimization (Weeks 14-15)

### Checkpoint 6.1: Monitoring and Health Checks
**Deliverables:**
```
✅ Health check endpoints (app/api/health/)
✅ Metrics collection (lib/utils/monitoring/metrics-collector.ts)
✅ Performance tracking (lib/utils/monitoring/performance-tracker.ts)
✅ Error tracking (lib/utils/monitoring/error-tracker.ts)
✅ Alerting system (lib/utils/monitoring/alerting.ts)
✅ Monitoring dashboards configuration
```

**Railway Deployment Steps:**
1. **Configure Health Check:**
   ```bash
   # Railway automatically uses /health endpoint
   railway variables set HEALTH_CHECK_ENDPOINT=/api/health
   railway variables set HEALTH_CHECK_TIMEOUT=30000
   ```

2. **Set Monitoring Configuration:**
   ```bash
   railway variables set METRICS_RETENTION=7  # days
   railway variables set ERROR_ALERT_THRESHOLD=10  # errors per minute
   railway variables set PERFORMANCE_ALERT_THRESHOLD=5000  # ms response time
   ```

3. **Configure Railway Webhooks:**
   ```bash
   # Set up Discord/Slack webhooks in Railway dashboard
   railway variables set DISCORD_WEBHOOK_URL=your_discord_webhook
   railway variables set SLACK_WEBHOOK_URL=your_slack_webhook
   ```

4. **Deploy Monitoring System:**
   ```bash
   railway up
   ```

5. **Set Up Railway Alerts:**
   - Configure CPU/RAM alerts in Railway dashboard
   - Set up deployment notifications
   - Configure database performance alerts

**Testing Criteria:**
- Health check endpoint responds correctly
- Railway dashboard shows comprehensive metrics
- Alerts trigger appropriately
- Webhook notifications work

---

### Checkpoint 6.2: Security and Compliance
**Deliverables:**
```
✅ Security audit system (lib/utils/audit/security-audit.ts)
✅ Compliance tracking (lib/utils/audit/compliance-tracker.ts)
✅ Data protection measures (lib/utils/encryption/data-protection.ts)
✅ Audit logging (lib/utils/audit/audit-logger.ts)
✅ GDPR/DPDP compliance features
✅ Security testing suite
```

**Railway Deployment Steps:**
1. **Configure Security Settings:**
   ```bash
   railway variables set AUDIT_LOG_RETENTION=2555  # 7 years in days
   railway variables set ENCRYPTION_KEY=your_32_character_encryption_key
   railway variables set DATA_RETENTION_DAYS=2555
   ```

2. **Set Compliance Configuration:**
   ```bash
   railway variables set GDPR_COMPLIANCE=true
   railway variables set DPDP_COMPLIANCE=true
   railway variables set PCI_DSS_MODE=true
   ```

3. **Deploy Security Features:**
   ```bash
   railway up
   ```

4. **Configure Railway Security:**
   - Enable Railway's DDoS protection
   - Configure TLS certificates
   - Set up firewall rules if needed

**Testing Criteria:**
- Security audit logs properly
- Data encryption working
- Compliance features active
- Railway security features enabled

---

### Checkpoint 6.3: Final Integration and Testing
**Deliverables:**
```
✅ End-to-end integration tests
✅ Load testing suite
✅ API documentation completion
✅ Deployment optimization
✅ Performance tuning
✅ Production readiness checklist
```

**Railway Deployment Steps:**
1. **Configure Production Optimizations:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set LOG_LEVEL=warn
   railway variables set COMPRESSION_ENABLED=true
   railway variables set CACHE_HEADERS=true
   ```

2. **Set Resource Limits:**
   ```bash
   # Configure in Railway dashboard:
   # - CPU limits
   # - RAM limits
   # - Disk usage alerts
   # - Network bandwidth monitoring
   ```

3. **Final Production Deployment:**
   ```bash
   railway up --detach
   ```

4. **Configure Custom Domain (Optional):**
   - Set up custom domain in Railway dashboard
   - Configure DNS records
   - Enable automatic TLS certificate

5. **Production Health Verification:**
   ```bash
   # Run comprehensive health checks
   curl https://your-production-domain.com/api/health
   
   # Monitor Railway logs
   railway logs --follow
   
   # Check all service endpoints
   railway status
   ```

**Testing Criteria:**
- All systems work together seamlessly on Railway
- Performance meets requirements in production
- Railway monitoring shows healthy metrics
- Custom domain (if configured) works correctly
- Production environment fully validated

---

## Railway-Specific Monitoring and Maintenance

### Ongoing Railway Management:

1. **Daily Monitoring:**
   ```bash
   railway status
   railway logs --tail=100
   ```

2. **Weekly Performance Review:**
   - Check Railway dashboard metrics
   - Review resource usage
   - Monitor database performance
   - Check error rates

3. **Monthly Optimization:**
   - Review Railway costs
   - Optimize resource allocation
   - Update dependencies
   - Security updates

4. **Railway Commands for Troubleshooting:**
   ```bash
   # Restart services
   railway restart
   
   # Check environment variables
   railway variables
   
   # Monitor real-time logs
   railway logs --follow
   
   # Check service status
   railway status
   
   # Connect to database
   railway connect
   ```
