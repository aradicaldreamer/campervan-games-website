# Merge Kitchen feedback form

`index.html` is the page the game opens from its end-of-game screen
(`https://www.campervangames.com/mergekitchen/feedback/?mode=rush&level=38&v=0.1.288&platform=WebGLPlayer`).
It pre-fills mode / level / build from that query string, and works fine opened directly too.

## The page is static; the receiver is not

GitHub Pages can only serve files, so the page cannot *accept* a submission itself. It POSTs the
answers as JSON to whatever address is in `data-endpoint` on the `<form>`. Until that is set, the
page falls back to a pre-filled email to `contact@campervangames.com` - so it is never broken,
just less convenient.

Two receivers are supported without touching the page's code:

### Google Apps Script (free, you own the data, ~5 minutes)

1. Create a Google Sheet. `Extensions > Apps Script`, replace the editor's contents with
   `apps-script.gs`, save.
2. `Deploy > New deployment`, type **Web app**, execute as **Me**, access **Anyone**. Authorise.
   Copy the URL ending in `/exec`.
3. Paste it into `data-endpoint=""` in `index.html`. Publish the site.
4. Open the `/exec` URL in a browser: it should answer `Merge Kitchen feedback: ok`.

Rows land in a `Feedback` tab and an email goes to `NOTIFY_EMAIL` (set in the script; blank to
switch off). After editing the script, `Deploy > Manage deployments > edit > New version` -
a saved edit is not live until redeployed. Apps Script's free quota is generous for this: 100
emails/day, no limit on rows.

### Formspree (no code, hosted)

Create a form at formspree.io, paste its `https://formspree.io/f/xxxx` address into
`data-endpoint`. The page detects the host and sends the JSON headers Formspree wants. The free
tier is 50 submissions/month, which is plenty for a demo.

## Why the request looks the way it does

Apps Script web apps cannot answer a CORS preflight, so the page sends the JSON as a
`text/plain` body (a "simple" request, no preflight). Formspree *does* preflight and wants
`application/json`, hence the one branch in `send()`. Both get an identical body.

## Fields

`rating` (1-5), `mode` (casual/rush/both), `wouldPlay` (yes/maybe/no), `liked`, `frustrated`,
`other`, `level`, plus context: `version`, `platform`, `device` (user agent and screen), `page`
(the full URL the form was opened with), `submittedAt`. A hidden `website` field is a honeypot -
anything that fills it is dropped client-side.

**Deliberately anonymous.** There is no email or name field, so nothing personal is collected and
no retention policy is needed for it (owner's call, 2026-09-06). Don't add one without deciding
that first. The user agent is the closest thing to identifying data and is kept only because it
is what makes a bug report reproducible.
