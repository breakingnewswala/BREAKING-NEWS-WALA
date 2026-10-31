# Security Specification & Threat Model: BREAKING NEWS WALA

## 1. Data Invariants
1. **Public Read-Only Published Content:** Public unauthenticated users can ONLY read articles where `status == 'published'`. Drafts, rejected, or review-pending stories are never exposed.
2. **Reporter Authorship Binding:** On article creation, `authorId` must strictly match `request.auth.uid`. A reporter cannot forge authorship or file stories under another journalist's UID.
3. **Admin Privilege Verification:** Only authenticated users matching the bootstrapped admin record (`breakingnewswala.com@gmail.com`) or having an entry in `/admins/{uid}` can modify editorial approval statuses (`status == 'published'`), alter categories, or update breaking tickers.
4. **Immutability of Historical Identity:** Once an article is created, `authorId` and `createdAt` cannot be altered on update.
5. **PII Isolation:** User personal details (`/users/{userId}`) can only be read and updated by the respective user (`request.auth.uid == userId`) or an admin.

## 2. The "Dirty Dozen" Payloads
1. **Unpublished Article Snooping:** Anonymous client querying `articles` with `status == 'draft'` or `status == 'pending_review'`. (Must return `PERMISSION_DENIED`).
2. **Ghost Author Injection:** Authenticated user `UID_A` attempts to create an article with `authorId: 'UID_B'`. (Must fail schema check).
3. **Privilege Escalation via Status:** Standard reporter attempts to write `status: 'published'` on their own submission. (Must fail unless user is admin or explicitly designated trusted publisher).
4. **Junk ID Poisoning:** Writing document to `/articles/` with a 1.5KB string ID or characters containing path traversals. (Must fail `isValidId()`).
5. **Direct Ticker Tampering:** Non-admin attempts to insert or update `/tickers/{tickerId}`. (Must return `PERMISSION_DENIED`).
6. **Denial of Wallet String Bomb:** Article payload containing a 10MB string in the `title` field. (Must fail `maxLength: 300` check).
7. **PII Account Takeover:** User `UID_A` attempting to read or modify `/users/UID_B`. (Must return `PERMISSION_DENIED`).
8. **Admin Self-Promotion:** Non-admin creating a document at `/admins/{uid}`. (Must return `PERMISSION_DENIED`).
9. **Category Tree Destruction:** Non-admin attempting to delete or overwrite `/categories/cat-1`. (Must return `PERMISSION_DENIED`).
10. **Shadow Field Injection:** Article write containing unauthorized root field `isAdminOverride: true`. (Must fail strict allowed keys check).
11. **Client Timestamp Spoofing:** Article creation with backdated or spoofed `createdAt`.
12. **Blanket Query Scrape:** Authenticated user running unconstrained `collection('users').get()` to harvest user emails. (Must return `PERMISSION_DENIED`).
