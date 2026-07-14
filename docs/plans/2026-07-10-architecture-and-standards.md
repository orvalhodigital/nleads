# Architecture & Brainstorming Design Review

Date: 2026-07-10
Status: Draft

---

## 1. Codebase Architecture Overview

The `n-Leads Veículos` platform is a multi-tenant client system where:
- **System Hosts:** (e.g., localhost, painel.orvalhodigital.com.br) display the **CRM Dashboard** and **Lead/Inventory Management Portal**.
- **Tenant Domains:** display client-specific vehicle sales websites with custom domain routing.
- **Backend Service Integration:** Utilizes Supabase (PostgreSQL client-side logic) and Gemini API (AI automation) for lead categorization/response simulations.

---

## 2. Key Findings & Design Anomalies

After reviewing [App.tsx](file:///c:/Sistemas/Orvalho%20Digital%20-%20Ve%C3%ADculos/src/App.tsx) and [index.css](file:///c:/Sistemas/Orvalho%20Digital%20-%20Ve%C3%ADculos/src/index.css), I identified the following architecture & design anomalies:

### Color Palette Mismatches in Tailwind v4
In [index.css:L170-197](file:///c:/Sistemas/Orvalho%20Digital%20-%20Ve%C3%ADculos/src/index.css#L170-197), colors like `emerald` and `teal` are overwritten with violet/purple HEX values (e.g., `--color-emerald-500: #8b5cf6`). This creates confusion, as class names like `border-emerald-500` will render violet.

### Monolithic Components
Multiple components inside `src/components/` exceed **50-100KB** in size (e.g., `MotorcycleInventory.tsx` at 108KB, `Dashboard.tsx` at 63KB, and `Inventory.tsx` at 72KB). This indicates a tight coupling of state, rendering logic, and API calls within a single file.

---

## 3. Next Steps Selection

I propose starting by cleaning up the styling tokens in [index.css](file:///c:/Sistemas/Orvalho%20Digital%20-%20Ve%C3%ADculos/src/index.css) and creating a clean, logical color naming structure (e.g., `--color-brand-primary` / `--color-brand-secondary`) rather than overriding native CSS variables. 

Does this sound like a correct first step to align our design system?
