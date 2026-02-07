# Production-Grade Audit & Improvement Plan

## Audit Summary

Reviewed all 35 components, 38 API routes, 14 lib files, and global CSS. The codebase is well-structured and feature-complete. The following 8 items move it from "works" to "production-grade" — ordered by [Impact/Effort].

---

## Part 1: Functional & Logic Architecture

### 1. [High/Low] DRY: Extract Duplicated Utilities into `admin-utils.ts`

**Problem:** Three helper functions are copy-pasted across multiple files:
- `formatFileSize` — duplicated in `AdminCreateTab.tsx:7`, `AdminEmailsTab.tsx:40`, `AdminMaterialsTab.tsx:11`
- `sortArrow` — duplicated in `AdminPaymentsTab.tsx:400`, `AdminEmailsTab.tsx:447`, `AdminStudentsTab.tsx:46`, `AdminMaterialsTab.tsx:144`
- `lastUpdatedText` — duplicated in `AdminPaymentsTab.tsx:494`, `AdminMaterialsTab.tsx:148`, plus inline IIFEs in `AdminEmailsTab.tsx:592-596`

**Fix:** Move all three into `admin-utils.ts`. Replace all call sites with imports.

**Verification:** `npx tsc --noEmit` passes; existing functionality unchanged.

---

### 2. [High/Low] Bug Fix: N+1 Materials Fetch in AdminEmailsTab

**Problem:** `AdminEmailsTab.tsx:126-140` — when pending attachment IDs arrive, the code fetches `GET /api/admin/materials` **once per attachment ID**, then filters. 3 attachments = 3 identical API calls.

```typescript
// CURRENT (bad) — fetches ALL materials N times
Promise.all(
  pendingAttachmentIds.map((id) =>
    fetch('/api/admin/materials')
      .then((r) => r.json())
      .then((json) => (json.materials as Material[]).find((m) => m.id === id))
  )
)
```

**Fix:** Fetch once, then filter locally:
```typescript
fetch('/api/admin/materials')
  .then((r) => r.json())
  .then((json) => {
    const ids = new Set(pendingAttachmentIds);
    setAttachments((json.materials as Material[]).filter((m) => ids.has(m.id)));
  });
```

**Verification:** Attach 2+ materials from the Create tab → Network tab shows 1 request instead of N.

---

### 3. [High/Low] Bug Fix: AbortController Cleanup on Unmount in AdminCreateTab

**Problem:** `AdminCreateTab.tsx:116` stores an `AbortController` in a ref, but never aborts on unmount. If the user navigates away during generation, the SSE reader keeps running, causing state updates on an unmounted component.

**Fix:** Add a `useEffect` cleanup that calls `abortRef.current?.abort()` on unmount.

**Verification:** Start generation, switch tabs during "Generating content" stage — no console warnings about state updates on unmounted components.

---

### 4. [High/Medium] Type Safety: Narrow String Unions for Enums

**Problem:** Several types in `admin-types.ts` use `string` where specific union types exist in the Prisma schema:
- `Enrollment.plan` — should be `'FULL' | 'DEPOSIT'`
- `Enrollment.paymentStatus` — should be `'PENDING' | 'COMPLETED' | 'WAITLISTED'`
- `Section.status` — should be `'OPEN' | 'FULL'`
- `Lead.status` — should be `'NEW' | 'CONTACTED'`

Using `string` means TypeScript won't catch typos like `e.paymentStatus === 'completed'` (wrong case).

**Fix:** Replace `string` with the correct union types. Audit all comparison sites for correctness.

**Verification:** `npx tsc --noEmit` passes. Any existing typos surface as compile errors.

---

### 5. [Medium/Low] Resilience: Add Error Feedback for Silenced Catches

**Problem:** 12+ catch blocks across the admin silently swallow errors with `catch { /* silent */ }` or `.catch(() => {})`. Examples:
- `AdminStudentsTab.tsx:76,87,180,192,205` — lead fetching, editing, deleting
- `AdminPaymentsTab.tsx:123,134,147` — payouts, coupons, links fetching
- `AdminAttendanceTab.tsx:38` — session fetching
- `AdminOverviewTab.tsx:34` — payment summary fetching

