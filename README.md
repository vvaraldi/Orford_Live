# REGIS

2. Improve the code
#	Priority	Item
2.1 Medium Documentation / README & deployment guide
2.2	Low	Trim legacy back-compat branches

3. Improve the user experience
#	Priority	Item
3.1 Could the "Support" app send an email to the a given email adress when there is something new or updated :  What you need to do (about 30 min the first time)
3.1.1- Install Node.js 22 LTS, then run npm install -g firebase-tools and firebase login.
3.1.2- Run npm install in functions, then copy .env.example to .env and set MAIL_FROM to the sender address.
3.1.3- Run firebase functions:secrets:set SMTP_URI and paste the SMTP connection address. It needs the client’s sending account and password (a Gmail or Workspace app password, or a Brevo/Mailgun login).
3.1.4- Run firebase deploy --only functions, answering yes to enabling services and 1 day for old images.
3.1.5- In the Support page, tick “Envoyer des courriels” and test.

issue
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system. For
more information, see about_Execution_Policies at https:/go.microsoft.com/fwlink/?LinkID=135170.
At line:1 char:1
+ npm install -g firebase-tools
+ 
    + CategoryInfo          : SecurityError: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
	
	
3.2	Low	Accessibility audit pass

optimised meteo with request + improve signalisations reporting


Quick line to popy paste at the end of each session :
- Add/update the estimated time to the log. I go to sleep !


Bike :
- Objectif to deliver this part for end of March 2027


Outcome of the meeting of the 28th of sept
Info shared : data server is US-EAST1.
Agreed on data imported and inclusion of some personal data
Created a Regis@orford.com account to manage the data (regis is the owner)
Regis has a github account



Later: once Firebase allows template edits again, set the action URL to https://regis-orford.github.io/Regis/pages/new-password.html.
You can then delete the redirect from the old repo. Until then, the redirect is what makes the emailed link work.



