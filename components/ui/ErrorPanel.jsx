'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// ===========================================================================
//  ERROR PANEL
//
//  Shared by every error boundary in the app.
//
//  A demo that white-screens is over. A demo that shows one broken panel with a
//  working retry is recoverable in front of an audience, which is the only
//  reason these boundaries exist at this scale.
//
//  The message is shown, not swallowed. Hiding it would mean standing in front
//  of a room with no idea what just happened.
// ===========================================================================

export default function ErrorPanel({ error, reset, scope = 'this screen', home = '/' }) {
  useEffect(() => {
    console.error(`[${scope}]`, error);
  }, [error, scope]);

  return (
    <div className="err">
      <div className="err-card" role="alert">
        <span className="err-mark" aria-hidden="true">!</span>
        <h1>Something broke in {scope}</h1>
        <p>
          The rest of the app is fine. Retrying re-renders this section without reloading the
          page, so nothing you have done so far is lost.
        </p>

        {error?.message && <pre className="err-detail">{error.message}</pre>}

        <div className="err-actions">
          {reset && (
            <button className="btn primary" onClick={reset}>
              Try again
            </button>
          )}
          <button className="btn" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <Link href={home} className="btn ghost">
            Back to start
          </Link>
        </div>

        {error?.digest && <p className="err-digest">Reference {error.digest}</p>}
      </div>
    </div>
  );
}
