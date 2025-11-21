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
      <aside className="w-28 hover:w-60 transition-all duration-300 bg-green-800 text-white p-4">
        <ul className="space-y-2 mt-6">
          <li className="px-2 py-3 rounded hover:bg-green-700 cursor-pointer">
            <Link href="/validator/dashboard" className="block">Validator Dashboard</Link>
          </li>
          <li className="px-2 py-3 rounded hover:bg-green-700 cursor-pointer">
            <Link href="/validator/survey-form" className="block">Survey Form</Link>
          </li>
          <li className="px-2 py-3 rounded bg-green-700 cursor-pointer">
            <Link href="/validator/profile" className="block">Profile</Link>
          </li>
          <li className="px-2 py-3 rounded hover:bg-red-600 cursor-pointer mt-20">
            <Link href="/validator/logout" method="post" as="button" className="w-full text-left">Logout</Link>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center bg-white p-4 rounded shadow">
            <h1 className="text-2xl font-semibold text-green-800">Validator Profile</h1>
            <img src="/image/greenlogo1.jpg" alt="logo" className="h-14 object-contain" />
          </div>

          <div className="mt-6 bg-white rounded shadow p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Account Details</h2>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <input className="w-full border rounded p-2 bg-gray-50" value={profile.name || ''} readOnly />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <input className="w-full border rounded p-2 bg-gray-50" value={profile.email || ''} readOnly />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Username</div>
                  <input className="w-full border rounded p-2 bg-gray-50" value={profile.username || ''} readOnly />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
              <p className="mt-1 text-sm text-gray-600">Use a strong, unique password.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Current Password</div>
                  <input
                    type="password"
                    className="w-full border rounded p-2"
                    value={form.current_password}
                    onChange={e => setForm({ ...form, current_password: e.target.value })}
                  />
                  {errors.current_password && <div className="text-red-600 text-sm mt-1">{errors.current_password[0]}</div>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">New Password</div>
                  <input
                    type="password"
                    className="w-full border rounded p-2"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  {errors.password && <div className="text-red-600 text-sm mt-1">{errors.password[0]}</div>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Confirm Password</div>
                  <input
                    type="password"
                    className="w-full border rounded p-2"
                    value={form.password_confirmation}
                    onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                  />
                  {errors.password_confirmation && <div className="text-red-600 text-sm mt-1">{errors.password_confirmation[0]}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-800 text-white rounded"
                    disabled={saving}
                    onClick={updatePassword}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {saved && <span className="text-sm text-gray-600">Saved.</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}