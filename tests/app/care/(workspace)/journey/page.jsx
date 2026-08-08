import FeaturePane from '@/components/agent/FeaturePane';
import JourneyView from '@/components/agent/JourneyView';

export const metadata = { title: 'Distributor journey — AltCare' };

export default function JourneyPage() {
  return (
    <FeaturePane
      title="Distributor journey"
      waitForData={false}
      lede="The five stages of a distributor's day, and which part of this console runs each one. Every stage links straight into the tool that does the work."
    >
      <JourneyView />
    </FeaturePane>
  );
}
