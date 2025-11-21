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
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-green-800">Survey Details</h1>
          <div className="flex gap-2">
            <Link href={isAdmin ? '/admin/beneficiaries' : '/validator/dashboard'} className="px-4 py-2 border rounded text-green-800">Back</Link>
            <button onClick={() => window.print()} className="px-4 py-2 bg-green-800 text-white rounded">Print</button>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><div className="text-sm text-gray-500">Previous Client</div><div className="font-medium">{survey.previous_client}</div></div>
            <div><div className="text-sm text-gray-500">Year Inhabited</div><div className="font-medium">{survey.year_inhabited}</div></div>
            <div><div className="text-sm text-gray-500">Classification</div><div className="font-medium">{survey.classification}</div></div>
            <div><div className="text-sm text-gray-500">Sub-class</div><div className="font-medium">{survey.subclass_displaced || survey.subclass_doubleup}</div></div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Demographic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div><div className="text-sm text-gray-500">Last Name</div><div className="font-medium">{survey.last_name}</div></div>
              <div><div className="text-sm text-gray-500">First Name</div><div className="font-medium">{survey.first_name}</div></div>
              <div><div className="text-sm text-gray-500">Middle Name</div><div className="font-medium">{survey.middle_name}</div></div>
              <div><div className="text-sm text-gray-500">Suffix</div><div className="font-medium">{survey.suffix}</div></div>
              <div><div className="text-sm text-gray-500">Street</div><div className="font-medium">{survey.street}</div></div>
              <div><div className="text-sm text-gray-500">Purok</div><div className="font-medium">{survey.purok}</div></div>
              <div><div className="text-sm text-gray-500">Barangay</div><div className="font-medium">{survey.barangay}</div></div>
              <div><div className="text-sm text-gray-500">Sex</div><div className="font-medium">{survey.gender}</div></div>
              <div><div className="text-sm text-gray-500">Religion</div><div className="font-medium">{survey.religion}</div></div>
              <div><div className="text-sm text-gray-500">Birth Place</div><div className="font-medium">{survey.birth_place}</div></div>
              <div><div className="text-sm text-gray-500">Birth Date</div><div className="font-medium">{survey.birth_date}</div></div>
              <div><div className="text-sm text-gray-500">Age</div><div className="font-medium">{survey.person_age}</div></div>
              <div><div className="text-sm text-gray-500">Marital Status</div><div className="font-medium">{survey.marital_status}</div></div>
              <div><div className="text-sm text-gray-500">Contact Number</div><div className="font-medium">{survey.contact_number}</div></div>
              <div><div className="text-sm text-gray-500">Language</div><div className="font-medium">{survey.language_spoken}</div></div>
              <div><div className="text-sm text-gray-500">Tribe</div><div className="font-medium">{survey.tribe}</div></div>
              <div><div className="text-sm text-gray-500">Highest Education</div><div className="font-medium">{survey.highest_education}</div></div>
              <div><div className="text-sm text-gray-500">Last School</div><div className="font-medium">{survey.last_school_name}</div></div>
              <div><div className="text-sm text-gray-500">Year Graduated</div><div className="font-medium">{survey.year_graduated}</div></div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Spouse Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
              <div><div className="text-sm text-gray-500">Name</div><div className="font-medium">{survey.spouse_name}</div></div>
              <div><div className="text-sm text-gray-500">Religion</div><div className="font-medium">{survey.spouse_religion}</div></div>
              <div><div className="text-sm text-gray-500">Ethnicity</div><div className="font-medium">{survey.spouse_tribe}</div></div>
              <div><div className="text-sm text-gray-500">Age</div><div className="font-medium">{survey.spouse_age}</div></div>
              <div><div className="text-sm text-gray-500">Sex</div><div className="font-medium">{survey.spouse_gender}</div></div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Affiliation</h2>
            <div className="font-medium mt-2">{survey.affiliation}</div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Members of the Household</h2>
            <div className="overflow-x-auto mt-3">
              <table className="min-w-full">
                <thead className="bg-green-800 text-white">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Age</th>
                    <th className="p-2 text-left">Sex</th>
                    <th className="p-2 text-left">Relationship</th>
                    <th className="p-2 text-left">Civil Status</th>
                    <th className="p-2 text-left">Education</th>
                    <th className="p-2 text-left">Occupation</th>
                    <th className="p-2 text-left">Monthly Income</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length ? members.map((m, i) => (
                    <tr key={i} className="even:bg-gray-50">
                      <td className="p-2">{m.name}</td>
                      <td className="p-2">{m.age}</td>
                      <td className="p-2">{m.sex}</td>
                      <td className="p-2">{m.relationship}</td>
                      <td className="p-2">{m.civilStatus}</td>
                      <td className="p-2">{m.educationalAttainment}</td>
                      <td className="p-2">{m.occupation}</td>
                      <td className="p-2">{m.monthlyIncome}</td>
                    </tr>
                  )) : (
                    <tr><td className="p-2" colSpan="8">No household members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Household Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div><div className="text-sm text-gray-500">Lot Ownership</div><div className="font-medium">{survey.lot_ownership}</div></div>
              <div><div className="text-sm text-gray-500">Temporary Dwelling</div><div className="font-medium">{survey.temporary_living_area}</div></div>
              <div><div className="text-sm text-gray-500">House Ownership</div><div className="font-medium">{survey.house_ownership}</div></div>
              <div><div className="text-sm text-gray-500">Socialized Housing</div><div className="font-medium">{survey.avail_socialized_housing}</div></div>
              <div><div className="text-sm text-gray-500">House Structure</div><div className="font-medium">{survey.housing_structure}</div></div>
              <div><div className="text-sm text-gray-500">Type of Toilet</div><div className="font-medium">{survey.type_of_toilet}</div></div>
              <div><div className="text-sm text-gray-500">Water Source</div><div className="font-medium">{survey.source_of_water}</div></div>
              <div><div className="text-sm text-gray-500">Electricity Source</div><div className="font-medium">{survey.source_of_electricity}</div></div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Economic Aspect</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
              <div><div className="text-sm text-gray-500">Main Income Source</div><div className="font-medium">{survey.main_income_source}</div></div>
              <div><div className="text-sm text-gray-500">Work Status</div><div className="font-medium">{survey.work_status}</div></div>
              <div><div className="text-sm text-gray-500">Work Location</div><div className="font-medium">{survey.work_location_head}</div></div>
              <div><div className="text-sm text-gray-500">Monthly Salary</div><div className="font-medium">{survey.monthly_salary}</div></div>
              <div><div className="text-sm text-gray-500">Combined Income</div><div className="font-medium">{survey.combine_monthly_income}</div></div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Training & Membership</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
              <div><div className="text-sm text-gray-500">Skill for Living</div><div className="font-medium">{survey.skills_for_living}</div></div>
              <div><div className="text-sm text-gray-500">Specific Skill</div><div className="font-medium">{survey.specific_skill}</div></div>
              <div><div className="text-sm text-gray-500">Skills to Learn</div><div className="font-medium">{survey.wanttolearn}</div></div>
              <div><div className="text-sm text-gray-500">Organization Member</div><div className="font-medium">{survey.organization_member}</div></div>
              <div><div className="text-sm text-gray-500">Organization</div><div className="font-medium">{survey.specific_organization}</div></div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-green-800">Remarks</h2>
            <div className="border rounded p-4 mt-2 min-h-[80px]">{survey.remarks}</div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><div className="text-sm text-gray-500">Interviewed by</div><div className="font-medium">{survey.interviewed_by}</div></div>
            <div><div className="text-sm text-gray-500">Date Interviewed</div><div className="font-medium">{survey.date_interviewed}</div></div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-green-800">House Photo & Location</h2>
              <button className="px-3 py-1 border rounded text-sm text-green-800" onClick={() => setShowHouseInfo(v => !v)}>{showHouseInfo ? 'Hide' : 'Show'}</button>
            </div>
            {showHouseInfo && (
              <div className="mt-3 space-y-4">
                {survey.house_photo ? (
                  <div>
                    <div className="text-sm text-gray-500">House Photo</div>
                    <img src={`${apiBase}/survey/${surveyId}/photo`} alt="House" className="w-full max-w-md border" />
                    {survey.house_photo_filename && (<div className="text-xs text-gray-500 mt-1">Filename: {survey.house_photo_filename}</div>)}
                  </div>
                ) : (
                  <div className="text-gray-500">No house photo uploaded.</div>
                )}
                {(survey.latitude && survey.longitude) ? (
                  <div>
                    <div className="text-sm text-gray-500">Coordinates</div>
                    <div className="font-medium">{Number(survey.latitude).toFixed(6)}, {Number(survey.longitude).toFixed(6)}</div>
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