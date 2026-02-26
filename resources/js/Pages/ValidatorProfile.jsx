// resources/js/Pages/ValidatorProfile.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

export default function ValidatorProfile() {
  const [profile, setProfile] = useState({ name: '', email: '', username: '' });
  const [emailValue, setEmailValue] = useState('');
  const [emailErrors, setEmailErrors] = useState({});
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [passwordStrength, setPasswordStrength] = useState({ label: '', score: 0 });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
        setEmailValue(profile?.email || '');
      });
  }, []);

  function evaluateStrength(value) {
    if (!value) return { label: '', score: 0 };
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    if (score <= 1) return { label: 'Weak', score };
    if (score === 2 || score === 3) return { label: 'Medium', score };
    return { label: 'Strong', score };
  }

  function updateFormField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'password') {
      setPasswordStrength(evaluateStrength(value));
    }
  }

  async function submitEmailUpdate() {
    setEmailSaving(true);
    setEmailSaved(false);
    setEmailErrors({});

    const email = (emailValue || '').trim();
    if (!email) {
      setEmailErrors({ email: ['Email is required'] });
      setEmailSaving(false);
      return;
    }

    try {
      const res = await fetch('/validator/api/profile/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf(),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors) {
        setEmailErrors(data.errors);
        return;
      }
      if (!res.ok || data.ok !== true) {
        setEmailErrors({ form: [data.message || 'Failed to update email'] });
        return;
      }
      setProfile(prev => ({ ...prev, email }));
      setEmailSaved(true);
    } finally {
      setEmailSaving(false);
    }
  }

  async function submitPassword(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrors({});

    if (!form.current_password) {
      setErrors({ current_password: ['Current password is required'] });
      setSaving(false);
      return;
    }
    if (!form.password) {
      setErrors({ password: ['New password is required'] });
      setSaving(false);
      return;
    }
    if (form.password.length < 8) {
      setErrors({ password: ['Password must be at least 8 characters'] });
      setSaving(false);
      return;
    }
    if (!form.password_confirmation || form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Passwords do not match'] });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/validator/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf(),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        return;
      }
      if (!res.ok || data.ok !== true) {
        setErrors({ form: [data.message || 'Failed to update password'] });
        return;
      }
      setForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setPasswordStrength({ label: '', score: 0 });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:block w-64 flex flex-col flex-shrink-0 bg-white text-gray-700 p-6 border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
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

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
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
          </div>
        </div>
      )}

      <main className="flex-1 h-screen overflow-y-auto p-6 bg-gray-50">
        <DashboardFade delay={0}>
          <div>
            <div className="md:hidden mb-4 flex items-center justify-between">
              <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <span className="text-sm font-semibold text-emerald-800">Menu</span>
            </div>

            <section className="mt-6 w-full max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setActiveTab('account')} 
                  className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full ${activeTab==='account' ? 'ring-2 ring-emerald-200' : ''} flex flex-col cursor-pointer transition-all hover:shadow-md`}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-emerald-800">Account details</h3>
                    <p className="mt-1 text-sm text-gray-500">Your validator profile information.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Name</div>
                      <input
                        className="border border-gray-300 rounded-xl p-2.5 w-full bg-gray-50 text-sm text-gray-900"
                        value={profile.name || ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Username</div>
                      <input
                        className="border border-gray-300 rounded-xl p-2.5 w-full bg-gray-50 text-sm text-gray-900"
                        value={profile.username || ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Email</div>
                      <input
                        className="border border-gray-300 rounded-xl p-2.5 w-full bg-white text-sm text-gray-900"
                        type="email"
                        value={emailValue}
                        onChange={e => {
                          setEmailValue(e.target.value);
                          setEmailErrors({});
                          setEmailSaved(false);
                        }}
                        disabled={activeTab !== 'account'}
                      />
                      {emailErrors.email && (
                        <p className="mt-1 text-xs text-red-600">{emailErrors.email[0]}</p>
                      )}
                    </div>
                  </div>
                  {activeTab === 'account' && (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">Active</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          submitEmailUpdate();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs disabled:opacity-60"
                        disabled={emailSaving || !emailValue || emailValue === (profile.email || '')}
                      >
                        {emailSaving ? 'Saving...' : 'Update Email'}
                      </button>
                    </div>
                  )}
                  {activeTab !== 'account' && (
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">Active</span>
                    </div>
                  )}
                  {emailErrors.form && (
                    <div className="mt-2 text-xs text-red-600">{emailErrors.form[0]}</div>
                  )}
                  {emailSaved && (
                    <div className="mt-2 text-xs text-emerald-700">Email updated and sent to admin.</div>
                  )}
                </div>

                <form 
                  onSubmit={submitPassword} 
                  onClick={() => setActiveTab('password')} 
                  className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full ${activeTab==='password' ? 'ring-2 ring-emerald-200' : ''} flex flex-col cursor-pointer transition-all hover:shadow-md`}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-emerald-800">Change password</h3>
                    <p className="mt-1 text-sm text-gray-500">Update your password using your current credentials.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Current password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="border border-gray-300 rounded-xl p-2.5 w-full pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          value={form.current_password}
                          onChange={e => updateFormField('current_password', e.target.value)}
                          disabled={activeTab !== 'password'}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                          aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        >
                          {showCurrentPassword ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 0-1.37.35-2.66.98-3.78" />
                              <path d="M6.1 6.1A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-.46 1.33-1.15 2.55-2.02 3.6" />
                              <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.current_password && (
                        <p className="mt-1 text-xs text-red-600">{errors.current_password[0]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">New password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          className="border border-gray-300 rounded-xl p-2.5 w-full pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          value={form.password}
                          onChange={e => updateFormField('password', e.target.value)}
                          disabled={activeTab !== 'password'}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {showNewPassword ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 0-1.37.35-2.66.98-3.78" />
                              <path d="M6.1 6.1A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-.46 1.33-1.15 2.55-2.02 3.6" />
                              <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-gray-500">At least 8 characters, mix of letters, numbers, symbols.</p>
                        {passwordStrength.label && (
                          <span className={`text-xs font-medium ${
                            passwordStrength.label === 'Weak'
                              ? 'text-red-600'
                              : passwordStrength.label === 'Medium'
                              ? 'text-yellow-600'
                              : 'text-emerald-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        )}
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 mb-1 block">Confirm new password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="border border-gray-300 rounded-xl p-2.5 w-full pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          value={form.password_confirmation}
                          onChange={e => updateFormField('password_confirmation', e.target.value)}
                          disabled={activeTab !== 'password'}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                          aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                        >
                          {showConfirmPassword ? (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 0-1.37.35-2.66.98-3.78" />
                              <path d="M6.1 6.1A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8-.46 1.33-1.15 2.55-2.02 3.6" />
                              <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password_confirmation && (
                        <p className="mt-1 text-xs text-red-600">{errors.password_confirmation[0]}</p>
                      )}
                    </div>
                    {errors.form && (
                      <div className="text-xs text-red-600">{errors.form[0]}</div>
                    )}
                    {saved && (
                      <div className="text-xs text-emerald-700">Password updated successfully.</div>
                    )}
                  </div>
                  {activeTab === 'password' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm disabled:opacity-60"
                        disabled={
                          saving ||
                          !form.current_password ||
                          !form.password ||
                          !form.password_confirmation ||
                          passwordStrength.score < 2
                        }
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </section>
          </div>
        </DashboardFade>
      </main>
    </div>
  );
}

function DashboardFade({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-in-out transform motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
