import React, { useState } from 'react';
import { X, Search, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Registration } from '../../types.ts';

interface PassLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegistration: (reg: Registration) => void;
}

export const PassLookupModal: React.FC<PassLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectRegistration,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = query.trim();
    if (!clean) return;

    setIsSearching(true);
    try {
      // First try direct registration lookup by ID or token
      const res = await fetch(`/api/registrations/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const reg = await res.json();
        onSelectRegistration(reg);
        onClose();
        return;
      }

      // If not found by ID, search through registrations list by email or phone
      const listRes = await fetch('/api/registrations');
      if (listRes.ok) {
        const list: Registration[] = await listRes.json();
        const found = list.find(
          (r) =>
            r.registration_number.toLowerCase() === clean.toLowerCase() ||
            r.email.toLowerCase() === clean.toLowerCase() ||
            r.phone.replace(/[^0-9]/g, '') === clean.replace(/[^0-9]/g, '')
        );

        if (found) {
          onSelectRegistration(found);
          onClose();
          return;
        }
      }

      setError('No registration record found matching that Registration ID, email, or phone number.');
    } catch (err: any) {
      setError('Unable to perform search. Please check your network connection.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Find My Registration Pass</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your <strong>Registration ID</strong> (e.g. <span className="font-mono text-slate-900">REG-2026-000101</span>),
            or the email/phone used during registration to retrieve your pass status.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Registration ID / Email / Phone
            </label>
            <input
              type="text"
              autoFocus
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. REG-2026-000101 or email@domain.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search Pass'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
