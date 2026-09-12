import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Table,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { Event } from '../../types.ts';

interface ExportsViewProps {
  event: Event;
}

export const ExportsView: React.FC<ExportsViewProps> = ({ event }) => {
  const isEventFree = !event.payment_enabled || event.fee === 0;
  const [sheetData, setSheetData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const fetchSheetStatus = async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/export/sheets`);
      if (res.ok) {
        setSheetData(await res.json());
      }
    } catch (e) {
      console.error('Failed to load sheet status', e);
    }
  };

  useEffect(() => {
    fetchSheetStatus();
  }, [event.id]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/events/${event.id}/export/sheets/sync`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSyncNotice('Google Sheet synchronized with latest event registrations.');
        fetchSheetStatus();
        setTimeout(() => setSyncNotice(null), 3500);
      }
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Portability & Reports
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Export Records & Google Sheets Sync
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Download formatted multi-sheet Excel workbooks or synchronize real-time with Google Sheets.
          </p>
        </div>
      </div>

      {syncNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Multi-Sheet Excel Workbook (.xlsx) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Full Excel Workbook (.xlsx)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Includes {isEventFree ? '3' : '4'} separate structured sheets:
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Sheet 1: Registrations</strong> (All participant details, contact, status)
              </li>
              {!isEventFree && (
                <li>
                  <strong>Sheet 2: Payments</strong> (UTR, verified by, timestamps, audit)
                </li>
              )}
              <li>
                <strong>Sheet {isEventFree ? '2' : '3'}: Attendance</strong> (Check-in time, gate, scanner operator)
              </li>
              <li>
                <strong>Sheet {isEventFree ? '3' : '4'}: Executive Summary</strong> ({isEventFree ? 'Attendance rate, breakdown, metrics' : 'Total revenue, attendance rate, metrics'})
              </li>
            </ul>
          </div>

          <a
            href={`/api/events/${event.id}/export/excel`}
            download
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            Download Complete .xlsx Workbook
          </a>
        </div>

        {/* Option 2: Standard CSV Export */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Registrations CSV Export (.csv)
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lightweight comma-separated format compatible with any data analysis tool, Python pandas, R, or legacy college database imports.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1 font-mono text-[11px]">
              <div>Headers included:</div>
              <div className="text-slate-500 truncate">
                Reg_ID, Name, Phone, Email, College, Dept, UTR, Status...
              </div>
            </div>
          </div>

          <a
            href={`/api/events/${event.id}/export/csv`}
            download
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Plain CSV
          </a>
        </div>
      </div>

      {/* Google Sheets Integration Section */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold">
              GS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Google Sheets Real-Time Sync
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically reflects newly registered participants and check-in gate stamps.
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Sheet Now'}
          </button>
        </div>

        {sheetData?.integration && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <div className="text-slate-400 font-medium">Sheet Title</div>
              <div className="font-bold text-slate-900 truncate">
                {sheetData.integration.sheet_title}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Synced Records</div>
              <div className="font-bold text-emerald-600">
                {sheetData.integration.records_synced} rows
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Last Synchronized</div>
              <div className="font-mono text-slate-700">
                {new Date(sheetData.integration.last_synced_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          </div>
        )}

        {/* Preview of Columns */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Synchronized Data Columns Preview
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Registration ID',
              'Full Name',
              'Phone',
              'Email',
              'College',
              'Department',
              ...(!isEventFree ? ['Transaction ID', 'Payment Status'] : []),
              'Registration Status',
              'Attendance Status',
              'Gate',
              'Check-in Timestamp',
            ].map((col) => (
              <span
                key={col}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-mono font-medium"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
