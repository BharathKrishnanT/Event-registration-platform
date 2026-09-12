import React, { useState, useEffect } from 'react';
import { Event, Club, User, Registration } from './types.ts';
import { PublicHeader } from './components/public/PublicHeader.tsx';
import { PublicEventPage } from './components/public/PublicEventPage.tsx';
import { PublicLandingPage } from './components/public/PublicLandingPage.tsx';
import { PublicConfirmationPage } from './components/public/PublicConfirmationPage.tsx';
import { PassLookupModal } from './components/public/PassLookupModal.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout.tsx';
import { DashboardView } from './components/admin/DashboardView.tsx';
import { RegistrationsView } from './components/admin/RegistrationsView.tsx';
import { HackathonScreeningView } from './components/admin/HackathonScreeningView.tsx';
import { PaymentsView } from './components/admin/PaymentsView.tsx';
import { CheckInScannerView } from './components/admin/CheckInScannerView.tsx';
import { EventsManagementView } from './components/admin/EventsManagementView.tsx';
import { ExportsView } from './components/admin/ExportsView.tsx';
import { ClubsView } from './components/admin/ClubsView.tsx';
import { UsersView } from './components/admin/UsersView.tsx';
import { SettingsView } from './components/admin/SettingsView.tsx';
import { ShieldCheck, Lock } from 'lucide-react';