When these fail, the user sees empty states with no explanation. Debugging is impossible.

**Fix:** Replace silent catches with `showToast(message, 'error')` or `console.error(...)` as appropriate. For background fetches (like overview), `console.error` suffices. For user-initiated actions (save, delete), surface via toast.

**Verification:** Temporarily disable network → verify error feedback appears instead of silent empty states.

---

### 6. [Medium/Low] Cleanup: Unused Parameter in AdminOverviewTab

**Problem:** `AdminOverviewTab.tsx:57-60`:
```typescript
function handleSendEmail(email: string) {
  setSelectedStudent(null);
  onNavigate('emails');
}
```
The `email` parameter is accepted but never used. The function navigates to emails tab but doesn't pre-fill the recipient.

**Fix:** Wire `email` into the navigation so clicking "Send Email" from the overview actually pre-fills the recipient, matching behavior in other tabs. Pass `email` up through `onNavigate` or via a dedicated `onSendEmail` callback.

**Verification:** Click a student on Overview → "Send Email" → emails tab opens with recipient pre-filled.

---

## Part 2: Frontend & UX Polish

### 7. [High/Medium] Accessibility: Keyboard Navigation for Clickable Table Rows

**Problem:** Multiple table rows use `onClick` but are not keyboard-accessible:
- `AdminStudentsTab.tsx:312` — `.admin-student-row-clickable` on `<tr>`
- `AdminEmailsTab.tsx:874` — `.admin-email-row` on `<tr>`

Screen reader users and keyboard navigators cannot interact with these rows. No `tabIndex`, `role`, `onKeyDown`, or `aria-label` attributes.

**Fix:** Add `tabIndex={0}`, `role="button"`, `aria-label`, and `onKeyDown` (Enter/Space triggers click) to all clickable `<tr>` elements. Add `:focus-visible` styles matching `:hover`.

**Verification:** Tab through the students table → can open student modal with Enter key. Screen reader announces rows as interactive.

---

### 8. [Medium/Medium] UX: Replace Inline Styles with CSS Classes for Action Buttons

**Problem:** ~30+ instances of inline `style={{ fontSize: '0.75rem', padding: '4px 10px' }}` scattered across admin components for small action buttons (Edit, Delete, Save, Email, etc.). Examples:
- `AdminStudentsTab.tsx:494,497,540,543,548`
- `AdminMaterialsTab.tsx:346,349,372,380,387`
- `AdminAttendanceTab.tsx:188,246,253`
- `AdminEmailsTab.tsx:725`

This creates visual inconsistency (some buttons get the style, some don't) and makes global tweaks impossible.

**Fix:** Create `.admin-action-btn-sm` class in `globals.css` and replace all inline style occurrences. This ensures all small action buttons share identical sizing.

**Verification:** Visual regression check — all table action buttons render identically before/after.

---

## Implementation Order

| # | Item | Files | Est. Lines |
|---|------|-------|-----------|
| 1 | Extract duplicated utilities | `admin-utils.ts`, 4 components | ~-60 |
| 2 | Fix N+1 materials fetch | `AdminEmailsTab.tsx` | ~-8 |
| 3 | AbortController cleanup | `AdminCreateTab.tsx` | ~+6 |
| 4 | Narrow string unions | `admin-types.ts` | ~+8 |
| 5 | Error feedback for silenced catches | 5 components | ~+30 |
| 6 | Fix unused email param | `AdminOverviewTab.tsx`, `AdminDashboard.tsx` | ~+5 |
| 7 | Keyboard a11y for table rows | 2 components, `globals.css` | ~+30 |
| 8 | CSS classes for action buttons | `globals.css`, 4 components | ~+10, -60 inline |

**Total estimated impact:** ~-50 lines net (removing duplication), stronger types, better a11y, fewer bugs.
