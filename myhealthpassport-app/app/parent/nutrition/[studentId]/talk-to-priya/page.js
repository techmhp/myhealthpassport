'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { mhbPriyaSession } from '@/services/secureApis';

const STATUS = { IDLE: 'idle', CONNECTING: 'connecting', ACTIVE: 'active' };

export default function TalkToPriyaPage() {
  const { studentId } = useParams();
  const router = useRouter();
  const vapiRef = useRef(null);

  const [callStatus, setCallStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (callStatus === STATUS.ACTIVE) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startCall = useCallback(async () => {
    setError('');
    setCallStatus(STATUS.CONNECTING);
    try {
      const res = await mhbPriyaSession(studentId);
      const parsed = typeof res === 'string' ? JSON.parse(res) : res;
      if (!parsed?.status || !parsed?.data?.publicKey) {
        throw new Error(parsed?.message || 'Could not start Priya session');
      }
      const { publicKey, assistant, context } = parsed.data;
      if (context?.speaker) setSpeakerName(context.speaker);

      const { default: Vapi } = await import('@vapi-ai/web');
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on('call-start', () => setCallStatus(STATUS.ACTIVE));
      vapi.on('call-end', () => { setCallStatus(STATUS.IDLE); vapiRef.current = null; });
      vapi.on('error', (e) => {
        console.error('[Priya] VAPI error:', e);
        setCallStatus(STATUS.IDLE);
        vapiRef.current = null;
        setError('Call ended unexpectedly. Please try again.');
      });

      await vapi.start(assistant);
    } catch (err) {
      console.error('[Priya] Start error:', err);
      setCallStatus(STATUS.IDLE);
      vapiRef.current = null;
      setError(String(err?.message || err));
    }
  }, [studentId]);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    vapiRef.current = null;
    setCallStatus(STATUS.IDLE);
  }, []);

  useEffect(() => {
    return () => { vapiRef.current?.stop(); vapiRef.current = null; };
  }, []);

  const isIdle = callStatus === STATUS.IDLE;
  const isConnecting = callStatus === STATUS.CONNECTING;
  const isActive = callStatus === STATUS.ACTIVE;

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-64px)] flex flex-col" style={{ background: 'linear-gradient(180deg, #F0F4FF 0%, #FAFBFF 50%, #FFFFFF 100%)' }}>
        {/* Top bar */}
        <div className="max-w-3xl w-full mx-auto px-4 pt-6">
          <button
            onClick={() => { if (isActive) endCall(); router.push(`/parent/health-records/${studentId}`); }}
            className="text-sm text-[#2563EB] font-medium hover:underline"
          >
            ← Back to Health Records
          </button>
        </div>

        {/* Main — centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">

          {/* ── Animated Orb ──────────────────────────── */}
          <div className="relative flex items-center justify-center mb-6" style={{ width: 160, height: 160 }}>
            {/* Outer pulse rings */}
            {isActive && (
              <>
                <div className="absolute rounded-full priya-pulse-1" style={{ width: 160, height: 160, background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)' }} />
                <div className="absolute rounded-full priya-pulse-2" style={{ width: 160, height: 160, background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)' }} />
              </>
            )}
            {isConnecting && (
              <div className="absolute rounded-full priya-ring-pulse" style={{ width: 160, height: 160, border: '2px solid rgba(37,99,235,0.3)' }} />
            )}

            {/* Main orb */}
            <div
              className={`relative rounded-full shadow-2xl flex items-center justify-center overflow-hidden ${
                isActive ? 'priya-orb-breathe' : isConnecting ? 'priya-orb-pulse' : ''
              }`}
              style={{
                width: 120, height: 120,
                background: isActive
                  ? 'linear-gradient(135deg, #16A34A, #059669, #0D9488)'
                  : 'linear-gradient(135deg, #2563EB, #7C3AED)',
                boxShadow: isActive
                  ? '0 8px 40px rgba(22,163,74,0.4)'
                  : '0 8px 40px rgba(37,99,235,0.3)',
                transition: 'background 0.6s ease, box-shadow 0.6s ease',
              }}
            >
              {/* Shimmer */}
              <div className={`absolute inset-0 ${isActive || isConnecting ? 'priya-shimmer' : ''}`}
                style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)' }}
              />
              {/* Inner glow */}
              {isActive && (
                <div className="absolute inset-0 rounded-full priya-inner-glow"
                  style={{ background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.25), transparent 60%)' }}
                />
              )}
              {/* Icon */}
              <div className="relative z-10 text-white">
                {isConnecting ? (
                  <svg className="animate-spin" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isActive ? 'priya-mic-pulse' : ''}>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Name + status */}
          <h1 className="text-[26px] font-bold text-[#1E293B] tracking-tight">Priya</h1>

          {isIdle && <p className="text-[14px] text-[#64748B] mt-1">Your AI Nutrition Companion</p>}
          {isConnecting && (
            <p className="text-[14px] text-[#2563EB] font-medium mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
              Connecting...
            </p>
          )}
          {isActive && (
            <p className="text-[14px] mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[#16A34A] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Connected
              </span>
              <span className="text-[#94A3B8] text-[12px]">{fmt(elapsed)}</span>
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
            <span className="rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1 text-[11px] font-medium text-[#1E40AF]">
              Knows your child
            </span>
            <span className="rounded-full bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1 text-[11px] font-medium text-[#166534]">
              ElevenLabs voice
            </span>
            <span className="rounded-full bg-[#FFF7ED] border border-[#FED7AA] px-3 py-1 text-[11px] font-medium text-[#9A3412]">
              Meal plans & grocery
            </span>
          </div>

          {/* Audio visualizer */}
          {isActive && (
            <div className="flex items-end justify-center gap-[4px] h-[40px] mb-4">
              {[0,1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="w-[3px] rounded-full bg-[#22C55E] priya-audio-bar"
                  style={{ animationDelay: `${i * 0.06}s`, animationDuration: `${0.4 + i * 0.06}s` }}
                />
              ))}
            </div>
          )}

          {/* Contextual text */}
          {isActive && (
            <div className="text-center mb-4">
              <p className="text-[14px] font-medium text-[#16A34A]">Priya is listening...</p>
              <p className="text-[12px] text-[#64748B] mt-1">
                Speak naturally {speakerName ? `· Hi ${speakerName}!` : ''}
              </p>
            </div>
          )}
          {isIdle && !error && (
            <p className="text-[14px] text-[#475569] max-w-[300px] text-center leading-[22px] mb-6">
              Tap below to talk with Priya. Log meals, get nutrition advice, plan your week, or get grocery suggestions.
            </p>
          )}
          {isConnecting && (
            <p className="text-[12px] text-[#64748B] mt-2 mb-6">Please allow microphone access</p>
          )}

          {/* Error */}
          {error && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] text-[13px] rounded-[8px] px-4 py-3 mb-6 max-w-sm text-center">
              {error}
            </div>
          )}

          {/* ── Main Action Button ─────────────────────── */}
          {isIdle && (
            <button
              onClick={startCall}
              className="w-[72px] h-[72px] rounded-full text-white flex items-center justify-center transition-all active:scale-95 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                boxShadow: '0 8px 32px rgba(37,99,235,0.35)',
              }}
              aria-label="Start call with Priya"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
          )}
          {isConnecting && (
            <div
              className="w-[72px] h-[72px] rounded-full text-white/60 flex items-center justify-center cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.5), rgba(124,58,237,0.5))' }}
            >
              <svg className="animate-spin" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
              </svg>
            </div>
          )}
          {isActive && (
            <button
              onClick={endCall}
              className="w-[72px] h-[72px] rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-center transition-all active:scale-95 hover:scale-105"
              style={{ boxShadow: '0 8px 32px rgba(220,38,38,0.35)' }}
              aria-label="End call"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="22" x2="2" y1="2" y2="22" />
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pb-6">
          <p className="text-[11px] text-[#94A3B8]">
            Powered by My Health Buddy · ElevenLabs voice
          </p>
        </div>
      </div>

      {/* CSS animations — pure CSS, no framer-motion needed */}
      <style jsx>{`
        @keyframes priyaPulse1 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes priyaPulse2 {
          0%, 100% { transform: scale(1.1); opacity: 0.3; }
          50% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes priyaRingPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes priyaOrbBreathe {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.06); }
          50% { transform: scale(0.98); }
          75% { transform: scale(1.04); }
        }
        @keyframes priyaOrbPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes priyaShimmer {
          0% { transform: translateX(-120px); }
          100% { transform: translateX(120px); }
        }
        @keyframes priyaInnerGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes priyaMicPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes priyaAudioBar {
          0%, 100% { height: 4px; }
          50% { height: 28px; }
        }
        .priya-pulse-1 { animation: priyaPulse1 2s ease-in-out infinite; }
        .priya-pulse-2 { animation: priyaPulse2 2.5s ease-in-out infinite 0.3s; }
        .priya-ring-pulse { animation: priyaRingPulse 1.5s ease-in-out infinite; }
        .priya-orb-breathe { animation: priyaOrbBreathe 1.8s ease-in-out infinite; }
        .priya-orb-pulse { animation: priyaOrbPulse 2s ease-in-out infinite; }
        .priya-shimmer { animation: priyaShimmer 2s linear infinite; }
        .priya-inner-glow { animation: priyaInnerGlow 1.2s ease-in-out infinite; }
        .priya-mic-pulse { animation: priyaMicPulse 1s ease-in-out infinite; }
        .priya-audio-bar { animation: priyaAudioBar 0.5s ease-in-out infinite alternate; }
      `}</style>
    </>
  );
}
