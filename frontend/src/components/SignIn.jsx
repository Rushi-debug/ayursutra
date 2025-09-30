import React, { useState } from 'react'
import { post } from '../api'

/**
 * SignIn : props:
 * - onClose()
 * - onAuth(userOrPractitioner)
 * - role: 'user' | 'practitioner' (defaults to 'user')
 * - location (optional) for user flows
 */
export default function SignIn({ onClose, onAuth, role = 'user', location }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handle(e) {
    e.preventDefault()
    setErr(null)
    setLoading(true)

    try {
      if (role === 'user') {
        // use existing user login endpoint; include location if available
        const res = await post('/api/auth/login', { email, password, location })
        setLoading(false)
        if (res.ok) {
          localStorage.setItem('token', res.token)
          localStorage.setItem('user', JSON.stringify(res.user))
          onAuth(res.user)
          onClose()
        } else {
          setErr(res.message || 'Invalid credentials')
        }
      } else {
        // practitioner login
        const resp = await fetch('http://localhost:5000/api/practitioners/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const json = await resp.json()
        setLoading(false)
        if (json.ok) {
          localStorage.setItem('token', json.token)
          localStorage.setItem('practitioner', JSON.stringify(json.practitioner))
          onAuth(json.practitioner)
          onClose()
        } else {
          setErr(json.message || 'Invalid credentials')
        }
      }
    } catch (err) {
      console.error('signin error', err)
      setLoading(false)
      setErr('Network error')
    }
  }

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-centered">
        <div className="modal-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="m-0">{role === 'user' ? 'Sign in (User)' : 'Sign in (Practitioner)'}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>

          <form onSubmit={handle} className="d-flex flex-column gap-2">
            <input className="form-control form-control-lg" required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="form-control form-control-lg" required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-primary btn-lg flex-grow-1" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
              <button type="button" className="btn btn-outline-secondary btn-lg" onClick={onClose}>Cancel</button>
            </div>

            {role === 'user' && location && <div className="text-success small mt-2">Location will be used to personalize experience.</div>}
            {err && <div className="text-danger mt-2">{err}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
