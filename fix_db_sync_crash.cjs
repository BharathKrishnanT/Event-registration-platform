const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const targetStr = `  private async syncToFirestore() {
    try {
      // Sync users
      for (const user of this.data.users) {
        await setDoc(doc(firestoreDb, 'users', user.id), this.cleanUndefined(user));
      }
      // Sync events
      for (const evt of this.data.events) {
        await setDoc(doc(firestoreDb, 'events', evt.id), this.cleanUndefined(evt));
      }
      // Sync registrations
      for (const reg of this.data.registrations) {
        await setDoc(doc(firestoreDb, 'registrations', reg.id), this.cleanUndefined(reg));
      }
    } catch (err) {
      console.error('Failed to sync to Firestore:', err);
    }
  }`;

const replaceStr = `  private async syncToFirestore(dbData?: DatabaseSchema) {
    const targetData = dbData || this.data;
    if (!targetData) return;
    try {
      // Sync users
      for (const user of targetData.users || []) {
        await setDoc(doc(firestoreDb, 'users', user.id), this.cleanUndefined(user));
      }
      // Sync events
      for (const evt of targetData.events || []) {
        await setDoc(doc(firestoreDb, 'events', evt.id), this.cleanUndefined(evt));
      }
      // Sync registrations
      for (const reg of targetData.registrations || []) {
        await setDoc(doc(firestoreDb, 'registrations', reg.id), this.cleanUndefined(reg));
      }
    } catch (err) {
      console.error('Failed to sync to Firestore:', err);
    }
  }`;

code = code.replace(targetStr, replaceStr);

code = code.replace(
  `this.syncToFirestore().catch(e => console.error("Firestore sync error", e));`,
  `this.syncToFirestore(data).catch(e => console.error("Firestore sync error", e));`
);

fs.writeFileSync('server/db.ts', code);
console.log("Fixed db.ts");
