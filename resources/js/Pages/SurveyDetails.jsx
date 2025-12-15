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
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  const fileUrl = (path) => {
    const s = String(path || '')
    if (!s) return ''
    if (s.startsWith('http')) return s
    if (s.startsWith('storage/')) return `/${s}`
    if (s.startsWith('signatures/')) return `/storage/${s}`
    return s.startsWith('/') ? s : `/${s}`
  }

  async function handleApprove() {
    try {
      await axios.post('/admin/api/approve', { survey_id: surveyId }, { headers: { 'X-CSRF-TOKEN': csrf() } })
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto p-6 print:max-w-none print:p-0 print:m-0">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h1 className="text-2xl font-semibold text-emerald-800">Survey Form Details</h1>
          <div className="flex gap-2">
            <Link href={isAdmin ? '/admin/beneficiaries' : '/validator/dashboard'} className="px-4 py-2 border rounded text-emerald-800">Back</Link>
            <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded">Print</button>
            <a
              href={`${apiBase}/survey/${surveyId}/export`}
              className="px-3 py-2 rounded-2xl ring-2 ring-emerald-300 text-emerald-700 inline-flex items-center gap-2 hover:bg-emerald-50"
              title="Download Excel"
            >
              <img src="/icons/downloadicon.png" alt="Download" className="w-5 h-5" />
            </a>
            {isAdmin && survey?.is_submitted !== 2 && (
              <button onClick={handleApprove} className="px-4 py-2 bg-emerald-600 text-white rounded">Approve</button>
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
            #print-root .leading-relaxed { line-height: 1.2 !important; }
            #print-root .text-xs { font-size: 10px !important; }
            #print-root .text-sm { font-size: 11px !important; }
            #print-root .mt-6 { margin-top: 6px !important; }
            #print-root .mt-5 { margin-top: 6px !important; }
            #print-root .p-6 { padding: 10px !important; }
            #print-root .p-3 { padding: 6px !important; }
            #print-root .px-3 { padding-left: 6px !important; padding-right: 6px !important; }
            #print-root .py-2 { padding-top: 4px !important; padding-bottom: 4px !important; }
            #print-root .chrrsdp-title { margin-top: 6px !important; }
            #print-root .members-header-wrapper { margin-top: 6px !important; }
            #print-root .members-header { margin-top: 0 !important; }
            #print-root .survey-box { margin-top: 6px !important; }
          }
        `}</style>

        <div id="print-root" className="bg-white p-6 print:shadow-none" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div className="border-2 border-black survey-box">
            <div className="grid grid-cols-3">
              <div className="col-span-1 p-3 border-r-2 border-black bg-slate-50">
                <div className="text-sm font-semibold chrrsdp-title">CHRRSDP FORM 2</div>
                <div className="text-xs mt-1">Date</div>
                <div className="text-sm font-medium">{survey.date_interviewed || ''}</div>
                <div className="text-xs mt-2">Form No.</div>
                <div className="mt-1">{survey.form_no || '________'}</div>
              </div>
              <div className="col-span-2 p-3">
                <div className="text-center font-semibold text-sm">CITY GOVERNMENT OF DIGOS</div>
                <div className="text-center text-sm">CITY HOUSING RELOCATION RESETTLEMENT</div>
                <div className="text-center text-sm">AND SITE DEVELOPMENT PROGRAM</div>
              </div>
            </div>
            <div className="grid grid-cols-2 border-t-2 border-black">
              <div className="p-3">
                <div className="text-xs font-bold">CONFIDENTIALITY</div>
                <div className="text-xs mt-1 leading-relaxed">The CHRRSDP adheres and commits to the confidentiality of information as Section 8 of RA 10173 (Confidentiality). All data obtained herein shall be held strictly confidential, and will not be used for taxation, investigation or law enforcement purposes.</div>
              </div>
              <div className="p-3 border-l-2 border-black flex flex-col items-center justify-center">
                <div className="text-emerald-700 font-extrabold text-3xl">ISF</div>
                <div className="text-[11px] leading-snug text-gray-800">Informal Settler Families<br/>Census Survey</div>
                <div className="mt-1 font-semibold text-sm text-gray-900">Household Profile Questionnaire</div>
              </div>
            </div>
            <div className="p-3 border-t-2 border-black">
              <div className="text-xs font-semibold">Dear Sir/Madam:</div>
              <div className="text-xs mt-1 leading-relaxed">The City Housing Relocation Resettlement and Site Development Program is collecting information to the Informal Settler Families identified in the different barangays of Digos City. The Informal Settler Families Census Survey aims to gather data about the demographic, socioeconomic and housing characteristics of every identified household. The collected data will be used by the City Government planners, policy makers, and administrators in formulating their social and economic development plans, policies, and programs.</div>
              <div className="text-xs mt-2 leading-relaxed">The City Housing Relocation Resettlement and Site Development Program highly encourages your participation and cooperation by providing truthful and complete answers. All information provided are strictly confidential pursuant to Section 8 (Confidentiality) of Republic Act 10173 or the Data Privacy Act of 2012 and will not be used against you or to any of your household member for taxation, investigation, or law enforcement purposes.</div>
              <div className="text-xs mt-2 leading-relaxed">We at City Housing Relocation Resettlement and Site Development Program would like to thank you for your trust in providing us with your personal information. Your information shall only be subject to reproduction, correction and/or deletion upon your personal request. For Data Privacy concern, you may send us an email at cityhousingrelocation@gmail.com.</div>
            </div>
          </div>

          <div className="mt-1 mb-1">
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2">Is this a previous client?</td>
                  <td className="border border-black px-3 py-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`inline-flex items-center gap-2`}>
                        <span className={`inline-block w-3 h-3 border border-black ${String(survey.previous_client).toLowerCase() === 'yes' ? 'bg-black' : ''}`}></span>
                        Yes
                      </span>
                      <span className={`inline-flex items-center gap-2`}>
                        <span className={`inline-block w-3 h-3 border border-black ${String(survey.previous_client).toLowerCase() === 'no' ? 'bg-black' : ''}`}></span>
                        No
                      </span>
                    </div>
                  </td>
                  <td className="border border-black px-3 py-2">Year inhabited the place</td>
                  <td className="border border-black px-3 py-2">{survey.year_inhabited || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-5 bg-blue-200 text-gray-900 font-semibold px-3 py-2 border border-black">I. CLASSIFICATION OF INFORMAL SETTLER FAMILIES</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2">Displaced</td>
                  <td className="border border-black px-3 py-2 w-10">
                    <span className={`inline-block w-4 h-4 border border-black ${String(survey.classification).toLowerCase() === 'displaced' ? 'bg-black' : ''}`}></span>
                  </td>
                  <td className="border border-black px-3 py-2">Homeless</td>
                  <td className="border border-black px-3 py-2 w-10">
                    <span className={`inline-block w-4 h-4 border border-black ${String(survey.classification).toLowerCase() === 'homeless' ? 'bg-black' : ''}`}></span>
                  </td>
                  <td className="border border-black px-3 py-2">Upgrading of Land Tenure</td>
                  <td className="border border-black px-3 py-2 w-10">
                    <span className={`inline-block w-4 h-4 border border-black ${String(survey.classification).toLowerCase() === 'upgrading of land tenure' ? 'bg-black' : ''}`}></span>
                  </td>
                  <td className="border border-black px-3 py-2">Doubled-up</td>
                  <td className="border border-black px-3 py-2 w-10">
                    <span className={`inline-block w-4 h-4 border border-black ${String(survey.classification).toLowerCase() === 'doubled-up' || String(survey.classification).toLowerCase() === 'double up' ? 'bg-black' : ''}`}></span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">A. SUB-CLASSIFICATION</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-2" colSpan={8}>{survey.sub_class_displaced || survey.subclass_displaced || survey.sub_class_double_up || survey.subclass_doubleup || survey.sub_class_homeless || survey.subclass_homeless || '-'}</td>
                </tr>
              </tbody>
            </table>
            <div className="border border-black p-3 text-xs leading-relaxed">
              <div className="font-bold">DEFINITION:</div>
              <div className="mt-1">Displaced – Household located in danger areas, such as extended esteros (canals), railroad tracks, garbage dumps, riverbanks, and flood-prone areas or in areas where government infrastructure projects are to be implemented or areas where household is a court order of eviction and demolition.</div>
              <div className="mt-2">Doubled-Up – It refers to a number of households in excess of the number of dwelling units at the time of census, assuming that one household per dwelling…</div>
            </div>

            <div className="mt-6 bg-blue-200 text-gray-900 font-semibold px-3 py-2 border border-black">II. DEMOGRAPHIC INFORMATION</div>
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
                  <td className="border border-gray-300 px-3 py-2">{survey.barangay || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.gender || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Religion</td>
                  <td className="border border-gray-300 px-3 py-2">Place of Birth</td>
                  <td className="border border-gray-300 px-3 py-2">Date of Birth</td>
                  <td className="border border-gray-300 px-3 py-2">Age</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.religion || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.birth_place || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.birth_date || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.person_age || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Marital Status</td>
                  <td className="border border-gray-300 px-3 py-2">Contact Number</td>
                  <td className="border border-gray-300 px-3 py-2">Language Spoken</td>
                  <td className="border border-gray-300 px-3 py-2">Tribe</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.marital_status || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.contact_number || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.language_spoken || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.tribe || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Affiliation</td>
                  <td className="border border-gray-300 px-3 py-2" colSpan={3}>{survey.affiliation || survey.affiliations || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>Highest Educational Attainment</td>
                  <td className="border border-gray-300 px-3 py-2">Name of the School Last Attended</td>
                  <td className="border border-gray-300 px-3 py-2">Year Graduated</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>{survey.highest_education || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.last_school_attended || survey.last_school_name || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.year_graduated || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">SPOUSE INFORMATION</div>
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
                  <td className="border border-gray-300 px-3 py-2">{survey.spouse_religion || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.spouse_tribe || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.spouse_age || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.spouse_gender || '-'}</td>
                </tr>
              </tbody>
            </table>

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
                  </tr>
                </thead>
                <tbody>
                  {members.length ? members.map((m, i) => (
                    <tr key={i} className="even:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{m.name}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.age}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.sex}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.relationship}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.civilStatus || m.civil_status}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.educationalAttainment || m.educational_attainment}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.occupation}</td>
                      <td className="border border-gray-300 px-3 py-2">{m.monthlyIncome || m.monthly_income}</td>
                    </tr>
                  )) : (
                    <tr><td className="border border-gray-300 px-3 py-2" colSpan={8}>No household members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">HOUSEHOLD INFORMATION</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Lot Ownership</td>
                  <td className="border border-gray-300 px-3 py-2">Temporary Dwelling</td>
                  <td className="border border-gray-300 px-3 py-2">House Ownership</td>
                  <td className="border border-gray-300 px-3 py-2">Socialized Housing</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.lot_ownership || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.temporary_living_area || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.house_ownership || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.avail_socialized_housing || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">House Structure</td>
                  <td className="border border-gray-300 px-3 py-2">Type of Toilet</td>
                  <td className="border border-gray-300 px-3 py-2">Water Source</td>
                  <td className="border border-gray-300 px-3 py-2">Electricity Source</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.housing_structure || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.type_of_toilet || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.source_of_water || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.source_of_electricity || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">ECONOMIC ASPECT</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Main Income Source</td>
                  <td className="border border-gray-300 px-3 py-2">Work Status</td>
                  <td className="border border-gray-300 px-3 py-2">Work Location</td>
                  <td className="border border-gray-300 px-3 py-2">Monthly Salary</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.main_income_source || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.work_status || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.work_location_head || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.monthly_salary || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2" colSpan={3}>Combined Household Income</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.combine_monthly_income || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">TRAINING & MEMBERSHIP</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Skills for Living</td>
                  <td className="border border-gray-300 px-3 py-2">Specific Skill</td>
                  <td className="border border-gray-300 px-3 py-2">Skills you want to learn</td>
                  <td className="border border-gray-300 px-3 py-2">Organization Member</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.skills_for_living || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.specific_skill || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.wanttolearn || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.organization_member || '-'}</td>
                </tr>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2" colSpan={3}>Organization</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.specific_organization || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <div className="mt-6 bg-blue-100 text-gray-900 font-semibold px-3 py-2 border border-black">REMARKS</div>
            <table className="w-full border border-black text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-3 py-3 leading-relaxed" colSpan={4}>{survey.remarks || ''}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border border-black text-sm border-collapse mt-6">
              <tbody>
                <tr className="bg-gray-100 text-gray-900 font-semibold">
                  <td className="border border-gray-300 px-3 py-2">Interviewed by</td>
                  <td className="border border-gray-300 px-3 py-2">Date Interviewed</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-3 py-2">{survey.interviewed_by || '-'}</td>
                  <td className="border border-gray-300 px-3 py-2">{survey.date_interviewed || '-'}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="border border-black p-3 flex flex-col items-center">
                <div className="text-xs font-semibold mb-2">Validator's Signature</div>
                {survey.validator_signature ? (
                  <img className="signature h-24 object-contain" src={fileUrl(survey.validator_signature)} alt="Validator Signature" />
                ) : (
                  <div className="h-24 w-full"></div>
                )}
              </div>
              <div className="border border-black p-3 flex flex-col items-center">
                <div className="text-xs font-semibold mb-2">Respondent's Signature</div>
                {survey.respondent_signature ? (
                  <img className="signature h-24 object-contain" src={fileUrl(survey.respondent_signature)} alt="Respondent Signature" />
                ) : (
                  <div className="h-24 w-full"></div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 print:hidden">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">House Photo & Location</div>
              <button className="px-3 py-1 border rounded-lg text-sm text-emerald-800 hover:bg-emerald-50" onClick={() => setShowHouseInfo(v => !v)}>{showHouseInfo ? 'Hide' : 'Show'}</button>
            </div>
            {showHouseInfo && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
