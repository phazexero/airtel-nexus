import FeaturePane from '@/components/agent/FeaturePane';
import Performance from '@/components/agent/Performance';

export const metadata = { title: 'Performance — AltCare' };

export default function PerformancePage() {
  return (
    <FeaturePane
      title="Performance"
      lede="What the two features are meant to move, with the assumptions behind each number kept in one place."
    >
      <Performance />
    </FeaturePane>
  );
}
