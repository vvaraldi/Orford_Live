'use strict';
/**
 * Cloud Function "sendMail": sends the e-mails the Support page queues in the Firestore collection "mail".
 * (It replaces the Firebase extension "Trigger Email from Firestore", which Google shuts down on 2027-03-31.)
 * The logic is in mail-sender.js; this file only connects it to Firestore and to the SMTP account.
 *
 * Settings (see ../SUPPORT_EMAIL_SETUP.md):
 *   SMTP_URI  (secret)  e.g. smtps://USER:PASSWORD@smtp.gmail.com:465   -> firebase functions:secrets:set SMTP_URI
 *   MAIL_FROM (setting) e.g. Support Mont Orford <support@domain.com>   -> functions/.env
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { processMail } = require('./mail-sender');

admin.initializeApp();

const SMTP_URI = defineSecret('SMTP_URI');
const MAIL_FROM = defineString('MAIL_FROM');

exports.sendMail = onDocumentCreated({
  document: 'mail/{mailId}',
  region: 'us-east1',          // the same location as Firestore
  secrets: [SMTP_URI],
  memory: '256MiB',
  timeoutSeconds: 60,
  maxInstances: 3,
  retry: false                 // a failure is written on the document (delivery.error), not retried forever
}, async (event) => {
  const snap = event.data;
  if (!snap) return;
  const db = admin.firestore();

  // Firestore triggers can fire twice for one document: only the first run to flag it sends.
  const claim = ref => db.runTransaction(async t => {
    const current = await t.get(ref);
    const d = current.data() || {};
    if (d.delivery && d.delivery.state) return false;
    t.update(ref, { delivery: { state: 'PROCESSING', startTime: admin.firestore.FieldValue.serverTimestamp() } });
    return true;
  });

  const result = await processMail({
    ref: snap.ref,
    data: snap.data(),
    transporter: nodemailer.createTransport(SMTP_URI.value()),
    from: MAIL_FROM.value(),
    claim
  });
  logger.info('mail ' + event.params.mailId + ': ' + result);
});
