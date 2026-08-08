import { SkelStats, SkelCard } from '@/components/ui/Skeleton';

export default function WorkspaceLoading() {
  return (
    <section className="workspace">
      <div className="ws-body">
        <SkelStats />
        <div className="grid-2">
          <SkelCard lines={7} />
          <SkelCard lines={7} />
        </div>
      </div>
    </section>
  );
}
