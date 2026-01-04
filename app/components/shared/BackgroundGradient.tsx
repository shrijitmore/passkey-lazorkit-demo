'use client';

interface BackgroundGradientProps {
  position: 'left' | 'right';
}

export default function BackgroundGradient({ position }: BackgroundGradientProps) {
  const leftStyles = position === 'left' 
    ? 'left-[184px] top-[-376px]' 
    : 'left-[1147px] top-[-209px]';

  return (
    <div className={`absolute h-[912px] ${leftStyles} w-[797px]`}>
      <div className="absolute inset-[-9.74%_-12.92%_-9.75%_-12.92%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1003 1089.77">
          <g>
            <g filter="url(#filter0_f_1_241)">
              <circle cx="501.5" cy="501.5" fill="url(#paint0_linear_1_241)" r="301.5" />
            </g>
            <g filter="url(#filter1_f_1_241)">
              <rect fill="url(#paint1_linear_1_241)" height="411.069" width="289.734" x="356.633" y="478.704" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="1003" id="filter0_f_1_241" width="1003" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feGaussianBlur result="effect1_foregroundBlur_1_241" stdDeviation="100" />
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="811.07" id="filter1_f_1_241" width="689.734" x="156.633" y="278.704">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feGaussianBlur result="effect1_foregroundBlur_1_241" stdDeviation="100" />
            </filter>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_241" x1="501.5" x2="501.5" y1="200" y2="803">
              <stop stopColor="#00C2FF" stopOpacity="0" />
              <stop offset="1" stopColor="#FF29C3" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_241" x1="501.5" x2="501.5" y1="478.704" y2="889.773">
              <stop stopColor="#184BFF" stopOpacity="0" />
              <stop offset="1" stopColor="#174AFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

