const fs = require('fs');

const originalCode = fs.readFileSync('src/components/public/PublicEventPage.tsx', 'utf8');

const returnIndex = originalCode.indexOf('  return (');
if (returnIndex === -1) throw new Error("Could not find return statement");

const beforeReturn = originalCode.substring(0, returnIndex);

const newRender = `  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Top Banner (Optional for Poster) */}
      {event.poster_url && (
        <div className="w-full h-48 md:h-64 bg-gray-100 border-b border-gray-200 overflow-hidden">
          <img
            src={event.poster_url}
            alt={event.name}
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-5 sm:px-6 pt-10 md:pt-14">
        {/* Header Info */}
        <div className="mb-10 md:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {event.club_name || 'Event'}
            </span>
            {isClosed ? (
              <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-sm">
                Closed
              </span>
            ) : (
              <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-sm">
                Open
              </span>
            )}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            {event.name}
          </h1>
          
          <div className="text-gray-600 text-base md:text-lg max-w-3xl leading-relaxed mb-8">
            {event.description}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 md:gap-12 pt-6 border-t border-gray-200">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">When</div>
              <div className="text-sm text-gray-600">
                {event.start_date}<br/>
                {event.start_time} - {event.end_time}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Where</div>
              <div className="text-sm text-gray-600 max-w-xs">{event.venue}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Admission</div>
              <div className="text-sm text-gray-600">
                {event.fee > 0 && event.payment_enabled ? \`₹\${event.fee}\` : 'Free'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8">
            {duplicateWarning && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 mb-8 text-sm">
                <strong className="text-yellow-900 block mb-1">Already registered</strong>
                <span className="text-yellow-800">{duplicateWarning.message}</span>
                {duplicateWarning.registration_number && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => onViewExisting(duplicateWarning.registration_number!)}
                      className="text-yellow-900 underline font-medium hover:text-yellow-700"
                    >
                      View pass
                    </button>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-8 text-sm">
                {errorMsg}
              </div>
            )}

            {isClosed ? (
              <div className="bg-gray-50 border border-gray-200 p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Registrations closed</h3>
                <p className="text-gray-600 text-sm">
                  {event.auto_closed_at
                    ? \`Capacity (\${event.capacity}) reached.\`
                    : 'We are no longer accepting registrations.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. Basic Details */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Your details</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {event.event_type === 'team' || event.event_type === 'hackathon' ? 'Team Leader Name' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          disabled={isEmailVerified}
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setIsEmailVerified(false); setIsOtpSent(false); setOtpSuccessMsg(''); }}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        
                        {!isEmailVerified && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={isVerifyingOtp || !email}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                            >
                              {isOtpSent ? 'Resend verification code' : 'Verify email'}
                            </button>
                          </div>
                        )}
                        {isEmailVerified && (
                          <div className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </div>
                        )}

                        {isOtpSent && !isEmailVerified && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              placeholder="6-digit code"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                              maxLength={6}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isVerifyingOtp || otpCode.length < 6}
                              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                        {otpError && <p className="mt-1 text-sm text-red-600">{otpError}</p>}
                        {otpSuccessMsg && <p className="mt-1 text-sm text-green-600">{otpSuccessMsg}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">College/University *</label>
                        <input
                          type="text"
                          required
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                        <input
                          type="text"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Event Specific */}
                {event.form_fields && event.form_fields.length > 0 && (
                  <section className="pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional information</h2>
                    <div className="space-y-5">
                      {event.form_fields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label} {field.is_required && '*'}
                          </label>
                          {field.field_type === 'dropdown' ? (
                            <select
                              required={field.is_required}
                              value={customFields[field.field_name] || ''}
                              onChange={(e) => setCustomFields({ ...customFields, [field.field_name]: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm bg-white"
                            >
                              <option value="">{field.placeholder || 'Select...'}</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.field_type === 'number' ? 'number' : 'text'}
                              required={field.is_required}
                              placeholder={field.placeholder}
                              value={customFields[field.field_name] || ''}
                              onChange={(e) => setCustomFields({ ...customFields, [field.field_name]: e.target.value })}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Team Details */}
                {(event.event_type === 'team' || event.event_type === 'hackathon') && (
                  <section className="pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Team configuration</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Team Members</label>
                        {teamMembers.map((member, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              required
                              placeholder={\`Member \${idx + 2} Name\`}
                              value={member.name}
                              onChange={(e) => {
                                const newM = [...teamMembers];
                                newM[idx].name = e.target.value;
                                setTeamMembers(newM);
                              }}
                              className="flex-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                            />
                            <input
                              type="tel"
                              placeholder="Phone (optional)"
                              value={member.phone}
                              onChange={(e) => {
                                const newM = [...teamMembers];
                                newM[idx].phone = e.target.value;
                                setTeamMembers(newM);
                              }}
                              className="flex-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                            />
                          </div>
                        ))}
                        {event.max_team_size && teamMembers.length < event.max_team_size - 1 && (
                          <button
                            type="button"
                            onClick={() => setTeamMembers([...teamMembers, { name: '', phone: '' }])}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Add another member
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Hackathon Docs */}
                {event.event_type === 'hackathon' && (
                  <section className="pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Screening document</h2>
                    <p className="text-sm text-gray-600 mb-4">Upload your pitch deck or report. Must be PDF or PPT.</p>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
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
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer mx-auto"
                      />
                      {screeningDoc && (
                        <div className="mt-3 text-sm font-medium text-gray-900">
                          Selected: {screeningDoc.name}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <div className="pt-8 mt-8 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isEmailVerified || (event.event_type === 'hackathon' && !screeningDoc)}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white font-medium rounded-md hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : 'Complete registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Sidebar (Payment) */}
          <div className="lg:col-span-4 mt-10 lg:mt-0">
            {event.fee > 0 && event.payment_enabled && (
              <div className="bg-gray-50 border border-gray-200 p-6 rounded-md">
                <h3 className="font-semibold text-gray-900 mb-4">Payment required</h3>
                
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="text-3xl font-bold text-gray-900 mb-2">₹{event.fee}</div>
                  <p className="text-sm text-gray-600">Scan the QR code to pay via UPI.</p>
                </div>
                
                {paymentQrDataUrl ? (
                  <div className="bg-white p-4 rounded-md border border-gray-200 mb-6 flex justify-center">
                    <img src={paymentQrDataUrl} alt="UPI QR" className="max-w-[200px]" />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 mb-6 flex items-center justify-center text-sm text-gray-500 rounded-md">
                    Generating QR...
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI Transaction ID / UTR *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="12-digit UTR number"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Your registration will be pending until payment is verified by the organizers.
                  </p>
                </div>

                {event.upi_id && (
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedUpi ? 'Copied UPI ID' : 'Copy UPI ID'}
                  </button>
                )}
              </div>
            )}
            
            {event.fee === 0 && (
              <div className="bg-gray-50 border border-gray-200 p-5 rounded-md">
                <h3 className="font-semibold text-gray-900 mb-2">Free entry</h3>
                <p className="text-sm text-gray-600">
                  There is no admission fee for this event. Simply complete the form to register.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
`;

const finalCode = beforeReturn + newRender;
fs.writeFileSync('src/components/public/PublicEventPage.tsx', finalCode);
console.log('Successfully patched PublicEventPage');
