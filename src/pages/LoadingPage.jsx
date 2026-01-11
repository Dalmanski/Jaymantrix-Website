import React from 'react'

export default function LoadingPage({ progress, visible }) {
  return (
    <div className={"jm-loading-page" + (visible ? " jm-visible" : " jm-hidden")}>
      <div className="jm-loading-inner">
        <div className="jm-loading-text">Loading Jaymantrix Website. Pls wait...</div>
        <div className="jm-loading-percent">{progress ?? 0}%</div>
      </div>
    </div>
  )
}
