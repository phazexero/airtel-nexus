'use client';

import { useEffect, useState } from 'react';
import { useDb } from '@/lib/db';
import { APP_USER_ID } from '@/lib/data';

// ===========================================================================
//  KYC IMAGING
//
//  Capture is simulated. A real build swaps captureNow() for a getUserMedia
//  stream drawn to a canvas, and swaps the checks below for whatever the KYC
//  vendor returns. The step machine, the quality gate and the retake path all
//  stay the same, which is why they are worth having in the demo: the awkward
//  part of KYC is not the camera, it is what happens when an image fails.
// ===========================================================================

const SHOTS = [
  {
    id: 'front',
    label: 'Front of your ID',
    hint: 'Lay it flat, fill the frame, and keep all four corners inside the guides.',
    checks: ['All four edges detected', 'Text is legible', 'No glare across the photo'],
    frame: 'card',
  },
  {
    id: 'back',
    label: 'Back of your ID',
    hint: 'Same again. Make sure the address block is in focus.',
    checks: ['All four edges detected', 'Address block readable', 'No shadow across the strip'],
    frame: 'card',
  },
  {
    id: 'face',
    label: 'A live photo of you',
    hint: 'Look straight at the camera in even light. Remove glasses if there is glare.',
    checks: ['Face centred in frame', 'Eyes open and visible', 'Matches the photo on your ID'],
    frame: 'face',
  },
];

export default function KycFlow({ setTab }) {
  const { state, dispatch } = useDb();
  const me = state.customers.find((c) => c.id === APP_USER_ID);

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('aim'); // aim | reading | review | verifying | done
  const [captured, setCaptured] = useState({});

  const shot = SHOTS[step];
  const isLast = step === SHOTS.length - 1;

  // Quality read after a capture. Deliberately not instant, because an
  // instant pass reads as fake and hides the state the retake path lives in.
  useEffect(() => {
    if (phase !== 'reading') return undefined;
    const t = setTimeout(() => setPhase('review'), 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'verifying') return undefined;
    const t = setTimeout(() => {
      setPhase('done');
      dispatch({ type: 'KYC_STATUS', status: 'verified', customer: me?.name ?? 'Customer' });
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, dispatch, me]);

  function captureNow() {
    // === CAMERA INTEGRATION POINT ===
    // const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: shot.id === 'face' ? 'user' : 'environment' } });
    // draw the current frame to a canvas, then hand the blob to the KYC vendor.
    setCaptured((c) => ({ ...c, [shot.id]: true }));
    setPhase('reading');
  }

  if (phase === 'done') {
    return (
      <>
        <div className="kyc-done">
          <span className="kyc-tick" aria-hidden="true">✓</span>
          <h2>KYC verified</h2>
          <p>
            Your documents cleared. Postpaid Infinity 549 starts from your next billing cycle, and
            your number, balance and validity carry across untouched.
          </p>
        </div>

        <div className="tile">
          <span className="eyebrow">What happens next</span>
          <ul className="steps" style={{ marginTop: 8 }}>
            <li>
              <span className="step-dot" data-done="true">✓</span>
              <div>
                <b>Documents verified</b>
                No branch visit, no paperwork to post.
              </div>
            </li>
            <li>
              <span className="step-dot" data-done="true">✓</span>
              <div>
                <b>Plan queued</b>
                Unlimited calls and 75 GB with rollover, ₹549 a month.
              </div>
            </li>
            <li>
              <span className="step-dot">3</span>
              <div>
                <b>First bill</b>
                Generates on the date you pick in settings. Nothing to pay today.
              </div>
            </li>
          </ul>
        </div>

        <button className="btn primary block" onClick={() => setTab('home')}>
          Back to home
        </button>
      </>
    );
  }

  return (
    <>
      <div className="kyc-head">
        <button className="kyc-back" onClick={() => setTab('home')} aria-label="Back to home">
          ←
        </button>
        <div>
          <span className="eyebrow">Switch to postpaid</span>
          <h2>Complete your KYC</h2>
        </div>
      </div>

      <div className="kyc-progress" role="list">
        {SHOTS.map((s, i) => (
          <span key={s.id} role="listitem" data-state={captured[s.id] ? 'done' : i === step ? 'now' : 'todo'}>
            <i />
            {s.label.split(' ').slice(0, 2).join(' ')}
          </span>
        ))}
      </div>

      {phase === 'verifying' ? (
        <div className="kyc-verifying">
          <span className="kyc-spinner" aria-hidden="true" />
          <b>Verifying against the ID database</b>
          <span>This usually takes under a minute. You can stay on this screen.</span>
        </div>
      ) : (
        <>
          <div className="kyc-stage" data-frame={shot.frame} data-phase={phase}>
            {phase === 'aim' && <span className="kyc-hint-live">Align and hold steady</span>}
            {phase === 'reading' && <span className="kyc-scan" aria-hidden="true" />}

            {shot.frame === 'card' ? (
              <svg viewBox="0 0 200 126" className="kyc-doc" aria-hidden="true">
                <rect x="1" y="1" width="198" height="124" rx="9" />
                <circle cx="42" cy="52" r="19" />
                <path d="M23 88h38M84 34h92M84 52h92M84 70h64M84 96h56" />
              </svg>
            ) : (
              <svg viewBox="0 0 120 140" className="kyc-doc" aria-hidden="true">
                <circle cx="60" cy="52" r="26" />
                <path d="M16 136c4-27 22-42 44-42s40 15 44 42" />
              </svg>
            )}

            <span className="kyc-corner tl" /><span className="kyc-corner tr" />
            <span className="kyc-corner bl" /><span className="kyc-corner br" />
          </div>

          {phase === 'aim' && (
            <>
              <div className="tile">
                <h3>{shot.label}</h3>
                <p>{shot.hint}</p>
              </div>
              <button className="btn primary block kyc-shutter" onClick={captureNow}>
                Capture
              </button>
            </>
          )}

          {phase === 'reading' && (
            <div className="state-note">Reading the image and checking quality…</div>
          )}

          {phase === 'review' && (
            <>
              <div className="tile">
                <span className="eyebrow">Quality check passed</span>
                <ul className="kyc-checks">
                  {shot.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="offer-actions">
                <button
                  className="btn"
                  onClick={() => {
                    setCaptured((c) => ({ ...c, [shot.id]: false }));
                    setPhase('aim');
                  }}
                >
                  Retake
                </button>
                <button
                  className="btn primary"
                  onClick={() => {
                    if (isLast) return setPhase('verifying');
                    setStep(step + 1);
                    setPhase('aim');
                  }}
                >
                  {isLast ? 'Submit for verification' : 'Looks good'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      <p className="kyc-legal">
        Your documents are used only to verify this connection. Nothing is captured until you press
        the shutter, and you can retake any image before submitting.
      </p>
    </>
  );
}
