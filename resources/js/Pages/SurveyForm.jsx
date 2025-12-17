// resources/js/Pages/SurveyForm.jsx
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import { Listbox, Transition } from '@headlessui/react'

const barangays = [
  'Aplaya','Balabag','Binaton','Cogon','Colorado','Dawis','Dulangan','Goma','Igpit','Kapatagan','Kiagot','Lungag','Mahayahay','Matti','Ruparan','San_Agustin','San_Jose','San_Miguel','San_Roque','Sinawilan','Soong','Tiguman','Tres_De_Mayo','Zone_1','Zone_2','Zone_3'
]

const purokMap = {
  Aplaya: [
    'Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 7-A','Purok 8','Purok 9','Purok 9-A','Purok 10','Purok 11','Purok 12'
  ],
  Balabag: [
    'Sambag','Kaimito','Sabana','Manga','Durian','Cashew','Mangosteen','Rambutan','Buongon','Lansones'
  ],
  Binaton: [
    'Duranta','Kahugpong','Mabulo','Kampana','Magkahiusa','Mabuhay','Pag-asa','Lamsones','Marangan','Panaghiusa','Palma','Durian','Mangga','Anthurium','Bajada','Balite','Nangka','Gemelina','Narra'
  ],
  Cogon: [
    'Butterfly','Mangga','San Francisco','Acacia','Gemelina','Ipil-ipil','Calachuchi','Mahogany','Riverside','Kalubihan','Calumpang','Owangon','Caimito','Talisay','Malabago','Hanapbuhay','Seaweeds','Tabing Ilog','Bakhaw','Pag-asa','Molave','Cherry Blossom','Laminosa','Kalingkatan','White Sand','Bermuda A','Bermuda B'
  ],
  Colorado: [
    'Vanda','Gemelina','Palmera','Anahaw','Yellow Bell','Birds of Paradise','Bougainvillea','San Francisco'
  ],
  Dawis: [
    'Bangus','Tangigue','Bariles','Maya-maya','Talakitok','Barongoy','Lapu-lapu','Kitong','Bolinao'
  ],
  Dulangan: [
    '1','2','3','4','5','6','7'
  ],
  Goma: [
    'Alom 1','Alom 2','Copper','Duranta','Gemelina','Katmon','Kawayan 1','Kawayan 2','Lansones','Maliwanag','Mangga 1','Mangga 2','Mangga 3','Narra 1','Narra 2','Narra 3','Olayan','Pinadayag','Rambutan 1','Rambutan 2','Rambutan 3','Rambutan 4','Sandawa 1','Sandawa 2','Sandawa 3','Lawaan'
  ],
  Igpit: [
    'Sto. Niño','Relocation','Roxas','Bagumbuhay','Palayan','Sto. Tomas','San Vicente'
  ],
  Kiagot: [],
  Lungag: [
    'Pag-asa','Malipayon','Mabuhay'
  ],
  Mahayahay: [
    'Doña Aurora','Lomboy','Mangga','Señorita','Palmera','Mahogany','Acacia'
  ],
  Matti: [
    'Purok 1','Purok 2','Purok 2A','Purok 3','Purok 3A','Purok 4','Purok 5','Purok 5A','Purok 6','Purok 6A','Purok 7','Purok 7A','Purok 7B'
  ],
  Kapatagan: [],
  Ruparan: [
    'Purok 1','Purok 1A','Purok 2','Purok 2A','Purok 3','Purok 4','Purok 4A','Purok 5','Purok 5A','Purok 5B','Purok 6','Purok 6A','Purok 6B','Purok 6C','Purok 6D','Purok 6E','Purok 7','Purok 7 Mangga Ext.'
  ],
  San_Agustin: [
    '1A','1','1C Tennessee Homes','2A','2B Frankville Subd.','3','4','5','6','7'
  ],
  San_Miguel: [
    'Caimito','Mizrach','Sun Flower','Azucena','Talisay','Motave','Gemelina Centro','Masnanitas','Bayabas','Rambutan','Gemelina Lim Ext.','Bayanihan','Duranta','Rolex','Calumpang','Anahaw','Camnsi','Lomboy 2','Nangka Lapu2x Ext.','Nangka-B','Coconut','Nangka-A','Pine Tree','Lomboy I','Rose','Rosal','Mangga','Ilaw Ng Buhay','Sampalok','Cactus','Waling-waling','Camantigue','Santol','Durian','Calachuchi','Sambag','Santan','San Francisco','Mabinex','Narra','Sibucao'
  ],
  San_Jose: [
    'Mangga','Pomelo','Mango Drive','Nindot','Nangka','Talisay I','Talisay II','Camanchilles','Superhighway','Madasigon','Batangueño','Pabalan','Cagape','Pioneer','Acacia','Gemelina','Rose','Malinawon','Jakosalem','Mahogany','Duranta','San Francisco'
  ],
  San_Roque: [
    'Dayang-dayang','Curacha','Cha-cha','Lambada','Tango','Tinikling','Cariñosa','Boogie','Zumba'
  ],
  Sinawilan: [],
  Soong: [
    'Durian','Santol','Narra','Mangga','Acacia','Mahogany','Tugas'
  ],
  Tiguman: [],
  Tres_De_Mayo: [
    'Sampaloc','Panag-hiusa','Mabuhay','San Francisco','Sto. Niño','Villa de Salvacion','Manggahan','Kamansiles','Padema','Linaw','Fortune','Sambag','Conte','Tugas','Santol','Dapsa','Centro','Pag-asa','Gemelina','Mahogany','Madasigon','Adelfa','Malantawon','Duranta','Citta di Oro','Yellow Bell','Maabi-abihon','Camansi','Don Lorenzo Subd.','Paradise Subd.','Emily Homes Phase I','Emily Homes Phase II','Perfect Homes','Central Plain Phase I','Central Plain Phase II','Estrada Subd.'
  ],
  Zone_1: [
    'Rosas','Avocado','Lanzones','Chesnut','Palmera','Sampaguita','Chico','Acaciaman','Rosal','Kawayab','Narra','Panaghiusa','Matamis','Riverside','Atis','Malipayon','Masipag','Pagtoo','Malunggay','Centennial','Star Apple','Madasigon','Gemelina','Santol','Tugas','Mangga','Ravina','Mahogany','Kasaligan','Golden Duranta','Durian','Kalinaw','Silangan','Bayabas','Tambis','Talisay','Yellowbell','Sambag','Duranta','Labana','Cattleya','Manggahan','Mangga-Jumao-as','San Francisco','Laminosa','Waling-waling','Papaya','Alum','Ipil-ipil','Aratilis','Islam','Molave'
  ],
  Zone_2: [
    "Assessor's","Bayanihan","San Vicente","Kahayag","Cometa","Kawayan","Panaghiusa","Pakigdait","Gemelina 2","Kalayaan","Palmera","Maya","Pag-asa","Nagkahiusa","Salam","Binangay","Kalusugan","Suerte","Laging Handa","Samahang Nayon","Kauswagan","Acacia","Duranta","Narra","Sadepa","Maharlika","Maligya","Padillo","Paraiso","Ubas","Gemelina 1","Santan","Kapamilya"
  ],
  Zone_3: []
}

