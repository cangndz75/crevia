# Crevia — Data Safety Draft (App Store + Google Play)

> **Taslak — hukuki onay gerekir.** Store console formlarını doldurmadan önce gerçek SDK, RevenueCat ve sandbox smoke sonuçlarını doğrulayın.

İlgili: `docs/crevia-privacy-policy-draft.md`, `docs/crevia-store-listing-readiness.md`

---

## App Store Privacy Nutrition — Draft Answers

| Data category | Collected? | Linked to user? | Tracking? | Purpose | Notes | Manual confirm? |
|---------------|------------|-----------------|-----------|---------|-------|-----------------|
| Purchases | yes | pending | no | App functionality | StoreKit + RevenueCat | **Yes** |
| App Interactions | yes | no | no | Analytics | Structured only | **Yes** |
| Crash Data | pending | pending | no | Diagnostics | SDK not integrated | **Yes** |
| Precise Location | **no** | no | no | N/A | Fictional map | No |
| User Content | **no** | no | no | N/A | No UGC/raw text | No |
| Identifiers | pending | pending | no | Analytics / IAP | RC anonymous id TBD | **Yes** |
| Diagnostics | pending | pending | no | Analytics / functionality | Device context | **Yes** |

---

## Google Play Data Safety — Draft Answers

| Data type | Collected? | Shared? | Ephemeral? | Required? | Purpose | Encrypted transit? | Deletion? | Manual? |
|-----------|------------|---------|------------|-----------|---------|-------------------|-----------|---------|
| Purchase history | yes | yes | no | optional | App functionality | yes | pending | **Yes** |
| App interactions | yes | pending | pending | optional | Analytics | yes | pending | **Yes** |
| Crash logs | pending | pending | pending | n/a | Diagnostics | pending | pending | **Yes** |
| Precise location | **no** | no | n/a | n/a | N/A | n/a | no | No |
| Contacts | **no** | no | n/a | n/a | N/A | n/a | no | No |
| Photos/videos/files | **no** | no | n/a | n/a | N/A | n/a | no | No |
| Health | **no** | no | n/a | n/a | N/A | n/a | no | No |
| Financial (IAP) | yes | yes | no | optional | App functionality | yes | pending | **Yes** |

---

## Third-Party Processor Matrix

| Processor | Status | Data types | Notes |
|-----------|--------|------------|-------|
| RevenueCat | pending | Purchase, entitlement, anonymous customer id | Public keys only in client |
| Apple StoreKit | pending | iOS transactions | Sandbox smoke pending |
| Google Play Billing | pending | Android transactions | Sandbox smoke pending |
| Analytics provider | pending | Structured events | No-op in verify |
| Crash reporting | not_used | Crash logs | Declare pending or no |
| OpenAI / external AI | **not_used** | — | Not in runtime |

---

## Data Category Matrix (summary)

| Category | Collected | Shared | Tracking | Processor |
|----------|-----------|--------|----------|-----------|
| Analytics events | yes | pending | no | Analytics placeholder |
| App interactions | yes | pending | no | Analytics placeholder |
| Purchase status | yes | yes | no | Apple / Google |
| Entitlement status | yes | yes | no | RevenueCat |
| Crash diagnostics | **pending** | pending | no | Not integrated |
| Device technical | yes | pending | no | Analytics placeholder |
| User identifiers | **no** (account) | — | no | RC anonymous TBD |
| Location | **no** | no | no | — |
| Raw text / content | **no** | no | no | — |
| Save data | **no** (remote) | no | no | Local only |
| Support email | pending | no | no | User-initiated |

---

## Manual Confirmation Checklist

- [ ] RevenueCat dashboard data processing terms reviewed
- [ ] Analytics SDK vendor + payload fields confirmed
- [ ] Crash SDK: integrate OR declare not collected
- [ ] Sandbox IAP purchase + restore logged
- [ ] Privacy policy hosted at **real URL** (not placeholder)
- [ ] Legal counsel reviewed TR/EN policy
- [ ] App Store Privacy Nutrition answers match SDK
- [ ] Google Play Data safety form matches SDK
- [ ] No absolute no-data, full-anonymity, or unverified compliance claims in published copy

---

## Known Blockers (current)

| Blocker | Status |
|---------|--------|
| Published privacy URL | **Placeholder** → launch_candidate BLOCKER |
| Crash SDK | Pending — do not claim collection |
| RevenueCat / store sandbox | Pending |
| Legal review | **Required** before publication |

---

## Before Submission Checklist

1. Run `npm run verify:privacy-policy-readiness`
2. Run `npm run verify:store-listing-readiness`
3. Complete IAP sandbox smoke on EAS dev build
4. Host privacy policy; update URL in store listing
5. Capture screenshots per store listing matrix
6. Fill App Store + Play forms from this draft
7. Legal sign-off
