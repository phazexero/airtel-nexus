'use client';

// The last boundary. This one replaces the root layout, so it has to bring its
// own html and body, and it cannot rely on anything above it having rendered.

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="err">
          <div className="err-card" role="alert">
            <span className="err-mark" aria-hidden="true">!</span>
            <h1>The app failed to start</h1>
            <p>
              This is the outermost failure, so nothing rendered at all. Reloading usually
              clears it. If it does not, stop the dev server, delete the .next directory and
              start again.
            </p>
            {error?.message && <pre className="err-detail">{error.message}</pre>}
            <div className="err-actions">
              <button className="btn primary" onClick={reset}>
                Try again
              </button>
              <button className="btn" onClick={() => window.location.reload()}>
                Reload the page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
