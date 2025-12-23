// resources/js/Pages/SurveyDetails.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, usePage } from '@inertiajs/react'

export default function SurveyDetails() {
  const { props } = usePage()
  const surveyId = props.survey_id
  const apiBase = props.api_base || '/validator/api'
  const isAdmin = apiBase.startsWith('/admin')
  const [survey, setSurvey] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showHouseInfo, setShowHouseInfo] = useState(false)
  const fileUrl = (path) => {
    const s = String(path || '')
    if (!s) return ''
    if (s.startsWith('http')) return s
    if (s.startsWith('storage/')) return `/${s}`
    if (s.startsWith('signatures/')) return `/storage/${s}`
    return s.startsWith('/') ? s : `/${s}`
  }

  const Check = ({ checked, size = 12 }) => (
    <span className="inline-flex items-center justify-center border border-black shrink-0" style={{ width: size, height: size }}>
      {checked ? (
        <svg viewBox="0 0 12 12" width={size - 2} height={size - 2} fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l2 2 6-6" />
        </svg>
      ) : null}
    </span>
  )

  const eq = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase()
  const isYes = (v) => eq(v, 'yes')
  const isNo = (v) => eq(v, 'no')
  const HS_OPTS = [
    { key: 'Full_Concrete', label: 'Full Concrete' },
    { key: 'Combination_of_concrete_and_wood', label: 'Combination of concrete and wood' },
    { key: 'Made_of_wood_and_metal_roof', label: 'Made of wood and metal roof' },
    { key: 'Made_of_Amakan_and_Nipa', label: 'Made of Amakan and Nipa' },
    { key: 'Made_of_Amakan_and_metal_roof', label: 'Made of Amakan and metal roof' },
    { key: 'Makeshift/Salvaged/Improvised_Material', label: 'Makeshift/Salvaged/Improvised Material' },
  ]
  const TOILET_OPTS = [
    { key: 'Water-sealed', label: 'Water Sealed', aliases: ['Water_Sealed', 'Water Sealed'] },
    { key: 'Pit', label: 'Open Pit/Antipolo', aliases: ['Open_Pit/Antipolo', 'Open Pit', 'Open pit/antipolo'] },
    { key: 'None', label: 'No Toilet', aliases: ['No_Toilet', 'No Toilet'] },
  ]
  const WATER_OPTS = [
    { key: 'Community_Water_System_(NAWASA)', label: 'Community Water System (NAWASA)', aliases: ['With_own_meter','Shared_connection'] },
    { key: 'Deep_Well', label: 'Deep Well', aliases: ['Well'] },
    { key: 'Spring', label: 'Spring', aliases: [] },
    { key: 'Rainwater', label: 'Rainwater', aliases: [] },
    { key: 'Surface_Water_(river,lake,dam)', label: 'Surface water (river,lake,dam)', aliases: [] },
  ]
  const ELEC_OPTS = [
    { key: 'With_own_meter', label: 'With own meter' },
    { key: 'Tapping_to_the_neighbor', label: 'Tapping to the neighbor' },
    { key: 'Solar_Panel', label: 'Solar Panel' },
    { key: 'Candle/Lamp', label: 'Candle/Lamp' },
  ]

  const INCOME_OPTS = [
    { key: 'Public_Employee', label: 'Employee (Public Office/Company)' },
    { key: 'Private_Employee', label: 'Employee (Private Office/Company)' },
    { key: 'Self_Employed', label: 'Self-employed/with owned business' },
    { key: 'Casual', label: 'Casual (On-call for work)' },
  ]
  const WORK_STATUS_OPTS = [
    { key: 'Regular', label: 'Regular' },
    { key: 'Contractual', label: 'Contractual' },
  ]
  const WORK_LOC_OPTS = [
    { key: 'Within the Barangay', label: 'Within the Barangay' },
    { key: 'Within the City/Municipality', label: 'Within the City/Municipality' },
    { key: 'Within the Province', label: 'Within the Province' },
    { key: 'Within the Country', label: 'Within the Country' },
  ]

  const buttonGhostClass = 'inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
  const buttonPrimaryClass = 'inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700'
  const buttonDangerClass = 'inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700'
  const SKILL_OPTS = [
    { key: 'Handicrafts', label: 'Handicrafts', aliases: ['Handicraft'] },
    { key: 'Wood Works & furnitures', label: 'Wood Works & furnitures', aliases: ['Wood Works and furnitures','Wood works & furnitures','Wood works and furnitures'] },
    { key: 'Food Processing', label: 'Food Processing', aliases: [] },
  ]
  const ORG_OPTS = [
    { key: 'HOA', label: 'HOA' },
    { key: 'Dayong', label: 'Dayong' },
    { key: "Women's Organization", label: "Women's Organization" },
    { key: 'Youth Organization', label: 'Youth Organization' },
  ]

  async function handleApprove() {
    try {
      await axios.post('/admin/api/approve', { survey_id: surveyId })
      window.location.href = '/admin/assignments'
    } catch (e) {
      setError(e?.response?.data?.message || 'Approval failed')
    }
  }

  useEffect(() => {
    let mounted = true
    axios.get(`${apiBase}/survey/${surveyId}`)
      .then(res => {
        if (!mounted) return
        setSurvey(res.data.survey)
        setMembers(res.data.members || [])
      })
      .catch(() => setError('Unable to load survey details.'))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [surveyId])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  if (!survey) return <div className="min-h-screen flex items-center justify-center text-gray-600">Not found</div>

  const normalizeNamePart = v => {
    if (!v) return ''
    const t = String(v).trim()
    if (t.toUpperCase() === 'N/A') return ''
    return t
  }

  const respondentNameParts = []
  const firstName = normalizeNamePart(survey.first_name)
  const middleName = normalizeNamePart(survey.middle_name)
  const lastName = normalizeNamePart(survey.last_name)
  const suffix = normalizeNamePart(survey.suffix)
  if (firstName) respondentNameParts.push(firstName)
  if (middleName) respondentNameParts.push(middleName)
  if (lastName) respondentNameParts.push(lastName)
  if (suffix) respondentNameParts.push(suffix)
  const respondentName = respondentNameParts.join(' ')
  const validatorName = survey.validator_name || ''

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6 print:max-w-none print:p-0 print:m-0">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h1 className="text-2xl font-semibold text-emerald-800">Survey Form Details</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href={isAdmin ? '/admin/beneficiaries' : '/validator/dashboard'}
                className={buttonGhostClass}
              >
                Back
              </Link>
              <button
                onClick={() => window.print()}
                className={buttonPrimaryClass}
              >
                Print
              </button>
              <a
                href={`${apiBase}/survey/${surveyId}/export`}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm font-medium text-emerald-700 ring-2 ring-emerald-300 hover:ring-emerald-400 hover:bg-emerald-50"
                title="Download Excel"
              >
                <img src="/icons/downloadicon.png" alt="Download" className="w-5 h-5" />
              </a>
              {isAdmin && survey?.is_submitted !== 2 && (
                <button
                  onClick={handleApprove}
                  className={buttonPrimaryClass}
                >
                  Approve
                </button>
              )}
              {!isAdmin && (survey?.is_submitted === 0) && (
                <>
                  <Link
                    href={`/validator/survey-form?survey_id=${surveyId}`}
                    className={buttonGhostClass}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this survey? You can restore it later.')) return
                      try {
                        await axios.delete(`/validator/api/survey/${surveyId}`)
                        window.location.href = '/validator/dashboard'
                      } catch (e) {
                        alert(e?.response?.data?.message || 'Delete failed')
                      }
                    }}
                    className={buttonDangerClass}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        <style>{`
          @page { size: 8.5in 13in; margin: 0in; }
          @media print {
            html, body { margin: 0; padding: 0; }
            #print-root { padding: 0 !important; margin: 0 !important; width: 100% !important; }
            #print-root table { width: 100% !important; page-break-inside: auto; }
            #print-root table td, #print-root table th { padding: 2px 4px !important; font-size: 10px; }
            #print-root .leading-relaxed { line-height: 1.1 !important; }
            #print-root .text-xs { font-size: 10px !important; }
            #print-root .text-sm { font-size: 11px !important; }
            #print-root .mt-6 { margin-top: 6px !important; }
            #print-root .mt-5 { margin-top: 6px !important; }
            #print-root .p-6 { padding: 10px !important; }
            #print-root .chrrsdp-title { margin-top: 0 !important; }
            #print-root .conf-block { padding: 2px !important; }
            #print-root .conf-title { font-size: 10px !important; font-weight: 700 !important; margin: 2px 0 1px 0 !important; line-height: 1.15 !important; }
            #print-root .conf-text { font-size: 10px !important; margin: 1px 0 !important; line-height: 1.2 !important; }
            #print-root .letter-block { padding: 2px !important; }
            #print-root .letter-title { font-size: 10px !important; font-weight: 700 !important; margin: 2px 0 1px 0 !important; line-height: 1.15 !important; }
            #print-root .letter-text { font-size: 10px !important; margin: 1px 0 !important; line-height: 1.2 !important; }
            #print-root .members-header-wrapper { margin-top: 6px !important; }
            #print-root .members-header { margin-top: 0 !important; }
            #print-root .survey-box { margin-top: 6px !important; }
            #print-root .subclass-cell { padding: 0 !important; }
            #print-root .subclass-table .leading-none { line-height: 1 !important; }
            #print-root .subclass-def { font-size: 10px !important; line-height: 1.2 !important; }
            #print-root .subclass-cell { min-height: 140px !important; display: flex !important; flex-direction: column !important; }
            #print-root .subclass-def { margin-top: auto !important; padding-top: 2px !important; }
          }
        `}</style>

        <div id="print-root" className="bg-white p-0 print:shadow-none" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div className="border-2 border-black survey-box">
            <div className="grid grid-cols-3">
              <div className="col-span-1 p-0 border-r-2 border-black">
                <div className="text-sm font-semibold chrrsdp-title">CHRRSDP FORM 2</div>
                <div className="text-sm font-medium">{survey.date_interviewed || ''}</div>
                <div className="text-xs">Form No.</div>
                <div>{survey.form_no || ''}</div>
              </div>
              <div className="col-span-2 p-0">
                <div className="text-center font-semibold text-sm" style={{ lineHeight: '1' }}>CITY GOVERNMENT OF DIGOS</div>
                <div className="text-center text-sm" style={{ lineHeight: '1' }}>CITY HOUSING RELOCATION RESETTLEMENT</div>
                <div className="text-center text-sm" style={{ lineHeight: '1' }}>AND SITE DEVELOPMENT PROGRAM</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 border-t-2 border-black">
              <div className="conf-block p-[2px]">
                <div className="conf-title text-xs font-bold leading-tight">CONFIDENTIALITY</div>
                <div className="conf-text text-[10px] leading-tight">The CHRRSDP adheres and commits to the confidentiality of information as Section 8 of RA 10173 (Confidentiality). All data obtained herein shall be held strictly confidential, and will not be used for taxation, investigation or law enforcement purposes.</div>
              </div>
              <div className="p-0 border-l-2 border-black flex flex-col items-center justify-center">
                <div className="text-emerald-700 font-extrabold text-3xl leading-none">ISF</div>
                <div className="text-[11px] text-gray-800 leading-none">Informal Settler Families<br/>Census Survey</div>
                <div className="font-semibold text-sm text-gray-900 leading-none">Household Profile Questionnaire</div>
              </div>
            </div>
            <div className="letter-block p-[2px] border-t-2 border-black">
              <div className="letter-title text-xs font-semibold leading-tight">Dear Sir/Madam:</div>
              <div className="letter-text text-[10px] leading-tight">The <span className="font-semibold">City Housing Relocation Resettlement and Site Development Program</span> is collecting information to the <span className="font-semibold">Informal Settler Families</span> identified in the different barangays of Digos City. The <span className="font-semibold">Informal Settler Families Census Survey</span> aims to gather data about the demographic, socioeconomic and housing characteristics of every identified household. The collected data will be used by the City Government planners, policy makers, and administrators in formulating their social and economic development plans, policies, and programs.</div>
              <div className="letter-text text-[10px] leading-tight">The <span className="font-semibold">City Housing Relocation Resettlement and Site Development Program</span> highly encourages your participation and cooperation by providing truthful and complete answers. All information provided are strictly confidential pursuant to Section 8 (Confidentiality) of Republic Act 10173 or the Data Privacy Act of 2012 and will not be used against you or to any of your household member for taxation, investigation, or law enforcement purposes.</div>
              <div className="letter-text text-[10px] leading-tight">We at <span className="font-semibold">City Housing Relocation Resettlement and Site Development Program</span> would like to thank you for your trust in providing us with your personal information. Your information shall only be subject to reproduction, correction and/or deletion upon your personal request. For Data Privacy concern, you may send us an email at cityhousingrelocation@gmail.com.</div>
            </div>
          </div>

          <div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2">Is this a previous client?</td>
                  <td className="border border-black px-3 py-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`inline-flex items-center gap-2`}>
                        <Check checked={String(survey.previous_client).toLowerCase() === 'yes'} />
                        Yes
                      </span>
                      <span className={`inline-flex items-center gap-2`}>
                        <Check checked={String(survey.previous_client).toLowerCase() === 'no'} />
                        No
                      </span>
                    </div>
                  </td>
                  <td className="border border-black px-3 py-2">Year inhabited the place</td>
                  <td className="border border-black px-3 py-2">{survey.year_inhabited || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-blue-200 text-gray-900 font-semibold px-3 py-2 border border-black">I. CLASSIFICATION OF INFORMAL SETTLER FAMILIES</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2" style={{width:'25%'}}>
                    <span className="inline-flex items-center gap-2">
                      <Check checked={String(survey.classification).toLowerCase() === 'displaced'} size={16} />
                      <span>Displaced</span>
                    </span>
                  </td>
                  <td className="border border-black px-3 py-2" style={{width:'25%'}}>
                    <span className="inline-flex items-center gap-2">
                      <Check checked={String(survey.classification).toLowerCase() === 'double-up' || String(survey.classification).toLowerCase() === 'double up' || String(survey.classification).toLowerCase() === 'doubled-up'} size={16} />
                      <span>Doubled-up</span>
                    </span>
                  </td>
                  <td className="border border-black px-3 py-2" style={{width:'25%'}}>
                    <span className="inline-flex items-center gap-2">
                      <Check checked={String(survey.classification).toLowerCase() === 'homeless'} size={16} />
                      <span>Homeless</span>
                    </span>
                  </td>
                  <td className="border border-black px-3 py-2" style={{width:'25%'}}>
                    <span className="inline-flex items-center gap-2">
                      <Check checked={String(survey.classification).toLowerCase() === 'upgrading of land tenure'} size={16} />
                      <span>Upgrading of Land Tenure</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">A. SUB-CLASSIFICATION</div>
            <table className="w-full border border-black text-xs border-collapse subclass-table">
              <tbody>
                <tr>
                  <td className="border-l border-r border-t border-b-2 border-black align-top p-0" style={{width:'25%'}}>
                    <div className="subclass-cell p-[2px] leading-none">
                      <div className="mt-0 space-y-[2px] leading-none">
                        {[
                          'Coastal Areas','Sea Level Rise','Drought','Earthquake Affected','Landslide Affected','Flood Affected','Threat of Eviction','Eviction/Demolition Order','Human Induced Disaster (e.g. War, Fire)','Infra-Projects (e.g. Road Widening)','Near Waterways (e.g. Riverbanks, Esteros)'
                        ].map(opt => (
                          <div key={opt} className="flex items-center gap-[2px] leading-none text-[10px]">
                            <Check checked={String(survey.subclass_displaced||'').toLowerCase() === opt.toLowerCase()} />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="border-l border-r border-t border-b-2 border-black align-top p-0" style={{width:'25%'}}>
                    <div className="subclass-cell p-[2px] leading-none flex flex-col min-h-[140px]">
                      <div className="mt-0 space-y-[2px] leading-none">
                        {['Renter/Tenant','Rent-free/Sharer','Caretaker'].map(opt => (
                          <div key={opt} className="flex items-center gap-[2px] leading-none text-[10px]">
                            <Check checked={String(survey.subclass_doubleup||'').toLowerCase() === opt.toLowerCase()} />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                      <div className="subclass-def border-t border-black text-[10px] leading-tight mt-auto pt-[4px]">
                        Doubled‑up – Refers to households in excess of the number of dwelling units at the time of census, assuming a ratio of one household per dwelling unit. A household with a separate arrangement for food preparation and consumption but shares dwelling of another household.
                      </div>
                    </div>
                  </td>
                  <td className="border-l border-r border-t border-b-2 border-black align-top p-0" style={{width:'25%'}}>
                    <div className="subclass-cell p-[2px] leading-none flex flex-col min-h-[140px]">
                      <div className="mt-0 space-y-[2px] leading-none">
                        {['Public - living in tent','Private - living in tent'].map(opt => (
                          <div key={opt} className="flex items-center gap-[2px] leading-none text-[10px]">
                            <Check checked={String(survey.subclass_homeless||'').toLowerCase() === opt.toLowerCase()} />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                      <div className="subclass-def border-t border-black text-[10px] leading-tight mt-auto pt-[4px]">
                        Homeless – Individuals residing in public places (such as sidewalks, roads, parks, or playgrounds) or those who are not members of any household.
                      </div>
                    </div>
                  </td>
                  <td className="border-l border-r border-t border-b-2 border-black align-top p-0" style={{width:'25%'}}>
                    <div className="subclass-cell p-[2px] leading-none flex flex-col min-h-[140px]">
                      <div className="mt-auto">
                        <div className="subclass-def text-[10px] leading-tight">
                          Displaced – Household located in danger areas, such as extended esteros (canals), railroad tracks, garbage dumps, riverbanks, and flood‑prone areas; or in areas where government infrastructure projects are to be implemented; or areas where the household is under a court order of eviction and demolition.
                        </div>
                        <div className="subclass-def border-t border-black text-[10px] leading-tight pt-[4px]">
                          Upgrading of Land Tenure – Households residing in areas with inadequate security of tenure and/or those with already ongoing negotiation with the land owners for the acquisition of land they are presently occupying.
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-12 border border-black">
              <div className="col-span-9 bg-blue-200 text-gray-900 font-semibold px-3 py-2">
                II. DEMOGRAPHIC INFORMATION <span className="font-normal">(Put N/A if not applicable)</span>
              </div>
              <div className="col-span-3 bg-amber-200 px-3 py-2 text-xs flex items-center justify-end">
                <span className="mr-1">Tag Number :</span>
                <span className="font-bold tracking-wider">{survey.tag_number || ''}</span>
              </div>
            </div>
            <div className="border border-black px-3 py-2 text-xs">
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                  <Check checked={String(survey.interview_person||'').toLowerCase()==='household_head'} size={16} />
                  <span>Household Head</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check checked={String(survey.interview_person||'').toLowerCase()==='spouse_head'} size={16} />
                  <span>Spouse of the Head</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check checked={String(survey.interview_person||'').toLowerCase()==='never-married'} size={16} />
                  <span>Never-Married children of Head/Spouse</span>
                </div>
              </div>
            </div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Last Name</td>
                  <td className="border border-gray-300 px-3 py-2">First Name</td>
                  <td className="border border-gray-300 px-3 py-2">Middle Name</td>
                  <td className="border border-gray-300 px-3 py-2">Suffix</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.last_name || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.first_name || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.middle_name || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.suffix || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">House Number/Lot/Block/Street</td>
                  <td className="border border-gray-300 px-3 py-2">Sitio/Purok</td>
                  <td className="border border-gray-300 px-3 py-2">Barangay</td>
                  <td className="border border-gray-300 px-3 py-2">Sex</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.street || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.purok || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.barangay || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="inline-flex items-center gap-2">
                        <Check checked={String(survey.gender||'').toLowerCase()==='male'} />
                        Male
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Check checked={String(survey.gender||'').toLowerCase()==='female'} />
                        Female
                      </span>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Religion</td>
                  <td className="border border-gray-300 px-3 py-2">Place of Birth</td>
                  <td className="border border-gray-300 px-3 py-2">Date of Birth</td>
                  <td className="border border-gray-300 px-3 py-2">Age</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.religion || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.birth_place || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.birth_date || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.person_age || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>Marital Status</td>
                  <td className="border border-gray-300 px-3 py-2">Contact Number</td>
                  <td className="border border-gray-300 px-3 py-2">Language Spoken</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-[2px] text-[10px] leading-none">
                      {['Single','Married','Live-in','Divorced','Separated','Widow/er','Annulled','Unknown'].map(opt=> (
                        <span key={opt} className="inline-flex items-center gap-[2px]">
                          <Check checked={String(survey.marital_status||'').toLowerCase()===opt.toLowerCase()} />
                          <span>{opt}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{survey.contact_number || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.language_spoken || '-').replace(/_/g,' ')}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Ethnicity/Tribe</td>
                  <td className="border border-gray-300 px-3 py-2">Highest Educational Attainment</td>
                  <td className="border border-gray-300 px-3 py-2">Name of School Last Attended</td>
                  <td className="border border-gray-300 px-3 py-2">Year Graduated</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.tribe || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.highest_education || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.last_school_attended || survey.last_school_name || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.year_graduated || '-').replace(/_/g,' ')}</td>
                </tr>
                
              </tbody>
            </table>

            <div className="bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">SPOUSE INFORMATION (Put N/A if not applicable)</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Spouse Name</td>
                  <td className="border border-gray-300 px-3 py-2">Religion</td>
                  <td className="border border-gray-300 px-3 py-2">Tribe</td>
                  <td className="border border-gray-300 px-3 py-2">Age</td>
                  <td className="border border-gray-300 px-3 py-2">Sex</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.spouse_name || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.spouse_religion || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">{String(survey.spouse_tribe || '-').replace(/_/g,' ')}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.spouse_age || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="inline-flex items-center gap-2">
                        <Check checked={String(survey.spouse_gender||'').toLowerCase()==='male'} />
                        Male
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Check checked={String(survey.spouse_gender||'').toLowerCase()==='female'} />
                        Female
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-2 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">AFFILIATION</div>
            <div className="border border-black p-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  {['SSS','GSIS','PhilHealth','PagIbig'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <Check checked={String(survey.affiliation||'').toLowerCase()===opt.toLowerCase() || String(survey.affiliations||'').toLowerCase().includes(opt.toLowerCase())} />
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {['PWD','Senior Citizen','Solo Parent','4Ps'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <Check checked={String(survey.affiliation||'').toLowerCase()===opt.toLowerCase().replace(' ','_') || String(survey.affiliations||'').toLowerCase().includes(opt.toLowerCase())} />
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ pageBreakBefore: 'always' }} className="members-header-wrapper">
              <div className="bg-blue-200 text-gray-900 font-semibold px-3 py-2 border border-black members-header">MEMBERS OF THE HOUSEHOLD</div>
              <table className="w-full border border-black text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 font-semibold">
                    <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Age</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Sex</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Relationship</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Civil Status</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Education</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Occupation</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Monthly Income</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }, (_, i) => members[i] || {}).map((m, i) => (
                    <tr key={i} className="even:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{m?.name || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.age || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.sex || m?.gender || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.relationship || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.civilStatus || m?.civil_status || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.educationalAttainment || m?.educational_attainment || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.occupation || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.monthlyIncome || m?.monthly_income || ''}</td>
                      <td className="border border-gray-300 px-3 py-2">{m?.code || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-0 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">III. HOUSEHOLD INFORMATION</div>
            <table className="w-full border border-black text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 align-top" colSpan={2}>
                    <div className="flex flex-col space-y-[2px]">
                      <div className="flex items-center">
                        <div className="flex-1">Do you own the lot where your house is situated?</div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="inline-flex items-center gap-2"><Check checked={isYes(survey.lot_ownership)} /><span>YES</span></span>
                          <span className="inline-flex items-center gap-2"><Check checked={isNo(survey.lot_ownership)} /><span>NO</span></span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-1">Do you own the house that you are living in at this time?</div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="inline-flex items-center gap-2"><Check checked={isYes(survey.house_ownership)} /><span>YES</span></span>
                          <span className="inline-flex items-center gap-2"><Check checked={isNo(survey.house_ownership)} /><span>NO</span></span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-1">Do you previously avail of socialized housing?</div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="inline-flex items-center gap-2"><Check checked={isYes(survey.avail_socialized_housing)} /><span>YES</span></span>
                          <span className="inline-flex items-center gap-2"><Check checked={isNo(survey.avail_socialized_housing)} /><span>NO</span></span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 align-top" colSpan={2}>
                    <div className="flex items-center">
                      <div className="flex-1">Do you live in a temporary dwelling, e.g., a tent, cart?</div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="inline-flex items-center gap-2"><Check checked={isYes(survey.temporary_living_area)} /><span>YES</span></span>
                        <span className="inline-flex items-center gap-2"><Check checked={isNo(survey.temporary_living_area)} /><span>NO</span></span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={2} style={{width:'60%'}}>House Structure</td>
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={2} style={{width:'40%'}}>Type of Toilet</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-1 py-1" colSpan={2} style={{width:'60%'}}>
                    <div className="grid grid-cols-2 gap-x-0 gap-y-0">
                      <div className="space-y-0">
                        {[
                          'Full Concrete',
                          'Made of wood and metal roof',
                          'Made of Amakan and Nipa',
                        ].map(lbl => {
                          const opt = HS_OPTS.find(o => o.label === lbl);
                          const otherRaw = String(survey.other_housing_structure || '');
                          const checked = opt ? (
                            eq(survey.housing_structure, opt.key) ||
                            eq(survey.housing_structure, opt.label) ||
                            eq(otherRaw, opt.key) ||
                            eq(otherRaw, opt.label)
                          ) : false;
                          return (
                            <div key={lbl} className="flex items-center gap-[1px]">
                              <Check checked={checked} />
                              <span>{lbl}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="space-y-0">
                        {[
                          'Combination of concrete and wood',
                          'Made of Amakan and metal roof',
                          'Makeshift/Salvaged/Improvised Material',
                        ].map(lbl => {
                          const opt = HS_OPTS.find(o => o.label === lbl);
                          const otherRaw = String(survey.other_housing_structure || '');
                          const checked = opt ? (
                            eq(survey.housing_structure, opt.key) ||
                            eq(survey.housing_structure, opt.label) ||
                            eq(otherRaw, opt.key) ||
                            eq(otherRaw, opt.label)
                          ) : false;
                          return (
                            <div key={lbl} className="flex items-center gap-[1px]">
                              <Check checked={checked} />
                              <span>{lbl}</span>
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-[2px]">
                          {(() => {
                            const v = String(survey.housing_structure || '');
                            const otherRaw = String(survey.other_housing_structure || '');
                            const knownByValue = HS_OPTS.some(o => eq(v, o.key) || eq(v, o.label));
                            const knownByOther = HS_OPTS.some(o => eq(otherRaw, o.key) || eq(otherRaw, o.label));
                            const isOtherSelected = !knownByValue && !knownByOther && otherRaw !== '';
                            const otherText = isOtherSelected ? (otherRaw || v) : '';
                            return (
                              <>
                                <Check checked={isOtherSelected} />
                                <span>Others</span>
                                <span className="ml-[2px]">please specify</span>
                                <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{otherText}</span>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-1 py-1" colSpan={2} style={{width:'40%'}}>
                    <div className="grid grid-cols-2 gap-x-[2px] gap-y-[1px]">
                      <div className="space-y-0">
                        {['Water Sealed','No Toilet'].map(lbl => {
                          const opt = TOILET_OPTS.find(o=>o.label===lbl);
                          const checked = opt ? (
                            eq(survey.type_of_toilet, opt.key) ||
                            eq(survey.type_of_toilet, opt.label) ||
                            (opt.aliases||[]).some(a=>eq(survey.type_of_toilet, a))
                          ) : false;
                          return (
                            <div key={lbl} className="flex items-center gap-[1px]">
                              <Check checked={checked} />
                              <span>{lbl}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="space-y-0">
                        {['Open Pit/Antipolo'].map(lbl => {
                          const opt = TOILET_OPTS.find(o=>o.label===lbl);
                          const checked = opt ? (
                            eq(survey.type_of_toilet, opt.key) ||
                            eq(survey.type_of_toilet, opt.label) ||
                            (opt.aliases||[]).some(a=>eq(survey.type_of_toilet, a))
                          ) : false;
                          return (
                            <div key={lbl} className="flex items-center gap-[1px]">
                              <Check checked={checked} />
                              <span>{lbl}</span>
                            </div>
                          )
                        })}
                        <div className="flex items-center gap-[2px] mt-[2px] pl-[2px]">
                          {(() => {
                            const v = String(survey.type_of_toilet||'');
                            const known = TOILET_OPTS.some(o =>
                              eq(v, o.key) ||
                              eq(v, o.label) ||
                              (o.aliases||[]).some(a => eq(v, a))
                            );
                            const other = String(survey.other_type_of_toilet||'') || (known ? '' : v);
                            return (
                              <>
                                <Check checked={other !== ''} />
                                <span>Others</span>
                                <span className="ml-[2px]">please specify</span>
                                <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{other}</span>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={2} style={{width:'60%'}}>Source of Water</td>
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={2} style={{width:'40%'}}>Source of Electricity</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-2 py-2" colSpan={2} style={{width:'60%'}}>
                    <div className="grid grid-cols-2 gap-x-[2px] gap-y-[1px]">
                      <div className="space-y-[1px]">
                        {['Community Water System (NAWASA)','Deep Well','Spring'].map(lbl => { const opt = WATER_OPTS.find(o=>o.label===lbl); const checked = opt ? (eq(survey.source_of_water, opt.key) || eq(survey.source_of_water, opt.label) || (opt.aliases||[]).some(a=>eq(survey.source_of_water,a))) : false; return (
                          <div key={lbl} className="flex items-center gap-[1px]">
                            <Check checked={checked} />
                            <span>{lbl}</span>
                          </div>
                        )})}
                      </div>
                      <div className="space-y-[1px]">
                        {['Rainwater','Surface water (river,lake,dam)'].map(lbl => { const opt = WATER_OPTS.find(o=>o.label===lbl); const checked = opt ? (eq(survey.source_of_water, opt.key) || eq(survey.source_of_water, opt.label) || (opt.aliases||[]).some(a=>eq(survey.source_of_water,a))) : false; return (
                          <div key={lbl} className="flex items-center gap-[1px]">
                            <Check checked={checked} />
                            <span>{lbl}</span>
                          </div>
                        )})}
                        <div className="flex items-center gap-[2px] mt-[2px]">
                          {(() => { const v = String(survey.source_of_water||''); const known = WATER_OPTS.some(o=>eq(v,o.key) || eq(v,o.label) || (o.aliases||[]).some(a=>eq(v,a))); const other = String(survey.other_source_of_water||'') || (known? '' : v); return (
                            <>
                              <Check checked={other !== '' && !eq(v,'none')} />
                              <span>Others please specify</span>
                              <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{other}</span>
                            </>
                          ) })()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-2 py-2" colSpan={2} style={{width:'40%'}}>
                    <div className="grid grid-cols-2 gap-x-[2px] gap-y-[1px]">
                      <div className="space-y-[1px]">
                        {['with own meter','Solar Panel','Candle/Lamp'].map(lbl => { const opt = ELEC_OPTS.find(o=>o.label===lbl || o.label.toLowerCase()===lbl.toLowerCase()); const checked = opt ? (eq(survey.source_of_electricity, opt.key) || eq(survey.source_of_electricity, opt.label)) : false; return (
                          <div key={lbl} className="flex items-center gap-[1px]">
                            <Check checked={checked} />
                            <span>{lbl}</span>
                          </div>
                        )})}
                      </div>
                      <div className="space-y-[1px]">
                        {['Tapping to the neighbor'].map(lbl => { const opt = ELEC_OPTS.find(o=>o.label===lbl); const checked = opt ? (eq(survey.source_of_electricity, opt.key) || eq(survey.source_of_electricity, opt.label)) : false; return (
                          <div key={lbl} className="flex items-center gap-[1px]">
                            <Check checked={checked} />
                            <span>{lbl}</span>
                          </div>
                        )})}
                        <div className="flex items-center gap-[2px] mt-[2px]">
                          {(() => { const v = String(survey.source_of_electricity||''); const known = ELEC_OPTS.some(o=>eq(v,o.key) || eq(v,o.label)); const other = String(survey.other_source_of_electricity||'') || (known? '' : v); return (
                            <>
                              <Check checked={other !== '' && !eq(v,'none')} />
                              <span>Others please specify</span>
                              <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{other}</span>
                            </>
                          ) })()}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-0 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">IV. ECONOMIC ASPECT</div>
            <table className="w-full border border-black text-xs border-collapse">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>Household Head main source of income</td>
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>Work Status</td>
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>Work Location (Household Head)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 align-top" colSpan={2}>
                    <div className="space-y-[2px]">
                      {INCOME_OPTS.map(opt => (
                        <div key={opt.key} className="flex items-center gap-[2px]">
                          <Check checked={eq(survey.main_income_source, opt.key) || eq(survey.main_income_source, opt.label)} />
                          <span>{opt.label}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-[2px] mt-[2px]">
                        {(() => { const v = String(survey.main_income_source||''); const known = INCOME_OPTS.some(o=>eq(v,o.key)||eq(v,o.label)); const other = String(survey.other_main_income_source||'') || (known? '' : v); return (
                          <>
                            <Check checked={other !== ''} />
                            <span>Others</span>
                            <span className="ml-[2px]">please specify</span>
                            <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{other}</span>
                          </>
                        ) })()}
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 align-top" colSpan={2}>
                    <div className="space-y-[2px]">
                      {WORK_STATUS_OPTS.map(opt => (
                        <div key={opt.key} className="flex items-center gap-[2px]">
                          <Check checked={eq(survey.work_status, opt.key) || eq(survey.work_status, opt.label)} />
                          <span>{opt.label}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-[2px] mt-[2px]">
                        {(() => { const v = String(survey.work_status||''); const known = WORK_STATUS_OPTS.some(o=>eq(v,o.key)||eq(v,o.label)); const other = String(survey.other_work_status||'') || (known? '' : v); return (
                          <>
                            <Check checked={other !== ''} />
                            <span>Others</span>
                            <span className="ml-[2px]">please specify</span>
                            <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{other}</span>
                          </>
                        ) })()}
                      </div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 align-top" colSpan={2}>
                    <div className="space-y-[2px]">
                      {WORK_LOC_OPTS.map(opt => (
                        <div key={opt.key} className="flex items-center gap-[2px]">
                          <Check checked={eq(survey.work_location_head, opt.key) || eq(survey.work_location_head, opt.label)} />
                          <span>{opt.label}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-[2px] mt-[2px]">
                        {(() => { const v = String(survey.work_location_head||''); const known = WORK_LOC_OPTS.some(o=>eq(v,o.key)||eq(v,o.label)); const other = String(survey.other_work_location||'') || (known? '' : v); return (
                          <>
                            <Check checked={other !== ''} />
                            <span>Others</span>
                            <span className="ml-[2px]">please specify</span>
                            <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{other}</span>
                          </>
                        ) })()}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={3}>Household Head Monthly Salary/Income (Numeric Only)</td>
                  <td className="border border-gray-300 px-3 py-2 text-center" colSpan={3}>Combine Household Income (Numeric Only)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-4 text-center" colSpan={3}>{survey.monthly_salary || ''}</td>
                  <td className="border border-gray-300 px-3 py-4 text-center" colSpan={3}>{survey.combine_monthly_income || ''}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-0 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">V. TRAINING NEEDS ASSESSMENT AND ORGANIZATION MEMBERSHIP</div>
            <table className="w-full border border-black text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 align-top" style={{width:'50%'}}>
                    <div className="flex items-center justify-between">
                      <span>Is there any skill that can be used for a living?</span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-[2px]"><Check checked={isYes(survey.skills_for_living)} /><span>YES</span></span>
                        <span className="inline-flex items-center gap-[2px]"><Check checked={isNo(survey.skills_for_living)} /><span>NO</span></span>
                      </div>
                    </div>
                    <div className="mt-[4px]">If there is any, what is it ?</div>
                    <div className="mt-[2px] grid grid-cols-2 gap-x-[4px] gap-y-[2px]">
                      {SKILL_OPTS.map(opt => { const v = String(survey.specific_skill||''); const checked = eq(v,opt.key) || eq(v,opt.label) || (opt.aliases||[]).some(a=>eq(v,a)); return (
                        <div key={opt.key} className="flex items-center gap-[2px]">
                          <Check checked={checked} />
                          <span>{opt.label}</span>
                        </div>
                      )})}
                      <div className="flex items-center gap-[2px]">
                        {(() => { const v = String(survey.specific_skill||''); const known = SKILL_OPTS.some(o=>eq(v,o.key)||eq(v,o.label)||(o.aliases||[]).some(a=>eq(v,a))); const other = known? '' : v; return (
                          <>
                            <Check checked={other !== ''} />
                            <span>Others please specify</span>
                            <span className="inline-block border-b border-black w-[160px] overflow-hidden whitespace-nowrap">{other}</span>
                          </>
                        ) })()}
                      </div>
                    </div>
                    <div className="mt-[6px]">What are the skills you want to learn?</div>
                    <div className="mt-[2px]"><span className="inline-block border-b border-black w-[200px] overflow-hidden whitespace-nowrap">{survey.wanttolearn || ''}</span></div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 align-top" style={{width:'50%'}}>
                    <div className="flex items-center justify-between">
                      <span>Are you a member of any organization/association in your community?</span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-[2px]"><Check checked={isYes(survey.organization_member)} /><span>YES</span></span>
                        <span className="inline-flex items-center gap-[2px]"><Check checked={isNo(survey.organization_member)} /><span>NO</span></span>
                      </div>
                    </div>
                    <div className="mt-[4px]">If member, what organization/association is it?</div>
                    <div className="mt-[2px] grid grid-cols-2 gap-x-[4px] gap-y-[2px]">
                      {ORG_OPTS.map(opt => { const v = String(survey.specific_organization||''); const checked = eq(v,opt.key) || eq(v,opt.label); return (
                        <div key={opt.key} className="flex items-center gap-[2px]">
                          <Check checked={checked} />
                          <span>{opt.label}</span>
                        </div>
                      )})}
                      <div className="flex items-center gap-[2px]">
                        {(() => { const v = String(survey.specific_organization||''); const known = ORG_OPTS.some(o=>eq(v,o.key)||eq(v,o.label)); const other = known? '' : v; return (
                          <>
                            <Check checked={other !== ''} />
                            <span>Others please specify</span>
                            <span className="inline-block border-b border-black w-[160px] overflow-hidden whitespace-nowrap">{other}</span>
                          </>
                        ) })()}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-0">
            <table className="w-full border border-black text-xs border-collapse">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 font-semibold">REMARKS:</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-8 align-top">{survey.remarks || ''}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border border-black text-xs border-collapse mt-0">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-2 align-top" style={{width:'50%'}}>
                    <div className="leading-relaxed">
                      I hereby certify that the above statement and information are true and correct to the best of my knowledge. I further understand that any misrepresentation and/or deliberate omission of facts and information contained herein shall constitute ground for my disqualification. I voluntarily and freely consent to the collection and processing of the above personal information only in relation to Data Privacy Act.
                    </div>
                    <div className="mt-2 flex items-center justify-center" style={{height:'90px'}}>
                      {survey.respondent_signature ? (
                        <img className="max-h-full object-contain" src={fileUrl(survey.respondent_signature)} alt="Respondent Signature" />
                      ) : null}
                    </div>
                    <div className="pt-1 text-center">
                      <div className="w-full border-b border-gray-300 flex justify-center">
                        <span className="font-semibold text-[12px] leading-tight px-2 bg-white">
                          {respondentName || '\u00A0'}
                        </span>
                      </div>
                      <div className="font-semibold text-[11px] mt-1">Signature over Printed Name of HH/Respondent</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 align-top" style={{width:'50%'}}>
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td className="px-2 py-1 align-top" style={{width:'50%'}}>
                            <div className="flex items-center gap-2">
                              <span>Interviewed by:</span>
                              <span className="inline-block border-b border-black w-[180px] overflow-hidden whitespace-nowrap">{survey.interviewed_by || ''}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1 align-top text-right" style={{width:'50%'}}>
                            <div className="flex items-center gap-2 justify-end">
                              <span>Date Interviewed:</span>
                              <span className="inline-block border-b border-black w-[140px] overflow-hidden whitespace-nowrap">{survey.date_interviewed || ''}</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-2" colSpan={2}>
                            <div className="w-full flex items-center justify-center" style={{height:'90px'}}>
                              {survey.validator_signature ? (
                                <img className="max-h-full object-contain" src={fileUrl(survey.validator_signature)} alt="Validator Signature" />
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 pt-1 pb-1 text-center" colSpan={2}>
                            <div className="w-full border-b border-gray-300 flex justify-center">
                              <span className="font-semibold text-[12px] leading-tight px-2 bg-white">
                                {validatorName || '\u00A0'}
                              </span>
                            </div>
                            <div className="font-semibold text-[11px] mt-1">Signature over Printed Name of Interviewer</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="border-t border-gray-300 px-2 py-2 text-[10px] leading-relaxed" colSpan={2}>
                            We at City Housing Office would like to thank you for your trust in providing us with your personal information. Rest assured that your data shall only be used for documentation and collection. Your information shall only be subject to reproduction, correction and/or deletion upon your personal request. For Data Privacy concern, you may send us an email at cityhousingrelocation@gmail.com
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 print:hidden">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">Photos & Location</div>
              <button className="px-3 py-1 border rounded-lg text-sm text-emerald-800 hover:bg-emerald-50" onClick={() => setShowHouseInfo(v => !v)}>{showHouseInfo ? 'Hide' : 'Show'}</button>
            </div>
            {showHouseInfo && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b text-sm font-medium text-gray-700">Respondent Photo</div>
                  <div className="p-4">
                    {survey.person_photo ? (
                      <img src={`${apiBase}/survey/${surveyId}/person-photo`} alt="Respondent" className="w-full aspect-[3/4] object-cover rounded-xl border" />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-50 rounded-xl">No respondent photo uploaded</div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b text-sm font-medium text-gray-700">House Photo</div>
                  <div className="p-4">
                    {survey.house_photo ? (
                      <img src={`${apiBase}/survey/${surveyId}/photo`} alt="House" className="w-full aspect-video object-cover rounded-xl border" />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-50 rounded-xl">No house photo uploaded</div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b text-sm font-medium text-gray-700">Location</div>
                  <div className="p-4 space-y-3">
                    {(survey.latitude && survey.longitude) ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{Number(survey.latitude).toFixed(6)}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{Number(survey.longitude).toFixed(6)}</span>
                        </div>
                        <a className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:underline" href={`https://www.google.com/maps?q=${survey.latitude},${survey.longitude}`} target="_blank" rel="noreferrer">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          View on Google Maps
                        </a>
                        <div className="mt-2">
                          <iframe title="map" className="w-full h-56 rounded-xl border" src={`https://maps.google.com/maps?q=${survey.latitude},${survey.longitude}&z=18&output=embed`}></iframe>
                        </div>
                      </>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-500 bg-gray-50 rounded-xl">Location not available</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
