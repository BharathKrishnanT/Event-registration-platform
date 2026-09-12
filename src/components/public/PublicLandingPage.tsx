import React from 'react';
import { Calendar, MapPin, ArrowRight, ArrowUpRight } from 'lucide-react';
import { Event } from '../../types.ts';

interface PublicLandingPageProps {
  events: Event[];
  onSelectEvent: (event: Event) => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ events, onSelectEvent }) => {
  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-24 pb-20 px-5 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold tracking-wide text-slate-700 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            2026 Academic Year
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 font-display">
            Campus Events & Symposia
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Discover and register for technical hackathons, cultural festivals, and professional workshops hosted by our top collegiate clubs.
          </p>
        </div>
      </section>

      {/* Events Grid Section */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upcoming Schedule</h2>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No events scheduled</h3>
            <p className="text-slate-500 text-sm mt-1">Check back later for upcoming symposia and hackathons.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const isClosed = event.status === 'REGISTRATION_CLOSED' || event.status === 'EVENT_COMPLETED';
              return (
                <div 
                  key={event.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col group cursor-pointer"
                  onClick={() => onSelectEvent(event)}
                >
                  <div className="h-48 w-full relative overflow-hidden bg-slate-100 border-b border-slate-100">
                    <img 
                      src={event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'} 
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {isClosed ? (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-full shadow-sm">
                        Closed
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-full shadow-sm">
                        Open
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                      {event.club_name || 'Campus Event'}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-3 group-hover:text-slate-700 transition-colors">
                      {event.name}
                    </h3>
                    
                    <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-1 leading-relaxed">
                      {event.description}
                    </p>
                    
                    <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                          {event.start_date !== event.end_date && ` - ${new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">
                        {event.fee === 0 || !event.payment_enabled ? 'Free Entry' : `${event.currency} ${event.fee}`}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <span>Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
