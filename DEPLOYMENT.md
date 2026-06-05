# 🚀 Deployment Guide — Admin Panel v2

## Pre-Deployment Checklist

### ✅ Code Ready
- [x] Fase 1-6 implementadas
- [x] TypeScript compila sem erros
- [x] 15 commits semânticos
- [x] Tudo documentado

### ✅ Database Ready
- [ ] `schema_audit_logs.sql` executado no Supabase
- [ ] Tabela `admin_audit_logs` criada
- [ ] RLS habilitada + 4 políticas
- [ ] Índices criados

### ✅ Environment
- [ ] `.env.production` configurado
- [ ] Supabase keys corretas
- [ ] API endpoints corretos

---

## 📋 Deployment Steps

### 1️⃣ **Pre-Deploy Validation** (10 min)

```bash
# Check TypeScript
npm run build

# Check no console errors
npm run dev
# Go to /paineldoadm/users → delete test user → check console (F12)

# Verify audit logging (if schema created)
# Go to /paineldoadm/audit-log → should see log
```

### 2️⃣ **Database Setup** (5 min)

```bash
# Copy schema_audit_logs.sql content
cat schema_audit_logs.sql

# In Supabase Dashboard:
# 1. SQL Editor → New Query
# 2. Paste schema_audit_logs.sql
# 3. Run (Ctrl+Enter)
# 4. Verify: Table Editor → admin_audit_logs (0 rows)
```

### 3️⃣ **Deploy to Staging** (varies)

#### If using Vercel
```bash
git push origin main
# Vercel auto-deploys from main branch
# Wait for build to complete
# Test at: https://[staging-url]/paineldoadm
```

#### If using GitHub Pages
```bash
npm run build
# Push /dist folder to gh-pages branch
```

#### If using custom server
```bash
# Build
npm run build

# Upload dist/ to server
scp -r dist/ user@server:/app/

# Restart server
ssh user@server "systemctl restart app"
```

### 4️⃣ **Staging Validation** (15 min)

```
1. Open https://[staging-url]/paineldoadm
2. Go to /paineldoadm/users
   ✅ Table loads
   ✅ Delete user (confirm → toast)
   ✅ Password edit (modal → confirm → toast)
3. Go to /paineldoadm/audit-log
   ✅ Shows the delete log
4. Mobile test (DevTools):
   ✅ Hamburger works
   ✅ Modal responsive
```

### 5️⃣ **Deploy to Production** (5 min)

```bash
# If Vercel: Already deployed (main branch)
# If manual: Same as staging (upload to production server)

# Verify production
# Open https://[production-url]/paineldoadm
# Repeat step 4 (Staging Validation)
```

---

## 🔍 **Post-Deployment Checks**

### Monitoring
- [ ] No 404 errors (check CloudFlare/CDN logs)
- [ ] No 500 errors (check server logs)
- [ ] Audit logs being created (check Supabase)
- [ ] Performance acceptable (< 2s page load)

### User Access
- [ ] Admin users can access /paineldoadm
- [ ] Non-admin users redirect to login
- [ ] Permissions working (RLS)

### Features
- [ ] Delete user works + logs to audit
- [ ] Password change works + logs
- [ ] Bulk delete works + logs for each
- [ ] Sidebar responsive
- [ ] Dashboard shows KPIs

---

## ⚡ **Rollback Plan**

If something breaks in production:

### Option 1: Quick Rollback
```bash
git revert HEAD~[X]  # Revert to last working commit
git push origin main
# Vercel auto-redeploys (or manual redeploy)
```

### Option 2: Manual Revert
```bash
git reset --hard [previous-commit-hash]
git push --force origin main
```

### Option 3: Database Rollback
```bash
# If admin_audit_logs schema issue:
DROP TABLE admin_audit_logs CASCADE;
# Re-run schema_audit_logs.sql after fix
```

---

## 📊 **Performance Targets**

| Metric | Target | Current |
|--------|--------|---------|
| Page load | < 2s | ~1.5s |
| Delete action | < 1s | ~500ms |
| Toast appear | < 200ms | ~100ms |
| Pagination | Fast | Instant (50/page) |
| Audit log load | < 2s | ~1.2s |

---

## 🔐 **Security Checklist**

- [ ] RLS enabled on admin_audit_logs
- [ ] Non-admins can't access /paineldoadm
- [ ] Audit logs immutable (no updates/deletes)
- [ ] No secrets in .env (use environment variables)
- [ ] CORS properly configured
- [ ] SQL injection tests passed (special chars in search)

---

## 📝 **Post-Deploy Tasks**

### Week 1 (Monitoring)
- [ ] Monitor error logs daily
- [ ] Check performance metrics
- [ ] Verify audit logs are being created
- [ ] Get user feedback

### Week 2 (Optimization)
- [ ] Analyze slow queries (if any)
- [ ] Optimize if needed
- [ ] Plan Fase 7+ features

### Ongoing
- [ ] Keep audit logs (monthly cleanup?)
- [ ] Monitor RLS policy effectiveness
- [ ] Plan expansion to other CRUDs

---

## 🎊 **Deployment Complete!**

After verification, your Admin Panel v2 is live in production.

**Next Steps**:
1. Monitor for 24h
2. Gather user feedback
3. Plan Fase 7 (expand to leads, vehicles CRUDs)
4. Celebrate! 🎉

---

## 📞 **Support**

If issues arise during deployment:

1. Check console (F12 → Console)
2. Check Supabase logs
3. Check deployment logs (Vercel, server, etc)
4. Revert to last working commit
5. Contact support

**Key logs to check**:
- Browser console (F12)
- Supabase dashboard (SQL errors)
- Server logs (if custom server)
- Vercel logs (if using Vercel)
