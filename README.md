# REGIS


1. Finalize
#	Priority	Item
1.4	High	Place remaining downhill run positions/numbers
1.5	Medium-High	Do one real, logged-in end-to-end pass
1.6	Medium	Bike content: real fault/practice list, bike sectors
1.7	Medium	Finalize branding ("Regis" name/logo)

2. Improve the code
#	Priority	Item
2.3	Low	Rules/site deploy via Firebase CLI (revisit in October)
2.4	Low-Medium	Watch client-side full-collection reads
2.5	Low	Trim legacy back-compat branches

3. Improve the user experience
#	Priority	Item
3.0 Add the possibility to create a report from the summary page. Use of right click or a link once clicked on the trail ?
3.05 Use two maps one for geolocalisation and one for status  (open and close)
3.1	Medium-High	Check the new UI at phone width
3.2	Medium	Add a hint when a trail is "missing" because of the wrong kind selected
3.3	Medium	Get real feedback on the bike issue checklist
3.5	Low	Season label wording for bike
3.6	Low	Accessibility audit pass


in parallel :

Step 2
- Manage Infraction with different fault type for ski touring, velo and downhill
- When I click on close all... it add to a "bonne état" state... it should have nothing.

Step 2.5
- Manage Signalisations for ski touring, velo and downhill

Step 3
- The network context: a network field on the collections, a network.js with the current network and a query helper, and the header switcher, remembered like orford-theme and defaulting by season	The step you're describing

Step 5
- Documentation / README & deployment guide

Step 6: Migration Support
will need to migrate database and potentially all the site to another host and account... to be validated
6.1 Firebase rules updateIf needed for new structure



- Add/update the estimated time to the log. I go to sleep !



Objectif :
Livraison pour vélo fin Mars up and running


signalisation et obstable:
- état, localisation, maintenance ?

filtre signalisation par sentier, geolocaliser les signalisations et obstables

Log de trail builder:
- date, trail builder responsable(approbation etc...), trail builder support, volontaire, photos, travails, trail,
- Code QR pour enregistrer un volontaire pour la saison



Outcome of the meeting
Agreed on European data server
Agreed on data imported and inclusion of some personal data
Created a Regis@orford.com account to manage the data (regis is the owner)
Regis has a github account

To Do
Duplicate the website from the same local folder
Remove vincent.varaldi as owner of the data
