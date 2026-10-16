# Addendum: filing-result callback endpoint

Paste this to the agent working in `bika-source-codes/bika`. This addresses the gap you flagged
yourself: generating a handoff link only means the user was *sent* to Bika Archive, not that they
actually finished filing. Bika Archive now calls back with the real outcome — you need one new
endpoint to receive it.

---

## New endpoint: `POST /v1/archive-integration/filing-callback`

**Auth:** identical to `/v1/companies/export` — same `X-Integration-Api-Key` header, same
`ARCHIVE_INTEGRATION_API_KEY` value, same filter/guard. Reuse whatever you already built for that
endpoint rather than adding a second auth mechanism.

**When it fires:** Bika Archive calls this exactly once per document-create attempt that carried an
`externalReference` (i.e. every filing that originated from your handoff) — once the attempt is
fully resolved, whether it succeeded or failed. It is a single best-effort attempt with no retry on
your side failing to receive it (matches how your own system doesn't retry outbound calls either) —
if you want stronger delivery guarantees later, that's a separate conversation, not blocking now.

## Request body

```json
{
  "externalReference": "CASE-9001",
  "sourceCompanyId": 2,
  "status": "COMPLETED",
  "bikaArchiveDocumentId": "21e28885-f9eb-4715-a7da-f450714c929f",
  "bikaArchiveDocumentNumber": "DOC-2026-0001",
  "failureReason": null
}
```

On failure, the same shape, but:

```json
{
  "externalReference": "CASE-9001",
  "sourceCompanyId": null,
  "status": "FAILED",
  "bikaArchiveDocumentId": null,
  "bikaArchiveDocumentNumber": null,
  "failureReason": "Location not found: 00000000-0000-0000-0000-000000000000"
}
```

| Field | Type | Notes |
|---|---|---|
| `externalReference` | string | The same value you put in `documentRef` when minting the handoff token — this is your key to match back to your own record. Always present. |
| `sourceCompanyId` | number or null | Your own `Company.id`. Present on success, `null` on failure (a failure can happen before company resolution completes). |
| `status` | string | Exactly `"COMPLETED"` or `"FAILED"` — no other values. |
| `bikaArchiveDocumentId` | string (UUID) or null | Bika Archive's own document ID, for cross-reference. Present only on success. |
| `bikaArchiveDocumentNumber` | string or null | Bika Archive's human-readable document number. Present only on success. |
| `failureReason` | string or null | A human-readable message (e.g. "Document number already exists", "Location not found: ..."). Present only on failure. Not meant to be parsed programmatically — just surface it in your own UI/logs. |

**Expected response:** any 2xx. Bika Archive discards the body either way — return `204 No Content`
or `200 OK` with nothing, whichever is more consistent with your other internal endpoints.

## What to do with it

Update your "mark as archived" logic to trigger on receiving this callback with
`status: "COMPLETED"`, rather than optimistically at handoff-generation time as you'd otherwise
planned. On `status: "FAILED"`, surface it however makes sense on your side (flag the record as
"filing failed, needs retry", show the `failureReason` to the user, whatever fits your existing UX)
— the user can just click "File in Archive" again to retry, since a failed attempt doesn't leave
any partial state in Bika Archive (nothing is saved unless the whole creation succeeds).
