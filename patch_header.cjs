const fs = require('fs');

const code = `import React from 'react';
import { Search, ChevronDown, Ticket } from 'lucide-react';
import { Event } from '../../types.ts';

interface PublicHeaderProps {
  isHome?: boolean;
  onGoHome: () => void;
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  onOpenLookup: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  isHome,
  onGoHome,
  events,
  selectedEvent,
  onSelectEvent,
  onOpenLookup,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 print:hidden transition-all">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand */}
          <div className="flex items-center gap-4">
            <button onClick={onGoHome} className="flex items-center gap-2 group outline-none">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter group-hover:bg-slate-800 transition-colors">
                CE
              </div>
              <div className="font-bold text-slate-900 tracking-tight">
                Campus Events
              </div>
            </button>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isHome && events.length > 1 && (
              <div className="relative hidden md:block">
                <select
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const found = events.find((ev) => ev.id === e.target.value);
                    if (found) onSelectEvent(found);
                  }}
                  className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium py-2 pl-3 pr-8 rounded-lg border border-slate-200 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
            
            <button
              id="btn-check-registration-pass"
              onClick={onOpenLookup}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg transition-all shadow-sm outline-none focus:ring-2 focus:ring-slate-900"
            >
              <Ticket className="w-4 h-4 text-slate-400" />
              Lookup Pass
            </button>
          </div>
          
        </div>
      </div>
    </header>
  );
};
`;

fs.writeFileSync('src/components/public/PublicHeader.tsx', code);
console.log('patched header');
