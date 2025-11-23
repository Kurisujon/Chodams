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

  const updatePassword = async () => {
    setSaving(true);
    setSaved(false);
    setErrors({});
    const res = await fetch('/validator/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setSaved(true);
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } else {
      const data = await res.json().catch(() => ({}));
      setErrors(data.errors || {});
    }
    setSaving(false);
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/validator/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/validator/survey-form" className="block">Survey Form</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800 cursor-pointer"><Link href="/validator/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 cursor-pointer mt-20"><button onClick={logoutValidator} className="w-full text-left">Log out</button></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        <section className="mt-6 max-w-6xl mx-auto">
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
              </div>
              <div className="flex flex-col items-center text-center">
                <img src={'/image/greenlogo1.jpg'} alt="avatar" className="w-20 h-20 rounded-full object-cover border"/>
                <div className="mt-3 w-full space-y-2">
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
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">Active</span>
                  <button type="button" onClick={()=>setActiveTab('password')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl">Change Password</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Change Password</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Current Password</div>
                  <input type="password" className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={form.current_password} onChange={e=>setForm({ ...form, current_password: e.target.value })}/>
                  {errors.current_password && <div className="text-red-600 text-sm mt-1">{errors.current_password[0]}</div>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">New Password</div>
                  <input type="password" className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={form.password} onChange={e=>setForm({ ...form, password: e.target.value })}/>
                  {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password[0]}</div>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Confirm Password</div>
                  <input type="password" className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={form.password_confirmation} onChange={e=>setForm({ ...form, password_confirmation: e.target.value })}/>
                  {errors.password_confirmation && <div className="text-red-600 text-sm mt-1">{errors.password_confirmation[0]}</div>}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-xl" disabled={saving} onClick={updatePassword}>{saving ? 'Saving...' : 'Change Password'}</button>
                {saved && <span className="text-sm text-gray-600">Saved.</span>}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}