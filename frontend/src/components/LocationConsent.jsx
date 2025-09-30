// LocationConsent.jsx (use this instead of Google map version)
import React, { useState } from 'react';
import MapPickerLeaflet from './MapPickerLeaflet';

export default function LocationConsent({ onAllow, onCancel, title = 'Allow location access' }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [captured, setCaptured] = useState(null); // geolocation raw
  const [picked, setPicked] = useState(null);     // adjusted by user

  async function requestLocation() {
    setErr(null);
    setLoading(true);

    if (!('geolocation' in navigator)) {
      setErr('Geolocation is not available in your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const payload = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCaptured(payload);
        setPicked(payload);
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) setErr('Permission denied. Please enable location access in your browser.');
        else if (error.code === error.POSITION_UNAVAILABLE) setErr('Position unavailable.');
        else if (error.code === error.TIMEOUT) setErr('Location request timed out.');
        else setErr('Failed to get location: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function handleConfirm() {
    if (!picked) {
      setErr('No location chosen.');
      return;
    }
    onAllow(picked);
  }

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-centered" style={{ maxWidth: 820 }}>
        <div className="modal-card p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="m-0">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
          </div>

          {!captured ? (
            <>
              <p className="mb-2">We need your location to personalize services... Click <strong>Allow location</strong>.</p>
              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={requestLocation} disabled={loading}>
                  {loading ? 'Locating…' : 'Allow location'}
                </button>
                <button className="btn btn-outline-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
              </div>
              {err && <div className="text-danger mt-2">{err}</div>}
            </>
          ) : (
            <>
              <div className="mb-2">Adjust your location by dragging the marker, clicking map, or searching. Then press <strong>Confirm location</strong>.</div>

              <MapPickerLeaflet
                initial={captured}
                onChange={(loc) => setPicked({ latitude: loc.latitude, longitude: loc.longitude, address: loc.address })}
                height={360}
              />

              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-success" onClick={handleConfirm}>Confirm location</button>
                <button className="btn btn-outline-secondary" onClick={() => { setCaptured(null); setPicked(null); }}>Retry</button>
              </div>

              <div className="mt-2 small text-muted">Captured: {captured.latitude.toFixed(5)}, {captured.longitude.toFixed(5)} — Accuracy: {captured.accuracy ? `${captured.accuracy}m` : 'unknown'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
