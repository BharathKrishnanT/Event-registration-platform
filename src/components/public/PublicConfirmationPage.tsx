import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CheckCircle,
  Clock,
  QrCode,
  Printer,
  Download,
  Calendar,
  MapPin,
  Building2,
  User,
  ArrowLeft,
  Mail,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  X,
  AlertTriangle,
  Info,
  FileText,
  XCircle,
  UploadCloud
} from 'lucide-react';
import { Registration } from '../../types.ts';
import { createQRCodeDataUrl } from '../../utils/qr.ts';

interface PublicConfirmationPageProps {
  registration: Registration;
  onBackToEvent: () => void;
}

export const PublicConfirmationPage: React.FC<PublicConfirmationPageProps> = ({
  registration: initialReg,
  onBackToEvent,
}) => {
  const [reg, setReg] = useState<Registration>(initialReg);
  const [qrPassUrl, setQrPassUrl] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printBlobUrl, setPrintBlobUrl] = useState<string | null>(null);
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
      const res = await fetch(`/api/registrations/${reg.id}/submission`, {
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
  };

  // Load pass QR code if token is available
  useEffect(() => {
    async function loadQR() {
      if (reg.qr_token && reg.registration_status === 'CONFIRMED') {
        const url = await createQRCodeDataUrl(reg.qr_token);
        setQrPassUrl(url);
      }
    }
    loadQR();
  }, [reg]);

  // Refresh status function
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/registrations/${reg.registration_number}`);
      if (res.ok) {
        const updated = await res.json();
        setReg(updated);
      }
    } catch (e) {
      console.error('Failed to refresh status', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isFree = Boolean(
    (reg.event && (!reg.event.payment_enabled || reg.event.fee === 0)) ||
    reg.transaction_id === 'FREE_PASS'
  );

  const isConfirmed = reg.registration_status === 'CONFIRMED' && (isFree || reg.payment_status === 'VERIFIED');
  const isPending = !isFree && reg.payment_status === 'PENDING';
  const isRejected = !isFree && reg.payment_status === 'REJECTED';

  // Helper to escape HTML for printable document
  const escapeHtml = (str: string) => {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  };

  const handlePrint = () => {
    setShowPrintModal(true);
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Print failed', err);
      }
    }, 500);
  };

  const handleDownloadPass = async () => {
    if (!qrPassUrl) return;
    setIsDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = qrPassUrl;
      a.download = `Pass-${reg.registration_number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

    return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Pass Card */}
        <div id="print-area" className="bg-white border border-gray-200 shadow-sm p-8 print:border-none print:shadow-none">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold mb-3">
                <CheckCircle className="w-3.5 h-3.5" /> Registration confirmed
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Your entry pass
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Present this pass at the entrance to check in.
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Registration ID</div>
              <div className="text-xl font-mono text-gray-900 font-bold">{reg.registration_number}</div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-10">
            
            {/* Details */}
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Attendee Details</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Name</div>
                    <div className="text-sm font-medium text-gray-900">{reg.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                    <div className="text-sm font-medium text-gray-900">{reg.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">College</div>
                    <div className="text-sm font-medium text-gray-900">{reg.college}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Department</div>
                    <div className="text-sm font-medium text-gray-900">{reg.department}</div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Event Details</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500 mb-0.5">Event Name</div>
                    <div className="text-sm font-medium text-gray-900">{reg.event_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Payment Status</div>
                    <div className="text-sm font-medium">
                      {!isFree ? (
                        reg.payment_status === 'VERIFIED' ? (
                          <span className="text-green-700">Verified</span>
                        ) : reg.payment_status === 'REJECTED' ? (
                          <span className="text-red-700">Rejected</span>
                        ) : (
                          <span className="text-orange-700">Pending Verification</span>
                        )
                      ) : (
                        <span className="text-green-700">Free Entry</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Attendance Status</div>
                    <div className="text-sm font-medium">
                      {reg.attendance_status === 'CHECKED_IN' ? (
                        <span className="text-green-700">Checked In ({reg.gate || 'Gate'})</span>
                      ) : (
                        <span className="text-gray-600">Not Checked In</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="sm:w-64 shrink-0 flex flex-col items-center">
              <div className="bg-white border-2 border-gray-100 p-3 rounded-xl mb-3 shadow-sm">
                {qrPassUrl ? (
                  <img src={qrPassUrl} alt="QR Code Pass" className="w-full h-auto aspect-square object-contain" />
                ) : (
                  <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-gray-300 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="text-center text-xs text-gray-500 w-full">
                Scan this code at the venue gate for entry.
              </div>
            </div>
          </div>
        </div>

        
        {/* HACKATHON SCREENING SECTION */}
        {reg.team_name && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden mb-8 print:hidden">
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
                          className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${uploading ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'}`}
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <button
            onClick={onBackToEvent}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to events
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPass}
              disabled={isDownloading || !qrPassUrl}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Saving...' : 'Download Image'}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white shadow-sm text-sm font-medium rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </div>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Save pass</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your browser blocked the print dialog. Use the options below.
            </p>
            
            <div className="space-y-3">
              {printBlobUrl && (
                <a
                  href={printBlobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-black"
                >
                  Open in New Tab
                </a>
              )}
              <button
                type="button"
                onClick={handleDownloadPass}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Download Image
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-full flex justify-center py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
