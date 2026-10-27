import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where, Timestamp, arrayUnion } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const env = await initializeTestEnvironment({ projectId: 'demo-rules', firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
let pass = 0, fail = 0;
async function t(name, fn) { try { await fn(); pass++; console.log('PASS', name); } catch (e) { fail++; console.log('FAIL', name, '-', e.message); console.log(`::error::FAIL ${name}`); } }

await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'users/admin1'), { name: 'Owner', role: 'admin' });
  await setDoc(doc(db, 'users/alice'), { name: 'Alice', role: 'client' });
  await setDoc(doc(db, 'users/bob'), { name: 'Bob', role: 'client' });
  await setDoc(doc(db, 'requests/r1'), { uid: 'alice', status: 'quote_sent', services: ['website'], quote: { total: 40000, items: [], advancePercent: 50 } });
  await setDoc(doc(db, 'requests/r2'), { uid: 'alice', status: 'submitted', services: ['website'] });
  await setDoc(doc(db, 'internal/r1'), { notes: 'secret' });
  await setDoc(doc(db, 'requests/r7'), { uid: 'alice', status: 'quote_accepted', services: ['website'], quote: { total: 40000, items: [], advancePercent: 50 } });
  await setDoc(doc(db, 'requests/r8'), { uid: 'alice', status: 'submitted', services: ['website'] });
  await setDoc(doc(db, 'settings/business'), { upiId: 'bp@okhdfc' });
  await setDoc(doc(db, 'settings/counters'), { invoice_2026_27: 3 });
});

const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const admin = env.authenticatedContext('admin1').firestore();
const anon = env.unauthenticatedContext().firestore();
const newReq = (uid, extra = {}) => ({ uid, status: 'submitted', services: ['website'], industry: 'food', ...extra });

// Sign-up / profile
await t('client creates own profile as client', () => assertSucceeds(setDoc(doc(env.authenticatedContext('carol').firestore(), 'users/carol'), { name: 'Carol', role: 'client' })));
await t('client cannot sign up as admin', () => assertFails(setDoc(doc(env.authenticatedContext('dave').firestore(), 'users/dave'), { name: 'Dave', role: 'admin' })));
await t('client cannot make self admin', () => assertFails(updateDoc(doc(alice, 'users/alice'), { role: 'admin' })));
await t('client can edit own profile', () => assertSucceeds(updateDoc(doc(alice, 'users/alice'), { company: 'Spice Box' })));
await t('client cannot read another profile', () => assertFails(getDoc(doc(bob, 'users/alice'))));
await t('anonymous cannot read profiles', () => assertFails(getDoc(doc(anon, 'users/alice'))));

// Requests
await t('client creates request', () => assertSucceeds(setDoc(doc(alice, 'requests/r3'), newReq('alice'))));
await t('client cannot create request with quote', () => assertFails(setDoc(doc(alice, 'requests/r4'), newReq('alice', { quote: { total: 1 } }))));
await t('client cannot create request with payments', () => assertFails(setDoc(doc(alice, 'requests/r5'), newReq('alice', { payments: [] }))));
await t('client cannot create request for someone else', () => assertFails(setDoc(doc(bob, 'requests/r6'), newReq('alice'))));
await t('client reads own requests (query)', () => assertSucceeds(getDocs(query(collection(alice, 'requests'), where('uid', '==', 'alice')))));
await t('client cannot read others request', () => assertFails(getDoc(doc(bob, 'requests/r1'))));
await t('client cannot list all requests', () => assertFails(getDocs(collection(alice, 'requests'))));

// Quote response
await t('client cannot change price', () => assertFails(updateDoc(doc(alice, 'requests/r1'), { 'quote.total': 1 })));
await t('client cannot add payment', () => assertFails(updateDoc(doc(alice, 'requests/r1'), { payments: arrayUnion({ amount: 99 }) })));
await t('client cannot jump to advance_paid', () => assertFails(updateDoc(doc(alice, 'requests/r1'), { status: 'advance_paid' })));
await t('client cannot accept when no quote sent', () => assertFails(updateDoc(doc(alice, 'requests/r2'), { status: 'quote_accepted', clientResponse: { decision: 'accepted' } })));
await t('other client cannot accept', () => assertFails(updateDoc(doc(bob, 'requests/r1'), { status: 'quote_accepted', clientResponse: { decision: 'accepted' } })));
await t('client accepts own quote', () => assertSucceeds(updateDoc(doc(alice, 'requests/r1'), { status: 'quote_accepted', clientResponse: { decision: 'accepted', note: '', at: Timestamp.now() }, updatedAt: Timestamp.now() })));
await t('client cannot change after accepting', () => assertFails(updateDoc(doc(alice, 'requests/r1'), { status: 'changes_requested' })));

