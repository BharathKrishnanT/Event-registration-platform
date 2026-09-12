const fs = require('fs');

const originalCode = fs.readFileSync('src/components/public/PublicConfirmationPage.tsx', 'utf8');

const returnIndex = originalCode.indexOf('  return (');
if (returnIndex === -1) throw new Error("Could not find return statement");

const beforeReturn = originalCode.substring(0, returnIndex);

const newRender = `  return (
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
`;

const finalCode = beforeReturn + newRender;
fs.writeFileSync('src/components/public/PublicConfirmationPage.tsx', finalCode);
console.log('Successfully patched PublicConfirmationPage');
