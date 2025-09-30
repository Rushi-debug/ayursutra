// loadGoogleMaps.js
export function loadGoogleMaps(apiKey, libraries = ['places']) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.google && window.google.maps) return resolve(window.google);

    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google) resolve(window.google);
        else reject(new Error('Google script loaded but no window.google'));
      });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');

    const libs = libraries && libraries.length ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libs}&v=weekly`;
    script.onload = () => {
      if (window.google) resolve(window.google);
      else reject(new Error('Google Maps loaded but window.google missing'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}
