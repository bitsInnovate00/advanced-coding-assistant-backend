/**
 * Type definitions for repository detection and management
 */

/**
 * Indexing status for a repository
 */
export enum IndexingStatus {
  NotIndexed = 'not-indexed',
  Indexing = 'indexing',
  Indexed = 'indexed',
  Error = 'error',
}

/**
 * Represents a detected repository in the workspace
 */
export interface Repository {
  /** Repository name (usually the folder name) */
  name: string;
  /** Absolute path to the repository root */
  path: string;
  /** Current indexing status */
  status: IndexingStatus;
  /** Error message if status is Error */
  errorMessage?: string;
  /** Timestamp of last indexing operation */
  lastIndexed?: Date;
}

/**
 * Repository tree item context values for command enablement
 */
export enum RepositoryContextValue {
  Repository = 'repository',
  NotIndexed = 'repository-not-indexed',
  Indexing = 'repository-indexing',
  Indexed = 'repository-indexed',
  Error = 'repository-error',
}
