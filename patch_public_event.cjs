const fs = require('fs');
let code = fs.readFileSync('src/components/public/PublicEventPage.tsx', 'utf8');

// 1. Change screeningDoc state
code = code.replace(
  "const [screeningDoc, setScreeningDoc] = useState<{name: string, base64: string} | null>(null);",
  "const [screeningDoc, setScreeningDoc] = useState<File | null>(null);"
);

// 2. Change event_type === 'team' checks to include 'hackathon' for team features
code = code.replace(
  "if (event.event_type === 'team') {",
  "if (event.event_type === 'team' || event.event_type === 'hackathon') {"
);
code = code.replace(
  "if (event.event_type === 'team') {",
  "if (event.event_type === 'team' || event.event_type === 'hackathon') {"
);

code = code.replace(
  "team_name: event.event_type === 'team' ? teamName.trim() : undefined,",
  "team_name: (event.event_type === 'team' || event.event_type === 'hackathon') ? teamName.trim() : undefined,"
);

code = code.replace(
  "team_members: event.event_type === 'team' ? finalTeamMembers : undefined,",
  "team_members: (event.event_type === 'team' || event.event_type === 'hackathon') ? finalTeamMembers : undefined,"
);

// 3. Update the file input onChange handler
code = code.replace(
  /onChange=\{\(e\) => \{[\s\S]*?reader\.readAsDataURL\(file\);\s*\}\s*\}\s*\}/,
  `onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 20 * 1024 * 1024) {
                               alert('File size exceeds 20MB limit');
                               e.target.value = '';
                               return;
                            }
                            setScreeningDoc(file);
                          }
                        }}`
);

// 4. Update the Selected: display
code = code.replace(
  "Selected: {screeningDoc.name}",
  "Selected: {screeningDoc.name}"
);

// 5. Update handleSubmit to upload the document
const afterSuccessRegex = /if \(\!response\.ok\) \{[\s\S]*?\}\s*setRegistrationSuccess\(data\.registration\);\s*\}\s*catch \(err\) \{/;
code = code.replace(
  afterSuccessRegex,
  `if (!response.ok) {
        setErrorMsg(data.error || 'Failed to register. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      let finalReg = data.registration;

      if (event.event_type === 'hackathon' && screeningDoc) {
        const formData = new FormData();
        formData.append('file', screeningDoc);
        try {
          const uploadRes = await fetch(\`/api/registrations/\${data.registration.id}/submission\`, {
            method: 'POST',
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalReg = uploadData.registration;
          } else {
             // We can ignore or log it, but the registration is already created.
             console.error('File upload failed during registration');
          }
        } catch (e) {
          console.error(e);
        }
      }

      setRegistrationSuccess(finalReg);
    } catch (err) {`
);

fs.writeFileSync('src/components/public/PublicEventPage.tsx', code);
console.log("Patched PublicEventPage.tsx");
