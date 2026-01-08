interface BadgeIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BadgeIcons: Record<string, React.FC<BadgeIconProps>> = {
  badge_checkered_flag: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <path d="M4 22V15"/>
      <rect x="8" y="3" width="4" height="4"/>
      <rect x="16" y="7" width="4" height="4"/>
      <rect x="8" y="11" width="4" height="4"/>
    </svg>
  ),
  badge_calendar_check: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M9 16l2 2 4-4"/>
    </svg>
  ),
  badge_iron_shield: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M12 8v4"/>
      <path d="M10 10h4"/>
      <circle cx="12" cy="16" r="1"/>
    </svg>
  ),
  badge_fist: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 11V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/>
      <path d="M10 7v5"/>
      <path d="M10 7h4a2 2 0 0 1 2 2v1"/>
      <path d="M14 10v5"/>
      <path d="M14 9h2a2 2 0 0 1 2 2v2"/>
      <path d="M6 11a2 2 0 0 0-2 2v1a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6v-1a2 2 0 0 0-2-2"/>
    </svg>
  ),
  badge_podium: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="6" height="8"/>
      <rect x="9" y="8" width="6" height="14"/>
      <rect x="16" y="11" width="6" height="11"/>
      <path d="M12 4l1.5 2 2.5.5-1.8 1.8.4 2.7-2.6-1.3-2.6 1.3.4-2.7-1.8-1.8 2.5-.5z"/>
    </svg>
  ),
  badge_trophy_star: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      <path d="M12 6l.7 1.5 1.6.2-1.2 1.1.3 1.7-1.4-.8-1.4.8.3-1.7-1.2-1.1 1.6-.2z"/>
    </svg>
  ),
  badge_flower: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 22v-6"/>
    </svg>
  ),
  badge_arrow_up_circle: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16V8"/>
      <path d="M8 12l4-4 4 4"/>
      <path d="M8 12l4-4 4 4"/>
    </svg>
  ),
  badge_lightning: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      <circle cx="12" cy="12" r="10" strokeDasharray="2 2"/>
    </svg>
  ),
  badge_mountain: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l4 8 5-5 5 16H2L8 3z"/>
      <path d="M4.14 15.08l3.86-3.08 3 4 3.5-3.5 3.5 5.5"/>
    </svg>
  ),
  badge_star_burst: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="22" y1="9.27" x2="18" y2="10"/>
      <line x1="2" y1="9.27" x2="6" y2="10"/>
      <line x1="18.18" y1="21.02" x2="15" y2="18"/>
      <line x1="5.82" y1="21.02" x2="9" y2="18"/>
    </svg>
  ),
  badge_double_check: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12l5 5L17 7"/>
      <path d="M7 12l5 5L22 7"/>
    </svg>
  ),
  badge_fire: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  badge_consistency: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M7 12h2l2-4 2 8 2-4h2"/>
    </svg>
  ),
  badge_stopwatch: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M10 2h4"/>
      <path d="M12 2v2"/>
      <path d="M20 5l-2 2"/>
    </svg>
  ),
  badge_hundred: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">100</text>
    </svg>
  ),
  badge_ribbon: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
      <text x="12" y="11" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">4</text>
    </svg>
  ),
  badge_crown: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17l3-7 4 4 3-9 3 9 4-4 3 7H2z"/>
      <path d="M3 17h18v4H3z"/>
      <circle cx="5" cy="10" r="1"/>
      <circle cx="19" cy="10" r="1"/>
      <circle cx="12" cy="5" r="1"/>
    </svg>
  ),
  badge_medal_silver: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6l4-4 4 4"/>
      <path d="M12 2v6"/>
      <circle cx="12" cy="14" r="6"/>
      <text x="12" y="17" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">2</text>
    </svg>
  ),
  badge_medal_bronze: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6l4-4 4 4"/>
      <path d="M12 2v6"/>
      <circle cx="12" cy="14" r="6"/>
      <text x="12" y="17" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">3</text>
    </svg>
  ),
  badge_bolt: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" transform="translate(4 4) scale(0.7)"/>
    </svg>
  ),
  badge_trending_up: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/>
      <polyline points="6 16 10 12 14 14 18 8"/>
      <polyline points="14 8 18 8 18 12"/>
    </svg>
  ),
  badge_gem: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 3 18 3 21 8 12 22 3 8"/>
      <line x1="3" y1="8" x2="21" y2="8"/>
      <line x1="12" y1="22" x2="6" y2="8"/>
      <line x1="12" y1="22" x2="18" y2="8"/>
      <line x1="12" y1="3" x2="12" y2="8"/>
    </svg>
  ),
  badge_zap: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      <circle cx="5" cy="5" r="2"/>
      <circle cx="19" cy="19" r="2"/>
    </svg>
  ),
  badge_target: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
    </svg>
  ),
  badge_legend_star: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9v-2"/>
      <path d="M12 15v2"/>
      <path d="M9 12h-2"/>
      <path d="M15 12h2"/>
    </svg>
  ),
  badge_hall_of_fame: ({ className, style }) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M5 21V7l7-4 7 4v14"/>
      <rect x="9" y="13" width="6" height="8"/>
      <path d="M9 9h6"/>
      <path d="M12 6v3"/>
      <polygon points="12 9 13.5 11 12 10.5 10.5 11 12 9"/>
    </svg>
  ),
};

export function getBadgeIcon(iconName: string): React.FC<BadgeIconProps> | null {
  return BadgeIcons[iconName] || null;
}
