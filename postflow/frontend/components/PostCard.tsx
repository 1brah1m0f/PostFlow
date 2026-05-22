"use client";

import Image from 'next/image';
import { StatusPill, StatusType } from './StatusPill';
import styles from './PostCard.module.css';

interface PostCardProps {
  id: string;
  status: StatusType;
  caption: string;
  scheduledTime: string;
  thumbnailUrl: string;
  onDelete?: (id: string) => void;
}

export function PostCard({ id, status, caption, scheduledTime, thumbnailUrl, onDelete }: PostCardProps) {
  return (
    <div className={`${styles.card} ${styles[`status-${status}`]}`}>
      <div className={styles.imageContainer}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="Post thumbnail" className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <StatusPill status={status} />
          {onDelete && (
            <button 
              onClick={() => onDelete(id)} 
              className={styles.deleteBtn}
              aria-label="Delete post"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
        
        <p className={`typography-body-md ${styles.caption}`}>{caption}</p>
        
        <div className={styles.footer}>
          <span className="typography-label-sm">{scheduledTime}</span>
        </div>
      </div>
    </div>
  );
}
