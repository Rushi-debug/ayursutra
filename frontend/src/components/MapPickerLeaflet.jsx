// MapPickerLeaflet.jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-control-geocoder'; // adds L.Control.Geocoder

// fix default icon issue in some bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

/*
Props:
  - initial: { latitude, longitude }  // center
  - onChange(loc) called when marker moves or search result chosen. loc = { latitude, longitude, address? }
  - height (optional) default 360
*/
export default function MapPickerLeaflet({ initial = { latitude: 12.9716, longitude: 77.5946 }, onChange, height = 360 }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedAddr, setSelectedAddr] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // create map
    if (!mapRef.current) {
      mapRef.current = L.map(mapEl.current, {
        center: [initial.latitude, initial.longitude],
        zoom: 14,
        attributionControl: true,
      });

      // OSM tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // marker
      markerRef.current = L.marker([initial.latitude, initial.longitude], { draggable: true }).addTo(mapRef.current);

      // reverse geocode helper
      const reverseGeocode = async (lat, lon) => {
        try {
          setLoadingAddr(true);
          setError(null);
          // Nominatim reverse geocode (public). Keep usage light.
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
          const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (!resp.ok) throw new Error('Reverse geocode failed');
          const json = await resp.json();
          const display = json.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
          setSelectedAddr(display);
          onChange && onChange({ latitude: lat, longitude: lon, address: display });
        } catch (err) {
          console.error('Reverse geocode error', err);
          setError('Unable to lookup address (try again).');
          onChange && onChange({ latitude: lat, longitude: lon });
        } finally {
          setLoadingAddr(false);
        }
      };

      // marker drag event
      markerRef.current.on('dragend', (ev) => {
        const pos = ev.target.getLatLng();
        mapRef.current.panTo(pos);
        reverseGeocode(pos.lat, pos.lng);
      });

      // click map to move marker
      mapRef.current.on('click', (ev) => {
        markerRef.current.setLatLng(ev.latlng);
        mapRef.current.panTo(ev.latlng);
        reverseGeocode(ev.latlng.lat, ev.latlng.lng);
      });

      // add geocoder (leaflet-control-geocoder - uses Nominatim by default)
      if (L.Control && L.Control.Geocoder) {
        const geocoder = L.Control.Geocoder.nominatim();
        const ctrl = L.Control.geocoder({
          query: '',
          placeholder: 'Search address...',
          geocoder,
          defaultMarkGeocode: false,
        }).addTo(mapRef.current);

        ctrl.on('markgeocode', function(e) {
          const center = e.geocode.center;
          markerRef.current.setLatLng(center);
          mapRef.current.setView(center, Math.max(mapRef.current.getZoom(), 14));
          // display name might be in e.geocode.name or use reverseGeocode for more detail
          const display = e.geocode.name || `${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`;
          setSelectedAddr(display);
          onChange && onChange({ latitude: center.lat, longitude: center.lng, address: display });
        });
      }
    }

    // cleanup on unmount
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (err) { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initial reverse geocode once
  useEffect(() => {
    async function initialLookup() {
      const lat = initial.latitude;
      const lon = initial.longitude;
      // small delay to allow map to mount
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) throw new Error('Reverse geocode failed');
        const json = await resp.json();
        const display = json.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        setSelectedAddr(display);
        onChange && onChange({ latitude: lat, longitude: lon, address: display });
      } catch (err) {
        console.warn('initial reverse geocode failed', err);
      }
    }
    initialLookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div ref={mapEl} style={{ width: '100%', height: height, borderRadius: 12, overflow: 'hidden', background: '#eee' }} />

      <div className="mt-2 d-flex justify-content-between align-items-center">
        <div>
          <div className="small text-muted">Selected:</div>
          <div className="fw-semibold">{loadingAddr ? 'Looking up...' : (selectedAddr || `${initial.latitude.toFixed(5)}, ${initial.longitude.toFixed(5)}`)}</div>
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
        <div className="small text-muted">Tip: drag marker, click map or search</div>
      </div>
    </div>
  );
}
