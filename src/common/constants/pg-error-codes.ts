/**
 * PostgreSQL error codes for transaction handling
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PgErrorCodes = {
  /** Unique constraint violation */
  UNIQUE_VIOLATION: '23505',
  /** Deadlock detected */
  DEADLOCK_DETECTED: '40P01',
  /** Lock not available (lock timeout) */
  LOCK_NOT_AVAILABLE: '55P03',
  /** Query canceled (statement timeout) */
  QUERY_CANCELED: '57014',
} as const;

export const RETRYABLE_PG_ERRORS = [
  PgErrorCodes.DEADLOCK_DETECTED,
  PgErrorCodes.LOCK_NOT_AVAILABLE,
  PgErrorCodes.QUERY_CANCELED,
] as const;
