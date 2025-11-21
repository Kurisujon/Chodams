// resources/js/Pages/ValidatorSignup.jsx
import React, { useRef, useState } from 'react'
import axios from 'axios'
import { Link, router } from '@inertiajs/react'

export default function ValidatorSignup() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const sigRef = useRef(null)
  const [error, setError] = useState('')
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function submit(e) {
    e.preventDefault()
    try {
      const signature_data = sigRef.current?.toDataURL ? sigRef.current.toDataURL() : ''
      await axios.post('/admin/api/validators', { name, username, email, password, signature_data }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      const data = err?.response?.data
      setError(data?.errors?.username?.[0] || data?.message || 'Failed to create account')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-green-800 font-semibold">Create Validator Account</h2>
          <Link href="/admin/profile" className="px-3 py-2 border rounded text-green-800">Back</Link>
        </div>
        {error && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name</label>
            <input className="border rounded p-2 w-full" value={name} onChange={e=>setName(e.target.value)} required/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <input className="border rounded p-2 w-full" value={username} onChange={e=>setUsername(e.target.value)} required/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input className="border rounded p-2 w-full" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input className="border rounded p-2 w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Signature</label>
            <div className="space-y-2">
              <canvas
                ref={sigRef}
                width={300}
                height={100}
                className="border"
                onMouseDown={(e)=>{sigRef.current._draw=true; const r=e.target.getBoundingClientRect(); sigRef.current._last={x:e.clientX-r.left,y:e.clientY-r.top}}}
                onMouseMove={(e)=>{if(!sigRef.current._draw)return; const r=e.target.getBoundingClientRect(); const x=e.clientX-r.left; const y=e.clientY-r.top; const ctx=sigRef.current.getContext('2d'); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(sigRef.current._last.x, sigRef.current._last.y); ctx.lineTo(x,y); ctx.stroke(); sigRef.current._last={x,y}}}
                onMouseUp={()=>{sigRef.current._draw=false}}
                onMouseLeave={()=>{sigRef.current._draw=false}}
                onTouchStart={(e)=>{sigRef.current._draw=true; const r=e.target.getBoundingClientRect(); const t=e.touches[0]; sigRef.current._last={x:t.clientX-r.left,y:t.clientY-r.top}}}
                onTouchMove={(e)=>{if(!sigRef.current._draw)return; const r=e.target.getBoundingClientRect(); const t=e.touches[0]; const x=t.clientX-r.left; const y=t.clientY-r.top; const ctx=sigRef.current.getContext('2d'); ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(sigRef.current._last.x, sigRef.current._last.y); ctx.lineTo(x,y); ctx.stroke(); sigRef.current._last={x,y}}}
                onTouchEnd={()=>{sigRef.current._draw=false}}
              />
              <button type="button" className="px-3 py-1 border rounded" onClick={()=>{const ctx=sigRef.current.getContext('2d'); ctx.clearRect(0,0,sigRef.current.width,sigRef.current.height)}}>Clear</button>
            </div>
          </div>
          <button className="px-4 py-2 bg-green-800 text-white rounded" type="submit">Create Account</button>
        </form>
      </div>
    </div>
  )
}