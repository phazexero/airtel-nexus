'use client';

import { useDb } from '@/lib/db';
import { SkelStats, SkelCard, LoadFail } from '@/components/ui/Skeleton';

// The Campaign and Performance features have no queue beside them, so they get
// a titled pane instead. Both wait on the same working set, so the loading and
// failure handling lives here once rather than in each feature.

// `waitForData` is on by default because most features are useless without the
// working set. The journey is the exception: it is static content about the
// product, so gating it behind a data fetch would be a skeleton for no reason.
export default function FeaturePane({ title, lede, children, waitForData = true }) {
  const { state, reset } = useDb();

  return (
    <section className="workspace">
      <header className="pane-head">
        <h1>{title}</h1>
        <p>{lede}</p>
      </header>

      <div className="ws-body">
        {waitForData && state.status === 'error' && <LoadFail onRetry={reset} />}

        {waitForData && state.status === 'loading' && (
          <>
            <SkelStats />
            <div className="grid-2">
              <SkelCard lines={7} />
              <SkelCard lines={7} />
            </div>
          </>
        )}

        {(!waitForData || state.status === 'ready') && children}
      </div>
    </section>
  );
}
