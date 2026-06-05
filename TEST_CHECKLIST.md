# 🧪 Test Checklist — Admin Panel v2

## Fase 1-5 Validation

### ✅ **Fase 1: Hooks + Components**
- [ ] `useAdminTable` pagination works (50 items/page)
- [ ] `useDebounce` delays search (300ms, no lag)
- [ ] `useAdminToast` shows success/error/info
- [ ] AdminPagination buttons work (prev, next, page numbers)
- [ ] Sidebar animation works (slideIn)

### ✅ **Fase 2: AdminUsers Delete + Password Edit**
- [ ] Delete individual user (confirmation → toast → refetch)
- [ ] Delete button disabled during action
- [ ] Password edit modal appears when clicking Key icon
- [ ] Password validation: min 6 chars, confirm match
- [ ] Password change shows success toast
- [ ] Impersonate button works (navigate to /paineldoadm/user/:id)
- [ ] Send notification modal opens and sends

### ✅ **Fase 2.5: Sidebar Cleanup**
- [ ] AdminLeads route removed (404 if try /paineldoadm/leads)
- [ ] AdminVehicles route removed (404 if try /paineldoadm/vehicles)
- [ ] Sidebar has only 5 groups: Gestão | Vendas | Conteúdo | Suporte | Sistema
- [ ] Dashboard shows KPIs for leads/vehicles (data only)

### ✅ **Fase 3: Responsive Sidebar**
- [ ] Desktop: Sidebar visible, fixed w-64
- [ ] Mobile (< 768px): Hamburger button visible
- [ ] Click hamburger: sidebar slides in from left
- [ ] Click overlay: sidebar closes
- [ ] Click link: sidebar auto-closes (mobile)
- [ ] Transitions smooth (translate-x)
- [ ] Menu groups visible with dividers

### ✅ **Fase 4: Audit Logging**
- [ ] AdminAuditLog page accessible at /paineldoadm/audit-log
- [ ] Table shows: Admin | Ação | Recurso | Alvo | Data
- [ ] Filter by action (create/update/delete/etc)
- [ ] Filter by resource type (user/lead/vehicle)
- [ ] **Schema created in Supabase** (admin_audit_logs table)
- [ ] Delete user → logs appear in AdminAuditLog
- [ ] Password change → logs appear with "field: password" in changes

### ✅ **Fase 5: Bulk Actions**
- [ ] Checkbox select multiple users
- [ ] "Ações em Massa (N)" button appears when N > 0
- [ ] Click button → modal opens
- [ ] Modal shows: N users selected, IDs preview (first 5 + count)
- [ ] Delete tab shows warning + red button
- [ ] Edit tab shows field + value inputs + blue button
- [ ] Delete multiple → all deleted + toast + refetch
- [ ] Each deleted user logged to audit_logs

---

## 📱 **Mobile Testing**

### Responsive Design
- [ ] Sidebar collapses properly on mobile
- [ ] Hamburger menu clickable (top-left)
- [ ] Table scrolls horizontally (on small screens)
- [ ] Buttons don't overlap (responsive padding)
- [ ] Modals fit screen (max-w-lg)
- [ ] Pagination mobile-friendly

### Touch Interaction
- [ ] Buttons have adequate padding (min 44x44px)
- [ ] No hover states blocking interaction
- [ ] Modal close (X button) easy to tap
- [ ] Checkboxes large enough on mobile

---

## ⚡ **Performance**

### Pagination
- [ ] Load 50 users quickly (no lag)
- [ ] Go to page 2, 3, etc. (fast navigation)
- [ ] Search doesn't load all records (debounce works)
- [ ] Refetch after delete is fast

### Toast Notifications
- [ ] Success toast appears < 200ms
- [ ] Error toast appears < 200ms
- [ ] Toast auto-dismiss after 3s
- [ ] Multiple toasts stack properly

### Audit Logging
- [ ] Delete action logged < 500ms (no noticeable delay)
- [ ] AdminAuditLog loads 100 logs quickly
- [ ] Filter changes are fast

---

## 🔒 **Security & Data**

### RLS & Permissions
- [ ] Non-admin can't access /paineldoadm (redirects to login)
- [ ] Audit logs only visible to admins
- [ ] Can't edit other admin's users
- [ ] Session stays valid during operations

### Audit Trail
- [ ] Delete user creates log entry
- [ ] Password change creates log entry with "field: password"
- [ ] Bulk delete creates N log entries (one per user)
- [ ] Logs immutable (can't edit/delete logs)

---

## 🐛 **Error Handling**

### Network Errors
- [ ] Delete fails gracefully (error toast)
- [ ] Pagination fails (shows error message)
- [ ] Toast network error (clear message)
- [ ] Console has no unhandled errors (F12)

### Edge Cases
- [ ] Delete 0 users (button disabled if none selected)
- [ ] Delete 1000+ users (may be slow, but works)
- [ ] Search with special chars (no SQL injection)
- [ ] Page number out of range (stays on last page)

---

## 📊 **Dashboard (Fase 6)**

### KPI Cards
- [ ] All 8 metrics load
- [ ] Numbers update when new data added
- [ ] Trends show (↑ green, ↓ red)
- [ ] Icons display correctly
- [ ] Responsive grid (4 cols desktop, 2 mobile, 1 phone)

### Loading State
- [ ] Skeleton placeholders appear while loading
- [ ] Content appears once loaded

---

## ✅ **Test Execution Steps**

### Prerequisites
```bash
# 1. Make sure schema_audit_logs.sql executed in Supabase
# 2. Have at least 1 admin user in profiles
# 3. Have at least 3 test users in profiles
```

### Run Tests
```
1. Desktop (Chrome DevTools):
   - Open /paineldoadm/users
   - Test delete, password edit, bulk delete
   - Check toast notifications
   - Verify sidebar
   
2. Mobile Simulation (DevTools):
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test hamburger menu
   - Test modals fit screen
   
3. Audit Log:
   - Delete a user
   - Go to /paineldoadm/audit-log
   - Should show the delete action
   
4. Dashboard:
   - Go to /paineldoadm
   - Should see 8 KPI cards with numbers
```

---

## 📝 **Bugs Found & Fixes**

| Bug | Severity | Status |
|-----|----------|--------|
| [add bugs as you find them] | ? | ? |

---

## ✨ **Final Sign-Off**

- [ ] All tests passed
- [ ] No console errors (F12 → Console)
- [ ] Mobile responsive works
- [ ] Audit logging working
- [ ] Ready for production deploy

**Date Tested**: ___________  
**Tester**: ___________  
**Status**: ✅ / ❌

