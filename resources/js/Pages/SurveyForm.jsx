// resources/js/Pages/SurveyForm.jsx
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import { Listbox, Transition } from '@headlessui/react'
import Modal from '@/Components/Modal'
import OtherSpecifyField from '@/Components/OtherSpecifyField'
import FieldError from '@/Components/FieldError'
import ValidationSummary from '@/Components/ValidationSummary'

const barangays = [
  'Aplaya','Balabag','Binaton','Cogon','Colorado','Dawis','Dulangan','Goma','Igpit','Kapatagan','Kiagot','Lungag','Mahayahay','Matti','Ruparan','San_Agustin','San_Jose','San_Miguel','San_Roque','Sinawilan','Soong','Tiguman','Tres_De_Mayo','Zone_I','Zone_II','Zone_III'
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
  Zone_I: [
    'Rosas','Avocado','Lanzones','Chesnut','Palmera','Sampaguita','Chico','Acaciaman','Rosal','Kawayab','Narra','Panaghiusa','Matamis','Riverside','Atis','Malipayon','Masipag','Pagtoo','Malunggay','Centennial','Star Apple','Madasigon','Gemelina','Santol','Tugas','Mangga','Ravina','Mahogany','Kasaligan','Golden Duranta','Durian','Kalinaw','Silangan','Bayabas','Tambis','Talisay','Yellowbell','Sambag','Duranta','Labana','Cattleya','Manggahan','Mangga-Jumao-as','San Francisco','Laminosa','Waling-waling','Papaya','Alum','Ipil-ipil','Aratilis','Islam','Molave'
  ],
  Zone_II: [
    "Assessor's","Bayanihan","San Vicente","Kahayag","Cometa","Kawayan","Panaghiusa","Pakigdait","Gemelina 2","Kalayaan","Palmera","Maya","Pag-asa","Nagkahiusa","Salam","Binangay","Kalusugan","Suerte","Laging Handa","Samahang Nayon","Kauswagan","Acacia","Duranta","Narra","Sadepa","Maharlika","Maligya","Padillo","Paraiso","Ubas","Gemelina 1","Santan","Kapamilya"
  ],
  Zone_III: []
}

const humanize = (value) => String(value ?? '').replace(/_/g, ' ')

