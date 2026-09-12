const fs = require('fs');
let code = fs.readFileSync('src/components/admin/HackathonScreeningView.tsx', 'utf8');

// Add actionNotice state
code = code.replace(
  "const [reviewComment, setReviewComment] = useState('');",
  "const [reviewComment, setReviewComment] = useState('');\n  const [actionNotice, setActionNotice] = useState<string | null>(null);\n  const [isSubmitting, setIsSubmitting] = useState(false);\n\n  const showNotice = (msg: string) => {\n    setActionNotice(msg);\n    setTimeout(() => setActionNotice(null), 3500);\n  };"
);

// Replace handleReview
const oldHandleReview = `  const handleReview = async (status: 'shortlisted' | 'rejected') => {
    if (!selectedReg) return;
    if (!window.confirm(\`Are you sure you want to mark \${selectedReg.team_name || selectedReg.name} as \${status === 'shortlisted' ? 'Shortlisted' : 'Not Shortlisted'}? This will send an email.\`)) return;

    try {
      const res = await fetch(\`/api/registrations/\${selectedReg.id}/screening\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({ status, comment: reviewComment })
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(registrations.map(r => r.id === selectedReg.id ? data.registration : r));
        setIsReviewModalOpen(false);
        alert(\`Team \${status} successfully. Email has been triggered.\`);
      } else {
        alert('Failed to update screening status.');
      }
    } catch (e) {
      alert('Error updating status.');
    }
  };`;

const newHandleReview = `  const handleReview = async (status: 'shortlisted' | 'rejected') => {
    if (!selectedReg) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(\`/api/registrations/\${selectedReg.id}/screening\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({ status, comment: reviewComment })
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(registrations.map(r => r.id === selectedReg.id ? data.registration : r));
        setIsReviewModalOpen(false);
        showNotice(\`Team \${status} successfully. Email has been triggered.\`);
      } else {
        showNotice('Failed to update screening status.');
      }
    } catch (e) {
      showNotice('Error updating status.');
    } finally {
      setIsSubmitting(false);
    }
  };`;

code = code.replace(oldHandleReview, newHandleReview);

// Add notice UI
const returnStr = "  return (\n    <div className=\"space-y-6\">";
const newReturnStr = "  return (\n    <div className=\"space-y-6\">\n      {/* Notice Toast */}\n      {actionNotice && (\n        <div className=\"fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium text-sm flex items-center gap-3 animate-in slide-in-from-bottom-5\">\n          <CheckCircle className=\"w-5 h-5 text-emerald-400\" />\n          {actionNotice}\n        </div>\n      )}";

code = code.replace(returnStr, newReturnStr);

// Disable buttons during submit
code = code.replace(
  "onClick={() => handleReview('rejected')}",
  "onClick={() => handleReview('rejected')}\n                  disabled={isSubmitting}"
);
code = code.replace(
  "onClick={() => handleReview('shortlisted')}",
  "onClick={() => handleReview('shortlisted')}\n                  disabled={isSubmitting}"
);

fs.writeFileSync('src/components/admin/HackathonScreeningView.tsx', code);
console.log('patched');
