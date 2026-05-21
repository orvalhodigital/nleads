# IMPLEMENTATION_PLAN.md

⚠️ **FEATURE**: Custom Domain Registration for Vehicle Dealerships  
**Date**: 2026-05-21  
**Status**: ✅ IMPLEMENTATION COMPLETE - READY FOR TESTING

---

## 📋 Plano (Implementation Steps)

### Backend Layer (APIs)
- [x] ✅ `api/register-custom-domain.ts` - IMPLEMENTED
  - JWT validation from Authorization header ✅
  - Domain format validation (regex) ✅
  - Uniqueness check against `profiles.custom_domain` ✅
  - Vercel API integration (register domain) ✅
  - Save to Supabase `profiles` table ✅
  - Implement rollback if DB save fails ✅
  
- [x] ✅ `api/remove-custom-domain.ts` - IMPLEMENTED
  - JWT validation ✅
  - Verify domain ownership (belongs to user) ✅
  - Vercel API integration (delete domain) ✅
  - Remove from Supabase `profiles` table ✅
  - Graceful handling if Vercel deletion fails ✅

### Frontend Layer (UI Components)
- [x] ✅ Updated `src/components/settings/WebsiteSettings.tsx` - INTEGRATED
  - Display registered custom domain (card with icon) ✅
  - Input field for new domain ✅
  - "OK" button to register ✅
  - "Remove" button with confirmation ✅
  - Loading states (Loader2 spinners) ✅
  - Success/error toasts ✅
  - Integrated handleRegisterDomain() ✅
  - Integrated handleRemoveDomain() ✅

- [x] ✅ Updated `src/pages/SettingsPage.tsx` - COMPLETE
  - Add "Website" tab to `BASE_TABS` ✅
  - Add Globe icon to `TAB_ICONS` ✅
  - Import WebsiteSettings component ✅
  - Render in switch statement ✅

### Data & Types
- [ ] Verify `src/types.ts` - ✅ Already has `custom_domain?: string`
- [ ] Verify `src/services/profileService.ts` - ✅ Already maps custom_domain

### Integration & Testing
- [ ] Test happy path: register valid domain
- [ ] Test error paths: invalid format, already in use, Vercel down
- [ ] Test removal with confirmation
- [ ] JWT validation tests (unauthorized access)
- [ ] Verify Supabase saves custom_domain
- [ ] Check Vercel dashboard shows domain registered

---

## ⚠️ Riscos (Risk Assessment)

### HIGH RISK
1. **Vercel API Failures**
   - Domain quota exceeded
   - API token invalid/expired
   - Service unavailable
   - **Mitigation**: Try-catch blocks, clear error messages, manual DNS setup option

2. **JWT/IDOR Attack**
   - Attacker uses stolen token to register domains for others
   - **Mitigation**: Strict JWT validation, verify user ID on every operation, double-check domain ownership before deletion

3. **Database Inconsistency**
   - Domain registered in Vercel but Supabase save fails
   - Orphaned domain pointing to wrong account
   - **Mitigation**: Implement rollback (delete from Vercel if DB update fails)

### MEDIUM RISK
4. **Domain Already in Use**
   - Concurrent registration attempts for same domain
   - **Mitigation**: DB unique constraint + Vercel API rejection

5. **DNS Propagation Delays**
   - Domain registered but not immediately resolving
   - **Mitigation**: Clear messaging "DNS may take 48 hours"

6. **Malformed Input**
   - Invalid domain format bypasses validation
   - **Mitigation**: Client + server-side regex validation

---

## ✅ Haiku Check

### Code Complexity Assessment
```
APIs handle auth,
Custom domains in Vercel,
Haiku knows the way.
```

**Verdict**: ✅ Haiku is sufficient (Haiku 4.5 can handle API integration, type safety, and JWT validation)

### Quality Gates Required
- [ ] All JWT validations present
- [ ] Error messages are user-friendly
- [ ] No hardcoded credentials in code (use env vars)
- [ ] Rollback logic tested
- [ ] Database queries use parameterized inputs
- [ ] Loading states prevent double-submit
- [ ] Toast notifications for all outcomes

---

## 🔐 Required Environment Variables

```env
VERCEL_API_TOKEN=vcp_1RIgio5gQaVw4WcDM11aTQXOprOUzv8OWu0U4p1wxPuvkS0gfh0BveLX
VERCEL_PROJECT_ID=prj_eStX0gJ75PS2ktfzTB6UJjyyCd59
VITE_SUPABASE_URL=<existing>
SUPABASE_SERVICE_ROLE_KEY=<existing>
VITE_SUPABASE_ANON_KEY=<existing>
```

---

## 📦 Files Summary

### NEW FILES (3)
1. `api/register-custom-domain.ts` - Vercel + Supabase registration
2. `api/remove-custom-domain.ts` - Cleanup & removal
3. `src/components/settings/WebsiteSettings.tsx` - UI component

### MODIFIED FILES (1)
1. `src/pages/SettingsPage.tsx` - Add "Website" tab

### UNCHANGED
- ✅ nLeads - Imóveis/* (reference only)
- ✅ SistemaCelular/* (unrelated projects)

---

## 🚀 Ready for Implementation?

**AWAITING USER APPROVAL**

Confirm the following:
- [ ] New "Website" tab in SettingsPage ✅
- [ ] Use `profiles.custom_domain` column ✅
- [ ] Vercel credentials ready ✅
- [ ] High risk items understood and mitigated ✅

**To proceed, reply with: "IMPLEMENTAR"**
