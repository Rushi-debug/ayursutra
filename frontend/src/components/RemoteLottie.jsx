import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

export default function RemoteLottie({ url, style }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (!cancelled) setData(json)
      })
      .catch(err => console.error('Failed to load Lottie JSON', err))
    return () => (cancelled = true)
  }, [url])

  if (!data) return <div className="placeholder">Loading…</div>
  return <Lottie animationData={data} loop style={style || { width: 300, height: 240 }} />
}
