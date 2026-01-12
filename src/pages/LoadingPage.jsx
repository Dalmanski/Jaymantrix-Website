import React from 'react'

export default function LoadingPage({ progress, visible, failed = false, message = '', onRefresh = null }) {
  return (
    <div className={"jm-loading-page" + (visible ? " jm-visible" : " jm-hidden")}>
      <div className="jm-loading-inner">
        <div className="jm-loading-text">Loading Jaymantrix Website. Pls wait...</div>
        <div className="jm-loading-percent">{progress ?? 0}%</div>
        {message ? <div className="jm-loading-message">{message}</div> : null}
        {failed ? (
          <div className="jm-loading-actions">
            <button className="jm-refresh-btn" onClick={() => { try { if (onRefresh) onRefresh(); else window.location.reload() } catch (e) { try { window.location.reload() } catch (e) {} } }}>
              Refresh page
            </button>
            <div className="jm-loading-tip">If refreshing helps, please try refreshing the page.</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
