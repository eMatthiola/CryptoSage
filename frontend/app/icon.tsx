import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8e5e" />
              <stop offset="100%" stopColor="#ffb088" />
            </linearGradient>
            <radialGradient id="nucleusGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ff6b3d" />
              <stop offset="100%" stopColor="#ff8e5e" />
            </radialGradient>
          </defs>

          {/* Nucleus - central core */}
          <circle cx="16" cy="16" r="2.5" fill="url(#nucleusGradient)"/>
          <circle cx="16" cy="16" r="3.5" fill="none" stroke="url(#mainGradient)" strokeWidth="0.8" opacity="0.5"/>

          {/* Electron orbit rings */}
          <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradient)" strokeWidth="1" opacity="0.5"/>
          <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradient)" strokeWidth="1" opacity="0.5" transform="rotate(60 16 16)"/>
          <ellipse cx="16" cy="16" rx="11" ry="6" fill="none" stroke="url(#mainGradient)" strokeWidth="1" opacity="0.5" transform="rotate(120 16 16)"/>

          {/* Electrons */}
          <circle cx="27" cy="16" r="1.5" fill="#ff8e5e"/>
          <circle cx="5" cy="16" r="1.5" fill="#ffb088"/>
          <circle cx="21.5" cy="12" r="1.3" fill="#ff8e5e" opacity="0.9"/>
          <circle cx="10.5" cy="20" r="1.3" fill="#ffb088" opacity="0.9"/>
          <circle cx="21.5" cy="20" r="1.3" fill="#ff8e5e" opacity="0.9"/>
          <circle cx="10.5" cy="12" r="1.3" fill="#ffb088" opacity="0.9"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
