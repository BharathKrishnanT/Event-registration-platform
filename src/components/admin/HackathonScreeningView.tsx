import React, { useState, useMemo } from 'react';
import { Event, Registration, User } from '../../types.ts';
import { Search, Filter, CheckCircle, XCircle, Clock, FileText, Download, Mail, Eye } from 'lucide-react';

interface HackathonScreeningViewProps {
  event: Event;
  currentUser: User;
}

export const HackathonScreeningView: React.FC<HackathonScreeningViewProps> = ({ event, currentUser }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  React.useEffect(() => {
    fetchRegistrations();
  }, [event.id]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/registrations?event_id=${event.id}`, {
        headers: { 'x-user-email': currentUser.email }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const matchesSearch = 
        reg.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase());
        
      const status = reg.screening_status || 'pending';
      const isSubmitted = !!reg.hackathon_submission;
      
      let matchesFilter = true;
      if (statusFilter === 'submitted') matchesFilter = isSubmitted;
      else if (statusFilter === 'not_submitted') matchesFilter = !isSubmitted;
      else if (statusFilter !== 'all') matchesFilter = status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [registrations, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const submitted = registrations.filter(r => !!r.hackathon_submission).length;
    const pending = registrations.filter(r => r.screening_status === 'pending' || !r.screening_status).length;
    const shortlisted = registrations.filter(r => r.screening_status === 'shortlisted').length;
    const rejected = registrations.filter(r => r.screening_status === 'rejected').length;
    return { total, submitted, pending, shortlisted, rejected };
  }, [registrations]);

  const handleReview = async (status: 'shortlisted' | 'rejected') => {
    if (!selectedReg) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/registrations/${selectedReg.id}/screening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify({ status, comment: reviewComment })
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(registrations.map(r => r.id === selectedReg.id ? data.registration : r));
        setIsReviewModalOpen(false);
        showNotice(`Team ${status} successfully. Email has been triggered.`);
      } else {
        showNotice('Failed to update screening status.');
      }
    } catch (e) {
      showNotice('Error updating status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notice Toast */}
      {actionNotice && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {actionNotice}
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Hackathon Screening Round</h2>
        <p className="text-slate-500">Review team submissions, evaluate screening documents, and publish shortlist results.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Teams</span>
          <span className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Submitted</span>
          <span className="text-2xl font-bold text-indigo-700 mt-1">{stats.submitted}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pending Review</span>
          <span className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Shortlisted</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1">{stats.shortlisted}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Not Shortlisted</span>
          <span className="text-2xl font-bold text-rose-700 mt-1">{stats.rejected}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams, leaders, emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Teams</option>
            <option value="submitted">Submitted</option>
            <option value="not_submitted">Not Submitted</option>
            <option value="pending">Pending Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Not Shortlisted</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Leader</th>
                  <th className="px-6 py-4">Submission</th>
                  <th className="px-6 py-4">Screening Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRegistrations.map((reg) => {
                  const status = reg.screening_status || 'pending';
                  const hasSubmission = !!reg.hackathon_submission;
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {reg.team_name || 'No Team Name'}
                        <div className="text-xs text-slate-500 font-normal mt-0.5">{reg.registration_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">{reg.name}</div>
                        <div className="text-xs text-slate-500">{reg.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {hasSubmission ? (
                          <a 
                            href={reg.hackathon_submission!.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-xs hover:bg-indigo-100 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {reg.hackathon_submission!.file_name.substring(0, 15)}...
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Not Submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {status === 'pending' && <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-bold uppercase"><Clock className="w-3.5 h-3.5"/> Pending</span>}
                        {status === 'shortlisted' && <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold uppercase"><CheckCircle className="w-3.5 h-3.5"/> Shortlisted</span>}
                        {status === 'rejected' && <span className="inline-flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md text-xs font-bold uppercase"><XCircle className="w-3.5 h-3.5"/> Not Shortlisted</span>}
                        
                        {reg.hackathon_submission?.email_status === 'SENT' && (
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Email Sent
                          </div>
                        )}
                        {reg.hackathon_submission?.email_status === 'FAILED' && (
                          <div className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-500" /> Email Failed
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedReg(reg);
                            setReviewComment(reg.hackathon_submission?.reviewer_comment || '');
                            setIsReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRegistrations.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No teams match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Review Submission: {selectedReg.team_name}</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Team Leader</div>
                  <div className="font-medium text-slate-900">{selectedReg.name} ({selectedReg.email})</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">College</div>
                  <div className="font-medium text-slate-900">{selectedReg.college}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-3">Submitted Document</div>
                {selectedReg.hackathon_submission ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-indigo-700">{selectedReg.hackathon_submission.file_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Uploaded: {new Date(selectedReg.hackathon_submission.uploaded_at).toLocaleString()} • {(selectedReg.hackathon_submission.file_size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <a
                      href={selectedReg.hackathon_submission.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-sm">No document submitted yet.</div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-sm mb-2">Reviewer Comments (Optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Internal notes about this submission..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Status: <strong className="uppercase">{selectedReg.screening_status || 'Pending'}</strong>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white border border-rose-200 text-rose-700 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors shadow-sm"
                >
                  Mark Not Shortlisted
                </button>
                <button
                  onClick={() => handleReview('shortlisted')}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Confirm Shortlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
