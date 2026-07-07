import { useState, useEffect, useRef } from 'react';
import { sounds } from './utils/audio';
import { Play, Volume2, VolumeX, RotateCcw, MessageCircle, X } from 'lucide-react';

interface WheelSegment {
  id: number;
  label: string;
  type: 'win' | 'lose';
  color?: string;
}

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { id: 1, label: 'WIN', type: 'win', color: '#10B981' },
  { id: 2, label: 'LOSE', type: 'lose', color: '#EF4444' },
  { id: 3, label: 'WIN', type: 'win', color: '#10B981' },
  { id: 4, label: 'LOSE', type: 'lose', color: '#EF4444' },
  { id: 5, label: 'WIN', type: 'win', color: '#10B981' },
  { id: 6, label: 'LOSE', type: 'lose', color: '#EF4444' },
];

export default function App() {
  const [segments, setSegments] = useState<WheelSegment[]>(DEFAULT_SEGMENTS);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Compliance & Legal State
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [cookieAccepted, setCookieAccepted] = useState(true);

  useEffect(() => {
    setCookieAccepted(localStorage.getItem('cookieConsent') === 'true');
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setCookieAccepted(true);
  };
  
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

    const numSegments = segments.length;
    const anglePerSegment = 360 / numSegments;
    const targetIndex = Math.floor(Math.random() * numSegments);
    const winningSegment = segments[targetIndex];

    const midAngle = (targetIndex * anglePerSegment) + (anglePerSegment / 2);
    const baseAngle = (270 - midAngle + 360) % 360;
    
    // Multi-rotations for suspense + random offset within the segment
    const randomOffset = Math.floor(Math.random() * (anglePerSegment * 0.6)) - (anglePerSegment * 0.3);
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
      // Calculate which segment boundary is passing the top (270 degrees)
      const normalizedRot = (computedRot) % 360;
      const topAngleOffset = (270 - normalizedRot + 360) % 360;
      const tickIndex = Math.floor(topAngleOffset / anglePerSegment);
      
      if (tickIndex !== lastTickIndexRef.current && lastTickIndexRef.current !== -1) {
        sounds.playTick();
      }
      lastTickIndexRef.current = tickIndex;

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

  const getSectorPath = (index: number) => {
    const size = 300;
    const radius = size / 2;
    const innerRadius = radius - 4;
    const numSegments = segments.length;
    const anglePerSegment = 360 / numSegments;
    
    const startAngle = (index * anglePerSegment * Math.PI) / 180;
    const endAngle = ((index + 1) * anglePerSegment * Math.PI) / 180;
    const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
    
    const x1 = radius + innerRadius * Math.cos(startAngle);
    const y1 = radius + innerRadius * Math.sin(startAngle);
    const x2 = radius + innerRadius * Math.cos(endAngle);
    const y2 = radius + innerRadius * Math.sin(endAngle);
    
    return `M ${radius} ${radius} L ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
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

          <div className="flex items-center gap-2">
            {/* Sound Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-bold"
              id="audio-mute-toggle"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">SOUND MUTED</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden sm:inline">SOUND ON</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* WHEEL BODY STAGE */}
      <main className="flex-1 flex flex-col items-center justify-center py-2 px-4 max-w-md mx-auto w-full overflow-y-auto overflow-x-hidden" id="main-interactive-stage">
        
        {/* Simple Title */}
        <div className="text-center mb-3 shrink-0">
          <h2 className="font-display font-black text-xl tracking-tight text-white">
            Spin the Wheel
          </h2>
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
                const anglePerSegment = 360 / segments.length;
                const startAngleDeg = index * anglePerSegment;
                const textAngleDeg = startAngleDeg + (anglePerSegment / 2);
                const textRad = (textAngleDeg * Math.PI) / 180;
                
                // Adjust text distance based on segment count
                const textDist = segments.length > 8 ? 150 * 0.7 : 150 * 0.58;
                const tx = 150 + textDist * Math.cos(textRad);
                const ty = 150 + textDist * Math.sin(textRad);
                const fontSize = segments.length > 8 ? "10" : "14";

                return (
                  <g key={segment.id}>
                    {/* SVG Pie Arc with flat colors */}
                    <path
                      d={getSectorPath(index)}
                      fill={segment.color}
                      className="stroke-slate-950 stroke-[3] transition-all"
                    />

                    {/* Segment text */}
                    <text
                      x={tx}
                      y={ty}
                      fill="#FFFFFF"
                      fontWeight="bold"
                      fontSize={fontSize}
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

      {/* Center Spin Hub */}
      <button
        onClick={handleSpin}
        disabled={isSpinning}
        className={`absolute z-30 w-16 h-16 rounded-full border-4 border-slate-900 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer group ${
          isSpinning
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed scale-95'
            : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-110 active:scale-95'
        }`}
        title="Spin the Wheel"
      >
        {isSpinning ? (
          <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="font-black text-[13px] tracking-wider uppercase shadow-sm">Spin</span>
        )}
      </button>

        </div>

        {/* WHATSAPP JOIN ACTION */}
        <div className="mt-4 w-full shrink-0" id="whatsapp-join-section">
          <a
            href="https://whatsapp.com/channel/0029VaHSaCLK0IBoy1Jket3A"
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 w-full rounded-xl font-bold text-sm uppercase tracking-wider transition-all transform shadow-md flex items-center justify-center gap-2 cursor-pointer bg-[#25D366] hover:bg-[#20BA5A] text-white active:scale-98"
            id="whatsapp-join-btn"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Join Our WhatsApp</span>
          </a>
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
                {resultSegment.type === 'win' ? '🎉 OUTCOME: ' : '❌ OUTCOME: '} {resultSegment.label}
              </span>
            </div>
          )}

          {!isSpinning && !hasSpun && (
            <div className="text-center text-[10px] text-slate-500 italic">
              "Click the center SPIN button to test your luck!"
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

      {/* SEO & CONTENT SECTION FOR ADSENSE */}
      <section className="max-w-2xl mx-auto mt-16 mb-8 p-6 sm:p-8 bg-slate-900/30 rounded-2xl border border-slate-800/50 text-slate-300 text-sm space-y-6">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-2">About Lucky Spin</h2>
          <p className="leading-relaxed text-slate-400">
            Lucky Spin is a free, interactive random picker wheel designed to help you make decisions, host giveaways, or add a fun element to your events. Whether you are a teacher randomly calling on students, a business owner picking a raffle winner, or just trying to decide where to eat dinner, our customizable wheel makes the process fair and entertaining.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-2">How to Use the Custom Wheel</h3>
          <p className="leading-relaxed text-slate-400 mb-2">
            You can easily create your own custom wheel by modifying the web address (URL). This is perfect for store owners wanting to share a specific promotional wheel with their customers.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Add <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-400 border border-slate-800 text-xs">?items=</code> to the end of our website URL.</li>
            <li>Separate your custom prizes or options with commas.</li>
            <li>Example: <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 border border-slate-800 text-xs break-all">mysite.com/?items=10% Off,Sorry,Free Coffee</code></li>
          </ul>
        </div>
      </section>

      {/* FOOTER WITH LEGAL LINKS */}
      <footer className="border-t border-slate-900 py-6 shrink-0 flex flex-col items-center gap-3">
        <div className="flex gap-6 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
          <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
          <button onClick={() => setShowTerms(true)} className="hover:text-slate-300 transition-colors">Terms of Service</button>
          <a href="mailto:contact@yoursite.com" className="hover:text-slate-300 transition-colors">Contact</a>
        </div>
        <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
          © {new Date().getFullYear()} LUCKY SPIN • ALL OUTCOMES ARE FULLY RANDOM
        </p>
      </footer>

      {/* PRIVACY POLICY MODAL */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowPrivacy(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-display font-bold text-white mb-4">Privacy Policy</h2>
            <div className="space-y-4 text-sm text-slate-300">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              <p>At Lucky Spin, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Lucky Spin and how we use it.</p>
              <h3 className="text-lg font-bold text-white mt-4">Log Files</h3>
              <p>Lucky Spin follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>
              <h3 className="text-lg font-bold text-white mt-4">Cookies and Web Beacons</h3>
              <p>Like any other website, Lucky Spin uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.</p>
              <h3 className="text-lg font-bold text-white mt-4">Google DoubleClick DART Cookie</h3>
              <p>Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-emerald-400 hover:underline" target="_blank" rel="noreferrer">https://policies.google.com/technologies/ads</a></p>
            </div>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative">
            <button onClick={() => setShowTerms(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-2xl font-display font-bold text-white mb-4">Terms of Service</h2>
            <div className="space-y-4 text-sm text-slate-300">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              <p>By accessing this Website, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws.</p>
              <h3 className="text-lg font-bold text-white mt-4">Use License</h3>
              <p>Permission is granted to temporarily download one copy of the materials on Lucky Spin's Website for personal, non-commercial transitory viewing only.</p>
              <h3 className="text-lg font-bold text-white mt-4">Disclaimer</h3>
              <p>All the materials on Lucky Spin's Website are provided "as is". Lucky Spin makes no warranties, may it be expressed or implied, therefore negates all other warranties. Furthermore, Lucky Spin does not make any representations concerning the accuracy or reliability of the use of the materials on its Website or otherwise relating to such materials or any sites linked to this Website.</p>
              <h3 className="text-lg font-bold text-white mt-4">Limitations</h3>
              <p>Lucky Spin or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use the materials on Lucky Spin's Website, even if Lucky Spin or an authorize representative of this Website has been notified, orally or written, of the possibility of such damage.</p>
            </div>
          </div>
        </div>
      )}

      {/* COOKIE CONSENT BANNER */}
      {!cookieAccepted && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 z-[60] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="text-xs text-slate-300 text-center sm:text-left max-w-4xl">
            We use cookies to personalize content and ads, to provide social media features and to analyze our traffic. We also share information about your use of our site with our social media, advertising and analytics partners.
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => setShowPrivacy(true)} className="px-4 py-2 text-slate-300 hover:text-white text-xs font-bold transition-colors">
              Learn More
            </button>
            <button onClick={acceptCookies} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg transition-colors">
              ACCEPT
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

