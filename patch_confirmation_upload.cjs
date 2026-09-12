const fs = require('fs');
let code = fs.readFileSync('src/components/public/PublicConfirmationPage.tsx', 'utf8');

// Need to inject state for file upload
const stateStr = `  const [printBlobUrl, setPrintBlobUrl] = useState<string | null>(null);`;
const newStateStr = `  const [printBlobUrl, setPrintBlobUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Maximum file size is 20 MB.');
      return;
    }
    
    const allowed = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only PPT, PPTX and PDF files are allowed.');
      return;
    }
    
    setUploadError('');
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(\`/api/registrations/\${reg.id}/submission\`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setReg(data.registration);
      } else {
        setUploadError(data.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setUploadError('Network error. Upload failed.');
    } finally {
      setUploading(false);
    }
  };`;

code = code.replace(stateStr, newStateStr);

const hackathonSection = `
        {/* HACKATHON SCREENING SECTION */}
        {reg.team_name && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8 print:hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Screening Round Submission
              </h2>
              {reg.screening_status === 'shortlisted' && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Shortlisted
                </span>
              )}
              {reg.screening_status === 'rejected' && (
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Not Shortlisted
                </span>
              )}
              {(!reg.screening_status || reg.screening_status === 'pending') && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending Review
                </span>
              )}
            </div>
            
            <div className="p-8">
              {reg.screening_status === 'shortlisted' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900 mb-2">🎉 Congratulations!</h3>
                  <p className="text-emerald-700 font-medium">Your team has been shortlisted for the next round.</p>
                  <p className="text-emerald-600/80 text-sm mt-2">Team ID: {reg.registration_number}</p>
                </div>
              ) : reg.screening_status === 'rejected' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Screening Result</h3>
                  <p className="text-slate-600 font-medium">Not Shortlisted</p>
                  <p className="text-slate-500 text-sm mt-2">Thank you for participating in the screening round.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                      <h3 className="text-lg font-bold text-slate-900">Upload your presentation</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        Upload your PPT/PDF presentation for the screening round. 
                        We only accept <strong>.ppt, .pptx, and .pdf</strong> formats. 
                        Recommended maximum file size is <strong>20 MB</strong>.
                      </p>
                      
                      {uploadError && (
                        <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm font-medium flex items-start gap-2">
                          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          {uploadError}
                        </div>
                      )}

                      <div className="relative">
                        <input
                          type="file"
                          id="hackathon-upload"
                          className="hidden"
                          accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <label
                          htmlFor="hackathon-upload"
                          className={\`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all \${uploading ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'}\`}
                        >
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-6">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Current Submission</div>
                      {reg.hackathon_submission ? (
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="font-bold text-slate-900 truncate" title={reg.hackathon_submission.file_name}>
                                {reg.hackathon_submission.file_name}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                <span>{(reg.hackathon_submission.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="text-slate-300">•</span>
                                <span>{new Date(reg.hackathon_submission.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 flex items-center gap-3">
                            <a
                              href={reg.hackathon_submission.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              Preview
                            </a>
                            <label
                              htmlFor="hackathon-upload"
                              className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer"
                            >
                              Replace File
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <p className="text-slate-500 text-sm">No file uploaded yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
`;

const insertMarker = `{/* PASS ACTIONS (Mobile mostly) */}`;
code = code.replace(insertMarker, hackathonSection + '\n        ' + insertMarker);

// Ensure icons are imported
if (!code.includes('UploadCloud')) {
  code = code.replace(
    "import { CheckCircle2, Ticket, Printer, MapPin, Calendar, Clock, Loader2, Download, ShieldCheck, ChevronRight, Share2, Mail, ExternalLink, RefreshCw } from 'lucide-react';",
    "import { CheckCircle2, Ticket, Printer, MapPin, Calendar, Clock, Loader2, Download, ShieldCheck, ChevronRight, Share2, Mail, ExternalLink, RefreshCw, FileText, CheckCircle, XCircle, UploadCloud } from 'lucide-react';"
  );
}

fs.writeFileSync('src/components/public/PublicConfirmationPage.tsx', code);
console.log("Patched PublicConfirmationPage.tsx");
