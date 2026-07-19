import { useState, useEffect, useRef } from 'react';
import { sounds } from './utils/audio';
import { Play, Volume2, VolumeX, RotateCcw, MessageCircle, Menu, X } from 'lucide-react';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'contact'>('home');
  
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
      <header className="border-b border-slate-900 bg-slate-950 shrink-0 relative z-50">
        <div className="max-w-4xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-display font-black text-sm tracking-wider">LUCKY SPIN</span>
          </div>

          <div className="flex items-center gap-4">
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
            
            {/* Hamburger Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-xl py-4 px-6 flex flex-col gap-4">
            <button onClick={() => { setIsMenuOpen(false); setCurrentView('home'); }} className="text-left text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider">Home</button>
            <a href="https://whatsapp.com/channel/0029VaHSaCLK0IBoy1Jket3A" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Join WhatsApp Group
            </a>
          </div>
        )}
      </header>

      {currentView === 'home' && (
        <>
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
      </>
      )}
      {currentView === 'privacy' && (
        <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-6 text-slate-300 space-y-6">
          <h1 className="text-3xl font-display font-bold text-white mb-8">Privacy Policy</h1>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>We do not collect any personal information when you use our core spinning wheel tool. The tool runs entirely in your browser and does not transmit the names or options you enter to our servers.</p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Cookies and Third-Party Advertising</h2>
          <p>We use third-party advertising companies (such as Google AdSense) to serve ads when you visit our website. These companies may use aggregated information (not including your name, address, email address or telephone number) about your visits to this and other Web sites in order to provide advertisements about goods and services of interest to you.</p>
          <p>Google, as a third party vendor, uses cookies to serve ads on our site. Google's use of the DART cookie enables it to serve ads to our users based on their visit to our sites and other sites on the Internet. Users may opt out of the use of the DART cookie by visiting the Google ad and content network privacy policy.</p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Log Files</h2>
          <p>Like many other Web sites, we make use of log files. The information inside the log files includes internet protocol (IP) addresses, type of browser, Internet Service Provider (ISP), date/time stamp, referring/exit pages, and number of clicks to analyze trends, administer the site, track user's movement around the site, and gather demographic information. IP addresses, and other such information are not linked to any information that is personally identifiable.</p>
        </main>
      )}

      {currentView === 'terms' && (
        <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-6 text-slate-300 space-y-6">
          <h1 className="text-3xl font-display font-bold text-white mb-8">Terms of Service</h1>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using Lucky Spin, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Use of Service</h2>
          <p>Lucky Spin provides a free, digital random picker tool for entertainment and decision-making purposes. The service is provided "as is". We are not responsible for any decisions, giveaways, or disputes that arise from the use of our random picker wheel. The results generated by the wheel are random and we do not guarantee specific outcomes.</p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Intellectual Property</h2>
          <p>The site and its original content, features, and functionality are owned by Lucky Spin and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. We do so by posting and drawing attention to the updated terms on the Site. Your decision to continue to visit and make use of the Site after such changes have been made constitutes your formal acceptance of the new Terms of Service.</p>
        </main>
      )}

      {currentView === 'contact' && (
        <main className="flex-1 w-full max-w-3xl mx-auto py-12 px-6 text-slate-300 space-y-6">
          <h1 className="text-3xl font-display font-bold text-white mb-8">Contact Us</h1>
          <p>If you have any questions or suggestions about our Privacy Policy, Terms of Service, or the app itself, do not hesitate to contact us.</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8">
            <h2 className="text-lg font-bold text-white mb-2">Email Support</h2>
            <p className="text-slate-400 mb-4">Reach out to us directly via email:</p>
            <a href="mailto:habibtoravi@gmail.com" className="text-emerald-400 font-bold hover:text-emerald-300">habibtoravi@gmail.com</a>
          </div>
        </main>
      )}

      {/* FOOTER (Required for AdSense trust) */}
      <footer className="max-w-4xl mx-auto mb-12 px-6 text-center text-xs text-slate-500 flex flex-col items-center gap-4">
        <p className="font-mono tracking-widest uppercase">© {new Date().getFullYear()} LUCKY SPIN • ALL OUTCOMES ARE FULLY RANDOM</p>
        <div className="flex gap-4">
          <button onClick={() => { setCurrentView('privacy'); window.scrollTo(0,0); }} className="hover:text-slate-300 transition-colors">Privacy Policy</button>
          <button onClick={() => { setCurrentView('terms'); window.scrollTo(0,0); }} className="hover:text-slate-300 transition-colors">Terms of Service</button>
          <button onClick={() => { setCurrentView('contact'); window.scrollTo(0,0); }} className="hover:text-slate-300 transition-colors">Contact Us</button>
        </div>
      </footer>

    </div>
  );
}

