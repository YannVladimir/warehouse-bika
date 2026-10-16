# Handoff token contract — everything the bika DMS side needs to send

Paste this to the agent working in `bika-source-codes/bika`. This is the complete, current spec for
the "File in Archive" handoff token — it supersedes the earlier addendum about `documentTitle`/
`custodian`, folding those into the full picture. Bika Archive's side is built, tested, and live;
this describes exactly what your `POST /v1/archive-integration/handoff` endpoint needs to produce.

---

## What you already built (unchanged)

- `POST /v1/archive-integration/handoff` — authenticated by the calling user's normal session JWT.
- Mints a short-lived signed JWT and returns `{ "redirectUrl": "http://localhost:5180/handoff?token=<jwt>" }`.
- Signed HS256 with `ARCHIVE_HANDOFF_SECRET` (already shared, already confirmed distinct from your
  internal `JWT_SECRET`).
- Expiry: 60–120 seconds is right — it only needs to survive one browser redirect.

## The full claims contract

Every claim below except the three marked required must still be *included as a key* only when
you have a real value — omit the claim entirely rather than sending an empty string.

| Claim | Required? | Type | Meaning |
|---|---|---|---|
| `type` | **Required** | string, literal | Must be exactly `"bika-archive-handoff"` — Bika Archive rejects anything else, even with a valid signature. |
| `email` | **Required** | string | The filing user's email. Used to find-or-create their scoped Bika Archive account (see below). |
| `sourceCompanyId` | **Required** | number | Your own `Company.id` (the `Long`, not a UUID). Bika Archive resolves this against its already-synced mirror of your `companies` table — the company must have synced at least once already (it syncs on-demand whenever a SUPER_ADMIN opens the Companies page in Bika Archive, or you can just wait — sync happens automatically before it's needed in practice). |
| `documentRef` | Optional | string | Any reference/case/record number tying the created document back to your system. Shown on the Bika Archive document as "Source reference" and prefilled into the form. |
| `documentTitle` | Optional | string | The record's title/subject. Prefilled directly into the Add Document form's title field. |
| `custodian` | Optional | string | Whoever's responsible for the record (case owner, filer's name, etc). Prefilled into the form's custodian field. |
| `iat` / `exp` | **Required** | number (unix seconds) | Standard JWT issued-at/expiry. |

## What happens on the Bika Archive side (for context, not action)

1. Token is verified (signature + expiry + `type` check).
2. `sourceCompanyId` is resolved to the matching already-synced company.
3. The user is found by `email`, or auto-provisioned on first handoff as a narrowly-scoped
   `EXTERNAL_FILER` account (can only: view their own company's warehouses/locations/categories, and
   create documents — no admin capability, can't edit/delete anything, can't see other companies).
4. They land on the Add Document form with `documentTitle`/`custodian`/`documentRef` prefilled,
   pick a category and a physical box location themselves (this part only Bika Archive can know,
   since it owns the warehouse layout), and submit.
5. The created document is automatically stamped `sourceSystem: "BIKA_FILING_SYSTEM"` plus the
   filer's name/email — visible on the document as a "Filed via Bika Filing System" badge. This
   stamping is derived server-side from who's authenticated, never from anything the client sends,
   so it can't be spoofed.

## Nothing else is needed

No new endpoints, no new auth mechanism, no schema changes on your side — this is the complete,
final shape of what to send. If a record has no known title/custodian at the point the user clicks
"File in Archive", just send `type`, `email`, `sourceCompanyId`, `iat`, `exp` and omit the rest;
the user will fill in whatever's missing on the Bika Archive form itself.
