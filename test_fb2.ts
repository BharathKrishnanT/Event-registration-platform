import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import config from './firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  const snap = await getDocs(collection(db, 'test'));
  console.log('success', snap.size);
  process.exit(0);
}
test().catch(e => { console.error(e); process.exit(1); });
