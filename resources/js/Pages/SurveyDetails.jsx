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
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h1 className="text-2xl font-semibold text-emerald-800">Survey Form Details</h1>
          <div className="flex gap-2">
            <Link href={isAdmin ? '/admin/beneficiaries' : '/validator/dashboard'} className="px-4 py-2 border rounded text-emerald-800">Back</Link>
            <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded">Print</button>
          </div>
        </div>

        <div className="bg-white border border-gray-300 p-6 print:shadow-none">

          <table className="w-full border border-gray-400 text-sm border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-300 bg-gray-100 text-gray-900 font-semibold px-3 py-2">Is this a previous client?</td>
                <td className="border border-gray-300 px-3 py-2">{survey.previous_client || '-'}</td>
                <td className="border border-gray-300 bg-gray-100 text-gray-900 font-semibold px-3 py-2">Year inhabited the Place</td>
                <td className="border border-gray-300 px-3 py-2">{survey.year_inhabited || '-'}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 bg-gray-200 text-gray-800 font-semibold px-3 py-2">I. Classification of Informal Settler Families</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-300 bg-gray-100 text-gray-900 font-semibold px-3 py-2">Classification</td>
                <td className="border border-gray-300 px-3 py-2">{survey.classification || '-'}</td>
                <td className="border border-gray-300 bg-gray-100 text-gray-900 font-semibold px-3 py-2">Sub-class</td>
                <td className="border border-gray-300 px-3 py-2">{survey.sub_class_displaced || survey.subclass_displaced || survey.sub_class_double_up || survey.subclass_doubleup || survey.sub_class_homeless || survey.subclass_homeless || '-'}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">II. Demographic Information</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
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

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">Spouse Information</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
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

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">Members of the Household</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
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
                  <td className="border border-gray-300 px-3 py-2">{m.civilStatus}</td>
                  <td className="border border-gray-300 px-3 py-2">{m.educationalAttainment}</td>
                  <td className="border border-gray-300 px-3 py-2">{m.occupation}</td>
                  <td className="border border-gray-300 px-3 py-2">{m.monthlyIncome}</td>
                </tr>
              )) : (
                <tr><td className="border border-gray-300 px-3 py-2" colSpan={8}>No household members found.</td></tr>
              )}
            </tbody>
          </table>

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">Household Information</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
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

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">Economic Aspect</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
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

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">Training & Membership</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
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

          <div className="mt-6 bg-gray-200 text-gray-800 font-semibold px-3 py-2">Remarks</div>
          <table className="w-full border border-gray-400 text-sm border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-3 leading-relaxed" colSpan={4}>{survey.remarks || ''}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border border-gray-400 text-sm border-collapse mt-6">
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

          <div className="mt-3">
            <div className="flex items-center justify-between print:hidden">
              <div className="text-lg font-semibold text-gray-900">House Photo & Location</div>
              <button className="px-3 py-1 border rounded text-sm text-emerald-800" onClick={() => setShowHouseInfo(v => !v)}>{showHouseInfo ? 'Hide' : 'Show'}</button>
            </div>
            {showHouseInfo && (
              <div className="mt-3 space-y-4">
                {survey.house_photo ? (
                  <div>
                    <img src={`${apiBase}/survey/${surveyId}/photo`} alt="House" className="w-full max-w-md border" />
                  </div>
                ) : (
                  <div className="text-gray-500">No house photo uploaded.</div>
                )}
                {(survey.latitude && survey.longitude) ? (
                  <div>
                    <div className="font-medium text-gray-700">{Number(survey.latitude).toFixed(6)}, {Number(survey.longitude).toFixed(6)}</div>
                    <a className="text-blue-600 underline" href={`https://www.google.com/maps?q=${survey.latitude},${survey.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
                    <div className="mt-3">
                      <iframe title="map" className="w-full max-w-xl h-64 border" src={`https://maps.google.com/maps?q=${survey.latitude},${survey.longitude}&z=18&output=embed`}></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Location not available.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}