const humanize = (value) => String(value ?? '').replace(/_/g, ' ')

const buildOptions = (values, emptyLabel = '- select here -', labelFn = humanize) => [
  { value: '', label: emptyLabel },
  ...values.map(v => ({ value: v, label: labelFn(v) })),
]

function calcAgeFromDateString(dateString) {
  const s = String(dateString || '').trim()
  if (!s) return ''
  const parts = s.split('-').map(x => x.trim())
  if (parts.length !== 3) return ''
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ''
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return ''

  const birth = new Date(y, m - 1, d)
  if (Number.isNaN(birth.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - y
  const hasHadBirthdayThisYear =
    today.getMonth() > (m - 1) || (today.getMonth() === (m - 1) && today.getDate() >= d)
  if (!hasHadBirthdayThisYear) age -= 1
  if (age < 0) return ''
  return String(age)
}

function SmoothSelect({ value, onChange, options, buttonClassName, disabled = false }) {
  const selected = options.find(o => o.value === value)
  const showPlaceholder = value === '' || value == null
  const label = showPlaceholder ? (options[0]?.label ?? '') : (selected?.label ?? '')

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
            type="button"
            className={`${buttonClassName} ${disabled ? 'cursor-not-allowed opacity-60' : ''} flex items-center justify-between gap-2`}
          >
            <span className={`block min-w-0 flex-1 truncate ${showPlaceholder ? 'text-gray-400' : 'text-gray-900'}`}>{label}</span>
            <svg className="h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              {open ? (
                <path
                  fillRule="evenodd"
                  d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.83l-3.71 3.94a.75.75 0 0 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </Listbox.Button>

          <Transition
            as={Fragment}
            show={open && !disabled}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Listbox.Options className="absolute left-0 z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
              {options.map((opt, idx) => (
                <Listbox.Option
                  key={`${opt.value ?? 'opt'}-${idx}`}
                  value={opt.value}
                  className={({ active }) =>
                    `cursor-pointer select-none rounded-xl px-3 py-2 text-sm ${active ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'}`
                  }
                >
                  {({ selected: isSelected }) => (
                    <div className="flex items-center justify-between gap-3">
                      <span className={`min-w-0 flex-1 truncate ${isSelected ? 'font-medium text-emerald-700' : ''}`}>{opt.label}</span>
                      {isSelected && (
                        <svg className="h-4 w-4 flex-shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.58a1 1 0 0 1-1.43.003L3.29 9.76a1 1 0 1 1 1.42-1.41l3.05 3.07 6.79-6.86a1 1 0 0 1 1.414-.006Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}

function Signature({ canvasRef, onClear }) {
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const getPoint = (e) => {
    if (e?.cancelable) e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e?.touches?.[0]?.clientX ?? e?.clientX ?? 0
    const clientY = e?.touches?.[0]?.clientY ?? e?.clientY ?? 0
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }
  const onDown = (e) => {
    drawing.current = true
    last.current = getPoint(e)
  }
  const onMove = (e) => {
    if (!drawing.current) return
    const { x, y } = getPoint(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    last.current = { x, y }
  }
  const onUp = () => { drawing.current = false }
  return (
    <div className="space-y-2">
      <div className="w-full max-w-3xl">
        <canvas
          ref={canvasRef}
          width={900}
          height={240}
          className="w-full h-36 rounded-xl border border-gray-200 bg-white touch-none"
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm text-emerald-700 ring-2 ring-emerald-300 hover:ring-emerald-400"
      >
        Clear
      </button>
    </div>
  )
}

export default function SurveyForm() {
  const { props } = usePage()
  const validatorName = props.validator_name || ''
  const [step, setStep] = useState(0)
  const steps = ['Classification','Personal','Household','Utilities','Income','Final']
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [housePhoto, setHousePhoto] = useState(null)
  const [personPhoto, setPersonPhoto] = useState(null)
  const [purokOptions, setPurokOptions] = useState([])
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const rSigRef = useRef(null)
  const sortedBarangays = useMemo(() => [...barangays].sort((a,b)=>a.replace(/_/g,' ').localeCompare(b.replace(/_/g,' '))), [])
  
  const inputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const selectClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const readOnlyInputClass = 'w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed'
  const tableInputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const tableSelectClass = 'w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const tableReadOnlyInputClass = 'w-full rounded-xl border border-gray-200 bg-gray-100 px-2 py-2 text-xs text-gray-600 cursor-not-allowed'
  const fileInputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const buttonSecondaryClass = 'inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm text-emerald-700 ring-2 ring-emerald-300 hover:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed'
  const buttonPrimaryClass = 'inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed'
  const yesNoOptions = useMemo(() => buildOptions(['Yes', 'No']), [])
  const genderOptions = useMemo(() => buildOptions(['Male', 'Female']), [])
  const civilStatusOptions = useMemo(() => buildOptions(['Single', 'Married', 'Live-in', 'Widow/Widower', 'Annulled', 'Separated', 'Unknown']), [])
  const memberCivilStatusOptions = civilStatusOptions
  const educationOptions = useMemo(
    () => [
      { value: '', label: '- select here -' },
      { value: 'none', label: 'No Formal Education' },
      ...[
        'Elementary_Level_(Incomplete)',
        'Elementary_Graduate',
        'High_School_Level (Incomplete)',
        'High_School_Graduate',
        'Vocational/Technical_Education',
        'College_Level_(Incomplete)',
        'College_Graduate',
        'Postgraduate_Level',
        'ALS',
      ].map(v => ({ value: v, label: humanize(v) })),
    ],
    []
  )
  const incomeOptions = useMemo(
    () =>
      buildOptions(
        ['0 - 2,999 PHP', '3,000 - 5,999 PHP', '6,000 - 8,999 PHP', '9,000 - 12,999_PHP', '13,000 and above'],
        '- select income -'
      ),
    []
  )
  const relationshipOptions = useMemo(
    () =>
      buildOptions(
        ['Household Head', 'Spouse of Head', 'Never-Married Child', 'Other Relative', 'Non-Relative', 'Spouse'],
        '- select relationship -'
      ),
    []
  )
  const barangayOptions = useMemo(
    () => [{ value: '', label: '- select here -' }, ...sortedBarangays.map(b => ({ value: b, label: b.replace(/_/g, ' ') }))],
    [sortedBarangays]
  )
  const purokSelectOptions = useMemo(
    () => [{ value: '', label: '- select purok -' }, ...purokOptions.map(p => ({ value: p, label: p }))],
    [purokOptions]
  )
  function StepHeader({ number, title }) { return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold">{number}</div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
  ) }

  const [members, setMembers] = useState([{ name:'', age:'', gender:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'' }])
  const [tagNum, setTagNum] = useState('')
  const [affSelections, setAffSelections] = useState([])

  const [data, setData] = useState({
    previous_client:'', year_inhabited:'', classification:'', sub_class_displaced:'', sub_class_double_up:'', sub_class_homeless:'',
    interview_person:'', last_name:'', first_name:'', middle_name:'', suffix:'', barangay:'', purok:'', street:'',
    gender:'', religion:'', birth_place:'', birth_date:'', person_age:'', marital_status:'', contact_number:'', language_spoken:'', tribe:'',
    highest_education:'', last_school_attended:'', year_graduated:'', spouse_name:'', spouse_religion:'', spouse_tribe:'', spouse_age:'', spouse_gender:'',
    affiliation:'', affiliations:'', endorsed_by_mayor:'', lot_ownership:'', house_ownership:'', avail_socialized_housing:'', temporary_living_area:'',
    housing_structure:'', other_housing_structure:'', type_of_toilet:'', other_type_of_toilet:'', source_of_water:'', other_source_of_water:'',
    source_of_electricity:'', other_source_of_electricity:'', main_income_source:'', other_main_income_source:'', work_status:'', other_work_status:'',
    work_location_head:'', monthly_salary:'', combine_monthly_income:'', skills_for_living:'', specific_skill:'', other_skill:'',
    organization_member:'', specific_organization:'', other_organization:'', wanttolearn:'', remarks:'', interviewed_by: validatorName, date_interviewed:''
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const b = params.get('barangay')
    if (b) setData(d => ({ ...d, barangay: b }))
  }, [])

  const spouseEnabled = useMemo(() => {
    const s = data.marital_status
    return s === 'Married' || s === 'Live-in' || s === 'Widow/Widower' || s === 'Separated' || s === 'Annulled'
  }, [data.marital_status])

  const hasLocation = Boolean(String(lat || '').trim() && String(lon || '').trim())

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  async function logoutValidator() {
    try {
      await fetch('/validator/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    if (data.barangay) {
      const normalizeName = (s) => {
        const t = String(s || '').replace(/"/g,'').replace(/\s+/g,' ').trim()
        return t.split(' ').map(part => part.split('-').map(seg => {
          const low = seg.toLowerCase()
          if (low === 'sto.' || low === 'st.') return 'Sto.'
          if (low === 'niño' || low === 'nińo') return 'Niño'
          return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()
        }).join('-')).join(' ')
      }
      const uniqSorted = (arr) => Array.from(new Set(arr.map(normalizeName))).sort((a,b)=>a.localeCompare(b))
      const base = uniqSorted(purokMap[data.barangay] || [])
      setPurokOptions(base)
      setData(d => ({...d, purok: ''}))
      axios.get('/validator/api/tag-number/preview', { params: { barangay: data.barangay } })
        .then(res => setTagNum(res.data?.tag_number || ''))
        .catch(() => setTagNum(''))
    }
  }, [data.barangay])

  useEffect(() => {
    axios.get('/validator/api/profile')
      .then(res => {
        const p = res.data?.profile
        if (p?.name) setData(d => ({...d, interviewed_by: p.name}))
      })
      .catch(() => {})
  }, [])

  const subclassVisible = useMemo(() => ({
    displaced: data.classification === 'Displaced',
    doubleup: data.classification === 'Double-up',
    homeless: data.classification === 'Homeless',
  }), [data.classification])

  const getLocation = () => {
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLon(String(pos.coords.longitude)) },
      () => setError('Unable to get location')
    )
  }

  const clearCanvas = (ref) => {
    const ctx = ref.current.getContext('2d')
    ctx.clearRect(0,0,ref.current.width, ref.current.height)
  }

  const addMember = () => setMembers(m => [...m, { name:'', age:'', gender:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'' }])

  const updateMember = (idx, key, val) => setMembers(m => {
    const copy = [...m]; copy[idx] = {...copy[idx], [key]: val}; return copy
  })

  const deleteMember = (idx) =>
    setMembers(m => {
      if (m.length <= 1) return m
      const next = m.filter((_, i) => i !== idx)
      const spouseIndex = next.findIndex(r => String(r.relationship || '').trim() === 'Spouse')
      if (next.length === 1 && spouseIndex === 0) {
        return [...next, { name:'', age:'', gender:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'' }]
      }
      return next
    })

  useEffect(() => {
    const nextAge = calcAgeFromDateString(data.birth_date)
    if (nextAge === '') return
    if (String(data.person_age || '') !== nextAge) {
      setData(d => ({ ...d, person_age: nextAge }))
    }
  }, [data.birth_date])

  useEffect(() => {
    const spouseName = String(data.spouse_name || '').trim()
    const spouseAge = String(data.spouse_age || '').trim()
    const shouldHaveSpouseRow = spouseEnabled && spouseName !== ''

    setMembers(prev => {
      const spouseIndex = prev.findIndex(m => String(m.relationship || '').trim() === 'Spouse')
      if (!shouldHaveSpouseRow) {
        if (spouseIndex === -1) return prev
        const next = prev.filter((_, i) => i !== spouseIndex)
        return next.length ? next : [{ name:'', age:'', gender:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'' }]
      }

      const spouseRow = {
        ...(spouseIndex === -1 ? { name:'', age:'', gender:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'' } : prev[spouseIndex]),
        name: spouseName,
        age: spouseAge,
        gender: data.spouse_gender,
        relationship: 'Spouse',
      }

      const others = spouseIndex === -1 ? prev : prev.filter((_, i) => i !== spouseIndex)
      const next = [spouseRow, ...others]
      if (next.length === 1) {
        next.push({ name:'', age:'', gender:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'' })
      }
      return next
    })
  }, [spouseEnabled, data.spouse_name, data.spouse_age, data.spouse_gender])

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k,v]) => fd.append(k, v ?? ''))
      if (housePhoto) fd.append('house_photo', housePhoto)
      if (personPhoto) fd.append('person_photo', personPhoto)
      fd.append('latitude', lat)
      fd.append('longitude', lon)
      
      fd.append('respondent_signature', rSigRef.current.toDataURL ? rSigRef.current.toDataURL() : '')
      members.forEach(m => {
        fd.append('name[]', m.name ?? '')
        fd.append('age[]', m.age ?? '')
        fd.append('gender[]', m.gender ?? '')
        fd.append('relationship[]', m.relationship ?? '')
        fd.append('civil_status[]', m.civil_status ?? '')
        fd.append('educational_attainment[]', m.educational_attainment ?? '')
        fd.append('occupation[]', m.occupation ?? '')
        fd.append('monthly_income[]', m.monthly_income ?? '')
      })
      await axios.post('/validator/api/survey', fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      window.location.href = '/validator/dashboard'
    } catch (e) {
      setError(e.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
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
        <div className="max-w-none w-full">
          <DashboardFade delay={0}>
            <div>
              <div className="md:hidden mb-4 flex items-center justify-between">
                <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                <span className="text-sm font-semibold text-emerald-800">Menu</span>
              </div>

              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <img src="/icons/assignmenticon.png" alt="Survey" className="w-5 h-5"/>
                  <h1 className="text-2xl font-semibold text-emerald-800">Survey Form</h1>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/validator/dashboard" className="px-3 py-2 rounded-2xl ring-2 ring-emerald-300 text-emerald-700 inline-flex items-center gap-2 hover:bg-emerald-50">
                    <img src="/icons/dashboardicon.png" alt="Dashboard" className="w-5 h-5"/>
                    <span className="text-sm font-medium">Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </DashboardFade>

          <DashboardFade delay={100}>
            <div className="mt-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex items-center flex-1">
                      <button onClick={() => setStep(i)} className={`w-9 h-9 rounded-full grid place-items-center text-sm font-semibold ${i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-white text-gray-700 border border-gray-300'}`}>{i+1}</button>
                      {i < 5 && (<div className={`mx-2 h-px flex-1 ${i < step ? 'bg-emerald-300' : 'bg-gray-200'}`}></div>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardFade>

          <DashboardFade delay={200}>
            {error && <div className="mb-4 p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
          </DashboardFade>

          <DashboardFade delay={300}>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {step === 0 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={1} title="Basic Details" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Previous Client</div>
                  <SmoothSelect
                    value={data.previous_client}
                    onChange={v => setData({ ...data, previous_client: v })}
                    options={yesNoOptions}
                    buttonClassName={selectClass}
                  />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Year Inhabited</div>
                  <input className={inputClass} value={data.year_inhabited} onChange={e=>setData({...data, year_inhabited:e.target.value})}/>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Classification</div>
                  <SmoothSelect
                    value={data.classification}
                    onChange={v =>
                      setData({
                        ...data,
                        classification: v,
                        sub_class_displaced: '',
                        sub_class_double_up: '',
                        sub_class_homeless: '',
                      })
                    }
                    options={buildOptions(['Displaced', 'Double-up', 'Homeless', 'Upgrading_of_Land_Tenure'])}
                    buttonClassName={selectClass}
                  />
                  </div>
                </div>
                {subclassVisible.displaced && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Displaced</div>
                  <SmoothSelect
                    value={data.sub_class_displaced}
                    onChange={v => setData({ ...data, sub_class_displaced: v })}
                    options={buildOptions([
                      'Coastal Areas',
                      'Drought',
                      'Earthquake Affected',
                      'Flood Affected',
                      'Sea Level Rise',
                      'Threat of Eviction',
                      'Eviction/Demolition Order',
                      'Human Induced Disaster',
                      'Infra Projects',
                      'Landslide Affected',
                      'Near Waterways',
                    ])}
                    buttonClassName={selectClass}
                  />
                  </div>
                )}
                {subclassVisible.doubleup && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Double-up</div>
                  <SmoothSelect
                    value={data.sub_class_double_up}
                    onChange={v => setData({ ...data, sub_class_double_up: v })}
                    options={buildOptions(['Renter/Tenant', 'Rent-free/Sharer', 'Caretaker'])}
                    buttonClassName={selectClass}
                  />
                  </div>
                )}
                {subclassVisible.homeless && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Homeless</div>
                  <SmoothSelect
                    value={data.sub_class_homeless}
                    onChange={v => setData({ ...data, sub_class_homeless: v })}
                    options={buildOptions(['Public - living in tent', 'Private - living in tent'])}
                    buttonClassName={selectClass}
                  />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={2} title="Personal Information" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Person Interviewed</div>
                  <SmoothSelect
                    value={data.interview_person}
                    onChange={v => setData({ ...data, interview_person: v })}
                    options={buildOptions(['Household_Head', 'Spouse_Head', 'Never-Married'])}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Name</div>
                  <input className={inputClass} value={data.last_name} onChange={e=>setData({...data, last_name:e.target.value})}/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">First Name</div>
                  <input className={inputClass} value={data.first_name} onChange={e=>setData({...data, first_name:e.target.value})}/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Middle Name</div>
                  <input className={inputClass} value={data.middle_name} onChange={e=>setData({...data, middle_name:e.target.value})}/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Suffix</div>
                  <input className={inputClass} value={data.suffix} onChange={e=>setData({...data, suffix:e.target.value})}/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Gender</div>
                  <SmoothSelect value={data.gender} onChange={v => setData({ ...data, gender: v })} options={genderOptions} buttonClassName={selectClass} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Barangay</div>
                  <SmoothSelect
                    value={data.barangay}
                    onChange={v => setData({ ...data, barangay: v })}
                    options={barangayOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Purok</div>
                  <SmoothSelect
                    value={data.purok}
                    onChange={v => setData({ ...data, purok: v })}
                    options={purokSelectOptions}
                    buttonClassName={selectClass}
                    disabled={!data.barangay || purokOptions.length === 0}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Street</div>
                  <input className={inputClass} value={data.street} onChange={e=>setData({...data, street:e.target.value})}/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tag Number</div>
                  <input className={inputClass} value={tagNum} readOnly placeholder="Generated after selecting barangay"/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Religion</div>
                  <SmoothSelect
                    value={data.religion}
                    onChange={v => setData({ ...data, religion: v })}
                    options={buildOptions([
                      'Roman_Catholic',
                      'Islam',
                      'Iglesia_ni_Cristo',
                      'Seventh-day_Adventist',
                      'Bible_Baptist_Church',
                      'United_Church_of_Christ_in_the_Philippines',
                      "Jehovah's_Witnesses",
                      'Church_of_Christ',
                    ])}
                    buttonClassName={selectClass}
                  />
                </div>
                <div><div className="text-sm text-gray-500">Birth Place</div><input className={inputClass} value={data.birth_place} onChange={e=>setData({...data, birth_place:e.target.value})}/></div>
                <div><div className="text-sm text-gray-500">Birth Date</div><input type="date" className={inputClass} value={data.birth_date} onChange={e=>setData({...data, birth_date:e.target.value})}/></div>
                <div><div className="text-sm text-gray-500">Age</div><input type="number" className={readOnlyInputClass} value={data.person_age} readOnly /></div>
                <div>
                  <div className="text-sm text-gray-500">Marital Status</div>
                  <SmoothSelect
                    value={data.marital_status}
                    onChange={v => setData({ ...data, marital_status: v })}
                    options={civilStatusOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                <div><div className="text-sm text-gray-500">Contact Number</div><input className={inputClass} value={data.contact_number} onChange={e=>setData({...data, contact_number:e.target.value})}/></div>
                <div>
                  <div className="text-sm text-gray-500">Language</div>
                  <SmoothSelect
                    value={data.language_spoken}
                    onChange={v => setData({ ...data, language_spoken: v })}
                    options={buildOptions(['Cebuano', 'Tagalog', 'English'])}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tribe</div>
                  <SmoothSelect
                    value={data.tribe}
                    onChange={v => setData({ ...data, tribe: v })}
                    options={buildOptions(['Manobo', 'Bagobo', "B'laan", 'Kaolo', 'Bisaya', 'Muslim'])}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Highest Education</div>
                  <SmoothSelect
                    value={data.highest_education}
                    onChange={v => setData({ ...data, highest_education: v })}
                    options={educationOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                <div><div className="text-sm text-gray-500">School Last Attended</div><input className={inputClass} value={data.last_school_attended} onChange={e=>setData({...data, last_school_attended:e.target.value})}/></div>
                <div><div className="text-sm text-gray-500">Year Graduated</div><input className={inputClass} value={data.year_graduated} onChange={e=>setData({...data, year_graduated:e.target.value})}/></div>
              </div>

              {spouseEnabled && (
                <div className="mt-6">
                  <div className="text-lg font-semibold text-emerald-800">Spouse Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
                    <input className={inputClass} placeholder="Spouse Name" value={data.spouse_name} onChange={e=>setData({...data, spouse_name:e.target.value})}/>
                    <SmoothSelect
                      value={data.spouse_religion}
                      onChange={v => setData({ ...data, spouse_religion: v })}
                      options={buildOptions([
                        'Roman_Catholic',
                        'Islam',
                        'Iglesia_ni_Cristo',
                        'Seventh-day_Adventist',
                        'Bible_Baptist_Church',
                        'United_Church_of_Christ_in_the_Philippines',
                        "Jehovah's_Witnesses",
                        'Church_of_Christ',
                      ])}
                      buttonClassName={selectClass}
                    />
                    <SmoothSelect
                      value={data.spouse_tribe}
                      onChange={v => setData({ ...data, spouse_tribe: v })}
                      options={buildOptions(['Manobo', 'Bagobo', "B'laan", 'Kaolo', 'Bisaya', 'Muslim'])}
                      buttonClassName={selectClass}
                    />
                    <input type="number" className={inputClass} placeholder="Age" value={data.spouse_age} onChange={e=>setData({...data, spouse_age:e.target.value})}/>
                    <SmoothSelect
                      value={data.spouse_gender}
                      onChange={v => setData({ ...data, spouse_gender: v })}
                      options={genderOptions}
                      buttonClassName={selectClass}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="text-lg font-semibold text-emerald-800">Affiliations</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                  {['None','SSS','GSIS','PhilHealth','PagIbig','PWD','Senior_Citizen','Solo_Parent','4Ps'].map(opt => (
                    <label key={opt} className="inline-flex items-center gap-2">
                      <input type="checkbox" className="rounded" checked={affSelections.includes(opt)} onChange={e => {
                        setAffSelections(prev => {
                          const has = prev.includes(opt)
                          const next = has ? prev.filter(x => x !== opt) : [...prev, opt]
                          const primary = next.find(x => x !== 'None') || (next.includes('None') ? 'None' : '')
                          setData(d => ({ ...d, affiliations: next.join(','), affiliation: primary }))
                          return next
                        })
                      }}/>
                      <span>{opt.replace(/_/g,' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-lg font-semibold text-emerald-800">Endorsed by Mayor</div>
                <SmoothSelect
                  value={data.endorsed_by_mayor}
                  onChange={v => setData({ ...data, endorsed_by_mayor: v })}
                  options={yesNoOptions}
                  buttonClassName={selectClass}
                />
              </div>

              <div className="mt-6">
                <div className="text-lg font-semibold text-emerald-800">Members of the Household</div>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="min-w-full table-fixed text-xs">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="w-16 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Age</th>
                        <th className="w-20 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Sex</th>
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Relationship</th>
                        <th className="w-32 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Civil Status</th>
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Education</th>
                        <th className="w-32 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Occupation</th>
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Monthly Income</th>
                        <th className="w-20 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        (() => {
                          const isSpouseRow = String(m.relationship || '').trim() === 'Spouse'
                          return (
                        <tr key={i} className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50">
                          <td className="px-2 py-2 align-middle"><input className={isSpouseRow ? tableReadOnlyInputClass : tableInputClass} value={m.name} readOnly={isSpouseRow} onChange={e=>updateMember(i,'name',e.target.value)}/></td>
                          <td className="px-2 py-2 align-middle"><input type="number" className={isSpouseRow ? tableReadOnlyInputClass : tableInputClass} value={m.age} readOnly={isSpouseRow} onChange={e=>updateMember(i,'age',e.target.value)}/></td>
                          <td className="px-2 py-2 align-middle">
                            <SmoothSelect
                              value={m.gender}
                              onChange={v => updateMember(i, 'gender', v)}
                              options={genderOptions}
                              buttonClassName={tableSelectClass}
                              disabled={isSpouseRow}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <SmoothSelect
                              value={m.relationship}
                              onChange={v => updateMember(i, 'relationship', v)}
                              options={relationshipOptions}
                              buttonClassName={tableSelectClass}
                              disabled={isSpouseRow}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <SmoothSelect
                              value={m.civil_status}
                              onChange={v => updateMember(i, 'civil_status', v)}
                              options={memberCivilStatusOptions}
                              buttonClassName={tableSelectClass}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <SmoothSelect
                              value={m.educational_attainment}
                              onChange={v => updateMember(i, 'educational_attainment', v)}
                              options={educationOptions}
                              buttonClassName={tableSelectClass}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle"><input className={tableInputClass} value={m.occupation} onChange={e=>updateMember(i,'occupation',e.target.value)}/></td>
                          <td className="px-2 py-2 align-middle">
                            <SmoothSelect
                              value={m.monthly_income}
                              onChange={v => updateMember(i, 'monthly_income', v)}
                              options={incomeOptions}
                              buttonClassName={tableSelectClass}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <button
                              type="button"
                              className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-500 hover:text-red-700 transition-colors"
                              onClick={() => deleteMember(i)}
                              disabled={isSpouseRow}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                          )
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="mt-3 px-3 py-1 border rounded" onClick={addMember}>Add Member</button>
              </div>
            </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={3} title="Household & Utilities" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Lot Ownership</div>
                  <SmoothSelect value={data.lot_ownership} onChange={v => setData({ ...data, lot_ownership: v })} options={yesNoOptions} buttonClassName={selectClass} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">House Ownership</div>
                  <SmoothSelect value={data.house_ownership} onChange={v => setData({ ...data, house_ownership: v })} options={yesNoOptions} buttonClassName={selectClass} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avail Socialized Housing</div>
                  <SmoothSelect
                    value={data.avail_socialized_housing}
                    onChange={v => setData({ ...data, avail_socialized_housing: v })}
                    options={yesNoOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Temporary Dwelling</div>
                  <SmoothSelect
                    value={data.temporary_living_area}
                    onChange={v => setData({ ...data, temporary_living_area: v })}
                    options={yesNoOptions}
                    buttonClassName={selectClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Housing Structure</div>
                  <SmoothSelect
                    value={data.housing_structure}
                    onChange={v => setData({ ...data, housing_structure: v, other_housing_structure: '' })}
                    options={buildOptions([
                      'Full_Concrete',
                      'Made_of_wood_and_metal_roof',
                      'Made_of_Amakan_and_Nipa',
                      'Combination_of_concrete_and_wood',
                      'Made_of_Amakan_and_metal_roof',
                      'Others',
                    ])}
                    buttonClassName={selectClass}
                  />
                  {data.housing_structure === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_housing_structure} onChange={e=>setData({...data, other_housing_structure:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type of Toilet</div>
                  <SmoothSelect
                    value={data.type_of_toilet}
                    onChange={v => setData({ ...data, type_of_toilet: v, other_type_of_toilet: '' })}
                    options={buildOptions(['Water-sealed', 'Pit', 'None', 'Others'])}
                    buttonClassName={selectClass}
                  />
                  {data.type_of_toilet === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_type_of_toilet} onChange={e=>setData({...data, other_type_of_toilet:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Source of Water</div>
                  <SmoothSelect
                    value={data.source_of_water}
                    onChange={v => setData({ ...data, source_of_water: v, other_source_of_water: '' })}
                    options={buildOptions(['With_own_meter', 'Shared_connection', 'Well', 'Others'])}
                    buttonClassName={selectClass}
                  />
                  {data.source_of_water === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_source_of_water} onChange={e=>setData({...data, other_source_of_water:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Source of Electricity</div>
                  <SmoothSelect
                    value={data.source_of_electricity}
                    onChange={v => setData({ ...data, source_of_electricity: v, other_source_of_electricity: '' })}
                    options={buildOptions(['With_own_meter', 'Solar_Panel', 'Candle/Lamp', 'Tapping_to_the_neighbor', 'Others'])}
                    buttonClassName={selectClass}
                  />
                  {data.source_of_electricity === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_source_of_electricity} onChange={e=>setData({...data, other_source_of_electricity:e.target.value})}/>}
                </div>
              </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={4} title="Utilities" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Main Income Source</div>
                  <SmoothSelect
                    value={data.main_income_source}
                    onChange={v => setData({ ...data, main_income_source: v, other_main_income_source: '' })}
                    options={[
                      { value: '', label: '- select here -' },
                      { value: 'Public_Employee', label: 'Employee (Public)' },
                      { value: 'Private_Employee', label: 'Employee (Private)' },
                      { value: 'Self_Employed', label: 'Self-Employed' },
                      { value: 'Casual', label: 'Casual' },
                      { value: 'others', label: 'Others' },
                    ]}
                    buttonClassName={selectClass}
                  />
                  {data.main_income_source === 'others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_main_income_source} onChange={e=>setData({...data, other_main_income_source:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Work Status</div>
                  <SmoothSelect
                    value={data.work_status}
                    onChange={v => setData({ ...data, work_status: v, other_work_status: '' })}
                    options={[
                      { value: '', label: '- select here -' },
                      { value: 'Regular', label: 'Regular' },
                      { value: 'Contractual', label: 'Contractual' },
                      { value: 'others', label: 'Others' },
                    ]}
                    buttonClassName={selectClass}
                  />
                  {data.work_status === 'others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_work_status} onChange={e=>setData({...data, other_work_status:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Work Location</div>
                  <SmoothSelect
                    value={data.work_location_head}
                    onChange={v => setData({ ...data, work_location_head: v })}
                    options={buildOptions([
                      'None',
                      'N/A',
                      'Within the Barangay',
                      'Within the City/Municipality',
                      'Within the Province',
                      'Within the Country',
                    ])}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Monthly Salary</div>
                  <SmoothSelect
                    value={data.monthly_salary}
                    onChange={v => setData({ ...data, monthly_salary: v })}
                    options={incomeOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Combined Household Income</div>
                  <SmoothSelect
                    value={data.combine_monthly_income}
                    onChange={v => setData({ ...data, combine_monthly_income: v })}
                    options={incomeOptions}
                    buttonClassName={selectClass}
                  />
                </div>
              </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={5} title="Income & Organization" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Skills for Living</div>
                  <SmoothSelect
                    value={data.skills_for_living}
                    onChange={v => setData({ ...data, skills_for_living: v, specific_skill: '', other_skill: '' })}
                    options={yesNoOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                {data.skills_for_living === 'Yes' && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Specific Skill</div>
                      <SmoothSelect
                        value={data.specific_skill}
                        onChange={v => setData({ ...data, specific_skill: v, other_skill: '' })}
                        options={[
                          { value: '', label: '- select skill -' },
                          { value: 'Handicrafts', label: 'Handicrafts' },
                          { value: 'Wood_Works_and_Furnitures', label: 'Wood Works & Furnitures' },
                          { value: 'Food_Processing', label: 'Food Processing' },
                          { value: 'others', label: 'Others' },
                        ]}
                        buttonClassName={selectClass}
                      />
                    </div>
                    {data.specific_skill === 'others' && (
                      <div><input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_skill} onChange={e=>setData({...data, other_skill:e.target.value})}/></div>
                    )}
                  </>
                )}
                <div>
                  <div className="text-sm text-gray-500">Organization Member</div>
                  <SmoothSelect
                    value={data.organization_member}
                    onChange={v => setData({ ...data, organization_member: v, specific_organization: '', other_organization: '' })}
                    options={yesNoOptions}
                    buttonClassName={selectClass}
                  />
                </div>
                {data.organization_member === 'Yes' && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Organization</div>
                      <SmoothSelect
                        value={data.specific_organization}
                        onChange={v => setData({ ...data, specific_organization: v, other_organization: '' })}
                        options={[
                          { value: '', label: '- select -' },
                          { value: 'HOA', label: 'HOA' },
                          { value: 'Youth_Organization', label: 'Youth Organization' },
                          { value: 'Dayong', label: 'Dayong' },
                          { value: 'Womens_Organization', label: "Women's Organization" },
                          { value: 'others', label: 'Others' },
                        ]}
                        buttonClassName={selectClass}
                      />
                    </div>
                {data.specific_organization === 'others' && (
                      <div><input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_organization} onChange={e=>setData({...data, other_organization:e.target.value})}/></div>
                )}
                  </>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500">Skills you want to learn</div>
                <input className={inputClass} value={data.wanttolearn} onChange={e=>setData({...data, wanttolearn:e.target.value})}/>
              </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={6} title="Final Details" />
              <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">House Photo</div>
                <input
                  type="file"
                  accept="image/*"
                  className={fileInputClass}
                  onChange={e=>setHousePhoto(e.target.files?.[0] || null)}
                />
                {housePhoto?.name && <div className="mt-1 text-xs text-gray-500 truncate">Selected: {housePhoto.name}</div>}
              </div>
              <div>
                <div className="text-sm text-gray-500">Respondent Photo</div>
                <input
                  type="file"
                  accept="image/*"
                  className={fileInputClass}
                  onChange={e=>setPersonPhoto(e.target.files?.[0] || null)}
                />
                {personPhoto?.name && <div className="mt-1 text-xs text-gray-500 truncate">Selected: {personPhoto.name}</div>}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={buttonSecondaryClass} onClick={getLocation}>Get Current Location</button>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${hasLocation ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {hasLocation ? 'Captured' : 'Not captured'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">Lat: {lat || '-'} | Lon: {lon || '-'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Interviewed by</div>
                  <input className={readOnlyInputClass} value={data.interviewed_by} readOnly />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date Interviewed</div>
                  <input type="date" className={inputClass} value={data.date_interviewed} onChange={e=>setData({...data, date_interviewed:e.target.value})}/>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Remarks</div>
                <textarea className={inputClass} rows={4} value={data.remarks} onChange={e=>setData({...data, remarks:e.target.value})}/>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Respondent Signature</div>
                  <Signature canvasRef={rSigRef} onClear={()=>clearCanvas(rSigRef)} />
                </div>
              </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button type="button" className={buttonSecondaryClass} onClick={()=>setStep(s=>Math.max(0, s-1))} disabled={step===0}>Previous</button>
            {step < 5 ? (
              <button type="button" className={buttonPrimaryClass} onClick={()=>setStep(s=>Math.min(5, s+1))}>Next</button>
            ) : (
              <button type="button" className={buttonPrimaryClass} onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
            )}
          </div>
            </div>
          </DashboardFade>
        </div>
      </main>
    </div>
  )
}

function DashboardFade({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

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
  )
}
