import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="err">
      <div className="err-card">
        <span className="err-mark" aria-hidden="true">?</span>
        <h1>Nothing here</h1>
        <p>
          That address does not match a screen in either app. The distributor console lives
          under /care and the customer app under /my.
        </p>
        <div className="err-actions">
          <Link href="/care" className="btn primary">Distributor console</Link>
          <Link href="/my" className="btn">Customer app</Link>
          <Link href="/" className="btn ghost">Back to start</Link>
        </div>
      </div>
    </div>
  );
}
