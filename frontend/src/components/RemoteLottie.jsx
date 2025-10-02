import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

const RemoteLottie = ({ url }) => {
  const containerRef = useRef(null);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    let animation;
    if (containerRef.current) {
      try {
        animation = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: url,
        });
        animation.addEventListener('data_failed', () => {
          setError('Failed to load animation');
        });
      } catch (err) {
        setError('Error loading animation');
        console.error('Lottie error:', err);
      }
    }
    return () => {
      if (animation) animation.destroy();
    };
  }, [url]);

  return (
    <div className="animWrap">
      {error ? (
        <div className="placeholder">Animation Failed: {error}</div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};

export default RemoteLottie;