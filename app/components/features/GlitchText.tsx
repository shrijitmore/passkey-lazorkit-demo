'use client';

import { useEffect, useRef } from 'react';

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
}

export default function GlitchText({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = '',
}: GlitchTextProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    element.style.setProperty('--glitch-speed', `${speed}s`);
  }, [speed]);

  return (
    <div
      ref={textRef}
      className={`glitch-text ${enableOnHover ? 'glitch-on-hover' : ''} ${className}`}
      data-text={children}
      data-testid="glitch-text"
    >
      <span className={enableShadows ? 'glitch-shadows' : ''}>{children}</span>
      <style jsx>{`
        .glitch-text {
          position: relative;
          display: inline-block;
          font-weight: bold;
        }

        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text.glitch-shadows span {
          text-shadow: 2px 2px 0 rgba(234, 88, 254, 0.5),
            -2px -2px 0 rgba(88, 195, 254, 0.5);
        }

        .glitch-text:not(.glitch-on-hover)::before,
        .glitch-text:not(.glitch-on-hover)::after,
        .glitch-text.glitch-on-hover:hover::before,
        .glitch-text.glitch-on-hover:hover::after {
          animation: glitch calc(var(--glitch-speed, 0.5s) * 2) infinite;
        }

        .glitch-text::before {
          left: 2px;
          text-shadow: -2px 0 rgba(234, 88, 254, 0.8);
          clip: rect(24px, 550px, 90px, 0);
          animation-delay: calc(var(--glitch-speed, 0.5s) * 0.5);
        }

        .glitch-text::after {
          left: -2px;
          text-shadow: -2px 0 rgba(88, 195, 254, 0.8);
          clip: rect(85px, 550px, 140px, 0);
          animation-delay: calc(var(--glitch-speed, 0.5s) * 0.2);
        }

        @keyframes glitch {
          0% {
            clip: rect(51px, 9999px, 28px, 0);
          }
          5% {
            clip: rect(84px, 9999px, 41px, 0);
          }
          10% {
            clip: rect(2px, 9999px, 93px, 0);
          }
          15% {
            clip: rect(65px, 9999px, 12px, 0);
          }
          20% {
            clip: rect(31px, 9999px, 76px, 0);
          }
          25% {
            clip: rect(88px, 9999px, 19px, 0);
          }
          30% {
            clip: rect(7px, 9999px, 54px, 0);
          }
          35% {
            clip: rect(43px, 9999px, 97px, 0);
          }
          40% {
            clip: rect(72px, 9999px, 8px, 0);
          }
          45% {
            clip: rect(16px, 9999px, 61px, 0);
          }
          50% {
            clip: rect(95px, 9999px, 33px, 0);
          }
          55% {
            clip: rect(24px, 9999px, 79px, 0);
          }
          60% {
            clip: rect(59px, 9999px, 4px, 0);
          }
          65% {
            clip: rect(38px, 9999px, 86px, 0);
          }
          70% {
            clip: rect(11px, 9999px, 47px, 0);
          }
          75% {
            clip: rect(69px, 9999px, 22px, 0);
          }
          80% {
            clip: rect(46px, 9999px, 91px, 0);
          }
          85% {
            clip: rect(3px, 9999px, 58px, 0);
          }
          90% {
            clip: rect(77px, 9999px, 14px, 0);
          }
          95% {
            clip: rect(52px, 9999px, 71px, 0);
          }
          100% {
            clip: rect(29px, 9999px, 96px, 0);
          }
        }
      `}</style>
    </div>
  );
}