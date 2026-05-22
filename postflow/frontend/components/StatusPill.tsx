import styles from './StatusPill.module.css';

export type StatusType = 'scheduled' | 'published' | 'running' | 'failed';

interface StatusPillProps {
  status: StatusType;
}

export function StatusPill({ status }: StatusPillProps) {
  const labelMap = {
    scheduled: 'Scheduled',
    published: 'Published',
    running: 'Running',
    failed: 'Failed',
  };

  return (
    <div className={`${styles.pill} ${styles[status]}`}>
      {status === 'running' && <span className={styles.spinner}></span>}
      <span className="typography-label-sm">{labelMap[status]}</span>
    </div>
  );
}
