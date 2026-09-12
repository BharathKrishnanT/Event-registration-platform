const fs = require('fs');
let code = fs.readFileSync('server/db.ts', 'utf8');

const replacement = `
  private cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => this.cleanUndefined(v));
    const cleaned = { ...obj };
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        delete cleaned[key];
      } else {
        cleaned[key] = this.cleanUndefined(cleaned[key]);
      }
    });
    return cleaned;
  }

  private async syncToFirestore() {
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
  }
`;

code = code.replace(/private async syncToFirestore\(\) \{[\s\S]*?catch \(err\) \{\s*console\.error\('Failed to sync to Firestore:', err\);\s*\}\s*\}/, replacement.trim());

fs.writeFileSync('server/db.ts', code);
console.log("Fixed db.ts");
