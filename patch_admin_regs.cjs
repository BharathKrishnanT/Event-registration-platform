const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RegistrationsView.tsx', 'utf8');

const isHackathon = `const isHackathon = event.event_type === 'hackathon';`;
code = code.replace("const isEventFree = event.fee === 0;", "const isEventFree = event.fee === 0;\n  const isHackathon = event.event_type === 'hackathon';");

const headerOrig = "{!isEventFree && <th className=\"py-3 px-4\">Payment</th>}\n                <th className=\"py-3 px-4\">Attendance</th>";
const headerNew = "{!isEventFree && <th className=\"py-3 px-4\">Payment</th>}\n                {isHackathon && <th className=\"py-3 px-4\">Screening</th>}\n                <th className=\"py-3 px-4\">Attendance</th>";
code = code.replace(headerOrig, headerNew);

const colspanOrig = "colSpan={isEventFree ? 6 : 7}";
const colspanNew = "colSpan={(isEventFree ? 6 : 7) + (isHackathon ? 1 : 0)}";
code = code.replace(colspanOrig, colspanNew);

const tdPaymentOrig = `
                        <td className="py-3.5 px-4">
                          {r.payment_status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : r.payment_status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                      )}
`;

const updateStatusFn = `
  const handleUpdateScreening = async (id: string, status: string) => {
    if (!confirm(\`Are you sure you want to mark this team as \${status}? This will email them automatically.\`)) return;
    try {
      const res = await fetch(\`/api/registrations/\${id}/screening-status\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchData(); // Reload data
    } catch (err) {
      alert(err);
    }
  };
`;

code = code.replace("const handleAddPayment = async (id: string) => {", updateStatusFn + "\n  const handleAddPayment = async (id: string) => {");

const tdScreening = `
                      )}
                      {isHackathon && (
                        <td className="py-3.5 px-4">
                          {r.screening_document_url ? (
                            <div className="flex flex-col gap-1.5 items-start">
                              <a href={r.screening_document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                                View Doc
                              </a>
                              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                <button
                                  onClick={() => handleUpdateScreening(r.id, 'shortlisted')}
                                  className={\`px-2 py-0.5 text-[9px] font-bold rounded \${r.screening_status === 'shortlisted' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}\`}
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => handleUpdateScreening(r.id, 'rejected')}
                                  className={\`px-2 py-0.5 text-[9px] font-bold rounded \${r.screening_status === 'rejected' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}\`}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No Doc Uploaded</span>
                          )}
                        </td>
                      )}
`;

code = code.replace(tdPaymentOrig, tdPaymentOrig.trim() + '\n' + tdScreening);

fs.writeFileSync('src/components/admin/RegistrationsView.tsx', code);
console.log('Patched registrations view');
