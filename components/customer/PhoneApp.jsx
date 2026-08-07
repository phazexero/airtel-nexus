'use client';

import { useDb } from '@/lib/db';
import { APP_USER, RECHARGE_PACKS, APP_USER_ID } from '@/lib/data';
import { Skel } from '@/components/ui/Skeleton';
import OffersTab from './OffersTab';
import KycFlow from './KycFlow';
import FamilyTab from './FamilyTab';
import OnboardTab from './OnboardTab';

const TABS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'family', label: 'Family', icon: '⚭' },
  { id: 'recharge', label: 'Recharge', icon: '↻' },
  { id: 'offers', label: 'Offers', icon: '◆' },
  { id: 'bank', label: 'Money', icon: '₹' },
  { id: 'help', label: 'Help', icon: '☎' },
];

export default function PhoneApp({ tab, setTab }) {
  const { state } = useDb();
  const me = state.customers.find((c) => c.id === APP_USER_ID);
  const loading = state.status !== 'ready';
  const unread = state.offers.filter((o) => o.toId === APP_USER_ID && o.status === 'new').length;

  return (
    <div className="phone">
      <div className="phone-status">
        <span className="mono">9:41</span>
        <span>Airtel 5G · 84%</span>
      </div>

      <div className="phone-body">
        <div className="app-header">
          <div className="avatar">{me?.initials}</div>
          <div>
            <h1>{me?.name}</h1>
            <p>{me?.phone} · Prepaid</p>
          </div>
          <button className="bell" onClick={() => setTab('offers')} aria-label="Open offers">
            ◆{unread > 0 && <span>{unread}</span>}
          </button>
        </div>

        {loading && <PhoneSkeleton />}

        {!loading && tab === 'home' && <HomeTab setTab={setTab} unread={unread} me={me} />}
        {!loading && tab === 'recharge' && <RechargeTab />}
        {!loading && tab === 'offers' && <OffersTab setTab={setTab} />}
        {!loading && tab === 'family' && <FamilyTab setTab={setTab} />}
        {!loading && tab === 'kyc' && <KycFlow setTab={setTab} />}
        {!loading && tab === 'onboard' && <OnboardTab setTab={setTab} />}
        {!loading && tab === 'bank' && <BankTab />}
        {!loading && tab === 'help' && <HelpTab />}
      </div>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-on={tab === t.id || (tab === 'onboard' && t.id === 'offers') || (tab === 'kyc' && t.id === 'home')}
            onClick={() => setTab(t.id)}
          >
            <b>{t.icon}</b>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function PhoneSkeleton() {
  return (
    <>
      <Skel w="100%" h={168} r={24} style={{ marginBottom: 16 }} />
      <div className="quick-grid">
        {[0, 1, 2, 3].map((i) => (
          <Skel key={i} w="100%" h={62} r={16} />
        ))}
      </div>
      <Skel w="42%" h={11} style={{ margin: '22px 0 12px' }} />
      <Skel w="100%" h={74} r={16} style={{ marginBottom: 10 }} />
      <Skel w="100%" h={74} r={16} />
    </>
  );
}

function HomeTab({ setTab, unread, me }) {
  const { state, dispatch } = useDb();
  const used = APP_USER.dataTotalGb - APP_USER.dataLeftGb;
  const pct = Math.round((used / APP_USER.dataTotalGb) * 100);

  const broadband = state.requests.find((r) => r.type === 'broadband');
  const kycDone = state.kyc === 'verified';

  function requestBroadband() {
    dispatch({
      type: 'RAISE_REQUEST',
      request: {
        type: 'broadband',
        from: me?.name ?? 'Customer',
        fromId: APP_USER_ID,
        title: 'Xstream Fiber broadband',
        note: 'Asked for a broadband connection from the app. Building is fiber-ready.',
      },
    });
  }

  return (
    <>
      <div className="balance-card">
        <span className="eyebrow">Prepaid ₹299 pack</span>
        <div className="balance-row">
          <strong>{APP_USER.dataLeftGb} GB</strong>
          <em>left of {APP_USER.dataTotalGb} GB</em>
        </div>
        <div className="meter">
          <i style={{ width: `${pct}%` }} />
        </div>
        <footer>
          <span>{APP_USER.validityDays} days validity left</span>
          <span>Expires 12 Aug</span>
        </footer>
        <button className="btn block" onClick={() => setTab('recharge')}>
          Recharge now
        </button>
      </div>

      {/* The exhaustion itself, stated plainly. Everything below it is a
          response to this number, so it has to come first and be specific. */}
      <div className="usage-panel">
        <div className="usage-top">
          <span className="eyebrow">Data this cycle</span>
          <span className="usage-flag">{pct}% used</span>
        </div>
        <strong>
          {used.toFixed(1)} GB <em>of {APP_USER.dataTotalGb} GB</em>
        </strong>
        <div className="usage-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p>
          You ran out on day 24 of 28. This is the third time this quarter, and you have bought 4
          top-ups worth ₹484 above what the pack already covers.
        </p>
      </div>

      {/* Alert one: the plan change. Goes to KYC imaging, because that is the
          only step standing between prepaid and postpaid for this customer. */}
      <div className="alert-card alert-primary">
        <span className="alert-icon" aria-hidden="true">∞</span>
        <div className="alert-body">
          <h3>Switch to postpaid for unlimited data</h3>
          <p>
            No more top-ups and no validity to watch. Unlimited calls, 75 GB with rollover, and one
            bill on a date you choose, for ₹549 a month.
          </p>
          {kycDone ? (
            <span className="pill good">KYC verified · starts next cycle</span>
          ) : (
            <button className="btn primary block" onClick={() => setTab('kyc')}>
              Switch to postpaid
            </button>
          )}
        </div>
      </div>

      {/* Alert two: broadband. Raises a request rather than pretending to
          provision anything, which is what actually happens on this path. */}
      <div className="alert-card">
        <span className="alert-icon" aria-hidden="true">◎</span>
        <div className="alert-body">
          <h3>Get a broadband connection</h3>
          <p>
            Your building is already fiber-ready. Xstream Fiber runs 200 Mbps unlimited with 22 OTT
            apps included, and install takes about 48 hours.
          </p>
          {broadband ? (
            <div className="alert-raised" role="status">
              <b>We have raised a request for this to customer support.</b>
              <span>
                Reference {broadband.id.toUpperCase()} · raised at {broadband.at}. Someone will call
                you on this number.
              </span>
            </div>
          ) : (
            <button className="btn block" onClick={requestBroadband}>
              Request a broadband connection
            </button>
          )}
        </div>
      </div>

      {/* Third response to the same problem: the household, not the line. */}
      <div className="alert-card">
        <span className="alert-icon" aria-hidden="true">⚭</span>
        <div className="alert-body">
          <h3>Bundle the whole household</h3>
          <p>
            Four lines, four payment dates and five subscriptions between you. There is a version of
            this that costs less and arrives on one bill.
          </p>
          <button className="btn block" onClick={() => setTab('family')}>
            See the household bundle
          </button>
        </div>
      </div>

      <div className="quick-grid">
        <button className="quick" onClick={() => setTab('recharge')}>
          <b>↻</b>Recharge
        </button>
        <button className="quick" onClick={() => setTab('bank')}>
          <b>₹</b>Pay
        </button>
        <button className="quick" onClick={() => setTab('offers')}>
          <b>◆</b>Offers
        </button>
        <button className="quick" onClick={() => setTab('help')}>
          <b>☎</b>Help
        </button>
      </div>

      {unread > 0 && (
        <div className="tile" style={{ borderColor: '#f7cccc', background: 'linear-gradient(160deg,var(--red-wash),var(--paper) 65%)' }}>
          <span className="ai-tag">Picked for you</span>
          <h3 style={{ marginTop: 8 }}>
            {unread} new {unread === 1 ? 'offer' : 'offers'} waiting
          </h3>
          <p>Based on how you have been using your pack this quarter.</p>
          <button className="btn ai block" style={{ marginTop: 12 }} onClick={() => setTab('offers')}>
            See what changed
          </button>
        </div>
      )}

      <div className="sec-head">
        <h2>Your services</h2>
      </div>
      <div className="tile">
        <h3>Mobile · Prepaid</h3>
        <p>98301 •• 4471 · ₹299 pack · renews 12 Aug</p>
      </div>
      <div className="tile" style={{ opacity: 0.72 }}>
        <h3>Xstream Fiber</h3>
        <p>
          {broadband
            ? 'Request raised. Customer support will confirm your install slot.'
            : 'Not active. Your building is fiber-ready, install takes about 48 hours.'}
        </p>
      </div>
      <div className="tile" style={{ opacity: 0.72 }}>
        <h3>Airtel Black</h3>
        <p>Not active. Puts mobile, fiber and DTH on one bill.</p>
      </div>
    </>
  );
}

function RechargeTab() {
  return (
    <>
      <div className="sec-head">
        <h2>Packs for 98301 •• 4471</h2>
      </div>
      <div className="tile">
        {RECHARGE_PACKS.map((p) => (
          <div className="pack-row" key={p.id}>
            <strong>₹{p.price}</strong>
            <div>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{p.data}</span>
              <small>
                {p.days} {p.days === 1 ? 'day' : 'days'} · {p.tag}
              </small>
            </div>
            <button className="btn">Pay</button>
          </div>
        ))}
      </div>
      <div className="tile">
        <span className="ai-tag">Worth knowing</span>
        <h3 style={{ marginTop: 8 }}>You are on the ₹299 pack</h3>
        <p>
          With top-ups you paid ₹1,281 over the last four cycles. The ₹3,599 annual pack works out
          to ₹300 a month with more daily data.
        </p>
      </div>
    </>
  );
}

function BankTab() {
  return (
    <>
      <div className="balance-card" style={{ background: 'linear-gradient(150deg,#14171f 0%,#2b3243 100%)' }}>
        <span className="eyebrow">Payments Bank balance</span>
        <div className="balance-row">
          <strong>₹1,240</strong>
          <em>available</em>
        </div>
        <footer style={{ marginTop: 14 }}>
          <span>Savings at 7% p.a.</span>
          <span>₹5 lakh insured</span>
        </footer>
      </div>
      <div className="quick-grid">
        <button className="quick"><b>⇅</b>Send</button>
        <button className="quick"><b>▤</b>Bills</button>
        <button className="quick"><b>◫</b>Deposit</button>
        <button className="quick"><b>◷</b>History</button>
      </div>
      <div className="sec-head">
        <h2>Grow your money</h2>
      </div>
      <div className="tile">
        <h3>Fixed deposit at 8.5% p.a.</h3>
        <p>
          Booked with a partner small finance bank, insured up to ₹5 lakh. Opens from here in about
          four minutes with no branch visit.
        </p>
        <button className="btn block" style={{ marginTop: 12 }}>Check the rates</button>
      </div>
      <div className="tile">
        <h3>Savings at 7% p.a.</h3>
        <p>Zero balance account. Already active on this number.</p>
      </div>
    </>
  );
}

function HelpTab() {
  return (
    <>
      <div className="sec-head">
        <h2>Get help</h2>
      </div>
      <div className="tile">
        <h3>Chat with us</h3>
        <p>Average wait right now is under a minute.</p>
        <button className="btn primary block" style={{ marginTop: 12 }}>Start a chat</button>
      </div>
      <div className="tile">
        <h3>Your open requests</h3>
        <p>Data exhausted before cycle end · raised today · with an agent</p>
      </div>
      <div className="tile">
        <span className="eyebrow">Behind the scenes</span>
        <h3 style={{ marginTop: 8 }}>Why this ticket goes to a person</h3>
        <p>
          Three data exhaustion tickets in one quarter is a product-fit signal, not a support
          problem. The queue flags it so an agent can fix the plan rather than close the ticket.
        </p>
      </div>
    </>
  );
}
