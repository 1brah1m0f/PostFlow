"use client";

import styles from './PlatformChip.module.css';

interface PlatformChipProps {
  platform: 'instagram' | 'tiktok';
  active?: boolean;
  onClick?: () => void;
}

export function PlatformChip({ platform, active = false, onClick }: PlatformChipProps) {
  return (
    <button 
      type="button"
      className={`${styles.chip} ${styles[platform]} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className="typography-label-md">
        {platform === 'instagram' ? 'Instagram' : 'TikTok'}
      </span>
    </button>
  );
}
