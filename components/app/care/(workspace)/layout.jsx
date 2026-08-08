import FeatureNav from '@/components/agent/FeatureNav';

// Everything inside a feature gets the sidebar. The hub at /care sits outside
// this group, so it renders full width without it.

export default function WorkspaceLayout({ children }) {
  return (
    <div className="console">
      <FeatureNav />
      {children}
    </div>
  );
}
