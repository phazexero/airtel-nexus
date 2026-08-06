import FeaturePane from '@/components/agent/FeaturePane';
import CampaignStudio from '@/components/agent/CampaignStudio';

export const metadata = { title: 'Campaign studio — Nexus Care' };

export default function CampaignsPage() {
  return (
    <FeaturePane
      title="Campaign studio"
      lede="Pin-code clusters instead of cities. Pick a micro-market, then build the brief off what that cluster actually shows."
    >
      <CampaignStudio />
    </FeaturePane>
  );
}
