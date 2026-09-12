const fs = require('fs');
let code = fs.readFileSync('src/components/public/PublicEventPage.tsx', 'utf8');

// 1. Add states for file upload
const statesOrig = "const [teamMembers, setTeamMembers] = useState<{name: string, phone: string}[]>([]);";
const statesNew = "const [teamMembers, setTeamMembers] = useState<{name: string, phone: string}[]>([]);\n  const [screeningDoc, setScreeningDoc] = useState<{name: string, base64: string} | null>(null);";
code = code.replace(statesOrig, statesNew);

// 2. Pass document inside payload
const submitOrig = `
      const payload = {
        event_id: event.id,
        name,
        phone,
        email,
        college,
        department,
        transaction_id: transactionId,
        custom_fields: customFields,
        ...(event.event_type === 'team' && {
          team_name: teamName,
          team_members: teamMembers,
        }),
      };`;
const submitNew = `
      const payload = {
        event_id: event.id,
        name,
        phone,
        email,
        college,
        department,
        transaction_id: transactionId,
        custom_fields: customFields,
        ...((event.event_type === 'team' || event.event_type === 'hackathon') && {
          team_name: teamName,
          team_members: teamMembers,
        }),
        ...(event.event_type === 'hackathon' && screeningDoc && {
          screening_document_base64: screeningDoc.base64,
          screening_document_name: screeningDoc.name,
        }),
      };`;
code = code.replace(submitOrig, submitNew);

// 3. Prevent submit if hackathon and no doc uploaded
const valOrig = "if (!isEmailVerified) {";
const valNew = `
    if (event.event_type === 'hackathon' && !screeningDoc) {
      setError("Please upload a screening document (PDF or PPT) for the Hackathon.");
      setIsSubmitting(false);
      return;
    }
    if (!isEmailVerified) {`;
code = code.replace(valOrig, valNew);

// 4. File input HTML logic
const uiOrig = "{event.event_type === 'team' && (";
const uiNew = `
            {(event.event_type === 'team' || event.event_type === 'hackathon') && (`;
code = code.replace(uiOrig, uiNew);

const afterTeamInfo = `
                </div>
              </div>
            )}
`;
const newUploadSection = `
                </div>
              </div>
            )}

            {event.event_type === 'hackathon' && (
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    Hackathon Screening Document
                  </h3>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Upload Presentation or Report (PDF / PPT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setScreeningDoc({ name: file.name, base64: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {screeningDoc && <p className="mt-2 text-xs text-emerald-600 font-medium">Selected: {screeningDoc.name}</p>}
                </div>
              </div>
            )}
`;
code = code.replace(afterTeamInfo, newUploadSection);

fs.writeFileSync('src/components/public/PublicEventPage.tsx', code);
console.log('Patched public frontend');
