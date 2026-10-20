# Project rules
- The business's own GSTIN/details live in the `branches` row with `is_main = true`, read via `src/lib/business.ts`; why: one source for invoices and GST exports.
- Accounting postings happen in database triggers (sales_orders insert, purchase_orders status -> 'received') into system ledgers; why: P&L and balance sheet stay consistent regardless of which screen creates the document.
- Signed-in pages render inside `AdminLayout` (sidebar + auth guard) as nested routes in App.tsx; why: one navigation shell.
- Custom roles (`custom_roles`, `user_custom_roles`) sit alongside the fixed `app_role` enum; database access still checks `has_role` on the fixed roles.
