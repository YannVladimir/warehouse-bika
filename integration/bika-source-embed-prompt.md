# Addendum: embed the filing form in your own popup, instead of redirecting

Paste this to the agent working in `bika-source-codes/bika`. This changes how the handoff is
presented — the token contract, auth, and everything server-side is unchanged.

---

## What changes for you

Instead of `window.location.href = redirectUrl` (a full-page redirect away from your app to Bika
Archive), open your own popup/modal and put the form inside it as an `<iframe>`:

```html
<!-- inside a modal/popup component you build and control the chrome of -->
<iframe
  src="{redirectUrl-but-swap-/handoff-for-/embed/handoff}"
  style="width: 100%; height: 640px; border: 0;"
  title="File in Bika Archive"
/>
```

Concretely: the `redirectUrl` you already build is `http://localhost:5180/handoff?token=...` —
just change the path to `/embed/handoff` (same query string, same token): `http://localhost:5180/embed/handoff?token=...`.
That's the only change to the URL you construct. Nothing about token minting, claims, or the
secret changes at all.

The embedded page has no navigation, no header/footer — just the form itself, so it reads as part
of your own popup rather than a visit to someone else's site.

## Knowing when it's done

Listen for a `message` event on `window` while your popup/iframe is open:

```js
window.addEventListener('message', (event) => {
  if (event.data?.source !== 'bika-archive' || event.data?.type !== 'filing-complete') return;
  // event.origin will be http://localhost:5180 (or wherever Bika Archive is actually hosted) --
  // worth checking that matches what you expect before trusting the payload.
  if (event.data.status === 'success') {
    // event.data.documentId, event.data.documentNumber are available here
    // close your popup, show your own success state
  } else {
    // event.data.message has a human-readable error
  }
});
```

**Important distinction:** this `postMessage` is a same-tab UX signal only, for closing your popup
immediately — it is **not** the authoritative completion signal. The server-to-server
`POST /v1/archive-integration/filing-callback` (from the earlier addendum) remains the actual
source of truth for updating your own database/record state, since a `postMessage` can be missed
(user closes the tab at the wrong instant, browser hiccup) in a way a direct server call can't.
Use the callback for "mark as archived"; use `postMessage` only for "make my own popup feel
responsive."

## Nothing else changes

Same secret, same claims, same signing, same expiry, same filing-callback endpoint you're already
building. This is purely a presentation change — a different URL path and an iframe instead of a
redirect.
