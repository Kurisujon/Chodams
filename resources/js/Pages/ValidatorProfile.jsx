// resources/js/Pages/ValidatorProfile.jsx
import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';

export default function ValidatorProfile() {
  const [profile, setProfile] = useState({ name: '', email: '', username: '' });
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  async function logoutValidator() {
    try {
      await fetch('/validator/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    fetch('/validator/api/profile')
      .then(r => r.json())
      .then(({ profile }) => {
        setProfile(profile || { name: '', email: '', username: '' });
      });
  }, []);

  const sendResetLink = async () => {
    setResetSending(true);
    setResetMessage('');
    try {
      const res = await fetch('/api/validator/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email || '' })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResetMessage(data.message || 'Reset link sent. Please check your email.');
      } else {
        setResetMessage(data.message || 'Failed to send reset link.');
      }
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <img src="/icons/appicon1.png" alt="logo" className="w-7 h-7 rounded-xl object-cover"/>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <nav className="space-y-2 flex flex-col flex-1">
          <Link href="/validator/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/validator/dashboard') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/dashboardicon.png" alt="Dashboard" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Dashboard</span>
          </Link>
          <Link href="/validator/survey-form" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/validator/survey-form') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/assignmenticon.png" alt="Survey Form" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Survey Form</span>
          </Link>
          <Link href="/validator/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/validator/profile') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/profileicon.png" alt="Profile" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Profile</span>
          </Link>
          <div className="mt-auto">
            <button onClick={logoutValidator} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-700">
              <img src="/icons/logouticon.png" alt="Log out" className="w-5 h-5"/>
              <span className="tracking-wider uppercase text-xs">Log out</span>
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        <section className="mt-6 w-full">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-6">
            <div className="flex gap-2">
              <button type="button" onClick={()=>setActiveTab('account')} className={`px-3 py-2 rounded-xl text-sm font-medium ${activeTab==='account' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Account Details</button>
              <button type="button" onClick={()=>setActiveTab('password')} className={`px-3 py-2 rounded-xl text-sm font-medium ${activeTab==='password' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Change Password</button>
            </div>
          </div>

          {activeTab === 'account' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Account</h3>
                <button type="button" onClick={()=>setActiveTab('password')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl">Change Password</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium text-gray-900">{profile.name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Username</div>
                  <div className="font-medium text-gray-900">{profile.username || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">{profile.email || '-'}</div>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">Active</span>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Change Password</h3>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">For security, password changes require a reset token. A reset link will be sent to your email.</div>
                <div className="text-sm"><span className="text-gray-500">Email</span> <span className="font-medium text-gray-900">{profile.email || '-'}</span></div>
                <div className="flex items-center gap-3">
                  <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-xl" onClick={sendResetLink} disabled={resetSending}>{resetSending ? 'Sending...' : 'Send reset link'}</button>
                  {resetMessage && <span className="text-sm text-gray-600">{resetMessage}</span>}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
