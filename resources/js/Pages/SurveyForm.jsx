// resources/js/Pages/SurveyForm.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import axios from 'axios'

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

function Signature({ canvasRef, onClear }) {
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const onDown = (e) => {
    drawing.current = true
    const rect = e.target.getBoundingClientRect()
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top
    last.current = { x, y }
  }
  const onMove = (e) => {
    if (!drawing.current) return
    const rect = e.target.getBoundingClientRect()
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top
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
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="border"
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      />
      <button type="button" onClick={onClear} className="px-3 py-1 border rounded">Clear</button>
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
  const [housePhoto, setHousePhoto] = useState(null)
  const [personPhoto, setPersonPhoto] = useState(null)
  const [purokOptions, setPurokOptions] = useState([])
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const rSigRef = useRef(null)
  const sortedBarangays = useMemo(() => [...barangays].sort((a,b)=>a.replace(/_/g,' ').localeCompare(b.replace(/_/g,' '))), [])
  
  const inputClass = 'w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300'
  const selectClass = inputClass
  function StepHeader({ number, title }) { return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white grid place-items-center font-semibold">{number}</div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
    </div>
  ) }

  const [members, setMembers] = useState([{ name:'', age:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'', code:'' }])
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

  const incomeChoices = ['0 - 2,999 PHP','3,000 - 5,999 PHP','6,000 - 8,999 PHP','9,000 - 12,999 PHP','13,000 and above']
  const relationshipChoices = ['Spouse','Son','Daughter','Father','Mother','Brother','Sister','Grandfather','Grandmother','Cousin','Relative']
  const educationChoices = ['none','Elementary_Level_(Incomplete)','Elementary_Graduate','High_School_Level (Incomplete)','High_School_Graduate','Vocational/Technical_Education','College_Level_(Incomplete)','College_Graduate','Postgraduate_Level','ALS']

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
          setData(d => ({
            ...d,
            previous_client: sv.previous_client || d.previous_client,
            year_inhabited: sv.year_inhabited || d.year_inhabited,
            classification: sv.classification || d.classification,
            sub_class_displaced: sv.subclass_displaced || d.sub_class_displaced,
            sub_class_double_up: sv.subclass_doubleup || d.sub_class_double_up,
            sub_class_homeless: sv.subclass_homeless || d.sub_class_homeless,
            interview_person: sv.interview_person || d.interview_person,
            last_name: sv.last_name || d.last_name,
            first_name: sv.first_name || d.first_name,
            middle_name: sv.middle_name || d.middle_name,
            suffix: sv.suffix || d.suffix,
            barangay: sv.barangay || d.barangay,
            purok: sv.purok || d.purok,
            street: sv.street || d.street,
            gender: sv.gender || d.gender,
            religion: sv.religion || d.religion,
            birth_place: sv.birth_place || d.birth_place,
            birth_date: sv.birth_date || d.birth_date,
            person_age: sv.person_age || d.person_age,
            marital_status: sv.marital_status || d.marital_status,
            contact_number: sv.contact_number || d.contact_number,
            language_spoken: sv.language_spoken || d.language_spoken,
            tribe: sv.tribe || d.tribe,
            highest_education: sv.highest_education || d.highest_education,
            last_school_attended: sv.last_school_name || d.last_school_attended,
            year_graduated: sv.year_graduated || d.year_graduated,
            spouse_name: sv.spouse_name || d.spouse_name,
            spouse_religion: sv.spouse_religion || d.spouse_religion,
            spouse_tribe: sv.spouse_tribe || d.spouse_tribe,
            spouse_age: sv.spouse_age || d.spouse_age,
            spouse_gender: sv.spouse_gender || d.spouse_gender,
            lot_ownership: sv.lot_ownership || d.lot_ownership,
            house_ownership: sv.house_ownership || d.house_ownership,
            avail_socialized_housing: sv.avail_socialized_housing || d.avail_socialized_housing,
            temporary_living_area: sv.temporary_living_area || d.temporary_living_area,
            housing_structure: sv.housing_structure || d.housing_structure,
            type_of_toilet: sv.type_of_toilet || d.type_of_toilet,
            source_of_water: sv.source_of_water || d.source_of_water,
            source_of_electricity: sv.source_of_electricity || d.source_of_electricity,
            main_income_source: sv.main_income_source || d.main_income_source,
            work_status: sv.work_status || d.work_status,
            work_location_head: sv.work_location_head || d.work_location_head,
            monthly_salary: sv.monthly_salary || d.monthly_salary,
            combine_monthly_income: sv.combine_monthly_income || d.combine_monthly_income,
            skills_for_living: sv.skills_for_living || d.skills_for_living,
            specific_skill: sv.specific_skill || d.specific_skill,
            organization_member: sv.organization_member || d.organization_member,
            specific_organization: sv.specific_organization || d.specific_organization,
            wanttolearn: sv.wanttolearn || d.wanttolearn,
            remarks: sv.remarks || d.remarks,
            date_interviewed: sv.date_interviewed || d.date_interviewed,
          }))
          setMembers(mem.map(m => ({
            name: m.name || '',
            age: m.age || '',
            relationship: m.relationship || '',
            civil_status: m.civilStatus || m.civil_status || '',
            educational_attainment: m.educationalAttainment || m.educational_attainment || '',
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

  const addMember = () => setMembers(m => [...m, { name:'', age:'', relationship:'', civil_status:'', educational_attainment:'', occupation:'', monthly_income:'', code:'' }])

  const updateMember = (idx, key, val) => setMembers(m => {
    const copy = [...m]; copy[idx] = {...copy[idx], [key]: val}; return copy
  })

  const submit = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (!data.monthly_salary) { setError('Monthly salary is required'); setSubmitting(false); return }
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
        fd.append('relationship[]', m.relationship ?? '')
        fd.append('civil_status[]', m.civil_status ?? '')
        fd.append('educational_attainment[]', m.educational_attainment ?? '')
        fd.append('occupation[]', m.occupation ?? '')
        fd.append('monthly_income[]', m.monthly_income ?? '')
        fd.append('code[]', m.code ?? '')
      })
      const sid = new URLSearchParams(window.location.search).get('survey_id')
      if (sid) {
        fd.append('_method', 'PUT')
        await axios.post(`/validator/api/survey/${sid}`, fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      } else {
        await axios.post('/validator/api/survey', fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      }
      window.location.href = '/validator/dashboard'
    } catch (e) {
      setError(e.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

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
      <main className="flex-1 p-6 bg-gray-100">
        <div className="max-w-none w-full">
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

        {error && <div className="mb-4 p-2 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {step === 0 && (
            <div className="rounded-2xl bg-gray-50 p-6">
              <StepHeader number={1} title="Basic Details" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Previous Client</div>
                  <select className={selectClass} value={data.previous_client} onChange={e=>setData({...data, previous_client:e.target.value})}>
                    <option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option>
                  </select>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Year Inhabited</div>
                  <input className={inputClass} value={data.year_inhabited} onChange={e=>setData({...data, year_inhabited:e.target.value})}/>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Classification</div>
                  <select className={selectClass} value={data.classification} onChange={e=>setData({...data, classification:e.target.value, sub_class_displaced:'', sub_class_double_up:'', sub_class_homeless:''})}>
                    <option value="">- select here -</option>
                    <option value="Displaced">Displaced</option><option value="Double-up">Double-up</option><option value="Homeless">Homeless</option><option value="Upgrading_of_Land_Tenure">Upgrading_of_Land_Tenure</option>
                  </select>
                  </div>
                </div>
                {subclassVisible.displaced && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Displaced</div>
                  <select className={selectClass} value={data.sub_class_displaced} onChange={e=>setData({...data, sub_class_displaced:e.target.value})}>
                      <option value="">- select here -</option>
                      <option value="Coastal Areas">Coastal Areas</option><option value="Drought">Drought</option><option value="Earthquake Affected">Earthquake Affected</option><option value="Flood Affected">Flood Affected</option><option value="Sea Level Rise">Sea Level Rise</option><option value="Threat of Eviction">Threat of Eviction</option><option value="Eviction/Demolition Order">Eviction/Demolition Order</option><option value="Human Induced Disaster">Human Induced Disaster</option><option value="Infra Projects">Infra Projects</option><option value="Landslide Affected">Landslide Affected</option><option value="Near Waterways">Near Waterways</option>
                    </select>
                  </div>
                )}
                {subclassVisible.doubleup && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Double-up</div>
                  <select className={selectClass} value={data.sub_class_double_up} onChange={e=>setData({...data, sub_class_double_up:e.target.value})}>
                      <option value="">- select here -</option>
                      <option value="Renter/Tenant">Renter/Tenant</option><option value="Rent-free/Sharer">Rent-free/Sharer</option><option value="Caretaker">Caretaker</option>
                    </select>
                  </div>
                )}
                {subclassVisible.homeless && (
                  <div>
                    <div className="text-sm text-gray-500">Sub-class of Homeless</div>
                  <select className={selectClass} value={data.sub_class_homeless} onChange={e=>setData({...data, sub_class_homeless:e.target.value})}>
                      <option value="">- select here -</option>
                      <option value="Public - living in tent">Public - living in tent</option><option value="Private - living in tent">Private - living in tent</option>
                    </select>
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
                  <select className={selectClass} value={data.interview_person} onChange={e=>setData({...data, interview_person:e.target.value})}>
                    <option value="">- select here -</option><option value="Household_Head">Household Head</option><option value="Spouse_Head">Spouse Head</option><option value="Never-Married">Never-Married</option>
                  </select>
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
                  <select className={selectClass} value={data.gender} onChange={e=>setData({...data, gender:e.target.value})}><option value="">- select here -</option><option value="Male">Male</option><option value="Female">Female</option></select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Barangay</div>
                  <select className={selectClass} value={data.barangay} onChange={e=>setData({...data, barangay:e.target.value})}><option value="">- select here -</option>{sortedBarangays.map(b=>
                    <option key={b} value={b}>{b.replace(/_/g,' ')}</option>
                  )}</select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Purok</div>
                  <select className={selectClass} value={data.purok} onChange={e=>setData({...data, purok:e.target.value})}><option value="">- select purok -</option>{purokOptions.map(p=><option key={p} value={p}>{p}</option>)}</select>
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
                  <select className={selectClass} value={data.religion} onChange={e=>setData({...data, religion:e.target.value})}>
                    <option value="">- select here -</option><option value="Roman_Catholic">Roman Catholic</option><option value="Islam">Islam</option><option value="Iglesia_ni_Cristo">Iglesia ni Cristo</option><option value="Seventh-day_Adventist">Seventh-day Adventist</option><option value="Bible_Baptist_Church">Bible Baptist Church</option><option value="United_Church_of_Christ_in_the_Philippines">United Church of Christ in the Philippines</option><option value="Jehovah's_Witnesses">Jehovah's Witnesses</option><option value="Church_of_Christ">Church of Christ</option>
                  </select>
                </div>
                <div><div className="text-sm text-gray-500">Birth Place</div><input className={inputClass} value={data.birth_place} onChange={e=>setData({...data, birth_place:e.target.value})}/></div>
                <div><div className="text-sm text-gray-500">Birth Date</div><input type="date" className={inputClass} value={data.birth_date} onChange={e=>setData({...data, birth_date:e.target.value})}/></div>
                <div><div className="text-sm text-gray-500">Age</div><input type="number" className={inputClass} value={data.person_age} onChange={e=>setData({...data, person_age:e.target.value})}/></div>
                <div>
                  <div className="text-sm text-gray-500">Marital Status</div>
                  <select className={selectClass} value={data.marital_status} onChange={e=>setData({...data, marital_status:e.target.value})}><option value="">- select here -</option><option value="Single">Single</option><option value="Married">Married</option><option value="Live-in">Live-in</option><option value="Widow/Widower">Widow/Widower</option><option value="Annulled">Annulled</option><option value="Separated">Separated</option><option value="Unknown">Unknown</option></select>
                </div>
                <div><div className="text-sm text-gray-500">Contact Number</div><input className={inputClass} value={data.contact_number} onChange={e=>setData({...data, contact_number:e.target.value})}/></div>
                <div>
                  <div className="text-sm text-gray-500">Language</div>
                  <select className={selectClass} value={data.language_spoken} onChange={e=>setData({...data, language_spoken:e.target.value})}>
                    <option value="">- select here -</option>
                    <option value="Cebuano">Cebuano</option>
                    <option value="Tagalog">Tagalog</option>
                    <option value="English">English</option>
                    <option value="Maguindanaon">Maguindanaon</option>
                    <option value="Meranaw">Meranaw</option>
                    <option value="Tausug">Tausug</option>
                    <option value="Hiligaynon">Hiligaynon</option>
                    <option value="Ilocano">Ilocano</option>
                    <option value="Chavacano">Chavacano</option>
                    <option value="Bagobo">Bagobo</option>
                    <option value="B'laan">B'laan</option>
                    <option value="Mandaya">Mandaya</option>
                    <option value="Mansaka">Mansaka</option>
                    <option value="Kaagan">Kaagan (Kalagan)</option>
                    <option value="Subanen">Subanen</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tribe</div>
                  <select className={selectClass} value={data.tribe} onChange={e=>setData({...data, tribe:e.target.value})}><option value="">- select here -</option><option value="Manobo">Manobo</option><option value="Bagobo">Bagobo</option><option value="B'laan">B'laan</option><option value="Kaolo">Kaolo</option><option value="Bisaya">Bisaya</option><option value="Muslim">Muslim</option></select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Highest Education</div>
                  <select className={selectClass} value={data.highest_education} onChange={e=>setData({...data, highest_education:e.target.value})}>
                    <option value="">- select here -</option><option value="none">No Formal Education</option><option value="Elementary_Level_(Incomplete)">Elementary Level (Incomplete)</option><option value="Elementary_Graduate">Elementary Graduate</option><option value="High_School_Level (Incomplete)">High School Level (Incomplete)</option><option value="High_School_Graduate">High School Graduate</option><option value="Vocational/Technical_Education">Vocational/Technical Education</option><option value="College_Level_(Incomplete)">College Level (Incomplete)</option><option value="College_Graduate">College Graduate</option><option value="Postgraduate_Level">Postgraduate Level</option><option value="ALS">ALS Graduate</option>
                  </select>
                </div>
                <div><div className="text-sm text-gray-500">School Last Attended</div><input className={inputClass} value={data.last_school_attended} onChange={e=>setData({...data, last_school_attended:e.target.value})}/></div>
                <div><div className="text-sm text-gray-500">Year Graduated</div><input className={inputClass} value={data.year_graduated} onChange={e=>setData({...data, year_graduated:e.target.value})}/></div>
              </div>

              {spouseEnabled && (
                <div className="mt-6">
                  <div className="text-lg font-semibold text-emerald-800">Spouse Information</div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
                    <input className={inputClass} placeholder="Spouse Name" value={data.spouse_name} onChange={e=>setData({...data, spouse_name:e.target.value})}/>
                    <select className={selectClass} value={data.spouse_religion} onChange={e=>setData({...data, spouse_religion:e.target.value})}><option value="">- select here -</option><option value="Roman_Catholic">Roman Catholic</option><option value="Islam">Islam</option><option value="Iglesia_ni_Cristo">Iglesia ni Cristo</option><option value="Seventh-day_Adventist">Seventh-day Adventist</option><option value="Bible_Baptist_Church">Bible Baptist Church</option><option value="United_Church_of_Christ_in_the_Philippines">United Church of Christ in the Philippines</option><option value="Jehovah's_Witnesses">Jehovah's Witnesses</option><option value="Church_of_Christ">Church of Christ</option></select>
                    <select className={selectClass} value={data.spouse_tribe} onChange={e=>setData({...data, spouse_tribe:e.target.value})}><option value="">- select here -</option><option value="Manobo">Manobo</option><option value="Bagobo">Bagobo</option><option value="B'laan">B'laan</option><option value="Kaolo">Kaolo</option><option value="Bisaya">Bisaya</option><option value="Muslim">Muslim</option></select>
                    <input type="number" className={inputClass} placeholder="Age" value={data.spouse_age} onChange={e=>setData({...data, spouse_age:e.target.value})}/>
                    <select className={selectClass} value={data.spouse_gender} onChange={e=>setData({...data, spouse_gender:e.target.value})}><option value="">- select here -</option><option value="Male">Male</option><option value="Female">Female</option></select>
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
                <select className={selectClass} value={data.endorsed_by_mayor} onChange={e=>setData({...data, endorsed_by_mayor:e.target.value})}>
                  <option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>

              <div className="mt-6">
                <div className="text-lg font-semibold text-emerald-800">Members of the Household</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-emerald-600 text-white">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Age</th>
                        <th className="p-2 text-left">Relationship</th>
                        <th className="p-2 text-left">Civil Status</th>
                        <th className="p-2 text-left">Education</th>
                        <th className="p-2 text-left">Occupation</th>
                        <th className="p-2 text-left">Monthly Income</th>
                        <th className="p-2 text-left">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <tr key={i} className="even:bg-gray-50">
                          <td className="p-2"><input className={inputClass} value={m.name} onChange={e=>updateMember(i,'name',e.target.value)}/></td>
                          <td className="p-2"><input type="number" className={inputClass} value={m.age} onChange={e=>updateMember(i,'age',e.target.value)}/></td>
                          <td className="p-2">
                            <select className={selectClass} value={m.relationship} onChange={e=>updateMember(i,'relationship',e.target.value)}>
                              <option value="">- select here -</option>
                              {relationshipChoices.map(opt => (<option key={`rel-${opt}`} value={opt}>{opt}</option>))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select className={selectClass} value={m.civil_status} onChange={e=>updateMember(i,'civil_status',e.target.value)}>
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
                          <td className="p-2">
                            <select className={selectClass} value={m.educational_attainment} onChange={e=>updateMember(i,'educational_attainment',e.target.value)}>
                              <option value="">- select here -</option>
                              {educationChoices.map(opt => (<option key={`edu-${opt}`} value={opt}>{opt.replace(/_/g,' ')}</option>))}
                            </select>
                          </td>
                          <td className="p-2"><input className={inputClass} value={m.occupation} onChange={e=>updateMember(i,'occupation',e.target.value)}/></td>
                          <td className="p-2">
                            <select className={selectClass} value={m.monthly_income} onChange={e=>updateMember(i,'monthly_income',e.target.value)}>
                              <option value="">- select here -</option>
                              {incomeChoices.map(opt => (<option key={`inc-${opt}`} value={opt}>{opt}</option>))}
                            </select>
                          </td>
                          <td className="p-2"><input className={inputClass} value={m.code} onChange={e=>updateMember(i,'code',e.target.value)}/></td>
                        </tr>
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
                  <select className={selectClass} value={data.lot_ownership} onChange={e=>setData({...data, lot_ownership:e.target.value})}><option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">House Ownership</div>
                  <select className={selectClass} value={data.house_ownership} onChange={e=>setData({...data, house_ownership:e.target.value})}><option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Avail Socialized Housing</div>
                  <select className={selectClass} value={data.avail_socialized_housing} onChange={e=>setData({...data, avail_socialized_housing:e.target.value})}><option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Temporary Dwelling</div>
                  <select className={selectClass} value={data.temporary_living_area} onChange={e=>setData({...data, temporary_living_area:e.target.value})}><option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Housing Structure</div>
                  <select className={selectClass} value={data.housing_structure} onChange={e=>setData({...data, housing_structure:e.target.value, other_housing_structure:''})}>
                    <option value="">- select here -</option>
                    <option value="Full_Concrete">Full Concrete</option><option value="Made_of_wood_and_metal_roof">Made of wood and metal roof</option><option value="Made_of_Amakan_and_Nipa">Made of Amakan and Nipa</option><option value="Combination_of_concrete_and_wood">Combination of concrete and wood</option><option value="Made_of_Amakan_and_metal_roof">Made of Amakan and metal roof</option><option value="Others">Others</option>
                  </select>
                  {data.housing_structure === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_housing_structure} onChange={e=>setData({...data, other_housing_structure:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type of Toilet</div>
                  <select className={selectClass} value={data.type_of_toilet} onChange={e=>setData({...data, type_of_toilet:e.target.value, other_type_of_toilet:''})}>
                    <option value="">- select here -</option>
                    <option value="Water-sealed">Water-sealed</option><option value="Pit">Pit</option><option value="None">None</option><option value="Others">Others</option>
                  </select>
                  {data.type_of_toilet === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_type_of_toilet} onChange={e=>setData({...data, other_type_of_toilet:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Source of Water</div>
                  <select className={selectClass} value={data.source_of_water} onChange={e=>setData({...data, source_of_water:e.target.value, other_source_of_water:''})}>
                    <option value="">- select here -</option>
                    <option value="With_own_meter">With own meter</option><option value="Shared_connection">Shared connection</option><option value="Well">Well</option><option value="Others">Others</option>
                  </select>
                  {data.source_of_water === 'Others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_source_of_water} onChange={e=>setData({...data, other_source_of_water:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Source of Electricity</div>
                  <select className={selectClass} value={data.source_of_electricity} onChange={e=>setData({...data, source_of_electricity:e.target.value, other_source_of_electricity:''})}>
                    <option value="">- select here -</option>
                    <option value="With_own_meter">With own meter</option><option value="Solar_Panel">Solar Panel</option><option value="Candle/Lamp">Candle/Lamp</option><option value="Tapping_to_the_neighbor">Tapping to the neighbor</option><option value="Others">Others</option>
                  </select>
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
                  <select className={selectClass} value={data.main_income_source} onChange={e=>setData({...data, main_income_source:e.target.value, other_main_income_source:''})}>
                    <option value="">- select here -</option><option value="Public_Employee">Employee (Public)</option><option value="Private_Employee">Employee (Private)</option><option value="Self_Employed">Self-Employed</option><option value="Casual">Casual</option><option value="others">Others</option>
                  </select>
                  {data.main_income_source === 'others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_main_income_source} onChange={e=>setData({...data, other_main_income_source:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Work Status</div>
                  <select className={selectClass} value={data.work_status} onChange={e=>setData({...data, work_status:e.target.value, other_work_status:''})}>
                    <option value="">- select here -</option><option value="Regular">Regular</option><option value="Contractual">Contractual</option><option value="others">Others</option>
                  </select>
                  {data.work_status === 'others' && <input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_work_status} onChange={e=>setData({...data, other_work_status:e.target.value})}/>}
                </div>
                <div>
                  <div className="text-sm text-gray-500">Work Location</div>
                  <select className={selectClass} value={data.work_location_head} onChange={e=>setData({...data, work_location_head:e.target.value})}><option value="">- select here -</option><option value="None">None</option><option value="N/A">N/A</option><option value="Within the Barangay">Within the Barangay</option><option value="Within the City/Municipality">Within the City/Municipality</option><option value="Within the Province">Within the Province</option><option value="Within the Country">Within the Country</option></select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Monthly Salary</div>
                  <select className={selectClass} value={data.monthly_salary} onChange={e=>setData({...data, monthly_salary:e.target.value})}>
                    <option value="">- select here -</option>
                    {incomeChoices.map(opt => (<option key={`ms-${opt}`} value={opt}>{opt}</option>))}
                  </select>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Combined Household Income</div>
                  <select className={selectClass} value={data.combine_monthly_income} onChange={e=>setData({...data, combine_monthly_income:e.target.value})}>
                    <option value="">- select here -</option>
                    {incomeChoices.map(opt => (<option key={`ci-${opt}`} value={opt}>{opt}</option>))}
                  </select>
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
                  <select className={selectClass} value={data.skills_for_living} onChange={e=>setData({...data, skills_for_living:e.target.value, specific_skill:'', other_skill:''})}><option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
                {data.skills_for_living === 'Yes' && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Specific Skill</div>
                      <select className={selectClass} value={data.specific_skill} onChange={e=>setData({...data, specific_skill:e.target.value, other_skill:''})}><option value="">- select skill -</option><option value="Handicrafts">Handicrafts</option><option value="Wood_Works_and_Furnitures">Wood Works & Furnitures</option><option value="Food_Processing">Food Processing</option><option value="others">Others</option></select>
                    </div>
                    {data.specific_skill === 'others' && (
                      <div><input className={'mt-2 '+inputClass} placeholder="Please specify" value={data.other_skill} onChange={e=>setData({...data, other_skill:e.target.value})}/></div>
                    )}
                  </>
                )}
                <div>
                  <div className="text-sm text-gray-500">Organization Member</div>
                  <select className={selectClass} value={data.organization_member} onChange={e=>setData({...data, organization_member:e.target.value, specific_organization:'', other_organization:''})}><option value="">- select here -</option><option value="Yes">Yes</option><option value="No">No</option></select>
                </div>
                {data.organization_member === 'Yes' && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Organization</div>
                      <select className={selectClass} value={data.specific_organization} onChange={e=>setData({...data, specific_organization:e.target.value, other_organization:''})}><option value="">- select -</option><option value="HOA">HOA</option><option value="Youth_Organization">Youth Organization</option><option value="Dayong">Dayong</option><option value="Womens_Organization">Women's Organization</option><option value="others">Others</option></select>
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
                <input type="file" accept="image/*" onChange={e=>setHousePhoto(e.target.files?.[0] || null)} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Respondent Photo</div>
                <input type="file" accept="image/*" onChange={e=>setPersonPhoto(e.target.files?.[0] || null)} />
              </div>
              <div>
                <button type="button" className="px-3 py-1 border rounded-xl" onClick={getLocation}>Get Current Location</button>
                <div className="mt-2 text-sm text-gray-600">Lat: {lat || '-'} | Lon: {lon || '-'}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Interviewed by</div>
                  <input className={inputClass} value={data.interviewed_by} onChange={e=>setData({...data, interviewed_by:e.target.value})} readOnly />
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
            <button type="button" className="px-4 py-2 border rounded-xl" onClick={()=>setStep(s=>Math.max(0, s-1))} disabled={step===0}>Previous</button>
            {step < 5 ? (
              <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-xl" onClick={()=>setStep(s=>Math.min(5, s+1))}>Next</button>
            ) : (
              <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-xl" onClick={submit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}
