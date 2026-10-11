'use strict';
/**
 * The logic of the Support e-mail sender, kept free of any Firebase / SMTP library so it can be tested without them
 * (tests/specs/mail-function.html runs this very file with fake parts).
 *
 * A document added to the Firestore collection "mail" by the site looks like:
 *   { to: ['someone@x.ca'], message: { subject, text }, requestId, kind, createdBy, createdAt }
 * and gets, once handled, a "delivery" field: { state: 'PROCESSING' | 'SUCCESS' | 'ERROR', ... } - the same field name
 * the old Firebase extension used, so it is where to look when an e-mail did not arrive.
 */

const EMAIL = /^[^\s@<>"',;()\[\]\\]+@[^\s@<>"',;()\[\]\\]+\.[^\s@<>"',;()\[\]\\]+$/;
const MAX_SUBJECT = 200;
const MAX_TEXT = 3000;
const ATTEMPTS = 2;
const WAIT_BETWEEN_ATTEMPTS_MS = 2000;

/** Is this document something we are willing to send? { ok: true, to, subject, text } or { ok: false, reason }. */
function check(data) {
  if (!data || typeof data !== 'object') return { ok: false, reason: 'document vide' };
  const to = data.to;
  if (!Array.isArray(to) || to.length !== 1 || typeof to[0] !== 'string' || !EMAIL.test(to[0]) || to[0].length > 254) {
    return { ok: false, reason: 'un seul destinataire valide est requis' };
  }
  const m = data.message;
  if (!m || typeof m !== 'object' || typeof m.subject !== 'string' || typeof m.text !== 'string') {
    return { ok: false, reason: 'sujet et texte requis' };
  }
  const subject = m.subject.trim(), text = m.text.trim();
  if (!subject || subject.length > MAX_SUBJECT || /[\r\n]/.test(subject)) return { ok: false, reason: 'sujet invalide' };
  if (!text || text.length > MAX_TEXT) return { ok: false, reason: 'texte invalide' };
  return { ok: true, to: to[0], subject, text };
}

/**
 * Sends one queued e-mail and records the result on the document.
 *   deps: { ref (has update()), data, transporter (has sendMail()), from, claim(ref) -> Promise<boolean>,
 *           now() -> Date-like, sleep(ms) }
 * claim() must return true for exactly ONE run per document (Firestore triggers can fire twice).
 * Returns 'sent' | 'error' | 'invalid' | 'skipped'. Never throws for a delivery problem.
 */
async function processMail(deps) {
  const { ref, data, transporter, from, claim } = deps;
  const now = deps.now || (() => new Date());
  const sleep = deps.sleep || (ms => new Promise(r => setTimeout(r, ms)));

  const v = check(data);
  if (!v.ok) {
    await ref.update({ delivery: { state: 'ERROR', error: 'Refusé : ' + v.reason, endTime: now() } });
    return 'invalid';
  }
  if (!(await claim(ref))) return 'skipped';

  let lastError = '';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const info = await transporter.sendMail({ from, to: v.to, subject: v.subject, text: v.text });
      await ref.update({
        delivery: {
          state: 'SUCCESS', attempts: attempt, endTime: now(),
          messageId: (info && info.messageId) || null,
          accepted: (info && info.accepted) || [], rejected: (info && info.rejected) || [],
          response: (info && info.response) || null, error: null
        }
      });
      return 'sent';
    } catch (e) {
      lastError = String((e && e.message) || e).slice(0, 500);
      if (attempt < ATTEMPTS) await sleep(WAIT_BETWEEN_ATTEMPTS_MS);
    }
  }
  await ref.update({ delivery: { state: 'ERROR', attempts: ATTEMPTS, endTime: now(), error: lastError } });
  return 'error';
}

module.exports = { check, processMail, EMAIL, MAX_SUBJECT, MAX_TEXT, ATTEMPTS };