const buildOptions = (values, emptyLabel = '', labelFn = humanize) => [
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
        <div className={`relative ${open ? 'z-[1001]' : 'z-[1]'}`}>
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
            <Listbox.Options className="absolute left-0 z-[1000] mt-2 max-h-64 w-full overflow-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
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

function Signature({ canvasRef, onClear, onEnd }) {
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
  const onUp = () => {
    drawing.current = false
    if (typeof onEnd === 'function') onEnd()
  }
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
  const [fieldErrors, setFieldErrors] = useState({})
  const [validationSummary, setValidationSummary] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [housePhoto, setHousePhoto] = useState(null)
  const [personPhoto, setPersonPhoto] = useState(null)
  const [purokOptions, setPurokOptions] = useState([])
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const rSigRef = useRef(null)
  const [showConsent, setShowConsent] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [signatureDirty, setSignatureDirty] = useState(false)
  const [respondentSignatureDataUrl, setRespondentSignatureDataUrl] = useState('')
  const [existingHousePhotoUrl, setExistingHousePhotoUrl] = useState('')
  const [existingPersonPhotoUrl, setExistingPersonPhotoUrl] = useState('')
  const [existingRespondentSignatureUrl, setExistingRespondentSignatureUrl] = useState('')
  const sortedBarangays = useMemo(() => [...barangays].sort((a,b)=>a.replace(/_/g,' ').localeCompare(b.replace(/_/g,' '))), [])
  
  const inputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 capitalize'
  const selectClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const readOnlyInputClass = 'w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed capitalize'
  const tableInputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 capitalize'
  const tableSelectClass = 'w-full rounded-xl border border-gray-200 bg-white px-2 py-2 text-xs text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100'
  const tableReadOnlyInputClass = 'w-full rounded-xl border border-gray-200 bg-gray-100 px-2 py-2 text-xs text-gray-600 cursor-not-allowed capitalize'
  const fileInputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-100 file:min-w-[44px] file:min-h-[44px] file:touch-manipulation'
  const buttonSecondaryClass = 'inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm text-emerald-700 ring-2 ring-emerald-300 hover:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed'
  const buttonPrimaryClass = 'inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed'
  
  // Helper functions to get CSS classes with error styling
  const getInputClass = (fieldName) => {
    return fieldErrors[fieldName] 
      ? 'w-full rounded-xl border border-red-500 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 capitalize'
      : inputClass
  }
  
  const getSelectClass = (fieldName) => {
    return fieldErrors[fieldName]
      ? 'w-full rounded-xl border border-red-500 bg-white px-3 py-2.5 text-sm text-gray-900 text-left focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100'
      : selectClass
  }
  
  const getFileInputClass = (fieldName) => {
    return fieldErrors[fieldName]
      ? 'w-full rounded-xl border border-red-500 bg-white px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-red-100 file:min-w-[44px] file:min-h-[44px] file:touch-manipulation'
      : fileInputClass
  }
  
  const yesNoOptions = useMemo(() => buildOptions(['Yes', 'No']), [])
  const genderOptions = useMemo(() => buildOptions(['Male', 'Female']), [])
  const civilStatusOptions = useMemo(() => buildOptions(['Single', 'Married', 'Live-in', 'Widow/Widower', 'Annulled', 'Separated', 'Unknown']), [])
  const memberCivilStatusOptions = civilStatusOptions
  const sourceOfWaterValueKeys = useMemo(() => ['NAWASA', 'Spring', 'Deep_Well', 'Rainwater', 'Surface_Water'], [])
  const sourceOfElectricityValueKeys = useMemo(
    () => ['With_own_meter', 'Solar_Panel', 'Candle/Lamp', 'Tapping_to_the_neighbor'],
    []
  )
  const sourceOfWaterOptions = useMemo(
    () => [
      { value: '', label: '' },
      { value: 'NAWASA', label: 'Community Water System(NAWASA)' },
      { value: 'Spring', label: 'Spring' },
      { value: 'Deep_Well', label: 'Deep Well' },
      { value: 'Rainwater', label: 'Rainwater' },
      { value: 'Surface_Water', label: 'Surface Water' },
      { value: 'Others', label: 'Others' },
    ],
    []
  )
  const sourceOfElectricityOptions = useMemo(
    () => [
      { value: '', label: '' },
      { value: 'With_own_meter', label: 'With own meter' },
      { value: 'Solar_Panel', label: 'Solar Panel' },
      { value: 'Candle/Lamp', label: 'Candle/Lamp' },
      { value: 'Tapping_to_the_neighbor', label: 'Tapping to the neighbor' },
      { value: 'Others', label: 'Others' },
    ],
    []
  )
  const educationOptions = useMemo(
    () => [
      { value: '', label: '' },
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
        ''
      ),
    []
  )
  const combinedIncomeOptions = useMemo(
    () =>
      buildOptions(
        ['₱0 – ₱13,000', '₱13,001 – ₱25,000', '₱25,001 – ₱35,000', '₱35,001 – ₱47,000', '₱47,001 and above'],
        ''
      ),
    []
  )
  const relationshipChoiceList = useMemo(
    () => ['Household Head', 'Spouse of Head', 'Never-Married Child', 'Other Relative', 'Non-Relative'],
    []
  )
  const relationshipOptions = useMemo(
    () =>
      buildOptions(relationshipChoiceList, ''),
    [relationshipChoiceList]
  )
  const barangayOptions = useMemo(
    () => [{ value: '', label: '' }, ...sortedBarangays.map(b => ({ value: b, label: b.replace(/_/g, ' ') }))],
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

  const [members, setMembers] = useState([{ name:'', age:'', sex:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'', code:'' }])
  const [tagNum, setTagNum] = useState('')
  const [affSelections, setAffSelections] = useState([])
  const prevBarangayRef = useRef('')

  const [data, setData] = useState({
    previous_client:'', year_inhabited:'', classification:'', sub_class_displaced:'', sub_class_double_up:'', sub_class_homeless:'',
    interview_person:'', last_name:'', first_name:'', middle_name:'', suffix:'', barangay:'', purok:'', street:'',
    gender:'', religion:'', other_religion:'', birth_place:'', birth_date:'', person_age:'', marital_status:'', contact_number:'', language_spoken:'', tribe:'', other_tribe:'',
    highest_education:'', last_school_attended:'', year_graduated:'', spouse_name:'', spouse_religion:'', other_spouse_religion:'', spouse_tribe:'', other_spouse_tribe:'', spouse_age:'', spouse_gender:'',
    affiliation:'', affiliations:'', endorsed_by_mayor:'', lot_ownership:'', house_ownership:'', avail_socialized_housing:'', temporary_living_area:'',
    housing_structure:'', other_housing_structure:'', type_of_toilet:'', other_type_of_toilet:'', source_of_water:'', other_source_of_water:'',
    source_of_electricity:'', other_source_of_electricity:'', main_income_source:'', other_main_income_source:'', work_status:'', other_work_status:'',
    work_location_head:'', monthly_salary:'', combine_monthly_income:'', skills_for_living:'', specific_skill:'', other_skill:'',
    organization_member:'', specific_organization:'', other_organization:'', wanttolearn:'', remarks:'', interviewed_by: validatorName, date_interviewed:''
  })

  const incomeChoices = ['0 - 2,999 PHP','3,000 - 5,999 PHP','6,000 - 8,999 PHP','9,000 - 12,999 PHP','13,000 and above']
  const combinedIncomeChoices = ['₱0 – ₱13,000', '₱13,001 – ₱25,000', '₱25,001 – ₱35,000', '₱35,001 – ₱47,000', '₱47,001 and above']
  
  // Income calculation functions (matching mobile app logic)
  const parseSalaryRange = (salaryRange) => {
    if (!salaryRange || salaryRange === '') return 0.0
    const cleaned = salaryRange.replace(/PHP/g, '').trim()
    if (cleaned.includes('and above')) {
      const parts = cleaned.split('and above')
      if (parts.length > 0) {
        const numStr = parts[0].replace(/,/g, '').trim()
        return parseFloat(numStr) || 0.0
      }
      return 0.0
    }
    if (cleaned.includes('-') || cleaned.includes('–')) {
      const parts = cleaned.split(/[-–]/)
      if (parts.length === 2) {
        const lowerStr = parts[0].replace(/,/g, '').replace(/₱/g, '').trim()
        const upperStr = parts[1].replace(/,/g, '').replace(/₱/g, '').trim()
        const lower = parseFloat(lowerStr)
        const upper = parseFloat(upperStr)
        if (!isNaN(lower) && !isNaN(upper)) {
          return (lower + upper) / 2
        }
      }
    }
    const numStr = cleaned.replace(/,/g, '').replace(/₱/g, '').trim()
    return parseFloat(numStr) || 0.0
  }

  const calculateTotalIncome = (headSalary, members) => {
    let total = parseSalaryRange(headSalary)
    if (members && Array.isArray(members)) {
      members.forEach(member => {
        const income = parseSalaryRange(member.monthly_income)
        if (income > 0) total += income
      })
    }
    return total
  }

  const determineIncomeRange = (totalIncome) => {
    if (totalIncome <= 13000) return '₱0 – ₱13,000'
    else if (totalIncome <= 25000) return '₱13,001 – ₱25,000'
    else if (totalIncome <= 35000) return '₱25,001 – ₱35,000'
    else if (totalIncome <= 47000) return '₱35,001 – ₱47,000'
    else return '₱47,001 and above'
  }
  const relationshipChoices = relationshipChoiceList
  const memberRelationshipChoices = [
    'Spouse',
    'Son',
    'Daughter',
    'Stepson',
    'Step Daughter',
    'Son-In-Law',
    'Daughter-In-Law',
    'Grandson',
    'Granddaughter',
    'Father',
    'Mother',
    'Father-In-Law',
    'Mother-In-Law',
    'Brother',
    'Sister',
    'Brother-In-Law',
    'Sister-In-Law',
    'Uncle',
    'Aunt',
    'Nephew',
    'Niece',
  ]
  const educationChoices = ['none','Elementary_Level_(Incomplete)','Elementary_Graduate','High_School_Level_(Incomplete)','High_School_Graduate','Vocational/Technical_Education','College_Level_(Incomplete)','College_Graduate','Postgraduate_Level','ALS']
  const fileUrl = (path) => {
    const s = String(path || '')
    if (!s) return ''
    if (s.startsWith('http')) return s
    if (s.startsWith('storage/')) return `/${s}`
    if (s.startsWith('signatures/')) return `/storage/${s}`
    return s.startsWith('/') ? s : `/${s}`
  }
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim()
  const toKey = (s) => norm(s).replace(/ /g, '_')
  const normalizePurokName = (s) => {
    const t = String(s || '').replace(/"/g, '').replace(/\s+/g, ' ').trim()
    return t
      .split(' ')
      .map(part =>
        part
          .split('-')
          .map(seg => {
            const low = seg.toLowerCase()
            if (low === 'sto.' || low === 'st.') return 'Sto.'
            if (low === 'niño' || low === 'nińo') return 'Niño'
            return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()
          })
          .join('-')
      )
      .join(' ')
  }
  const normalizeLegacyToiletValue = (value) => {
    const raw = norm(value)
    if (!raw) return ''
    const t = raw.toLowerCase().replace(/[_-]/g, ' ')
    if (t.includes('water') && t.includes('sealed')) return 'Water-sealed'
    if (t.includes('open') && (t.includes('pit') || t.includes('antipolo'))) return 'Pit'
    if (t.includes('no') && t.includes('toilet')) return 'None'
    return raw
  }
  const isSpouseRel = (rel) => {
    const r = String(rel || '').trim()
    return r === 'Spouse of Head' || r === 'Spouse'
  }
  const normalizeRelationship = (rel) => {
    const r = norm(rel)
    if (!r) return ''
    if (r === 'Spouse') return 'Spouse of Head'
    if (relationshipChoiceList.includes(r)) return r
    const k = r.toLowerCase()
    if (['son','daughter','stepson','step daughter','grandson','granddaughter'].includes(k)) return 'Never-Married Child'
    return 'Other Relative'
  }
  const ynToYesNo = (v) => {
    if (v === 1 || v === '1' || v === true) return 'Yes'
    if (v === 0 || v === '0' || v === false) return 'No'
    const t = String(v || '').trim().toLowerCase()
    if (t === 'yes') return 'Yes'
    if (t === 'no') return 'No'
    return ''
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const b = params.get('barangay')
    if (b) setData(d => ({ ...d, barangay: b }))
    const sid = params.get('survey_id')
    if (sid) {
      axios.get(`/validator/api/survey/${sid}`).then(res => {
        const sv = res.data?.survey
        const mem = res.data?.members || []
        if (sv) {
          const housingStructureOptions = ['Makeshift/Salvaged/Improvised_material','Made_of_Amakan_and_Nipa','Made_of_Amakan_and_metal_roof','Made_of_wood_and_metal_roof','Combination_of_concrete_and_wood','Full_Concrete']
          const typeOfToiletOptions = ['No_Toilet','Open_Pit/Antipolo','Water_Sealed']
          const mainIncomeOptions = ['Public_Employee','Private_Employee','Self_Employed','Casual']
          const workStatusOptions = ['Regular','Contractual']
          const skillOptions = ['Handicrafts','Wood_Works_and_Furnitures','Food_Processing']
          const organizationOptions = ['HOA','Youth_Organization','Dayong','Womens_Organization']

          const normalizeToOptions = (stored, options, othersValue) => {
            const raw = norm(stored)
            if (!raw) return { v: '', other: '' }
            const k = toKey(raw)
            if (options.includes(k) || options.includes(raw)) return { v: options.includes(k) ? k : raw, other: '' }
            return { v: othersValue, other: raw }
          }

          const normalizeWater = (stored) => {
            const raw = norm(stored)
            if (!raw) return { v: '', other: '' }
            const k = toKey(raw)
            if (k === 'With_own_meter' || k === 'Shared_connection') return { v: 'NAWASA', other: '' }
            if (k === 'Well') return { v: 'Deep_Well', other: '' }
            if (k === 'Community_Water_System_(NAWASA)' || k === 'Community_Water_System(NAWASA)') return { v: 'NAWASA', other: '' }
            if (k.startsWith('Surface_Water')) return { v: 'Surface_Water', other: '' }
            if (sourceOfWaterValueKeys.includes(k) || sourceOfWaterValueKeys.includes(raw)) {
              return { v: sourceOfWaterValueKeys.includes(k) ? k : raw, other: '' }
            }
            return { v: 'Others', other: raw }
          }

          const normalizeElectricity = (stored) => {
            const raw = norm(stored)
            if (!raw) return { v: '', other: '' }
            const k = toKey(raw)
            if (sourceOfElectricityValueKeys.includes(k) || sourceOfElectricityValueKeys.includes(raw)) {
              return { v: sourceOfElectricityValueKeys.includes(k) ? k : raw, other: '' }
            }
            return { v: 'Others', other: raw }
          }

          const normalizeMainIncome = (stored) => {
            const raw = norm(stored)
            if (!raw) return ''
            const lower = raw.toLowerCase()
            if (lower === 'employee (public office/company)') return 'Public_Employee'
            if (lower === 'employee (private office/company)') return 'Private_Employee'
            if (lower === 'self-employed/with owned business') return 'Self_Employed'
            if (lower === 'casual (on-call for work)') return 'Casual'
            return raw
          }

          const normalizeIncomeRange = (stored) => {
            const raw = norm(stored)
            if (!raw) return ''
            const lower = raw.toLowerCase().replace(/\s+/g, ' ')
            if (lower === '0 - 2,999 php') return '0 - 2,999 PHP'
            if (lower === '3,000 - 5,999 php') return '3,000 - 5,999 PHP'
            if (lower === '6,000 - 8,999 php') return '6,000 - 8,999 PHP'
            if (lower === '9,000 - 12,999 php' || lower === '9,000 - 12,999_php') return '9,000 - 12,999_PHP'
            if (lower === '13,000 php and above' || lower === '13,000 and above') return '13,000 and above'
            return raw
          }

          const normalizeSkill = (stored) => {
            const raw = norm(stored)
            if (!raw) return ''
            const lower = raw.toLowerCase()
            if (lower === 'handicraft' || lower === 'handicrafts') return 'Handicrafts'
            if (
              lower === 'wood works & furnitures' ||
              lower === 'wood works and furnitures' ||
              lower === 'wood works & furnitures' ||
              lower === 'wood works and furnitures'
            ) {
              return 'Wood_Works_and_Furnitures'
            }
            if (lower === 'food processing') return 'Food_Processing'
            return raw
          }

          const normalizeOrganization = (stored) => {
            const raw = norm(stored)
            if (!raw) return ''
            const lower = raw.toLowerCase()
            if (lower === 'hoa') return 'HOA'
            if (lower === 'dayong') return 'Dayong'
            if (lower === "women's organization" || lower === 'womens organization') return 'Womens_Organization'
            if (lower === 'youth organization') return 'Youth_Organization'
            return raw
          }

          const hs = normalizeToOptions(sv.housing_structure, housingStructureOptions, 'Others')
          const tt = normalizeToOptions(normalizeLegacyToiletValue(sv.type_of_toilet), typeOfToiletOptions, 'Others')
          const sw = normalizeWater(sv.source_of_water)
          const se = normalizeElectricity(sv.source_of_electricity)
          const mi = normalizeToOptions(normalizeMainIncome(sv.main_income_source), mainIncomeOptions, 'others')
          const ws = normalizeToOptions(sv.work_status, workStatusOptions, 'Others')
          const sk = normalizeToOptions(normalizeSkill(sv.specific_skill), skillOptions, 'others')
          const org = normalizeToOptions(normalizeOrganization(sv.specific_organization), organizationOptions, 'others')

          const classificationValue = sv.classification === 'Upgrading of Land Tenure' ? 'Upgrading_of_Land_Tenure' : (sv.classification || '')
          const religionValue = sv.religion ? toKey(sv.religion) : ''
          const spouseReligionValue = sv.spouse_religion ? toKey(sv.spouse_religion) : ''
          const otherReligionValue = sv.other_religion || ''
          const otherSpouseReligionValue = sv.other_spouse_religion || ''
          const affiliationsStr = norm(sv.affiliations || '')
          const affList = affiliationsStr ? affiliationsStr.split(',').map(x => norm(x)).filter(Boolean) : []

          setData(d => ({
            ...d,
            previous_client: sv.previous_client || d.previous_client,
            year_inhabited: sv.year_inhabited || d.year_inhabited,
            classification: classificationValue || d.classification,
            sub_class_displaced: sv.subclass_displaced || d.sub_class_displaced,
            sub_class_double_up: sv.subclass_doubleup || d.sub_class_double_up,
            sub_class_homeless: sv.subclass_homeless || d.sub_class_homeless,
            interview_person: sv.interview_person || d.interview_person,
            last_name: sv.last_name || d.last_name,
            first_name: sv.first_name || d.first_name,
            middle_name: sv.middle_name || d.middle_name,
            suffix: sv.suffix || d.suffix,
            barangay: sv.barangay || d.barangay,
            purok: sv.purok ? normalizePurokName(sv.purok) : d.purok,
            street: sv.street || d.street,
            gender: sv.gender || d.gender,
            religion: religionValue || d.religion,
            other_religion: otherReligionValue || d.other_religion,
            birth_place: sv.birth_place || d.birth_place,
            birth_date: sv.birth_date || d.birth_date,
            person_age: sv.person_age || d.person_age,
            marital_status: sv.marital_status || d.marital_status,
            contact_number: sv.contact_number || d.contact_number,
            language_spoken: sv.language_spoken || d.language_spoken,
            tribe: sv.tribe || d.tribe,
            other_tribe: sv.other_tribe || d.other_tribe,
            highest_education: sv.highest_education || d.highest_education,
            last_school_attended: sv.last_school_name || d.last_school_attended,
            year_graduated: sv.year_graduated || d.year_graduated,
            spouse_name: sv.spouse_name || d.spouse_name,
            spouse_religion: spouseReligionValue || d.spouse_religion,
            other_spouse_religion: otherSpouseReligionValue || d.other_spouse_religion,
            spouse_tribe: sv.spouse_tribe || d.spouse_tribe,
            other_spouse_tribe: sv.other_spouse_tribe || d.other_spouse_tribe,
            spouse_age: sv.spouse_age || d.spouse_age,
            spouse_gender: sv.spouse_gender || d.spouse_gender,
            affiliation: sv.affiliation ? toKey(sv.affiliation) : (d.affiliation || ''),
            affiliations: affiliationsStr || d.affiliations,
            lot_ownership: sv.lot_ownership || d.lot_ownership,
            house_ownership: sv.house_ownership || d.house_ownership,
            avail_socialized_housing: sv.avail_socialized_housing || d.avail_socialized_housing,
            temporary_living_area: sv.temporary_living_area || d.temporary_living_area,
            housing_structure: hs.v || d.housing_structure,
            other_housing_structure: hs.other || d.other_housing_structure,
            type_of_toilet: tt.v || d.type_of_toilet,
            other_type_of_toilet: tt.other || d.other_type_of_toilet,
            source_of_water: sw.v || d.source_of_water,
            other_source_of_water: sw.other || d.other_source_of_water,
            source_of_electricity: se.v || d.source_of_electricity,
            other_source_of_electricity: se.other || d.other_source_of_electricity,
            main_income_source: mi.v || d.main_income_source,
            other_main_income_source: mi.other || d.other_main_income_source,
            work_status: ws.v || d.work_status,
            other_work_status: ws.other || d.other_work_status,
            work_location_head: sv.work_location_head || d.work_location_head,
            monthly_salary: normalizeIncomeRange(sv.monthly_salary || d.monthly_salary),
            combine_monthly_income: normalizeIncomeRange(sv.combine_monthly_income || d.combine_monthly_income),
            skills_for_living: sv.skills_for_living || d.skills_for_living,
            specific_skill: sk.v || d.specific_skill,
            other_skill: sk.other || d.other_skill,
            organization_member: sv.organization_member || d.organization_member,
            specific_organization: org.v || d.specific_organization,
            other_organization: org.other || d.other_organization,
            wanttolearn: sv.wanttolearn || d.wanttolearn,
            remarks: sv.remarks || d.remarks,
            date_interviewed: sv.date_interviewed || d.date_interviewed,
          }))
          setAffSelections(affList)
          setLat(sv.latitude !== null && sv.latitude !== undefined ? String(sv.latitude) : '')
          setLon(sv.longitude !== null && sv.longitude !== undefined ? String(sv.longitude) : '')
          setExistingHousePhotoUrl(fileUrl(sv.house_photo))
          setExistingPersonPhotoUrl(fileUrl(sv.person_photo))
          setExistingRespondentSignatureUrl(fileUrl(sv.respondent_signature))
          setMembers(mem.map(m => ({
            name: m.name || '',
            age: m.age || '',
            sex: m.sex || m.gender || '',
            relationship: (() => {
              const raw = norm(m.relationship)
              if (!raw) return ''
              const match = memberRelationshipChoices.find(opt => opt.toLowerCase() === raw.toLowerCase())
              return match || raw
            })(),
            civil_status: m.civilStatus || m.civil_status || '',
            educational_attainment: (() => {
              const raw = m.educationalAttainment || m.educational_attainment || ''
              const k = toKey(raw)
              if (educationChoices.includes(k)) return k
              if (educationChoices.includes(raw)) return raw
              return raw
            })(),
            occupation: m.occupation || '',
            monthly_income: m.monthlyIncome || m.monthly_income || '',
            code: m.code || '',
          })))
        }
      }).catch(()=>{})
    }
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
    const bd = data.birth_date
    if (!bd) return
    const now = new Date()
    const d = new Date(bd)
    let age = now.getFullYear() - d.getFullYear()
    const m = now.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age = age - 1
    if (!Number.isNaN(age) && age >= 0) setData(prev => ({ ...prev, person_age: String(age) }))
  }, [data.birth_date])

  // Auto-calculate combined household income when monthly_salary or members change
  // Use JSON.stringify to properly track deep changes in members array
  const membersIncomeKey = JSON.stringify(members.map(m => m.monthly_income || ''))
  
  useEffect(() => {
    // Skip calculation if monthly_salary is not set yet
    if (!data.monthly_salary && members.every(m => !m.monthly_income)) {
      return
    }
    
    const totalIncome = calculateTotalIncome(data.monthly_salary, members)
    const incomeRange = determineIncomeRange(totalIncome)
    
    // Always update to ensure calculated value is set (overrides any stale database value)
    setData(prev => {
      if (prev.combine_monthly_income !== incomeRange) {
        return { ...prev, combine_monthly_income: incomeRange }
      }
      return prev
    })
  }, [data.monthly_salary, membersIncomeKey])

  useEffect(() => {
    if (data.barangay) {
      const uniqSorted = (arr) => Array.from(new Set(arr.map(normalizePurokName))).sort((a,b)=>a.localeCompare(b))
      const base = uniqSorted(purokMap[data.barangay] || [])
      const current = normalizePurokName(data.purok)
      const withCurrent = current && !base.includes(current) ? uniqSorted([...base, current]) : base
      setPurokOptions(withCurrent)
      const prevBarangay = prevBarangayRef.current
      prevBarangayRef.current = data.barangay
      if (prevBarangay && prevBarangay !== data.barangay) {
        if (current && !base.includes(current)) {
          setData(d => ({ ...d, purok: '' }))
        }
      }
      axios.get('/validator/api/tag-number/preview', { params: { barangay: data.barangay } })
        .then(res => setTagNum(res.data?.tag_number || ''))
        .catch(() => setTagNum(''))
    }
  }, [data.barangay])

  useEffect(() => {
    if (!existingRespondentSignatureUrl || !rSigRef.current) return
    const img = new Image()
    img.onload = () => {
      const canvas = rSigRef.current
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setSignatureDirty(false)
      try {
        const data = canvas.toDataURL()
        setRespondentSignatureDataUrl(data)
      } catch {}
    }
    img.src = existingRespondentSignatureUrl
  }, [existingRespondentSignatureUrl])
  
  useEffect(() => {
    if (step !== 5) return
    if (signatureDirty) return
    if (!rSigRef.current) return
    if (existingRespondentSignatureUrl) {
      const img = new Image()
      img.onload = () => {
        const canvas = rSigRef.current
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = existingRespondentSignatureUrl
    }
  }, [step, signatureDirty, existingRespondentSignatureUrl])

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
  
  useEffect(() => {
    const shouldHaveSpouse = spouseEnabled && (String(data.spouse_name || '').trim() !== '' || String(data.spouse_age || '').trim() !== '' || String(data.spouse_gender || '').trim() !== '')
    setMembers(prev => {
      const idx = prev.findIndex(m => isSpouseRel(m.relationship))
      if (!shouldHaveSpouse) {
        if (idx !== -1) {
          const copy = [...prev]
          copy.splice(idx, 1)
          return copy
        }
        return prev
      }
      const civ = data.marital_status === 'Married' ? 'Married' : (data.marital_status || '')
      const entry = {
        name: data.spouse_name || '',
        age: data.spouse_age || '',
        sex: data.spouse_gender || '',
        relationship: 'Spouse of Head',
        civil_status: civ,
        educational_attainment: idx !== -1 ? prev[idx].educational_attainment : '',
        occupation: idx !== -1 ? prev[idx].occupation : '',
        monthly_income: idx !== -1 ? prev[idx].monthly_income : '',
        code: idx !== -1 ? prev[idx].code : '',
      }
      if (idx === -1) {
        return [entry, ...prev]
      } else {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], ...entry }
        return copy
      }
    })
  }, [data.spouse_name, data.spouse_age, data.spouse_gender, data.marital_status, spouseEnabled])

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

  const addMember = () => setMembers(m => [...m, { name:'', age:'', sex:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'', code:'' }])

  const updateMember = (idx, key, val) => setMembers(m => {
    const copy = [...m]; copy[idx] = {...copy[idx], [key]: val}; return copy
  })

  const deleteMember = (idx) =>
    setMembers(m => {
      if (m.length <= 1) return m
      const next = m.filter((_, i) => i !== idx)
      const spouseIndex = next.findIndex(r => isSpouseRel(r.relationship))
      if (next.length === 1 && spouseIndex === 0) {
        return [...next, { name:'', age:'', sex:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'', code:'' }]
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

  // Field validation helper
  const validateField = (fieldName, value) => {
    const requiredFields = [
      'classification',
      'previous_client',
      'interview_person',
      'last_name',
      'first_name',
      'barangay',
      'gender',
      'birth_date',
      'marital_status',
      'monthly_salary'
    ]
    
    if (requiredFields.includes(fieldName)) {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `The ${fieldName.replace(/_/g, ' ')} field is required`
      }
    }
    
    // Format validations
    if (fieldName === 'birth_date' && value) {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        return 'The birth date must be a valid date'
      }
      if (date >= new Date()) {
        return 'The birth date must be before today'
      }
    }
    
    if (fieldName === 'contact_number' && value) {
      if (!/^[0-9+\-\s()]+$/.test(value)) {
        return 'The contact number format is invalid'
      }
    }
    
    return null
  }

  // Validate all fields before submission
  const validateForm = () => {
    const errors = {}
    const requiredFields = [
      'classification',
      'previous_client',
      'interview_person',
      'last_name',
      'first_name',
      'barangay',
      'gender',
      'birth_date',
      'marital_status',
      'monthly_salary'
    ]
    
    requiredFields.forEach(field => {
      const error = validateField(field, data[field])
      if (error) {
        errors[field] = [error]
      }
    })
    
    return errors
  }

  // Clear field error when user types
  const handleFieldChange = (fieldName, value) => {
    setData(d => ({ ...d, [fieldName]: value }))
    
    // Clear error for this field
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const updated = { ...prev }
        delete updated[fieldName]
        return updated
      })
    }
  }

  const submit = async () => {
    setSubmitting(true)
    // Clear all error states at start of submission
    setError('')
    setFieldErrors({})
    setValidationSummary('')
    
    try {
      // Frontend validation - call validateForm() before creating FormData
      const errors = validateForm()
      
      if (Object.keys(errors).length > 0) {
        // If validation errors exist, set fieldErrors and validationSummary states
        setFieldErrors(errors)
        setValidationSummary('Please fill in all required fields')
        setSubmitting(false)
        
        // Scroll to first field with error and focus it
        const firstErrorField = Object.keys(errors)[0]
        const element = document.querySelector(`[name="${firstErrorField}"]`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
        
        // Prevent HTTP request if frontend validation fails
        return
      }
      
      const sid = new URLSearchParams(window.location.search).get('survey_id')
      const fd = new FormData()
      const isBlank = (v) => {
        if (v === null || v === undefined) return true
        if (typeof v !== 'string') return false
        return v.trim() === ''
      }
      const payload = { ...data }
      
      // Debug: Log the data being submitted
      console.log('Submitting survey data:', payload)
      console.log('Required fields check:', {
        classification: payload.classification,
        previous_client: payload.previous_client,
        interview_person: payload.interview_person,
        last_name: payload.last_name,
        first_name: payload.first_name,
        barangay: payload.barangay,
        gender: payload.gender,
        birth_date: payload.birth_date,
        marital_status: payload.marital_status,
        monthly_salary: payload.monthly_salary
      })
      
      // Remove N/A conversion for optional fields - allow them to remain empty/null
      // Only convert "Others" specify fields to N/A if they're required but empty
      if (payload.housing_structure === 'Others' && isBlank(payload.other_housing_structure)) payload.other_housing_structure = 'N/A'
      if (payload.type_of_toilet === 'Others' && isBlank(payload.other_type_of_toilet)) payload.other_type_of_toilet = 'N/A'
      if (payload.source_of_water === 'Others' && isBlank(payload.other_source_of_water)) payload.other_source_of_water = 'N/A'
      if (payload.source_of_electricity === 'Others' && isBlank(payload.other_source_of_electricity)) payload.other_source_of_electricity = 'N/A'
      if (payload.main_income_source === 'others' && isBlank(payload.other_main_income_source)) payload.other_main_income_source = 'N/A'
      if (payload.work_status === 'others' && isBlank(payload.other_work_status)) payload.other_work_status = 'N/A'
      if (payload.specific_skill === 'others' && isBlank(payload.other_skill)) payload.other_skill = 'N/A'
      if (payload.specific_organization === 'others' && isBlank(payload.other_organization)) payload.other_organization = 'N/A'
      if (payload.religion === 'Other' && isBlank(payload.other_religion)) payload.other_religion = 'N/A'
      if (payload.spouse_religion === 'Other' && isBlank(payload.other_spouse_religion)) payload.other_spouse_religion = 'N/A'
      if (payload.tribe === 'Others' && isBlank(payload.other_tribe)) payload.other_tribe = 'N/A'
      if (payload.spouse_tribe === 'Others' && isBlank(payload.other_spouse_tribe)) payload.other_spouse_tribe = 'N/A'

      Object.entries(payload).forEach(([k,v]) => fd.append(k, v ?? ''))
      if (housePhoto) fd.append('house_photo', housePhoto)
      if (personPhoto) fd.append('person_photo', personPhoto)
      
      fd.append('latitude', lat)
      fd.append('longitude', lon)
      
      if (!sid) {
        fd.append('respondent_signature', rSigRef.current?.toDataURL ? rSigRef.current.toDataURL() : '')
      } else if (signatureDirty) {
        fd.append('respondent_signature', respondentSignatureDataUrl || (rSigRef.current?.toDataURL ? rSigRef.current.toDataURL() : ''))
      }
      members.forEach(m => {
        fd.append('name[]', m.name ?? '')
        fd.append('age[]', m.age ?? '')
        fd.append('sex[]', m.sex ?? '')
        fd.append('relationship[]', m.relationship ?? '')
        fd.append('civil_status[]', m.civil_status ?? '')
        fd.append('educational_attainment[]', m.educational_attainment ?? '')
        fd.append('occupation[]', m.occupation ?? '')
        fd.append('monthly_income[]', m.monthly_income ?? '')
        fd.append('code[]', m.code ?? '')
      })
      if (sid) {
        fd.append('_method', 'PUT')
        await axios.post(`/validator/api/survey/${sid}`, fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      } else {
        await axios.post('/validator/api/survey', fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      }
      window.location.href = '/validator/dashboard'
    } catch (e) {
      console.error('Survey submission error:', e)
      console.error('Error response:', e.response)
      console.error('Error response data:', e.response?.data)
      console.error('Error response status:', e.response?.status)
      
      if (e.response) {
        // Server responded with error
        const data = e.response.data
        
        if (e.response.status === 422) {
          // Validation errors from backend - parse field errors
          const errors = data?.errors
          
          console.log('422 Validation errors:', errors)
          
          if (errors && typeof errors === 'object') {
            setFieldErrors(errors)
            setValidationSummary(data?.message || 'Validation failed. Please check the highlighted fields.')
            
            // Scroll to first error field after backend validation failure
            const firstErrorField = Object.keys(errors)[0]
            const element = document.querySelector(`[name="${firstErrorField}"]`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              element.focus()
            }
          } else {
            setError(data?.message || 'Validation error. Please check your input.')
          }
        } else if (e.response.status === 500) {
          // Database or server error - display specific error message
          console.error('Server error details:', data)
          setError(data?.message || 'Server error occurred. Please try again or contact support.')
        } else {
          setError(data?.message || data?.error || (typeof data === 'string' ? data : `Server error (${e.response.status})`))
        }
      } else if (e.request) {
        // Request was made but no response received
        setError('No response from server. Please check your internet connection.')
      } else {
        // Error setting up request
        setError(e.message || 'Submission failed. Please check your connection and try again.')
      }
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
            <ValidationSummary validationSummary={validationSummary} fieldErrors={fieldErrors} />
          </DashboardFade>

          <DashboardFade delay={300}>
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {step === 0 && (
            <div className="rounded-2xl bg-gray-50 p-6 animate-form-step">
              <StepHeader number={1} title="Basic Details" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Previous Client <span className="text-red-500">*</span></div>
                  <SmoothSelect
                    value={data.previous_client}
                    onChange={v => handleFieldChange('previous_client', v)}
                    options={yesNoOptions}
                    buttonClassName={getSelectClass('previous_client')}
                  />
                  <FieldError fieldName="previous_client" fieldErrors={fieldErrors} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Year Inhabited</div>
                  <input className={getInputClass('year_inhabited')} value={data.year_inhabited} onChange={e=>handleFieldChange('year_inhabited', e.target.value)}/>
                  <FieldError fieldName="year_inhabited" fieldErrors={fieldErrors} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Classification <span className="text-red-500">*</span></div>
                  <SmoothSelect
                    value={data.classification}
                    onChange={v =>
                      {
                        handleFieldChange('classification', v)
                        setData({
                          ...data,
                          classification: v,
                          sub_class_displaced: '',
                          sub_class_double_up: '',
                          sub_class_homeless: '',
                        })
                      }
                    }
                    options={buildOptions(['Displaced', 'Double-up', 'Homeless', 'Upgrading_of_Land_Tenure'])}
                    buttonClassName={getSelectClass('classification')}
                  />
                  <FieldError fieldName="classification" fieldErrors={fieldErrors} />
                  </div>
                </div>
                {subclassVisible.displaced && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Displaced</div>
                  <SmoothSelect
                    value={data.sub_class_displaced}
                    onChange={v => handleFieldChange('sub_class_displaced', v)}
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
                    buttonClassName={getSelectClass('sub_class_displaced')}
                  />
                  <FieldError fieldName="sub_class_displaced" fieldErrors={fieldErrors} />
                  </div>
                )}
                {subclassVisible.doubleup && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Double-up</div>
                  <SmoothSelect
                    value={data.sub_class_double_up}
                    onChange={v => handleFieldChange('sub_class_double_up', v)}
                    options={buildOptions(['Renter/Tenant', 'Rent-free/Sharer', 'Caretaker'])}
                    buttonClassName={getSelectClass('sub_class_double_up')}
                  />
                  <FieldError fieldName="sub_class_double_up" fieldErrors={fieldErrors} />
                  </div>
                )}
                {subclassVisible.homeless && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Homeless</div>
                  <SmoothSelect
                    value={data.sub_class_homeless}
                    onChange={v => handleFieldChange('sub_class_homeless', v)}
                    options={buildOptions(['Public - living in tent', 'Private - living in tent'])}
                    buttonClassName={getSelectClass('sub_class_homeless')}
                  />
                  <FieldError fieldName="sub_class_homeless" fieldErrors={fieldErrors} />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-2xl bg-gray-50 p-6 animate-form-step">
              <StepHeader number={2} title="Personal Information" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Person Interviewed <span className="text-red-500">*</span></div>
                  <SmoothSelect
                    value={data.interview_person}
                    onChange={v => handleFieldChange('interview_person', v)}
                    options={buildOptions(['Household_Head', 'Spouse_Head', 'Never-Married', 'Other_Relative', 'Non_Relative'])}
                    buttonClassName={getSelectClass('interview_person')}
                  />
                  <FieldError fieldName="interview_person" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Last Name <span className="text-red-500">*</span></div>
                  <input className={getInputClass('last_name')} value={data.last_name} onChange={e=>handleFieldChange('last_name', e.target.value)}/>
                  <FieldError fieldName="last_name" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">First Name <span className="text-red-500">*</span></div>
                  <input className={getInputClass('first_name')} value={data.first_name} onChange={e=>handleFieldChange('first_name', e.target.value)}/>
                  <FieldError fieldName="first_name" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Middle Name</div>
                  <input className={getInputClass('middle_name')} value={data.middle_name} onChange={e=>handleFieldChange('middle_name', e.target.value)}/>
                  <FieldError fieldName="middle_name" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Suffix</div>
                  <input className={getInputClass('suffix')} value={data.suffix} onChange={e=>handleFieldChange('suffix', e.target.value)}/>
                  <FieldError fieldName="suffix" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Gender <span className="text-red-500">*</span></div>
                  <SmoothSelect value={data.gender} onChange={v => handleFieldChange('gender', v)} options={genderOptions} buttonClassName={getSelectClass('gender')} />
                  <FieldError fieldName="gender" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Barangay <span className="text-red-500">*</span></div>
                  <SmoothSelect
                    value={data.barangay}
                    onChange={v => handleFieldChange('barangay', v)}
                    options={barangayOptions}
                    buttonClassName={getSelectClass('barangay')}
                  />
                  <FieldError fieldName="barangay" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Purok</div>
                  <SmoothSelect
                    value={data.purok}
                    onChange={v => handleFieldChange('purok', v)}
                    options={purokSelectOptions}
                    buttonClassName={getSelectClass('purok')}
                    disabled={!data.barangay || purokOptions.length === 0}
                  />
                  <FieldError fieldName="purok" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Street</div>
                  <input className={getInputClass('street')} value={data.street} onChange={e=>handleFieldChange('street', e.target.value)}/>
                  <FieldError fieldName="street" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tag Number</div>
                  <input className={inputClass} value={tagNum} readOnly placeholder="Generated after selecting barangay"/>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Religion</div>
                  <SmoothSelect
                    value={data.religion}
                    onChange={v => {
                      handleFieldChange('religion', v)
                      setData({ ...data, religion: v, other_religion: v !== 'Other' ? '' : data.other_religion })
                    }}
                    options={buildOptions([
                      'Roman_Catholic',
                      'Islam',
                      'Iglesia_ni_Cristo',
                      'Seventh-day_Adventist',
                      'Bible_Baptist_Church',
                      'United_Church_of_Christ_in_the_Philippines',
                      "Jehovah's_Witnesses",
                      'Church_of_Christ',
                      'Other',
                    ])}
                    buttonClassName={getSelectClass('religion')}
                  />
                  <FieldError fieldName="religion" fieldErrors={fieldErrors} />
                  <OtherSpecifyField
                    parentValue={data.religion}
                    value={data.other_religion}
                    onChange={(val) => handleFieldChange('other_religion', val)}
                    placeholder="Specify your religion"
                    inputClassName={getInputClass('other_religion')}
                  />
                  <FieldError fieldName="other_religion" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Birth Place</div>
                  <input className={getInputClass('birth_place')} value={data.birth_place} onChange={e=>handleFieldChange('birth_place', e.target.value)}/>
                  <FieldError fieldName="birth_place" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Birth Date <span className="text-red-500">*</span></div>
                  <input type="date" className={getInputClass('birth_date')} value={data.birth_date} onChange={e=>handleFieldChange('birth_date', e.target.value)}/>
                  <FieldError fieldName="birth_date" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Age</div>
                  <input type="number" className={readOnlyInputClass} value={data.person_age} readOnly />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Marital Status <span className="text-red-500">*</span></div>
                  <SmoothSelect
                    value={data.marital_status}
                    onChange={v => handleFieldChange('marital_status', v)}
                    options={civilStatusOptions}
                    buttonClassName={getSelectClass('marital_status')}
                  />
                  <FieldError fieldName="marital_status" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Contact Number</div>
                  <input
                    className={getInputClass('contact_number')}
                    value={data.contact_number}
                    maxLength={11}
                    onChange={e => {
                      const raw = e.target.value || ''
                      const digits = raw.replace(/\D/g, '').slice(0, 11)
                      handleFieldChange('contact_number', digits)
                    }}
                  />
                  <FieldError fieldName="contact_number" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Language</div>
                  <SmoothSelect
                    value={data.language_spoken}
                    onChange={v => handleFieldChange('language_spoken', v)}
                    options={buildOptions([
                      'Cebuano (Bisaya)',
                      'Tagalog (Filipino)',
                      'English',
                      'Maguindanaon',
                      'Tagakaulo',
                      'Hiligaynon (Ilonggo)',
                      'Ilocano',
                      'Bagobo',
                      "B'laan",
                      'Mandaya',
                      'Kalagan/Kagan',
                      'Others',
                    ])}
                    buttonClassName={getSelectClass('language_spoken')}
                  />
                  <FieldError fieldName="language_spoken" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tribe/Ethnicity</div>
                  <SmoothSelect
                    value={data.tribe}
                    onChange={v => {
                      handleFieldChange('tribe', v)
                      setData({ ...data, tribe: v, other_tribe: v !== 'Others' ? '' : data.other_tribe })
                    }}
                    options={buildOptions([
                      'Cebuano/Bisaya',
                      'Bagobo',
                      'Bagobo-Tagabawa',
                      "B'laan",
                      'Tagakaulo',
                      'Maguindanaon',
                      'Kalagan/Kagan',
                      'Kalagan (Kaagan)',
                      'Ilonggo/Hiligaynon',
                      'Ilocano',
                      'Manobo',
                      'Leyteño',
                      'Others',
                    ])}
                    buttonClassName={getSelectClass('tribe')}
                  />
                  <FieldError fieldName="tribe" fieldErrors={fieldErrors} />
                  <OtherSpecifyField
                    parentValue={data.tribe}
                    triggerValue="Others"
                    value={data.other_tribe || ''}
                    onChange={(val) => handleFieldChange('other_tribe', val)}
                    placeholder="Specify your tribe/ethnicity"
                    inputClassName={getInputClass('other_tribe')}
                  />
                  <FieldError fieldName="other_tribe" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Highest Education</div>
                  <SmoothSelect
                    value={data.highest_education}
                    onChange={v => handleFieldChange('highest_education', v)}
                    options={educationOptions}
                    buttonClassName={getSelectClass('highest_education')}
                  />
                  <FieldError fieldName="highest_education" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">School Last Attended</div>
                  <input className={getInputClass('last_school_attended')} value={data.last_school_attended} onChange={e=>handleFieldChange('last_school_attended', e.target.value)}/>
                  <FieldError fieldName="last_school_attended" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Year Graduated</div>
                  <input className={getInputClass('year_graduated')} value={data.year_graduated} onChange={e=>handleFieldChange('year_graduated', e.target.value)}/>
                  <FieldError fieldName="year_graduated" fieldErrors={fieldErrors} />
                </div>
              </div>

              {spouseEnabled && (
                <div className="mt-6">
                  <div className="text-lg font-semibold text-emerald-800">Spouse Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
                    <div>
                      <div className="text-sm text-gray-500">Spouse Name</div>
                      <input
                        className={getInputClass('spouse_name')}
                        value={data.spouse_name}
                        onChange={e => handleFieldChange('spouse_name', e.target.value)}
                      />
                      <FieldError fieldName="spouse_name" fieldErrors={fieldErrors} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Spouse Religion</div>
                      <SmoothSelect
                        value={data.spouse_religion}
                        onChange={v => {
                          handleFieldChange('spouse_religion', v)
                          setData({ ...data, spouse_religion: v, other_spouse_religion: v !== 'Other' ? '' : data.other_spouse_religion })
                        }}
                        options={buildOptions([
                          'Roman_Catholic',
                          'Islam',
                          'Iglesia_ni_Cristo',
                          'Seventh-day_Adventist',
                          'Bible_Baptist_Church',
                          'United_Church_of_Christ_in_the_Philippines',
                          "Jehovah's_Witnesses",
                          'Church_of_Christ',
                          'Other',
                        ])}
                        buttonClassName={getSelectClass('spouse_religion')}
                      />
                      <FieldError fieldName="spouse_religion" fieldErrors={fieldErrors} />
                      <OtherSpecifyField
                        parentValue={data.spouse_religion}
                        value={data.other_spouse_religion}
                        onChange={(val) => handleFieldChange('other_spouse_religion', val)}
                        placeholder="Specify spouse religion"
                        inputClassName={getInputClass('other_spouse_religion')}
                      />
                      <FieldError fieldName="other_spouse_religion" fieldErrors={fieldErrors} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Spouse Tribe/Ethnicity</div>
                      <SmoothSelect
                        value={data.spouse_tribe}
                        onChange={v => {
                          handleFieldChange('spouse_tribe', v)
                          setData({ ...data, spouse_tribe: v, other_spouse_tribe: v !== 'Others' ? '' : data.other_spouse_tribe })
                        }}
                        options={buildOptions([
                          'Cebuano/Bisaya',
                          'Bagobo',
                          'Bagobo-Tagabawa',
                          "B'laan",
                          'Tagakaulo',
                          'Maguindanaon',
                          'Kalagan/Kagan',
                          'Kalagan (Kaagan)',
                          'Ilonggo/Hiligaynon',
                          'Ilocano',
                          'Manobo',
                          'Leyteño',
                          'Others',
                        ])}
                        buttonClassName={getSelectClass('spouse_tribe')}
                      />
                      <FieldError fieldName="spouse_tribe" fieldErrors={fieldErrors} />
                      <OtherSpecifyField
                        parentValue={data.spouse_tribe}
                        triggerValue="Others"
                        value={data.other_spouse_tribe || ''}
                        onChange={(val) => handleFieldChange('other_spouse_tribe', val)}
                        placeholder="Specify spouse tribe/ethnicity"
                        inputClassName={getInputClass('other_spouse_tribe')}
                      />
                      <FieldError fieldName="other_spouse_tribe" fieldErrors={fieldErrors} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Spouse Age</div>
                      <input
                        type="number"
                        className={getInputClass('spouse_age')}
                        value={data.spouse_age}
                        onChange={e => handleFieldChange('spouse_age', e.target.value)}
                      />
                      <FieldError fieldName="spouse_age" fieldErrors={fieldErrors} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Spouse Gender</div>
                      <SmoothSelect
                        value={data.spouse_gender}
                        onChange={v => handleFieldChange('spouse_gender', v)}
                        options={genderOptions}
                        buttonClassName={getSelectClass('spouse_gender')}
                      />
                      <FieldError fieldName="spouse_gender" fieldErrors={fieldErrors} />
                    </div>
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
                <div className="text-lg font-semibold text-emerald-800">Members of the Household</div>
                <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                  <div className="font-medium text-gray-900">Choose the Code Letter that applies to a specific family member</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Vulnerable Group Code: A. Pregnant B. PWD C. Senior Citizen D. Infant/Kid E. With Severe Illness F. IP&apos;s
                  </div>
                </div>
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="min-w-full table-fixed text-xs">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-100">
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Name</th>
                        <th className="w-16 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Age</th>
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Relationship</th>
                        <th className="w-32 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Civil Status</th>
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Education</th>
                        <th className="w-32 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Occupation</th>
                        <th className="w-40 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Monthly Income</th>
                        <th className="w-28 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Code</th>
                        <th className="w-20 px-2 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        (() => {
                          const isSpouseRow = isSpouseRel(m.relationship)
                          return (
                        <tr key={i} className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50">
                          <td className="px-2 py-2 align-middle"><input className={tableInputClass} value={m.name} onChange={e=>updateMember(i,'name',e.target.value)}/></td>
                          <td className="px-2 py-2 align-middle"><input type="number" className={tableInputClass} value={m.age} onChange={e=>updateMember(i,'age',e.target.value)}/></td>
                          <td className="px-2 py-2 align-middle">
                            <select className={tableSelectClass} value={m.relationship} onChange={e=>updateMember(i,'relationship',e.target.value)}>
                              <option value="">- select here -</option>
                              {memberRelationshipChoices.map(opt => (<option key={`rel-${opt}`} value={opt}>{opt}</option>))}
                            </select>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <select className={tableSelectClass} value={m.civil_status} onChange={e=>updateMember(i,'civil_status',e.target.value)}>
                              <option value="">- select here -</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Live-in">Live-in</option>
                              <option value="Widow/Widower">Widow/Widower</option>
                              <option value="Annulled">Annulled</option>
                              <option value="Separated">Separated</option>
                              <option value="Unknown">Unknown</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            {(() => {
                              const base = [...educationChoices]
                              const currentEdu = String(m.educational_attainment || '')
                              if (currentEdu && !base.includes(currentEdu)) base.push(currentEdu)
                              return (
                                <select className={tableSelectClass} value={m.educational_attainment} onChange={e=>updateMember(i,'educational_attainment',e.target.value)}>
                                  <option value="">- select here -</option>
                                  {base.map(opt => (<option key={`edu-${opt}`} value={opt}>{opt.replace(/_/g,' ')}</option>))}
                                </select>
                              )
                            })()}
                          </td>
                          <td className="px-2 py-2 align-middle"><input className={tableInputClass} value={m.occupation} onChange={e=>updateMember(i,'occupation',e.target.value)}/></td>
                          <td className="px-2 py-2 align-middle">
                            <select className={tableSelectClass} value={m.monthly_income} onChange={e=>updateMember(i,'monthly_income',e.target.value)}>
                              <option value="">- select here -</option>
                              {incomeChoices.map(opt => (<option key={`inc-${opt}`} value={opt}>{opt}</option>))}
                            </select>
                          </td>
                          <td className="px-2 py-2 align-middle">
                            <select className={tableSelectClass} value={m.code} onChange={e=>updateMember(i,'code',e.target.value)}>
                              <option value="">- select here -</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                              <option value="F">F</option>
                            </select>
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
            <div className="rounded-2xl bg-gray-50 p-6 animate-form-step">
              <StepHeader number={3} title="Household & Utilities" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Lot Ownership</div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="lot_ownership"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.lot_ownership === 'Yes'}
                        onChange={() => setData({ ...data, lot_ownership: 'Yes' })}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="lot_ownership"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.lot_ownership === 'No'}
                        onChange={() => setData({ ...data, lot_ownership: 'No' })}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">House Ownership</div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="house_ownership"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.house_ownership === 'Yes'}
                        onChange={() => setData({ ...data, house_ownership: 'Yes' })}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="house_ownership"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.house_ownership === 'No'}
                        onChange={() => setData({ ...data, house_ownership: 'No' })}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Avail Socialized Housing</div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="avail_socialized_housing"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.avail_socialized_housing === 'Yes'}
                        onChange={() => setData({ ...data, avail_socialized_housing: 'Yes' })}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="avail_socialized_housing"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.avail_socialized_housing === 'No'}
                        onChange={() => setData({ ...data, avail_socialized_housing: 'No' })}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Temporary Dwelling</div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="temporary_living_area"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.temporary_living_area === 'Yes'}
                        onChange={() => setData({ ...data, temporary_living_area: 'Yes' })}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="temporary_living_area"
                        className="h-4 w-4 text-emerald-600"
                        checked={data.temporary_living_area === 'No'}
                        onChange={() => setData({ ...data, temporary_living_area: 'No' })}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Housing Structure</div>
                  <SmoothSelect
                    value={data.housing_structure}
                    onChange={v => setData({ ...data, housing_structure: v, other_housing_structure: '' })}
                    options={buildOptions([
                      'Makeshift/Salvaged/Improvised_material',
                      'Made_of_Amakan_and_Nipa',
                      'Made_of_Amakan_and_metal_roof',
                      'Made_of_wood_and_metal_roof',
                      'Combination_of_concrete_and_wood',
                      'Full_Concrete',
                      'Others',
                    ])}
                    buttonClassName={selectClass}
                  />
                  <OtherSpecifyField
                    parentValue={data.housing_structure}
                    triggerValue="Others"
                    value={data.other_housing_structure}
                    onChange={(val) => setData({ ...data, other_housing_structure: val })}
                    placeholder="Please specify"
                    inputClassName={inputClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type of Toilet</div>
                  <SmoothSelect
                    value={data.type_of_toilet}
                    onChange={v => setData({ ...data, type_of_toilet: v, other_type_of_toilet: '' })}
                    options={buildOptions(['No_Toilet', 'Open_Pit/Antipolo', 'Water_Sealed', 'Others'])}
                    buttonClassName={selectClass}
                  />
                  <OtherSpecifyField
                    parentValue={data.type_of_toilet}
                    triggerValue="Others"
                    value={data.other_type_of_toilet}
                    onChange={(val) => setData({ ...data, other_type_of_toilet: val })}
                    placeholder="Please specify"
                    inputClassName={inputClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Source of Water</div>
                  <SmoothSelect
                    value={data.source_of_water}
                    onChange={v => setData({ ...data, source_of_water: v, other_source_of_water: '' })}
                    options={sourceOfWaterOptions}
                    buttonClassName={selectClass}
                  />
                  <OtherSpecifyField
                    parentValue={data.source_of_water}
                    triggerValue="Others"
                    value={data.other_source_of_water}
                    onChange={(val) => setData({ ...data, other_source_of_water: val })}
                    placeholder="Please specify"
                    inputClassName={inputClass}
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Source of Electricity</div>
                  <SmoothSelect
                    value={data.source_of_electricity}
                    onChange={v => setData({ ...data, source_of_electricity: v, other_source_of_electricity: '' })}
                    options={sourceOfElectricityOptions}
                    buttonClassName={selectClass}
                  />
                  <OtherSpecifyField
                    parentValue={data.source_of_electricity}
                    triggerValue="Others"
                    value={data.other_source_of_electricity}
                    onChange={(val) => setData({ ...data, other_source_of_electricity: val })}
                    placeholder="Please specify"
                    inputClassName={inputClass}
                  />
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
                    onChange={v => {
                      handleFieldChange('main_income_source', v)
                      setData({ ...data, main_income_source: v, other_main_income_source: '' })
                    }}
                    options={[
                      { value: '', label: '- select here -' },
                      { value: 'Public_Employee', label: 'Employee (Public)' },
                      { value: 'Private_Employee', label: 'Employee (Private)' },
                      { value: 'Self_Employed', label: 'Self-Employed' },
                      { value: 'Casual', label: 'Casual' },
                      { value: 'others', label: 'Others' },
                    ]}
                    buttonClassName={getSelectClass('main_income_source')}
                  />
                  <FieldError fieldName="main_income_source" fieldErrors={fieldErrors} />
                  <OtherSpecifyField
                    parentValue={data.main_income_source}
                    triggerValue="others"
                    value={data.other_main_income_source}
                    onChange={(val) => handleFieldChange('other_main_income_source', val)}
                    placeholder="Please specify"
                    inputClassName={getInputClass('other_main_income_source')}
                  />
                  <FieldError fieldName="other_main_income_source" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Work Status</div>
                  <SmoothSelect
                    value={data.work_status}
                    onChange={v => {
                      handleFieldChange('work_status', v)
                      setData({ ...data, work_status: v, other_work_status: '' })
                    }}
                    options={[
                      { value: '', label: '- select here -' },
                      { value: 'Regular', label: 'Regular' },
                      { value: 'Contractual', label: 'Contractual' },
                      { value: 'others', label: 'Others' },
                    ]}
                    buttonClassName={getSelectClass('work_status')}
                  />
                  <FieldError fieldName="work_status" fieldErrors={fieldErrors} />
                  <OtherSpecifyField
                    parentValue={data.work_status}
                    triggerValue="others"
                    value={data.other_work_status}
                    onChange={(val) => handleFieldChange('other_work_status', val)}
                    placeholder="Please specify"
                    inputClassName={getInputClass('other_work_status')}
                  />
                  <FieldError fieldName="other_work_status" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Work Location</div>
                  <SmoothSelect
                    value={data.work_location_head}
                    onChange={v => handleFieldChange('work_location_head', v)}
                    options={buildOptions([
                      'Within the Barangay',
                      'Within the City/Municipality',
                      'Within the Province',
                      'Within the Country',
                    ])}
                    buttonClassName={getSelectClass('work_location_head')}
                  />
                  <FieldError fieldName="work_location_head" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Monthly Salary <span className="text-red-500">*</span></div>
                  <SmoothSelect
                    value={data.monthly_salary}
                    onChange={v => handleFieldChange('monthly_salary', v)}
                    options={incomeOptions}
                    buttonClassName={getSelectClass('monthly_salary')}
                  />
                  <FieldError fieldName="monthly_salary" fieldErrors={fieldErrors} />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Combined Household Income</div>
                  <input 
                    className={readOnlyInputClass} 
                    value={data.combine_monthly_income} 
                    readOnly 
                    placeholder="Auto-calculated from household head and members"
                  />
                </div>
              </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="rounded-2xl bg-gray-50 p-6 animate-form-step">
              <StepHeader number={5} title="Income & Organization" />
              <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Skills for Living</div>
                  <SmoothSelect
                    value={data.skills_for_living}
                    onChange={v => {
                      handleFieldChange('skills_for_living', v)
                      setData({ ...data, skills_for_living: v, specific_skill: '', other_skill: '' })
                    }}
                    options={yesNoOptions}
                    buttonClassName={getSelectClass('skills_for_living')}
                  />
                  <FieldError fieldName="skills_for_living" fieldErrors={fieldErrors} />
                </div>
                {data.skills_for_living === 'Yes' && (
                  <div>
                    <div className="text-sm text-gray-500">Specific Skill</div>
                    <SmoothSelect
                      value={data.specific_skill}
                      onChange={v => {
                        handleFieldChange('specific_skill', v)
                        setData({ ...data, specific_skill: v, other_skill: '' })
                      }}
                      options={[
                        { value: '', label: '- select skill -' },
                        { value: 'Handicrafts', label: 'Handicrafts' },
                        { value: 'Wood_Works_and_Furnitures', label: 'Wood Works & Furnitures' },
                        { value: 'Food_Processing', label: 'Food Processing' },
                        { value: 'others', label: 'Others' },
                      ]}
                      buttonClassName={getSelectClass('specific_skill')}
                    />
                    <FieldError fieldName="specific_skill" fieldErrors={fieldErrors} />
                    <OtherSpecifyField
                      parentValue={data.specific_skill}
                      triggerValue="others"
                      value={data.other_skill}
                      onChange={(val) => handleFieldChange('other_skill', val)}
                      placeholder="Please specify"
                      inputClassName={getInputClass('other_skill')}
                    />
                    <FieldError fieldName="other_skill" fieldErrors={fieldErrors} />
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500">Organization Member</div>
                  <SmoothSelect
                    value={data.organization_member}
                    onChange={v => {
                      handleFieldChange('organization_member', v)
                      setData({ ...data, organization_member: v, specific_organization: '', other_organization: '' })
                    }}
                    options={yesNoOptions}
                    buttonClassName={getSelectClass('organization_member')}
                  />
                  <FieldError fieldName="organization_member" fieldErrors={fieldErrors} />
                </div>
                {data.organization_member === 'Yes' && (
                  <div>
                    <div className="text-sm text-gray-500">Organization</div>
                    <SmoothSelect
                      value={data.specific_organization}
                      onChange={v => {
                        handleFieldChange('specific_organization', v)
                        setData({ ...data, specific_organization: v, other_organization: '' })
                      }}
                      options={[
                        { value: '', label: '' },
                        { value: 'HOA', label: 'HOA' },
                        { value: 'Youth_Organization', label: 'Youth Organization' },
                        { value: 'Dayong', label: 'Dayong' },
                        { value: 'Womens_Organization', label: "Women's Organization" },
                        { value: 'others', label: 'Others' },
                      ]}
                      buttonClassName={getSelectClass('specific_organization')}
                    />
                    <FieldError fieldName="specific_organization" fieldErrors={fieldErrors} />
                    <OtherSpecifyField
                      parentValue={data.specific_organization}
                      triggerValue="others"
                      value={data.other_organization}
                      onChange={(val) => handleFieldChange('other_organization', val)}
                      placeholder="Please specify"
                      inputClassName={getInputClass('other_organization')}
                    />
                    <FieldError fieldName="other_organization" fieldErrors={fieldErrors} />
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-gray-500">Skills you want to learn</div>
                <input className={getInputClass('wanttolearn')} value={data.wanttolearn} onChange={e=>handleFieldChange('wanttolearn', e.target.value)}/>
                <FieldError fieldName="wanttolearn" fieldErrors={fieldErrors} />
              </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-2xl bg-gray-50 p-6 animate-form-step">
              <StepHeader number={6} title="Final Details" />
              <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">House Photo</div>
                {existingHousePhotoUrl && !housePhoto && <img src={existingHousePhotoUrl} alt="House photo" className="mt-2 w-40 h-40 object-cover rounded border" />}
                <input type="file" accept="image/*" className={getFileInputClass('house_photo')} onChange={e=>setHousePhoto(e.target.files?.[0] || null)} />
                {housePhoto?.name && <div className="mt-1 text-xs text-gray-500 truncate">Selected: {housePhoto.name}</div>}
                <FieldError fieldName="house_photo" fieldErrors={fieldErrors} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Respondent Photo</div>
                {existingPersonPhotoUrl && !personPhoto && <img src={existingPersonPhotoUrl} alt="Respondent photo" className="mt-2 w-40 h-40 object-cover rounded border" />}
                <input type="file" accept="image/*" className={getFileInputClass('person_photo')} onChange={e=>setPersonPhoto(e.target.files?.[0] || null)} />
                {personPhoto?.name && <div className="mt-1 text-xs text-gray-500 truncate">Selected: {personPhoto.name}</div>}
                <FieldError fieldName="person_photo" fieldErrors={fieldErrors} />
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
                  <input type="date" className={getInputClass('date_interviewed')} value={data.date_interviewed} onChange={e=>handleFieldChange('date_interviewed', e.target.value)}/>
                  <FieldError fieldName="date_interviewed" fieldErrors={fieldErrors} />
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Remarks</div>
                <textarea className={getInputClass('remarks')} rows={4} value={data.remarks} onChange={e=>handleFieldChange('remarks', e.target.value)}/>
                <FieldError fieldName="remarks" fieldErrors={fieldErrors} />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-2">Respondent Signature</div>
                  <Signature
                    canvasRef={rSigRef}
                    onClear={() => {
                      clearCanvas(rSigRef)
                      setSignatureDirty(true)
                      setRespondentSignatureDataUrl('')
                      setExistingRespondentSignatureUrl('')
                    }}
                    onEnd={() => {
                      setSignatureDirty(true)
                      setRespondentSignatureDataUrl(rSigRef.current?.toDataURL ? rSigRef.current.toDataURL() : '')
                    }}
                  />
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
              <button
                type="button"
                className={buttonPrimaryClass}
                onClick={() => {
                  setAgreed(false)
                  setShowConsent(true)
                }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
            </div>
          </DashboardFade>
        </div>
      </main>

      <Modal
        show={showConsent}
        onClose={() => setShowConsent(false)}
        maxWidth="lg"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              Data Privacy Agreement
            </h3>
            <button 
              onClick={() => setShowConsent(false)}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto bg-white">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm leading-relaxed text-gray-600">
                  I hereby certify that the above statement and information are true and correct to the best of my knowledge. I further understand that any misrepresentation and/or deliberate omission of facts and information contained herein shall constitute ground for my disqualification. I voluntarily and freely consent to the collection and processing of the above personal information only in relation to Data Privacy Act.
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="px-6 py-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-emerald-600 checked:bg-emerald-600 transition-all"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium group-hover:text-emerald-700 transition-colors">
                I agree to the terms and conditions.
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <button
              type="button"
              onClick={() => setShowConsent(false)}
              className="px-6 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (agreed) {
                  setShowConsent(false)
                  submit()
                }
              }}
              className={`px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-sm ${
                agreed 
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95' 
                  : 'bg-emerald-300 cursor-not-allowed'
              }`}
              disabled={!agreed || submitting}
            >
              {submitting ? 'Submitting...' : 'Agree and Continue'}
            </button>
          </div>
        </div>
      </Modal>
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
