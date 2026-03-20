# 🚀 DEPLOYMENT CHECKLIST - Gestion Evidencias MVP

**Status**: ✅ **BACKEND READY FOR PRODUCTION**
**Date**: March 17, 2026
**Next**: Deploy tomorrow

---

## ✅ COMPLETED TODAY (Pre-Deployment Hardening)

### Security Fixes
- [x] **JWT Secret Migration**: Moved from hardcoded `"secreto_super_seguro"` to environment variable
  - JWT_SECRET: `<stored-in-env-not-in-docs>`
  - Updated: `authController.js` (jwt.sign), `authMiddleware.js` (jwt.verify)
  - Updated: `tests/api.security-smoke.test.js` (now uses process.env)

- [x] **CORS Hardening**: Changed from `cors()` to configurable origins
  - Default: `http://localhost:3001`
  - Production: Set `CORS_ALLOWED_ORIGINS` env variable

- [x] **Environment Variables**: Added NODE_ENV and JWT_SECRET to .env

### Validation & Testing
- [x] JWT secret generation: 64-character cryptographic key ✓
- [x] All 5 security smoke tests: **PASSING** ✓
- [x] App initialization: **SUCCESSFUL** ✓
- [x] No compilation errors ✓

### Documentation
- [x] Created `.env.example` for configuration template
- [x] `.gitignore` already has `.env` (NOT tracked in git) ✓

---

## 📋 DEPLOYMENT TASKS FOR TOMORROW

### Step 1: Choose Hosting (5 min)
**Options**:
- **Railway** (recommended - easiest) → https://railway.app
- **Render** → https://render.com
- **AWS EC2/RDS** → More control but more complex
- **Azure** → If you want to use Azure services

**Pick ONE** ⬇️

### Step 2: Prepare Production Secrets (10 min)
Before deploying, update `.env` or hosting env vars:

```env
# PRODUCTION CONFIGURATION
PORT=3000
NODE_ENV=production

# JWT Secret - use a DIFFERENT one for production!
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<GENERATE_NEW_STRONG_SECRET>

# Database - point to PRODUCTION database
DB_HOST=<your-production-db-host>
DB_PORT=5432
DB_NAME=gestion_evidencias
DB_USER=<secure-username>
DB_PASSWORD=<secure-password>

# Google Drive (keep your current values or update)
GOOGLE_DRIVE_CREDENTIALS_PATH=./google-service-account.json
GOOGLE_DRIVE_FOLDER_ID=<your-shared-drive-folder-id>
GOOGLE_OAUTH_CLIENT_ID=<your-oauth-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-oauth-client-secret>
GOOGLE_OAUTH_REFRESH_TOKEN=<your-oauth-refresh-token>

# CORS - set to your PRODUCTION frontend URL
CORS_ALLOWED_ORIGINS=https://tu-dominio-frontend.com
```

### Step 3: Database Setup (10 min)
- [ ] Ensure production PostgreSQL database exists
- [ ] Run migrations/initialize schema (if using migrations)
- [ ] Backup local DB if needed before switching

### Step 4: Deploy Backend (with chosen hosting)
**Railway Example**:
```bash
npm install -g railway
railway login
railway init
railway up
```

**Render Example**:
- Connect GitHub repo → Render Dashboard
- Auto-deploy on push

### Step 5: Test Production URLs
```bash
# Test backend health
curl https://your-backend-url.com/

# Test authentication endpoint
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 6: Update Frontend CORS
Update frontend API_URL to production backend URL:
- `frontend/services/api.js` or wherever you make API calls
- Change from `http://localhost:3000` → `https://your-backend-url.com`

### Step 7: Deploy Mobile App
Update mobile app API_URL and rebuild:
```bash
cd mobile-app
flutter build apk --release  # or iOS
```

---

## 🔐 SECURITY CHECKLIST

- [x] JWT Secret in environment variables (not hardcoded)
- [x] CORS configured to specific origin (not `*`)
- [x] Helmet security headers enabled ✓
- [x] SQL injection validation enabled ✓
- [x] Rate limiting on login (6 attempts/15min) ✓
- [x] Database credentials in .env (not in code) ✓
- [ ] **TODO FUTURE**: Implement token refresh endpoint (optional for MVP)
- [ ] **TODO FUTURE**: Add audit logging for failed logins (optional)

---

## 📞 QUICK SUPPORT

**If deployment fails**:
1. Check logs: `railway logs` or Render dashboard
2. Verify `.env` vars are all set in hosting platform
3. Ensure database is accessible from hosting location
4. Check CORS_ALLOWED_ORIGINS is correct
5. Verify JWT_SECRET is 64+ characters

**Common Issues**:
- "Connection refused" → Database not accessible from hosting
- "Token invalid" → JWT_SECRET mismatch between sign/verify
- "CORS error" → Frontend URL not in CORS_ALLOWED_ORIGINS
- "Google Drive error" → Missing credentials in .env

---

## 🎯 FINAL STATUS

| Component | Status | Details |
|-----------|--------|---------|
| Backend Code | ✅ Ready | All security hardening complete |
| Tests | ✅ 5/5 Passing | Security smoke tests validated |
| Environment Config | ✅ Ready | `.env` configured for development |
| Documentation | ✅ Complete | `.env.example` created |
| Errors | ✅ None | No compilation errors |
| Security | ✅ Hardened | JWT, CORS, Headers, Rate-limit |
| **MVP Ready** | ✅ **YES** | Deploy with confidence! |

---

**NEXT ACTION**: Choose hosting platform → Update production .env → Deploy 🚀

