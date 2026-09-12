const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace(
  "import { PublicEventPage } from './components/public/PublicEventPage.tsx';",
  "import { PublicEventPage } from './components/public/PublicEventPage.tsx';\nimport { PublicLandingPage } from './components/public/PublicLandingPage.tsx';"
);

// Update state
code = code.replace(
  "const [publicView, setPublicView] = useState<'event' | 'confirmation'>('event');",
  "const [publicView, setPublicView] = useState<'landing' | 'event' | 'confirmation'>('landing');"
);

// Fix initial data load logic: don't automatically select the first event if we want the landing page. Actually, we can keep selectedEvent=eventsData[0] but view is still 'landing'.
// Just leave that alone.

// Update PublicHeader props
code = code.replace(
  /<PublicHeader[\s\S]*?\/>/,
  `<PublicHeader
        isHome={publicView === 'landing'}
        onGoHome={() => setPublicView('landing')}
        events={events}
        selectedEvent={selectedEvent}
        onSelectEvent={(ev) => {
          setSelectedEvent(ev);
          setPublicView('event');
        }}
        onOpenLookup={() => setIsLookupOpen(true)}
      />`
);

// Update Main Content Area routing
const oldMainContent = `      {/* Main Content Area */}
      <main className="flex-1">
        {selectedEvent ? (
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
      </main>`;

const newMainContent = `      {/* Main Content Area */}
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
      </main>`;

code = code.replace(oldMainContent, newMainContent);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
