import * as vscode from 'vscode';
import { IndexingStatus } from './types';
import { RepositoryDetector } from './repositoryDetector';
import { ApiClient } from '../api';
import { Logger } from '../logger';

/**
 * Service for managing repository operations (index, re-index, delete)
 */
export class RepositoryManager {
  constructor(
    private readonly repositoryDetector: RepositoryDetector,
    private readonly getApiClient: () => ApiClient | undefined
  ) {}

  /**
   * Indexes a repository
   * @param repoPath - The repository path to index
   */
  public async indexRepository(repoPath: string): Promise<void> {
    const repo = this.repositoryDetector.getRepository(repoPath);
    
    if (!repo) {
      throw new Error(`Repository not found: ${repoPath}`);
    }

    const apiClient = this.getApiClient();
    
    if (!apiClient) {
      throw new Error('API client not available. Please ensure the backend is connected.');
    }

    Logger.info(`Starting indexing for repository: ${repo.name}`);
    this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.Indexing);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Indexing repository: ${repo.name}`,
        cancellable: false,
      },
      async (progress) => {
        try {
          progress.report({ message: 'Uploading repository to backend...' });
          
          await apiClient.uploadLocalRepository(repoPath);
          
          Logger.info(`Repository indexed successfully: ${repo.name}`);
          this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.Indexed);
          
          await vscode.window.showInformationMessage(
            `Repository "${repo.name}" indexed successfully.`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          Logger.error(`Failed to index repository: ${repo.name}`, error);
          this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.Error, errorMessage);
          
          await vscode.window.showErrorMessage(
            `Failed to index repository "${repo.name}": ${errorMessage}`
          );
        }
      }
    );
  }

  /**
   * Re-indexes a repository
   * @param repoPath - The repository path to re-index
   */
  public async reindexRepository(repoPath: string): Promise<void> {
    const repo = this.repositoryDetector.getRepository(repoPath);
    
    if (!repo) {
      throw new Error(`Repository not found: ${repoPath}`);
    }

    const apiClient = this.getApiClient();
    
    if (!apiClient) {
      throw new Error('API client not available. Please ensure the backend is connected.');
    }

    Logger.info(`Starting re-indexing for repository: ${repo.name}`);
    this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.Indexing);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Re-indexing repository: ${repo.name}`,
        cancellable: false,
      },
      async (progress) => {
        try {
          progress.report({ message: 'Refreshing repository on backend...' });
          
          await apiClient.refreshLocalRepository(repoPath);
          
          Logger.info(`Repository re-indexed successfully: ${repo.name}`);
          this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.Indexed);
          
          await vscode.window.showInformationMessage(
            `Repository "${repo.name}" re-indexed successfully.`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          Logger.error(`Failed to re-index repository: ${repo.name}`, error);
          this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.Error, errorMessage);
          
          await vscode.window.showErrorMessage(
            `Failed to re-index repository "${repo.name}": ${errorMessage}`
          );
        }
      }
    );
  }

  /**
   * Deletes a repository from the index
   * @param repoPath - The repository path to delete from index
   */
  public async deleteRepository(repoPath: string): Promise<void> {
    const repo = this.repositoryDetector.getRepository(repoPath);
    
    if (!repo) {
      throw new Error(`Repository not found: ${repoPath}`);
    }

    const confirm = await vscode.window.showWarningMessage(
      `Are you sure you want to remove "${repo.name}" from the index?`,
      { modal: true },
      'Remove'
    );

    if (confirm !== 'Remove') {
      return;
    }

    Logger.info(`Removing repository from index: ${repo.name}`);

    // Reset status to not indexed (the repository is still detected, just not indexed)
    this.repositoryDetector.updateRepositoryStatus(repoPath, IndexingStatus.NotIndexed);
    
    await vscode.window.showInformationMessage(
      `Repository "${repo.name}" removed from index.`
    );
  }

  /**
   * Indexes all detected repositories
   */
  public async indexAllRepositories(): Promise<void> {
    const repositories = this.repositoryDetector.getRepositories();
    const notIndexed = repositories.filter(r => r.status === IndexingStatus.NotIndexed);

    if (notIndexed.length === 0) {
      await vscode.window.showInformationMessage('All repositories are already indexed.');
      return;
    }

    const confirm = await vscode.window.showInformationMessage(
      `Index ${notIndexed.length} repository(ies)?`,
      'Index All'
    );

    if (confirm !== 'Index All') {
      return;
    }

    for (const repo of notIndexed) {
      await this.indexRepository(repo.path);
    }
  }

  /**
   * Refreshes the repository list by re-detecting repositories
   */
  public async refreshRepositories(): Promise<void> {
    await this.repositoryDetector.detectRepositories();
  }
}
