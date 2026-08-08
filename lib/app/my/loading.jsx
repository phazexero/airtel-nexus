import { Skel } from '@/components/ui/Skeleton';

export default function MyLoading() {
  return (
    <div className="app-stage">
      <div className="stage-left">
        <div className="phone">
          <div className="phone-status">
            <span className="mono">9:41</span>
            <span>Airtel 5G</span>
          </div>
          <div className="phone-body">
            <div className="app-header">
              <Skel w={40} h={40} r={99} />
              <div style={{ flex: 1 }}>
                <Skel w="52%" h={12} />
                <Skel w="38%" h={9} style={{ marginTop: 6 }} />
              </div>
            </div>
            <Skel w="100%" h={168} r={24} style={{ marginBottom: 16 }} />
            <div className="quick-grid">
              {[0, 1, 2, 3].map((i) => (
                <Skel key={i} w="100%" h={62} r={16} />
              ))}
            </div>
            <Skel w="100%" h={74} r={16} style={{ marginBottom: 10 }} />
            <Skel w="100%" h={74} r={16} />
          </div>
        </div>
      </div>
      <aside className="rail" />
    </div>
  );
}
