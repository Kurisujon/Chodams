import { Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false)
  const { data, setData, post, processing, errors, reset } = useForm({ username: '', password: '' })
  function submit(e) { e.preventDefault(); post('/login', { onSuccess: () => { setShowLogin(false); reset(); } }) }
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full backdrop-blur bg-white/80 border-b border-black/5 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">logo</span>
              <span className="text-xl font-semibold text-gray-900">CHoDaMS</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 ml-8">
              <a href="#home" className="text-gray-700 hover:text-gray-900">Home</a>
              <a href="#payment" className="text-gray-700 hover:text-gray-900">About</a>
              <a href="#features" className="text-gray-700 hover:text-gray-900">Department</a>
              <a href="#features" className="text-gray-700 hover:text-gray-900">Contact</a>
            </nav>
            <div className="ml-auto flex items-center gap-4">
              <button onClick={() => setShowLogin(true)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:bg-emerald-700">Login</button>
            </div>
          </div>
        </div>
      </header>

      <section id="home" className="pt-36 md:pt-40 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-14">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                Innovative Housing for Digos City -
              </h1>
              <p className="mt-6 text-gray-600 max-w-xl">
               Lifting Communities, Creating Lasting Change.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <Link href="/register" className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700">
                  Get Started
                </Link>
                <a href="#download" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 flex items-center gap-2">
                  <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-700 grid place-items-center">↓</span>
                  Download App
                </a>
              </div>
              <div className="mt-10">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>Lorim epsum</span>
                  <span className="w-12 h-px bg-gray-300"></span>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <span className="text-emerald-600 font-semibold text-lg">Lorim</span>
                  <span className="text-gray-900 font-semibold text-lg">Lorim</span>
                  <span className="text-emerald-600 font-semibold text-lg">Lorim</span>
                </div>
              </div>
            </div>
            <div className="relative md:pl-6 mt-8 md:mt-0">
              <div className="relative rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop"
                  alt="Working at laptop"
                  className="w-full aspect-square object-cover"
                />
              </div>
              <div className="absolute -left-8 bottom-8 grid grid-cols-6 gap-1 opacity-60">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="w-2 h-2 bg-emerald-500 rounded-sm"></span>
                ))}
              </div>
              <div className="absolute -right-4 bottom-6 w-8 h-8 rounded-full border border-gray-300 bg-white shadow-sm grid place-items-center text-gray-500">☾</div>
            </div>
          </div>
        </div>
      </section>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-80 md:h-[520px] bg-gray-100">
                <img src="/image/city_housing_building.jpg" alt="City Housing Building" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 via-emerald-500/20 to-emerald-400/10"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-semibold">Welcome to CHoDaMS</h3>
                  <p className="text-emerald-50 text-xs mt-1">City Housing Data Management System</p>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-500">User Login</span>
                  <button onClick={() => setShowLogin(false)} className="p-2 rounded-full hover:bg-gray-100">
                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                  </button>
                </div>
                {errors.error && <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{errors.error}</div>}
                <form onSubmit={submit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Username</label>
                    <input type="text" value={data.username} onChange={e=>setData('username', e.target.value)} className="w-full border border-gray-300 rounded-full p-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Enter username" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Password</label>
                    <input type="password" value={data.password} onChange={e=>setData('password', e.target.value)} className="w-full border border-gray-300 rounded-full p-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Enter password" />
                  </div>
                  <button type="submit" disabled={processing} className="w-full mt-2 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Log in</button>
                  <div className="mt-2 text-xs text-gray-500">Use Admin or Validator credentials</div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <BrandMarquee />

      <section id="features" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900">About The Project</h2>
            <p className="mt-4 text-gray-600 max-w-3xl mx-auto">Key capabilities designed to support efficient city housing data management and user experience.</p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
            {[
              {
                title: 'Data Management System',
                desc: 'Organized data collection, validation, storage, and reporting processes that enhance the accuracy and efficiency of managing beneficiary information.',
                icon: (
                  <svg className="relative w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="14" rx="2" />
                    <path d="M7 8h10M7 12h6M7 16h3" />
                  </svg>
                ),
              },
              {
                title: 'Automated Survey',
                desc: 'Streamlines survey processes, automates data collection, and enhances analysis for efficient decision-making.',
                icon: (
                  <svg className="relative w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 5h10a2 2 0 012 2v10a2 2 0 01-2 2H4z" />
                    <path d="M8 9h4M8 13h4" />
                    <path d="M18 7h2v8a2 2 0 01-2 2h-2" />
                  </svg>
                ),
              },
              {
                title: 'User-Friendly Platform',
                desc: 'Designed to simplify processes, ensuring seamless navigation, efficient data management, and accessibility for users of all skill levels.',
                icon: (
                  <svg className="relative w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="7" r="3" />
                    <path d="M5.5 21a6.5 6.5 0 0113 0" />
                  </svg>
                ),
              },
              {
                title: 'Role-Based System',
                desc: 'User authentication and authorization with different privilege in terms of accessing the system.',
                icon: (
                  <svg className="relative w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M4 20a8 8 0 0116 0" />
                    <path d="M17 8h3M18.5 6.5v3" />
                  </svg>
                ),
              },
              {
                title: 'Data Visualization',
                desc: 'Show varied information using pre-defined templates allowing for quick viewing of the information gathered.',
                icon: (
                  <svg className="relative w-12 h-12 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19h16" />
                    <path d="M7 15v4" />
                    <path d="M11 11v8" />
                    <path d="M15 8v11" />
                    <path d="M19 5v14" />
                  </svg>
                ),
              },
            ].map((f, i) => (
              <div
                key={i}
                className="relative rounded-[26px] border border-gray-200 p-10 text-center bg-white shadow-sm hover:shadow-lg transition"
              >
                <div className="mb-6">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 mx-auto">
                    <span className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-emerald-100/60"></span>
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-3 text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-6">
            <div className="absolute right-0 -bottom-6 w-10 h-10 rounded-xl border border-gray-300 bg-white shadow-sm grid place-items-center text-gray-500">☾</div>
          </div>
        </div>
      </section>

      <section id="about" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h5 className="text-gray-900">About The Department</h5>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-gray-900">City Housing Relocation Resettlement And Site Development program</h3>
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-emerald-600"></span>
                  <p className="text-gray-700">Stakeholders discuss plans for affordable housing development.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-emerald-600"></span>
                  <p className="text-gray-700">Groundbreaking ceremony for new housing projects.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-block w-5 h-5 rounded-full bg-emerald-600"></span>
                  <p className="text-gray-700">Teams collaborate to implement housing solutions effectively.</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <img src="https://images.unsplash.com/photo-1520607162513-77722e7c5c1a?q=80&w=1200&auto=format&fit=crop" alt="Department" className="rounded-2xl shadow-lg w-full" />
            </div>
          </div>
        </div>
      </section>

      
      <section id="department" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h5 className="text-gray-900">About The Department</h5>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-gray-900">City Housing Relocation Resettlement And Site Development program</h3>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  <p className="text-gray-700">“Teams work together to deliver sustainable housing solutions.”</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  <p className="text-gray-700">“In line with RA 7279 Of Urban Development Housing Act (UDH), it enunciates the policies and guideline for the implement of the ressettlement of Assistance Program in Local Government Units (LGUs) (RAP-LGU)”</p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                  <p className="text-gray-700">6,198 Censused and tagged household of 26 Barangays</p>
                </div>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img className="w-full h-28 sm:h-32 object-cover" src="https://images.unsplash.com/photo-1520607162513-77722e7c5c1a?q=80&w=800&auto=format&fit=crop" alt="Meeting" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img className="w-full h-28 sm:h-32 object-cover" src="https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=800&auto=format&fit=crop" alt="Planning" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img className="w-full h-28 sm:h-32 object-cover" src="https://images.unsplash.com/photo-1515165562835-c3b8b7ee40cb?q=80&w=800&auto=format&fit=crop" alt="Turnover" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 sm:col-span-2">
                  <img className="w-full h-28 sm:h-32 object-cover" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop" alt="Accomplishments" />
                  <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold bg-white/80 rounded">ACCOMPLISHMENTS</span>
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img className="w-full h-28 sm:h-32 object-cover" src="https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=800&auto=format&fit=crop" alt="Team" />
                </div>
                <div className="relative overflow-hidden rounded-xl bg-gray-100">
                  <img className="w-full h-28 sm:h-32 object-cover" src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop" alt="Workshop" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-emerald-600 font-semibold">Contact Us</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">GET IN TOUCH WITH US</h2>
              <p className="mt-4 text-gray-600 max-w-md">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Our Location</p>
                    <p className="text-gray-600">99 S.t Jomblo Park Pekanbaru</p>
                    <p className="text-gray-600">28292, Indonesia</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.15 19.5 19.5 0 01-6-6A19.86 19.86 0 012.08 4.18 2 2 0 014.06 2h3a2 2 0 012 1.72 12.44 12.44 0 00.65 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.17a2 2 0 012.11-.45 12.44 12.44 0 002.81.65A2 2 0 0122 16.92z"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Phone Number</p>
                    <p className="text-gray-600">(+62)81 414 257 9980</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Email Address</p>
                    <p className="text-gray-600">info@yourdomain.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-6 md:p-8">
                <ContactForm />
              </div>
              <div className="absolute -right-4 -top-4 w-12 h-12 rounded-bl-[2rem] bg-emerald-600"></div>
              <div className="absolute -left-10 bottom-6 hidden md:block">
                <div className="grid grid-cols-6 gap-1 opacity-25">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 bg-emerald-500 rounded-sm"></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-emerald-900 text-emerald-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <address className="not-italic">
                <p>143 castle road 517</p>
                <p className="mb-4">district, kiyev port south Canada</p>
                <div className="flex items-center gap-6">
                  <p className="mb-0">+3 123 456 789</p>
                  <a href="mailto:info@yourmail.com" className="underline hover:text-emerald-200">info@yourmail.com</a>
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <p className="mb-0">+1 222 345 342</p>
                  <a href="mailto:Marshmallow@yourmail.com" className="underline hover:text-emerald-200">Marshmallow@yourmail.com</a>
                </div>
              </address>
              <div className="mt-6">
                <h6 className="font-semibold">Social Share</h6>
                <div className="mt-2 flex items-center gap-4">
                  <a href="#" className="hover:text-emerald-200">GitHub</a>
                  <a href="#" className="hover:text-emerald-200">Facebook</a>
                  <a href="#" className="hover:text-emerald-200">Twitter</a>
                  <a href="#" className="hover:text-emerald-200">Dribbble</a>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h6 className="font-semibold">Social Share</h6>
                <ul className="mt-2 space-y-2">
                  <li><a href="#" className="underline hover:text-emerald-200">Home</a></li>
                  <li><a href="#" className="underline hover:text-emerald-200">About</a></li>
                  <li><a href="#" className="underline hover:text-emerald-200">Department</a></li>
                  <li><a href="#" className="underline hover:text-emerald-200">Portfolio</a></li>
                  <li><a href="#" className="underline hover:text-emerald-200">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>© 2019-2020 BootstrapDash. All rights reserved.</span>
              <span className="pl-4">Distributed By: Themewagon</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-emerald-200">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-200">Customer Support</a>
              <a href="#" className="hover:text-emerald-200">Careers Guide</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BrandMarquee() {
  const items = [
    { name: 'Deloitte', abbr: 'D' },
    { name: 'Ericsson', abbr: 'E' },
    { name: 'Netflix', abbr: 'N' },
    { name: 'Instagram', abbr: 'IG' },
    { name: 'Coinbase', abbr: 'CB' },
    { name: 'Deloitte', abbr: 'D' },
    { name: 'Ericsson', abbr: 'E' },
    { name: 'Netflix', abbr: 'N' },
    { name: 'Instagram', abbr: 'IG' },
    { name: 'Coinbase', abbr: 'CB' },
  ];

  return (
    <section id="clients" className="py-10 scroll-mt-40">
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 overflow-hidden">
        <div className="flex items-center gap-10 whitespace-nowrap" style={{ animation: 'marquee 28s linear infinite' }}>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 opacity-85">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700">
                <span className="text-sm font-bold">{item.abbr}</span>
              </div>
              <span className="text-gray-700 font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      setStatus('Please complete all fields.');
      return;
    }
    setStatus('Message sent.');
  }

  return (
    <form onSubmit={submit} className="w-full">
      {status && <div className="mb-4 text-emerald-600 font-medium">{status}</div>}
      <div className="space-y-4">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input w-full border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Your Name" aria-label="Name" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-input w-full border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Your Email" aria-label="Email" />
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input w-full border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Your Phone" aria-label="Phone" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="form-textarea w-full border border-gray-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" placeholder="Your Message" rows="5" aria-label="Message"></textarea>
      </div>
      <button type="submit" className="mt-6 w-full px-6 py-3 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700">Send Message</button>
    </form>
  );
}