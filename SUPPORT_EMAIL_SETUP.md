# Support e-mails - setup (once, in the Firebase console)

What the app does: when a request is created, put "En cours" / "Résolu", or gets a comment, the Support page adds a small
document to the Firestore collection `mail`. The Firebase extension **Trigger Email from Firestore** sends it.
Who gets what: new request -> the admin chosen on the Support page + the creator; En cours / Résolu -> the creator;
comment -> the other party; Archivé -> nobody. It is OFF until a system admin switches it on (Support > "Courriels du support").

## What the client must provide
- An **e-mail account that can send by SMTP**, and its password. Typed once into the extension's settings (kept in
  Google Secret Manager); it is never in the code or in this repo, and I never need to see it. Choose one:
  - **A dedicated address** (for example support@... or no-reply@...) on Google Workspace / Gmail: SMTP `smtp.gmail.com`, port 465,
    with an **app password** (the account needs 2-step verification on; the normal password does not work).
  - **Microsoft 365**: `smtp.office365.com`, port 587; an admin must allow "SMTP AUTH" for that mailbox.
  - **A sending service** (Brevo, Mailgun, SendGrid; free tiers are enough): its SMTP login and key. Best delivery, and not tied to a person's mailbox.
- If the sender address is on the client's own domain, ask whoever manages the domain to set up **SPF and DKIM** for the chosen
  provider, otherwise the e-mails may land in spam.
- The project must be on the **Blaze** plan (it is).

## Steps
1. Firebase console > **Extensions** > install **Trigger Email from Firestore**. Settings:
   - Location: the **same location as Firestore** (this project's is `us-east1`; no Europe requirement any more). Pick the same one, or the closest one the list offers.
   - SMTP connection URI: `smtps://USERNAME:PASSWORD@smtp.gmail.com:465` (use the provider's host and port; special characters in the password must be URL-encoded) - or the "SMTP password" field with Secret Manager if offered.
   - Email documents collection: `mail`.  Default FROM address: the sender address, e.g. `Support Mont Orford <support@...>`.
   - Leave the other fields empty / default.
2. Paste the new `assets/Rules for Firebase.txt` (Firestore part) into Firestore > Rules and publish: it adds `mail` and `support_settings`.
3. Deploy the site files (`pages/support.html`, `js/services/support-mail.js`), hard-refresh.
4. As system admin: Support > **Courriels du support**: tick "Envoyer des courriels", choose the admin who receives new requests, **Enregistrer**.
5. Test: create a request as a normal user; check the two e-mails; change its status; add a comment. The extension marks each document in `mail` with a `delivery` field (state SUCCESS / ERROR and the reason).

## If nothing arrives
- Firestore > `mail` > open the document > `delivery.error` says why (wrong password, port, blocked by the provider).
- No document at all: rules not published, or the switch is off, or the person has no e-mail address in their account.