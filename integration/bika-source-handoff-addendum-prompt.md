# Addendum: add documentTitle and custodian to the handoff token

Paste this to the agent working in `bika-source-codes/bika`.

---

Small follow-up to the "File in Archive" handoff endpoint you built (`POST /v1/archive-integration/handoff`, minting a signed token with `type`, `email`, `sourceCompanyId`, `documentRef`).

Bika Archive now prefills the destination form using whatever's in the token, so please add two more optional claims to the same signed JWT:

- `documentTitle` — the document/record's title or subject, if known at the point the user clicks "File in Archive".
- `custodian` — the person responsible for / associated with the record (e.g. the case owner, the filer's own name, or whatever concept of "responsible party" already exists on your side for this record).

Both are optional — omit the claim entirely if there's nothing sensible to put there for a given record, rather than sending an empty string. No other change needed: same signing key (`ARCHIVE_HANDOFF_SECRET`), same expiry, same endpoint and request/response shape as before — just two more keys in the claims map you already build.
