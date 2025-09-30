import React, { useState } from 'react';
import { post } from '../api'; // keep for JSON-based endpoints
import MapPickerLeaflet from './MapPickerLeaflet';

/*
Props:
 - onClose()
 - onAuth(practitioner) -> called on success
 - initialLocation (optional)
*/
export default function PractitionerSignUp({ onClose, onAuth, initialLocation }) {
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');

  const [pickedLocation, setPickedLocation] = useState(initialLocation || null);
  const [licenseFile, setLicenseFile] = useState(null);

  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f && f.type !== 'application/pdf') {
      setErr('Please upload a PDF file for license.');
      e.target.value = null;
      return;
    }
    setErr(null);
    setLicenseFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(null);

    // Basic validation
    if (!name || !clinicName || !email || !password || !mobile) {
      setErr('Please fill name, clinic name, email, password and mobile.');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      setErr('Mobile must be 10 digits.');
      return;
    }
    if (altMobile && !/^\d{10}$/.test(altMobile)) {
      setErr('Alternate mobile invalid.');
      return;
    }
    if (!pickedLocation) {
      setErr('Please pick/confirm your clinic location.');
      return;
    }
    if (!licenseFile) {
      setErr('Please upload your license PDF.');
      return;
    }

    setLoading(true);

    // build FormData
    const fd = new FormData();
    fd.append('name', name);
    fd.append('clinicName', clinicName);
    fd.append('email', email);
    fd.append('password', password);
    fd.append('mobile', mobile);
    fd.append('altMobile', altMobile);
    fd.append('gender', gender);
    // location as JSON string
    fd.append('location', JSON.stringify(pickedLocation));
    // license file
    fd.append('license', licenseFile);

    try {
      // Use fetch directly because post() helper is JSON-only
      const res = await fetch('http://localhost:5000/api/practitioners/register', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      setLoading(false);
      if (json.ok) {
        localStorage.setItem('token', json.token);
        localStorage.setItem('practitioner', JSON.stringify(json.practitioner));
        onAuth(json.practitioner);
        onClose();
      } else {
        setErr(json.message || 'Failed to register.');
      }
    } catch (err2) {
      setLoading(false);
      console.error('practitioner signup error', err2);
      setErr('Network error.');
    }
  }

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-centered" style={{ maxWidth: 820 }}>
        <div className="modal-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="m-0">Practitioner — Create account</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-2">
            <div className="row g-2">
              <div className="col-md-6">
                <input className="form-control" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="col-md-6">
                <input className="form-control" placeholder="Clinic name" value={clinicName} onChange={e => setClinicName(e.target.value)} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-md-6">
                <input className="form-control" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="col-md-6">
                <input className="form-control" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-md-4">
                <input className="form-control" placeholder="Mobile (10 digits)" value={mobile} onChange={e => setMobile(e.target.value)} />
              </div>
              <div className="col-md-4">
                <input className="form-control" placeholder="Alternate mobile (optional)" value={altMobile} onChange={e => setAltMobile(e.target.value)} />
              </div>
              <div className="col-md-4">
                <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 small text-muted">Clinic location — drag marker or search and confirm below</div>
              <MapPickerLeaflet initial={pickedLocation || { latitude: 12.9716, longitude: 77.5946 }} onChange={(loc) => setPickedLocation(loc)} />
            </div>

            <div>
              <label className="form-label">Upload license (PDF)</label>
              <input className="form-control" type="file" accept="application/pdf" onChange={onFileChange} />
            </div>

            <div className="d-flex gap-2 mt-2">
              <button className="btn btn-primary btn-lg flex-grow-1" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
              <button type="button" className="btn btn-outline-secondary btn-lg" onClick={onClose}>Cancel</button>
            </div>
            {err && <div className="text-danger mt-2">{err}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
