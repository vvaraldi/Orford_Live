# Support e-mails - setup (once)

What the app does: when a request is created, put "En cours" / "Résolu", or gets a comment, the Support page adds a small
document to the Firestore collection `mail`. A **Cloud Function** (`functions/`, function name `sendMail`) sends it by SMTP and
writes the result on the document (`delivery.state` = SUCCESS or ERROR, with the reason).
(The Firebase extension "Trigger Email from Firestore" is not used: Google shuts all extensions down on 2027-03-31.)

Who gets what: new request -> the admin chosen on the Support page + the creator; En cours / Résolu -> the creator;
comment -> the other party; Archivé -> nobody. OFF until a system admin ticks "Envoyer des courriels" (Support, bottom of the page).

## What the client must provide
- An **e-mail account that can send by SMTP**, and its password. It goes in a Google secret (step 5), never in a file or in the repo.
  - **A dedicated address** (support@... or no-reply@...) on Google Workspace / Gmail: `smtp.gmail.com`, port 465, with an **app password**
    (2-step verification must be on; the normal password does not work). The sender (`MAIL_FROM`) must be that same address.
  - **Microsoft 365**: `smtp.office365.com`, port 587 (use `smtp://` and add `?requireTLS=true`); an admin must allow "SMTP AUTH" for that mailbox.
  - **A sending service** (Brevo, Mailgun, SendGrid; free tiers are enough): its SMTP login and key. Best delivery, not tied to a person.
- On the client's own domain: SPF and DKIM for the chosen provider, or the e-mails may land in spam.
- The Blaze plan on the project (it is).

## Steps (Windows, PowerShell; the Firebase account must be Editor or Owner of `trail-inspection`)
1. Install **Node.js 22 LTS** from nodejs.org (default options). Close and reopen PowerShell.
2. `npm install -g firebase-tools`, then `firebase login` (a browser opens; sign in with the Google account of the project).
3. `cd` to the `Orford_Live` folder, then: `cd functions`, `npm install`, `cd ..`
4. In `functions`, copy `.env.example` to `.env` and write the sender: `MAIL_FROM="Support Mont Orford <support@your-domain.com>"`
5. `firebase functions:secrets:set SMTP_URI` and paste the connection address when asked (the typing is hidden), for example
   `smtps://support%40your-domain.com:APP-PASSWORD@smtp.gmail.com:465` (an @ in the user name is written %40; special characters in the password are URL-encoded).
6. `firebase deploy --only functions`. The first time it offers to enable some Google services (Cloud Build, Artifact Registry, Eventarc, Secret Manager): answer yes.
   If it asks how many days to keep old container images, answer 1 (this keeps storage at zero cost).
7. In the Google Cloud console > Billing > Budgets & alerts, create a **budget of 5 $** with e-mail alerts (a safety net, see the cost section).
8. Support page (system admin): tick "Envoyer des courriels", choose the admin, **Enregistrer**.
9. Test: create a request as a normal user (the chosen admin and the creator each get an e-mail); set En cours / Résolu; add comments.

To change the sender password later: repeat step 5, then step 6. To change the sender address: edit `.env`, then step 6.
Nothing in the site files changes when the function changes: only `firebase deploy --only functions` is run.

## Cost
Only what is above the free allowances is charged (Blaze plan). This function sends a few e-mails a day:
- Cloud Functions: 2 million calls a month free; here, dozens. Memory / CPU time: far below the free amounts.
- Secret Manager: 6 secret versions and 10,000 accesses a month free; here 1 secret, one access per e-mail.
- Artifact Registry (the stored copy of the function): 0.5 GB free, then 0.10 $ per GB-month; the 1-day clean-up in step 6 keeps it near 0.
- Firestore: a few reads / writes per e-mail, far inside the daily free amounts.
So the expected bill is 0 $ in practice; it is not a contractual zero. Two things bound the risk: the function can run on at most 3 servers at once
(`maxInstances`), and the budget alert of step 7 tells you if anything ever costs money.

## If nothing arrives
- Firestore > `mail` > the latest document > `delivery`: `ERROR` and its reason (wrong password, port, refused by the provider).
- No `delivery` field at all: the function is not deployed (`firebase functions:list`), or look at `firebase functions:log`.
- No document in `mail`: the switch is off, the rules were not published, the page was not refreshed, or the person has no e-mail address in their account.