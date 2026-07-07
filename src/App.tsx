import { useState, useEffect, useRef } from 'react';
import { sounds } from './utils/audio';
import { Play, Volume2, VolumeX, RotateCcw, MessageCircle } from 'lucide-react';

interface WheelSegment {
  id: number;
  label: string;
  type: 'win' | 'lose';
}

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { id: 1, label: 'WIN', type: 'win' },
  { id: 2, label: 'LOSE', type: 'lose' },
  { id: 3, label: 'WIN', type: 'win' },
  { id: 4, label: 'LOSE', type: 'lose' },
  { id: 5, label: 'WIN', type: 'win' },
  { id: 6, label: 'LOSE', type: 'lose' },
];

export default function App() {
  const [segments] = useState<WheelSegment[]>(DEFAULT_SEGMENTS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Active spinning outcome display
  const [resultSegment, setResultSegment] = useState<WheelSegment | null>(null);
  const [hasSpun, setHasSpun] = useState(false);

  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickIndexRef = useRef<number>(-1);

  useEffect(() => {
    sounds.setMute(isMuted);
  }, [isMuted]);

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResultSegment(null);
    setHasSpun(true);

    // 1. Determine target segment index randomly (1/6 chance for each slice)
    const targetIndex = Math.floor(Math.random() * 6);
    const winningSegment = segments[targetIndex];

    // 2. Compute rotation trigonometry
    // Pointer is at the top (270 degrees).
    // Midpoint angle of target index: (targetIndex * 60) + 30
    const midAngle = (targetIndex * 60) + 30;
    
    // Angle to bring target segment's center to top (270)
    const baseAngle = (270 - midAngle + 360) % 360;
    
    // Multi-rotations for suspense + random offset within the segment
    const randomOffset = Math.floor(Math.random() * 30) - 15; // +/- 15 degrees from center
    const totalSpins = 6 + Math.floor(Math.random() * 2); // 6 to 7 full spins
    const finalRotation = (totalSpins * 360) + ((baseAngle + randomOffset + 360) % 360);

    const startRotation = currentRotation % 360;
    const distance = finalRotation - startRotation;
    const duration = 4000; // 4 seconds spin
    const startTime = performance.now();

    lastTickIndexRef.current = -1;

    // 3. Cubic Ease Out animation frame loop
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const computedRot = startRotation + distance * easeOut;
      
      rotationRef.current = computedRot;
      setCurrentRotation(computedRot);

      // Play ticking audio as pointer passes lines
      const pointerOffsetRotation = (computedRot + 30) % 360;
      const tickIndex = Math.floor(pointerOffsetRotation / 60) % 6;
      if (tickIndex !== lastTickIndexRef.current) {
        sounds.playTick();
        lastTickIndexRef.current = tickIndex;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setCurrentRotation(finalRotation);
        
        // Final outcome audio trigger
        if (winningSegment.type === 'win') {
          sounds.playWin();
        } else {
          sounds.playLose();
        }
        
        setResultSegment(winningSegment);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Build sector path for 60 degrees (1/6 of circle)
  const getSectorPath = (index: number) => {
    const size = 300;
    const radius = size / 2;
    const innerRadius = radius - 4; // Simplified, sits right on the edge
    const startAngle = (index * 60 * Math.PI) / 180;
    const endAngle = ((index + 1) * 60 * Math.PI) / 180;
    
    const x1 = radius + innerRadius * Math.cos(startAngle);
    const y1 = radius + innerRadius * Math.sin(startAngle);
    const x2 = radius + innerRadius * Math.cos(endAngle);
    const y2 = radius + innerRadius * Math.sin(endAngle);
    
    return `M ${radius} ${radius} L ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans antialiased" id="landing-page-frame">
      
      {/* MINIMAL NAVBAR */}
      <header className="border-b border-slate-900 bg-slate-950 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-display font-black text-sm tracking-wider">LUCKY SPIN</span>
          </div>

          {/* Sound Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold"
            id="audio-mute-toggle"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                <span>SOUND MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>SOUND ON</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* WHEEL BODY STAGE */}
      <main className="flex-1 flex flex-col items-center justify-center py-2 px-4 max-w-md mx-auto w-full overflow-y-auto overflow-x-hidden" id="main-interactive-stage">
        
        {/* Simple Title */}
        <div className="text-center mb-3 shrink-0">
          <h2 className="font-display font-black text-xl tracking-tight text-white">
            Spin the Wheel
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Red represents <span className="text-rose-400 font-bold">LOSE</span>, green represents <span className="text-emerald-400 font-bold">WIN</span>.
          </p>
        </div>

        {/* SPIN WHEEL WIDGET */}
        <div className="relative w-[300px] h-[300px] flex items-center justify-center bg-slate-900 p-1.5 rounded-full border border-slate-800 shadow-xl shrink-0" id="wheel-frame-box">
          
          {/* Outer pin/beads rim indicator */}
          <div className="absolute inset-1.5 rounded-full border border-slate-800 pointer-events-none z-10" />

          {/* Golden selector pointer at the very top */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-30 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] scale-75 origin-top">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 24L23.5455 4H0.454483L12 24Z" fill="#FBBF24" />
            </svg>
          </div>

          {/* Rotating wheel element */}
          <div
            className="w-full h-full rounded-full overflow-hidden transition-transform duration-75 z-20"
            style={{ transform: `rotate(${currentRotation}deg)` }}
            id="spinning-wheel-svg-container"
          >
            <svg width="300" height="300" viewBox="0 0 300 300" className="w-full h-full">
              {segments.map((segment, index) => {
                const startAngleDeg = index * 60;
                const textAngleDeg = startAngleDeg + 30;
                const textRad = (textAngleDeg * Math.PI) / 180;
                const textDist = 150 * 0.58;
                const tx = 150 + textDist * Math.cos(textRad);
                const ty = 150 + textDist * Math.sin(textRad);

                return (
                  <g key={segment.id}>
                    {/* SVG Pie Arc with flat colors */}
                    <path
                      d={getSectorPath(index)}
                      fill={segment.type === 'win' ? '#10B981' : '#EF4444'} // Clean solid Tailwind colors
                      className="stroke-slate-950 stroke-[3] transition-all"
                    />

                    {/* Segment text */}
                    <text
                      x={tx}
                      y={ty}
                      fill="#FFFFFF"
                      fontWeight="bold"
                      fontSize="14"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-sans tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                      transform={`rotate(${textAngleDeg + 90}, ${tx}, ${ty})`}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

      {/* Center WhatsApp Link Hub */}
      <a
        href="https://whatsapp.com/channel/0029VaHSaCLK0IBoy1Jket3A"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute z-30 w-16 h-16 rounded-full bg-[#25D366] hover:bg-[#20BA5A] border-4 border-slate-900 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all hover:scale-110 cursor-pointer group"
        title="Join our WhatsApp Channel"
      >
        <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform fill-current" />
        <span className="text-[10px] font-black text-white mt-0.5 tracking-wider uppercase">Join</span>
      </a>

        </div>

        {/* PRIMARY SPIN ACTION */}
        <div className="mt-3 w-full shrink-0">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`py-3 w-full rounded-xl font-bold text-sm uppercase tracking-wider transition-all transform shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              isSpinning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed scale-98'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white active:scale-98'
            }`}
            id="wheel-spin-action-btn"
          >
            {isSpinning ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                <span>SPINNING...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>SPIN THE WHEEL</span>
              </>
            )}
          </button>
        </div>

        {/* REAL-TIME STATUS / OUTCOME FEEDBACK */}
        <div className="mt-2 w-full min-h-[40px] flex items-center justify-center shrink-0" id="outcome-display-area">
          {isSpinning && (
            <div className="text-center text-[10px] font-mono tracking-wider text-amber-400 animate-pulse">
              ⚡ SPINNING...
            </div>
          )}

          {!isSpinning && resultSegment && (
            <div
              className={`w-full py-1.5 px-3 rounded-lg border text-center transition-all ${
                resultSegment.type === 'win'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
              id="outcome-display-pill"
            >
              <span className="text-[11px] font-bold uppercase tracking-tight">
                {resultSegment.type === 'win' ? '🎉 WIN: ' : '❌ LOSE: '} {resultSegment.label}
              </span>
            </div>
          )}

          {!isSpinning && !hasSpun && (
            <div className="text-center text-[10px] text-slate-500 italic">
              "Click the button above to start your random spin!"
            </div>
          )}
        </div>

        {/* RE-SPIN RESET OPTION */}
        {!isSpinning && hasSpun && (
          <button
            onClick={() => {
              setResultSegment(null);
              setHasSpun(false);
            }}
            className="mt-1 text-[10px] text-slate-500 hover:text-slate-300 transition-all flex items-center gap-1 shrink-0"
            id="reset-simulation-trigger"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Wheel</span>
          </button>
        )}
        

      </main>

      {/* SIMPLE FOOTER */}
      <footer className="border-t border-slate-900 py-3 shrink-0 text-center text-[9px] text-slate-600 font-mono tracking-widest uppercase">
        © 2026 LUCKY SPIN • ALL OUTCOMES ARE FULLY RANDOM
      </footer>

    </div>
  );
}
