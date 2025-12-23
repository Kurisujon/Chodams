import { Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data, setData, post, processing, errors, reset } = useForm({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  function submit(e) { e.preventDefault(); post('/login', { onSuccess: () => { setShowLogin(false); reset(); } }) }
  return (
    <div className={`min-h-screen bg-white overflow-x-hidden transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <header className="fixed top-0 w-full backdrop-blur bg-white/90 border-b border-black/5 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 mr-auto">
              <img src="/pics/logo.png" alt="CHoDaMS Logo" className="h-10 sm:h-12 w-auto object-contain shrink-0" />
              <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">CHoDaMS</span>  
            </Link>
            <nav className="hidden md:flex items-center gap-8 mr-8">
              <a href="#home" className="text-gray-700 hover:text-gray-900">Home</a>
              <a href="#about" className="text-gray-700 hover:text-gray-900">About</a>
              <a href="#department" className="text-gray-700 hover:text-gray-900">Department</a>
              <a href="#contact" className="text-gray-700 hover:text-gray-900">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowLogin(true)} className="hidden md:block px-4 py-2 rounded-lg bg-emerald-600 text-white shadow hover:bg-emerald-700 transition">Login</button>
              <button 
                className="md:hidden p-2 text-gray-900 rounded-lg hover:bg-gray-100 focus:outline-none"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white absolute top-full left-0 w-full shadow-lg">
            <div className="flex flex-col p-4 space-y-3">
              <a href="#home" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#about" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#department" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>Department</a>
              <a href="#contact" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600" onClick={() => setMobileMenuOpen(false)}>Contact</a>
              <div className="pt-2">
                <button onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-center shadow hover:bg-emerald-700">Login</button>
              </div>
            </div>
          </div>
        )}
      </header>

      <section id="home" className="pt-28 md:pt-40 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center py-10 md:py-14">
            <Reveal>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                  City Housing Data Management System
                </h1>
                <p className="mt-4 md:mt-6 text-gray-600 max-w-xl text-base md:text-lg">
                 Innovative Housing for Digos City - 
                 Lifting Communities, Creating Lasting Change.
                </p>
                <div className="mt-6 md:mt-8 flex items-center gap-4">
                  <Link href="/register" className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 text-sm md:text-base">
                    Get Started
                  </Link>
                  <a href="#download" className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 flex items-center gap-2 text-sm md:text-base">
                    <span className="inline-block w-5 h-5 rounded-full bg-gray-200 text-gray-700 grid place-items-center">↓</span>
                    Download App
                  </a>
                </div>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="relative md:pl-6 mt-8 md:mt-0">
                <div className="relative z-10 rounded-tl-[100px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px] overflow-hidden shadow-lg">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/en/b/b7/Digos_City_Hall_%28Rizal_Avenue%2C_Digos%2C_Davao_Del_Sur%3B_08-17-2023%29.jpg"
                    alt="Working at laptop"
                    className="w-full aspect-[16/9] sm:aspect-[4/3] md:aspect-[3/2] object-cover hover:scale-105 transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="absolute -left-6 -bottom-6 z-0 grid grid-cols-6 gap-1.5 opacity-60">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <span key={i} className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-5xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-80 md:h-[520px] bg-gray-100">
                <img src="/pics/digos-cityhall.jpg" alt="Digos City Hall" className="absolute inset-0 w-full h-full object-cover" />
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
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={e=>setData('password', e.target.value)}
                        className="w-full border border-gray-300 rounded-full p-2.5 pr-20 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={processing} className="w-full mt-2 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Log in</button>
                  <div className="mt-2 text-xs text-gray-500">Use Admin or Validator credentials</div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <section id="beneficiaries" className="py-20 md:py-24 bg-white-50 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Side: Image */}
            <Reveal>
              <div className="relative">
                <img 
                  src="/pics/think.jpg" 
                  alt="Beneficiaries Thinking" 
                  className="w-full max-w-md mx-auto rounded-2xl shadow-lg object-cover h-80 hover:scale-105 transition-transform duration-500 ease-out"
                />
              </div>
            </Reveal>

            {/* Right Side: Content */}
            <Reveal delay={200}>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 uppercase mb-6 leading-tight">Checklist of Criteria of Qualified Beneficiaries (RA 7279)</h3>
                
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-200 mt-0.5">1</span>
                    <p className="text-gray-700 text-base leading-relaxed">Underprivileged and homeless citizen/s;</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-200 mt-0.5">2</span>
                    <p className="text-gray-700 text-base leading-relaxed">Those who do not own any real property nor have been beneficiary of any government housing program <span className="font-bold text-emerald-700">EXCEPT</span> on leasehold or rental arrangement;</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-200 mt-0.5">3</span>
                    <p className="text-gray-700 text-base leading-relaxed">Not a recipient of CARP or Stewardship Certificate from the National government or any housing entity (bank, foundation, etc.);</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-200 mt-0.5">4</span>
                    <p className="text-gray-700 text-base leading-relaxed">Those with joint or family income of Php 10,797 per month and below based on NEDA poverty threshold for Davao del Sur are the <span className="font-bold text-emerald-700">first (1st) priority</span>, and those with income of 10,798 and more per month as <span className="font-bold text-emerald-700">second (2nd) priority</span>.</p>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="strategic-direction" className="py-8 scroll-mt-40 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Mission - First Column */}
            <Reveal>
              <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center hover:shadow-lg transition duration-300 flex flex-col">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-6 mx-auto">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">MISSION</h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 flex items-center">
                      To acquire land for the resettlement of Informal Settlers Families (ISF), relocate the landless and underprivileged beneficiaries/families, especially those affected by the expansion of roads/highways, and families living in hazardous locations to a safer place in the City of Digos.
                  </p>
              </div>
            </Reveal>

            {/* Vision - Second Column */}
            <Reveal delay={200}>
              <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center hover:shadow-lg transition duration-300 flex flex-col">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mb-6 mx-auto">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">VISION</h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 flex items-center">
                      An inclusive socially and economically viable developed City of Digos, A City of Choice, where you can Live, Work, Visit, and do business responsive to the needs of the underprivileged and homeless citizens to have access to an adequate, safe, secure, habitable, sustainable, resilient and affordable Housing and Relocation Sites Development Programs of City Government.
                  </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <BrandMarquee />



      <section id="about" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Reveal>
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
            </Reveal>
            <Reveal delay={200}>
              <div className="text-right">
                <img src="/pics/department.png" alt="Department" className="rounded-2xl shadow-lg w-full hover:scale-105 transition-transform duration-500 ease-out" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      
      <section id="department" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Reveal delay={0}>
                  <div className="relative overflow-hidden rounded-xl bg-gray-100">
                    <img className="w-full h-28 sm:h-32 object-cover hover:scale-110 transition-transform duration-500 ease-out" src="/pics/meeting1.jpg" alt="Meeting" />
                  </div>
                </Reveal>
                <Reveal delay={100}>
                  <div className="relative overflow-hidden rounded-xl bg-gray-100">
                    <img className="w-full h-28 sm:h-32 object-cover hover:scale-110 transition-transform duration-500 ease-out" src="/pics/meeting2.jpg" alt="Planning" />
                  </div>
                </Reveal>
                <Reveal delay={200}>
                  <div className="relative overflow-hidden rounded-xl bg-gray-100">
                    <img className="w-full h-28 sm:h-32 object-cover hover:scale-110 transition-transform duration-500 ease-out" src="/pics/turnover.png" alt="Turnover" />
                  </div>
                </Reveal>
                <div className="relative overflow-hidden rounded-xl bg-gray-100 sm:col-span-2">
                  <Reveal delay={300}>
                    <img className="w-full h-28 sm:h-32 object-cover hover:scale-105 transition-transform duration-500 ease-out" src="/pics/accomplishments.png" alt="Accomplishments" />
                    <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold bg-white/80 rounded">ACCOMPLISHMENTS</span>
                  </Reveal>
                </div>
                <Reveal delay={400}>
                  <div className="relative overflow-hidden rounded-xl bg-gray-100">
                    <img className="w-full h-28 sm:h-32 object-cover hover:scale-110 transition-transform duration-500 ease-out" src="/pics/operation1.png" alt="Operation" />
                  </div>
                </Reveal>
                <Reveal delay={500}>
                  <div className="relative overflow-hidden rounded-xl bg-gray-100">
                    <img className="w-full h-28 sm:h-32 object-cover hover:scale-110 transition-transform duration-500 ease-out" src="/pics/operation2.png" alt="Operation" />
                  </div>
                </Reveal>
              </div>
            </div>
            <Reveal delay={600}>
              <div>
                <h5 className="text-gray-900">Department</h5>
                <h3 className="mt-2 text-2xl md:text-3xl font-semibold text-gray-900">City Housing Relocation Resettlement And Site Development Accomplishments</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                    <p className="text-gray-700">Teams work together to deliver sustainable housing solutions.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                    <p className="text-gray-700">In line with RA 7279 Of Urban Development Housing Act (UDH), it enunciates the policies and guideline for the implement of the ressettlement of Assistance Program in Local Government Units (LGUs) (RAP-LGU)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 11l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                    <p className="text-gray-700">6,198 Censused and tagged household of 26 Barangays</p>
                  </div>
                </div>
              </div>
            </Reveal>
            
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <Reveal>
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
            </Reveal>
            <Reveal delay={200}>
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
            </Reveal>
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
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
              <span className="text-sm md:text-base">© 2019-2020 BootstrapDash. All rights reserved.</span>
              <span className="hidden md:inline text-emerald-600">|</span>
              <span className="text-sm md:text-base">Distributed By: Themewagon</span>
            </div>
            <div className="flex items-center gap-4 text-sm md:text-base">
              <a href="#" className="hover:text-emerald-200">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-200">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Reveal({ children, delay = 0, className = '', threshold = 0.5 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-300 ease-out transform will-change-transform motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
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
