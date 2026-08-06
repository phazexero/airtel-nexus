'use client';

// Skeletons shaped like the thing they stand in for. A grey box that matches
// the final layout reads as "loading"; a spinner in the middle of the screen
// reads as "stuck".

export function Skel({ w = '100%', h = 12, r = 6, style }) {
  return <span className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkelLines({ n = 3, last = '70%' }) {
  return (
    <div className="skel-lines">
      {Array.from({ length: n }).map((_, i) => (
        <Skel key={i} w={i === n - 1 ? last : '100%'} h={10} />
      ))}
    </div>
  );
}

export function SkelStats({ n = 4 }) {
  return (
    <div className="grid-4" style={{ marginBottom: 16 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div className="stat" key={i}>
          <Skel w="52%" h={9} />
          <Skel w="68%" h={26} style={{ margin: '10px 0 8px' }} />
          <Skel w="84%" h={9} />
        </div>
      ))}
    </div>
  );
}

export function SkelQueue({ n = 6 }) {
  return (
    <div className="queue-list">
      {Array.from({ length: n }).map((_, i) => (
        <div className="qrow" key={i} style={{ animation: 'none' }}>
          <div className="qrow-top">
            <Skel w={7} h={7} r={99} />
            <Skel w={108} h={11} />
          </div>
          <Skel w="88%" h={9} style={{ marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function SkelCard({ lines = 5 }) {
  return (
    <div className="card">
      <header>
        <Skel w={130} h={12} />
      </header>
      <SkelLines n={lines} />
    </div>
  );
}

export function LoadFail({ onRetry }) {
  return (
    <div className="empty-studio">
      <h3>Could not load the working set</h3>
      <p>
        The seed endpoint did not answer. Nothing is lost, and retrying usually clears it. If it
        keeps failing, check that <code>/api/data</code> is reachable.
      </p>
      {onRetry && (
        <button className="btn primary" style={{ marginTop: 18 }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