// Admin
await t('admin lists all requests', () => assertSucceeds(getDocs(collection(admin, 'requests'))));
await t('admin lists all users', () => assertSucceeds(getDocs(collection(admin, 'users'))));
await t('admin sends quote', () => assertSucceeds(updateDoc(doc(admin, 'requests/r2'), { status: 'quote_sent', quote: { total: 50000, items: [], advancePercent: 50 } })));
await t('admin records payment', () => assertSucceeds(updateDoc(doc(admin, 'requests/r1'), { status: 'advance_paid', payments: arrayUnion({ amount: 20000, at: Timestamp.now() }) })));
await t('admin reads internal notes', () => assertSucceeds(getDoc(doc(admin, 'internal/r1'))));
await t('admin writes internal notes', () => assertSucceeds(setDoc(doc(admin, 'internal/r2'), { notes: 'x' })));
await t('client cannot read internal notes', () => assertFails(getDoc(doc(alice, 'internal/r1'))));
await t('client cannot write internal notes', () => assertFails(setDoc(doc(alice, 'internal/r9'), { notes: 'x' })));
await t('admin can set another user as admin', () => assertSucceeds(updateDoc(doc(admin, 'users/bob'), { role: 'admin' })));

// Settings, invoices, payment claims
await t('client reads payment settings', () => assertSucceeds(getDoc(doc(alice, 'settings/business'))));
await t('anonymous cannot read payment settings', () => assertFails(getDoc(doc(anon, 'settings/business'))));
await t('client cannot change payment settings', () => assertFails(setDoc(doc(alice, 'settings/business'), { upiId: 'thief@upi' })));
await t('client cannot read invoice counter', () => assertFails(getDoc(doc(alice, 'settings/counters'))));
await t('admin saves payment settings', () => assertSucceeds(setDoc(doc(admin, 'settings/business'), { upiId: 'bp@okhdfc', ifsc: 'HDFC0001234' }, { merge: true })));
await t('admin updates invoice counter', () => assertSucceeds(setDoc(doc(admin, 'settings/counters'), { invoice_2026_27: 4 }, { merge: true })));
await t('client adds one payment claim', () => assertSucceeds(updateDoc(doc(alice, 'requests/r7'), { paymentClaims: arrayUnion({ amount: 20000, utr: 'UTR1234', mode: 'UPI', at: Timestamp.now() }), updatedAt: Timestamp.now() })));
await t('client cannot claim before accepting quote', () => assertFails(updateDoc(doc(alice, 'requests/r8'), { paymentClaims: arrayUnion({ amount: 1, utr: 'X', mode: 'UPI' }) })));
await t('client cannot mark own claim verified', () => assertFails(updateDoc(doc(alice, 'requests/r7'), { paymentClaims: [{ amount: 20000, utr: 'UTR1234', mode: 'UPI', verified: true }] })));
await t('client cannot add claim and payment together', () => assertFails(updateDoc(doc(alice, 'requests/r7'), { paymentClaims: arrayUnion({ amount: 5, utr: 'Y', mode: 'UPI' }), payments: arrayUnion({ amount: 5 }) })));
await t('other client cannot add claim', () => assertFails(updateDoc(doc(bob, 'requests/r7'), { paymentClaims: arrayUnion({ amount: 1, utr: 'Z', mode: 'UPI' }) })));
await t('client cannot set invoice', () => assertFails(updateDoc(doc(alice, 'requests/r7'), { invoice: { number: 'FAKE/1' } })));
await t('client cannot set payment link', () => assertFails(updateDoc(doc(alice, 'requests/r7'), { paymentLink: 'https://evil.example' })));
await t('client cannot create request with invoice', () => assertFails(setDoc(doc(alice, 'requests/r10'), newReq('alice', { invoice: { number: 'X' } }))));
await t('admin sets invoice and payment link', () => assertSucceeds(updateDoc(doc(admin, 'requests/r7'), { invoice: { number: 'BP/2026-27/0004', date: '2026-10-27' }, paymentLink: 'https://rzp.io/l/x' })));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(`::error::${fail} security rule tests failed`); process.exit(1); }
console.log(`::notice::All ${pass} security rule tests passed`);
