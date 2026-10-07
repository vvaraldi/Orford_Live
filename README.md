# REGIS

2. Improve the code
#	Priority	Item
2.1 Medium Documentation / README & deployment guide
2.2	Low	Trim legacy back-compat branches

3. Improve the user experience
#	Priority	Item
3.0	Medium manage the risk of someone forcing the system via the registering of volunteers
3.1	Low	Accessibility audit pass



Quick line to popy paste at the end of each session :
- Add/update the estimated time to the log. I go to sleep !


Bike :
- Objectif to deliver this part for end of March 2027


Outcome of the meeting of the 28th of sept
Info shared : data server is US-EAST1.
Agreed on data imported and inclusion of some personal data
Created a Regis@orford.com account to manage the data (regis is the owner)
Regis has a github account
















I'd add a limit, but in a particular shape. I haven't written any code yet.

What the public page does today

Fields: each registration is a small record: first name, last name, a fixed network value, the agreement tick and a server timestamp.
Rules: my Firestore rules (assets/Rules for Firebase.txt:225) already block extra fields, long names and a fake date.
Missing limit: nothing limits how many records one visitor can create.
Real risk: the cost is low, since Firestore's free tier covers 20 000 writes a day. The real risk is a polluted volunteer list and a bloated database. Your admin tab can already bulk-delete volunteers, so the damage is recoverable.

What can and can't be limited

No per-person limit. The visitor is anonymous, and Firestore rules can't see an IP address or count existing documents. A per-device limit kept in the browser is cosmetic, because anyone with your public Firebase config can call the database directly and skip the page.
Global limits are possible. They can be enforced in the rules themselves, with no Cloud Function. A small counter document tracks per-minute, per-hour, per-day and total counts. A registration is only accepted if it increments the counter within the limits, in one atomic write. The counter can't be bumped on its own, so nobody can burn the quota without registering.
Trade-off: an attacker can't flood the database, but can fill the quota and block real volunteers until the window resets. Global limits cap the damage; they don't prevent the nuisance.

What I'd propose

Global limiter in the rules. Starting limits, which the system admin could change in a small config document without republishing rules:
10 per minute
60 per hour
150 per day
500 in total
A trail-day group of 20 people signing up within a few minutes would still pass. The "total" would be reset by the admin at each season start.
A clear message when blocked. The page would show something like « Inscriptions temporairement indisponibles, contactez la patrouille », not a generic error.
An admin switch and a counter view in the volunteers tab, to see usage, reset it, or turn the page off.
Firebase App Check with reCAPTCHA (optional). This is the proper defence against scripted floods, because it makes the database refuse calls that don't come from your real page. It needs about 15 minutes of setup in the Firebase console by you (registering a site key), and the allowed domain must be updated when the site moves to the Corporation's account.

Cautions

I can't test rules here. My test suite mocks Firebase and doesn't execute rules. A mistake would stop real volunteers from registering. I'd give you a Rules Playground checklist (about 8 cases) to run after publishing, plus the admin switch as a safety net.
Rules are tricky. Counters in rules are doable but fiddly. Two people registering in the same second could collide, so the page would retry once automatically.
Time estimate: about 2 – 3 hours of work for the limiter, counter view and tests. It was not in the quote. You can fold it into Projet 3 or treat it as a small addition to the quote.

Do you want me to go ahead? If so, tell me whether to use the proposed limits (10 / 60 / 150 / 500) and whether to include App Check now or later.