export default function App() {
  // App Mode: 'public' or 'admin'
  const [appMode, setAppMode] = useState<'public' | 'admin'>('public');

  // Core Data
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Public Experience State
  const [publicView, setPublicView] = useState<'landing' | 'event' | 'confirmation'>('landing');
  const [currentRegistration, setCurrentRegistration] = useState<Registration | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  // Admin Experience State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [eventsRes, clubsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/clubs'),
      ]);

      if (eventsRes.ok && clubsRes.ok) {
        const eventsData: Event[] = await eventsRes.json();
        const clubsData: Club[] = await clubsRes.json();
        setEvents(eventsData);
        setClubs(clubsData);
        if (eventsData.length > 0) {
          setSelectedEvent((prev) => prev || eventsData[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load initial event platform data', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Check pending payments for badge
  const checkPendingPayments = async (eventId?: string) => {
    try {
      const url = eventId ? `/api/payments?event_id=${eventId}` : '/api/payments';
      const res = await fetch(url);
      if (res.ok) {
        const list = await res.json();
        const pending = list.filter((p: any) => p.payment_status === 'PENDING');
        setPendingPaymentsCount(pending.length);
      }
    } catch (e) {
      console.error('Failed to check pending payments', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      checkPendingPayments(selectedEvent.id);
    }
  }, [selectedEvent?.id, adminTab]);

  // Sync active administrator identity to cookie for API authorization
  useEffect(() => {
    if (currentUser?.email) {
      
    } else {
      
    }
  }, [currentUser?.email]);

  // Handle Successful Public Registration
  const handleRegistrationSuccess = (reg: Registration) => {
    setCurrentRegistration(reg);
    setPublicView('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Lookup Selection
  const handleLookupSelect = (reg: Registration) => {
    setCurrentRegistration(reg);
    setPublicView('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View Existing from Warning
  const handleViewExisting = async (regId: string) => {
    try {
      const res = await fetch(`/api/registrations/${encodeURIComponent(regId)}`);
      if (res.ok) {
        const reg = await res.json();
        setCurrentRegistration(reg);
        setPublicView('confirmation');
      }
    } catch (e) {
      console.error('Lookup failed', e);
    }
  };

  // Admin Login Success
  const handleAdminLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    
    setAdminTab('dashboard');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setCurrentUser(null);
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error);
    setAppMode('public');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Loading College Events...
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN CONSOLE MODE
  // ==========================================
  if (appMode === 'admin') {
    if (!currentUser) {
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onCancel={() => setAppMode('public')}
        />
      );
    }

    return (
      <AdminLayout
        currentUser={currentUser}
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={setSelectedEvent}
        currentTab={adminTab}
        onTabChange={setAdminTab}
        onLogout={handleAdminLogout}
        onSwitchToPublic={() => setAppMode('public')}
        pendingPaymentsCount={pendingPaymentsCount}
      >
        {adminTab === 'events' ? (
          <EventsManagementView
            events={events}
            clubs={clubs}
            selectedEvent={selectedEvent}
            currentUser={currentUser}
            onSelectEvent={setSelectedEvent}
            onEventCreated={(ev) => {
              setEvents([ev, ...events]);
              setSelectedEvent(ev);
            }}
            onEventUpdated={(ev) => {
              setEvents(events.map((item) => (item.id === ev.id ? ev : item)));
              if (selectedEvent?.id === ev.id) setSelectedEvent(ev);
            }}
            onEventDeleted={(deletedId) => {
              const updated = events.filter((e) => e.id !== deletedId);
              setEvents(updated);
              if (selectedEvent?.id === deletedId) {
                setSelectedEvent(updated[0] || null);
              }
            }}
          />
        ) : adminTab === 'clubs' ? (
          <ClubsView
            clubs={clubs}
            onClubCreated={(c) => setClubs([...clubs, c])}
            onClubUpdated={(c) => setClubs(clubs.map((item) => (item.id === c.id ? c : item)))}
            onClubDeleted={(deletedId) => setClubs(clubs.filter((c) => c.id !== deletedId))}
          />
        ) : adminTab === 'users' ? (
          <UsersView
            clubs={clubs}
            currentUser={currentUser}
            onSwitchUser={(u) => {
              setCurrentUser(u);
              if (u.role !== 'SUPER_ADMIN') {
                setAdminTab('dashboard');
              }
            }}
          />
        ) : selectedEvent ? (
          <>
            {adminTab === 'dashboard' && (
              <DashboardView event={selectedEvent} onNavigateTab={setAdminTab} />
            )}
            {adminTab === 'scanner' && (
              <CheckInScannerView event={selectedEvent} currentUser={currentUser} />
            )}
            {adminTab === 'registrations' && (
              <RegistrationsView event={selectedEvent} currentUser={currentUser} />
            )}
            {adminTab === 'hackathon' && (
              <HackathonScreeningView event={selectedEvent} currentUser={currentUser} />
            )}
            {adminTab === 'payments' && (
              <PaymentsView event={selectedEvent} currentUser={currentUser} />
            )}
            {adminTab === 'exports' && <ExportsView event={selectedEvent} />}
            {adminTab === 'settings' && <SettingsView event={selectedEvent} />}
          </>
        ) : (
          <div className="py-20 text-center text-slate-500 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">No Events Configured</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You currently have no events in the database. Use the Events & Forms tab to create an event and launch registrations.
            </p>
            <button
              onClick={() => setAdminTab('events')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Go to Events & Forms
            </button>
          </div>
        )}
      </AdminLayout>
    );
  }

  // ==========================================
  // PUBLIC ATTENDEE MODE (Guest - Zero Login)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col font-sans">
      {/* Public Header */}
      <PublicHeader
        isHome={publicView === 'landing'}
        onGoHome={() => setPublicView('landing')}
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={(ev) => {
          setSelectedEvent(ev);
          setPublicView('event');
        }}
        onOpenLookup={() => setIsLookupOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {publicView === 'landing' ? (
          <PublicLandingPage 
            events={events} 
            onSelectEvent={(ev) => {
              setSelectedEvent(ev);
              setPublicView('event');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
          />
        ) : selectedEvent ? (
          publicView === 'confirmation' && currentRegistration ? (
            <PublicConfirmationPage
              registration={currentRegistration}
              onBackToEvent={() => setPublicView('event')}
            />
          ) : (
            <PublicEventPage
              event={selectedEvent}
              onRegistrationSuccess={handleRegistrationSuccess}
              onViewExisting={handleViewExisting}
            />
          )
        ) : (
          <div className="py-24 text-center text-slate-500">
            No active college events found.
          </div>
        )}
      </main>

      {/* Pass Lookup Modal */}
      <PassLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onSelectRegistration={handleLookupSelect}
      />

      {/* Discrete Footer with Organizer Sign-In Link */}
      <footer className="bg-white border-t border-slate-200/80 py-8 px-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">CE College Events</span>
            <span>•</span>
            <span>© 2026 Campus Events. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLookupOpen(true)}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              Lookup Pass
            </button>
            <span>•</span>
            <button
              id="btn-organizer-portal-link"
              onClick={() => setAppMode('admin')}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Organizer Portal</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
