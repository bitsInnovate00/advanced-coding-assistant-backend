/**
 * Repository Detection & Workspace Integration Module
 *
 * This module provides services for detecting Git repositories in the
 * VS Code workspace and managing their indexing status.
 */

export { RepositoryDetector } from './repositoryDetector';
export { RepositoryTreeProvider, RepositoryTreeItem } from './repositoryTreeProvider';
export { RepositoryManager } from './repositoryManager';
export * from './types';
