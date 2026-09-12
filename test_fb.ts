import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const app = initializeApp({ projectId: "gen-lang-client-0485797124" });
const db = getFirestore(app, "ai-studio-collegeeventregi-d6c3607f-ff7b-48f7-81cd-cfc6afe32ccd");
db.collection('test').get().then(snap => console.log('success', snap.size)).catch(e => console.error(e));
