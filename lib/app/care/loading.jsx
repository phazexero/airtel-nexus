import { Skel } from '@/components/ui/Skeleton';

// Hub-shaped loading UI. Streams while the server resolves the session.

export default function CareLoading() {
  return (
    <div className="hub">
      <div className="hub-inner">
        <header className="hub-head">
          <Skel w={220} h={10} />
          <Skel w="46%" h={38} style={{ margin: '16px 0 14px' }} />
          <Skel w="72%" h={12} />
        </header>
        <div className="hub-stats">
          {[0, 1, 2, 3].map((i) => (
            <div className="hub-stat" key={i}>
              <Skel w="70%" h={9} />
              <Skel w="48%" h={22} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
        <div className="hub-grid">
          {[0, 1, 2].map((i) => (
            <div className="hub-card" key={i} style={{ pointerEvents: 'none' }}>
              <Skel w={40} h={40} r={12} />
              <Skel w="52%" h={20} style={{ margin: '18px 0 12px' }} />
              <Skel w="100%" h={10} />
              <Skel w="88%" h={10} style={{ marginTop: 8 }} />
              <Skel w="64%" h={10} style={{ marginTop: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
