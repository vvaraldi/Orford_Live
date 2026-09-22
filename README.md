# REGIS

Step 3
- The network context: a network field on the collections (missing means ski, so existing data keeps working), a network.js with the current network and a query helper, and the header switcher, remembered like orford-theme and defaulting by season	The step you're describing
Step 4
- Bike forms and map	Snow conditions stay ski-only, and bike gets its own fields and a bike map
Step 5
- Documentation / README & deployment guide
Step 6: Migration Support
will need to migrate database and potentially all the site to another host and account... to be validated
6.1 Firebase rules updateIf needed for new structure


Bike content	Fault types and practices for infractions, the bike inspection checklist, bike sectors (probably the same as ski), and bike trails with numbers and positions. The trail tools are ready for this.
Season preview	Nothing. A ?date= option so you can see the public page and the default activity as they will be on 1 November, before the switch. I'd suggest doing this one first.
Cleanup	Your go-ahead. Remove the "missing activity = ski" fallbacks and the old sector name lists, since all your data has been migrated.
