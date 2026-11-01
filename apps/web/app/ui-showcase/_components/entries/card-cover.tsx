import styles from './card-cover.module.css';

export type CardCoverProps = {
  children: React.ReactNode;
};

/** A feed card on the index, whole and small, so its cover shows what the component really is. */
export function CardCover({ children }: CardCoverProps) {
  return <div className={styles.cover}>{children}</div>;
}
