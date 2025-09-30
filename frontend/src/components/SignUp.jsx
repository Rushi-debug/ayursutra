import React, { useState, useEffect } from 'react'
import { post } from '../api'

export default function SignUp({ onClose, onAuth, location }) {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [mobile, setMobile] = useState('')
  const [altMobile, setAltMobile] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (location) {
      // optional: show a small success message or prefill something if needed
    }
  }, [location])

  async function handle(e) {
    e.preventDefault()
    setErr(null)

    // basic client-side validation
    if (!name || !email || !password || !mobile) {
      setErr('Name, email, password and mobile are required.')
      return
    }
    if (!/^\d{10}$/.test(mobile)) {
      setErr('Mobile must be 10 digits.')
      return
    }
    if (altMobile && !/^\d{10}$/.test(altMobile)) {
      setErr('Alternate mobile must be 10 digits if provided.')
      return
    }
    if (age && (isNaN(age) || Number(age) <= 0 || Number(age) > 120)) {
      setErr('Please enter a valid age.')
      return
    }

    setLoading(true)

    const payload = {
      name,
      age,
      mobile,
      altMobile,
      gender,
      email,
      password,
      location, // include location object if present
    }

    const res = await post('/api/auth/register', payload)

    setLoading(false)

    if (res.ok) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      onAuth(res.user)
      onClose()
    } else {
      setErr(res.message || 'Failed to create account')
    }
  }

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-centered">
        <div className="modal-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="m-0">Create account</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>

          <form onSubmit={handle} className="d-flex flex-column gap-2">
            <input className="form-control form-control-lg" required placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />

            <div className="d-flex gap-2">
              <input className="form-control" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} inputMode="numeric" />
              <input className="form-control" placeholder="Mobile (10 digits)" value={mobile} onChange={e => setMobile(e.target.value)} inputMode="numeric" required />
            </div>

            <div className="d-flex gap-2">
              <input className="form-control" placeholder="Alternate mobile (optional)" value={altMobile} onChange={e => setAltMobile(e.target.value)} inputMode="numeric" />
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <input className="form-control form-control-lg" required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="form-control form-control-lg" required type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} />

            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-primary btn-lg flex-grow-1" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
              <button type="button" className="btn btn-outline-secondary btn-lg" onClick={onClose}>Cancel</button>
            </div>

            {location && (
              <div className="text-success small mt-2">Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</div>
            )}

            {err && <div className="text-danger mt-2">{err}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
