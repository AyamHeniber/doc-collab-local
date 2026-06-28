import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type IconName =
  | 'file'
  | 'plus'
  | 'logout'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'user'
  | 'help'
  | 'x'
  | 'calendar'
  | 'shield'
  | 'info'
  | 'alert-triangle'
  | 'wifi'
  | 'wifi-off'
  | 'refresh'
  | 'spinner'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'code'
  | 'list-bullet'
  | 'list-ordered'
  | 'quote'
  | 'terminal'
  | 'eye'
  | 'history'
  | 'save'
  | 'rotate-ccw'
  | 'sparkles'
  | 'check';

interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
  className?: string;
  animate?: boolean;
}

export function Icon({
  name,
  size = 16,
  className,
  animate,
  ...props
}: IconProps) {
  // Common vector style variables for visual consistency
  const defaultSvgProps = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const getIconPaths = (name: IconName): React.ReactNode => {
    switch (name) {
      case 'file':
        return (
          <>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
          </>
        );
      case 'plus':
        return (
          <>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </>
        );
      case 'logout':
        return (
          <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </>
        );
      case 'chevron-right':
        return <path d="m9 18 6-6-6-6" />;
      case 'chevron-left':
        return <path d="m15 18-6-6 6-6" />;
      case 'chevron-down':
        return <path d="m6 9 6 6 6-6" />;
      case 'user':
        return (
          <>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </>
        );
      case 'help':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </>
        );
      case 'x':
        return (
          <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </>
        );
      case 'calendar':
        return (
          <>
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </>
        );
      case 'shield':
        return <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l7-2a1 1 0 0 1-.02 0l7 2A1 1 0 0 1 20 6Z" />;
      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </>
        );
      case 'alert-triangle':
        return (
          <>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" x2="12" y1="9" y2="13" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </>
        );
      case 'wifi':
        return (
          <>
            <path d="M12 20h.01" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M5 13a10 10 0 0 1 14 0" />
            <path d="M1.5 9.5a15 15 0 0 1 21 0" />
          </>
        );
      case 'wifi-off':
        return (
          <>
            <line x1="2" x2="22" y1="2" y2="22" />
            <path d="M8.5 16.5a5 5 0 0 1 7 0" />
            <path d="M5 13a10 10 0 0 1 10.4-2.2" />
            <path d="M1.5 9.5a15 15 0 0 1 18.2-1.2" />
            <path d="M12 20h.01" />
          </>
        );
      case 'refresh':
        return (
          <>
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </>
        );
      case 'spinner':
        return (
          <>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </>
        );
      case 'bold':
        return <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6Zm0 8h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6Z" />;
      case 'italic':
        return (
          <>
            <line x1="19" x2="10" y1="4" y2="4" />
            <line x1="14" x2="5" y1="20" y2="20" />
            <line x1="15" x2="9" y1="4" y2="20" />
          </>
        );
      case 'strike':
        return (
          <>
            <path d="M16 4H9a3 3 0 0 0-2.83 4H14a3 3 0 0 1 0 6H4" />
            <line x1="4" x2="20" y1="12" y2="12" />
          </>
        );
      case 'code':
        return (
          <>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </>
        );
      case 'list-bullet':
        return (
          <>
            <line x1="9" x2="20" y1="6" y2="6" />
            <line x1="9" x2="20" y1="12" y2="12" />
            <line x1="9" x2="20" y1="18" y2="18" />
            <circle cx="4" cy="6" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="4" cy="18" r="1" />
          </>
        );
      case 'list-ordered':
        return (
          <>
            <line x1="10" x2="21" y1="6" y2="6" />
            <line x1="10" x2="21" y1="12" y2="12" />
            <line x1="10" x2="21" y1="18" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
          </>
        );
      case 'quote':
        return <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM4 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />;
      case 'terminal':
        return (
          <>
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" x2="20" y1="19" y2="19" />
          </>
        );
      case 'eye':
        return (
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        );
      case 'history':
        return (
          <>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <polyline points="3-3 3 8 8 8" />
            <line x1="12" x2="12" y1="7" y2="13" />
            <line x1="12" x2="16" y1="13" y2="13" />
          </>
        );
      case 'save':
        return (
          <>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </>
        );
      case 'rotate-ccw':
        return (
          <>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <polyline points="3-3 3 8 8 8" />
          </>
        );
      case 'sparkles':
        return (
          <>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
            <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
            <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
          </>
        );
      case 'check':
        return <polyline points="20 6 9 17 4 12" />;
      default:
        return null;
    }
  };

  const isSpinner = name === 'spinner';

  return (
    <svg
      {...defaultSvgProps}
      className={twMerge(
        clsx(
          className,
          isSpinner && 'animate-spin',
          animate && 'transition-transform duration-200'
        )
      )}
      {...props}
    >
      {getIconPaths(name)}
    </svg>
  );
}
