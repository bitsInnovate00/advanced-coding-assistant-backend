import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Repository, IndexingStatus } from './types';
import { Logger } from '../logger';

/**
 * Service for detecting Git repositories in the VS Code workspace
 */
export class RepositoryDetector {
  private repositories: Map<string, Repository> = new Map();
  private readonly onRepositoriesChangedEmitter = new vscode.EventEmitter<Repository[]>();
  
  /**
   * Event fired when repositories change (detected, removed, or status updated)
   */
  public readonly onRepositoriesChanged = this.onRepositoriesChangedEmitter.event;

  /**
   * Detects all Git repositories in the current workspace
   * @returns Array of detected repositories
   */
  public async detectRepositories(): Promise<Repository[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      Logger.info('No workspace folders found');
      this.repositories.clear();
      this.fireRepositoriesChanged();
      return [];
    }

    Logger.info(`Detecting repositories in ${workspaceFolders.length} workspace folder(s)`);
    
    const detectedPaths = new Set<string>();
    
    for (const folder of workspaceFolders) {
      await this.detectRepositoriesInFolder(folder.uri.fsPath, detectedPaths);
    }

    // Remove repositories that are no longer present
    for (const repoPath of this.repositories.keys()) {
      if (!detectedPaths.has(repoPath)) {
        this.repositories.delete(repoPath);
        Logger.info(`Repository removed: ${repoPath}`);
      }
    }

    this.fireRepositoriesChanged();
    return this.getRepositories();
  }

  /**
   * Detects Git repositories in a folder (including nested repositories)
   * @param folderPath - The folder path to search
   * @param detectedPaths - Set to track detected paths
   */
  private async detectRepositoriesInFolder(
    folderPath: string,
    detectedPaths: Set<string>
  ): Promise<void> {
    try {
      const gitPath = path.join(folderPath, '.git');
      
      // Check if this folder is a git repository
      if (await this.pathExists(gitPath)) {
        this.addOrUpdateRepository(folderPath);
        detectedPaths.add(folderPath);
        Logger.debug(`Detected repository: ${folderPath}`);
        // Don't search nested directories in a git repo
        return;
      }

      // Search subdirectories (one level deep for performance)
      const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subPath = path.join(folderPath, entry.name);
          const subGitPath = path.join(subPath, '.git');
          
          if (await this.pathExists(subGitPath)) {
            this.addOrUpdateRepository(subPath);
            detectedPaths.add(subPath);
            Logger.debug(`Detected nested repository: ${subPath}`);
          }
        }
      }
    } catch (error) {
      Logger.error(`Error detecting repositories in ${folderPath}`, error);
    }
  }

  /**
   * Checks if a path exists
   * @param targetPath - The path to check
   * @returns True if the path exists
   */
  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await fs.promises.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Adds a new repository or preserves existing status
   * @param repoPath - The repository path
   */
  private addOrUpdateRepository(repoPath: string): void {
    const existing = this.repositories.get(repoPath);
    
    if (existing) {
      // Repository already tracked, preserve its status
      return;
    }

    const repo: Repository = {
      name: path.basename(repoPath),
      path: repoPath,
      status: IndexingStatus.NotIndexed,
    };

    this.repositories.set(repoPath, repo);
  }

  /**
   * Gets all detected repositories
   * @returns Array of repositories
   */
  public getRepositories(): Repository[] {
    return Array.from(this.repositories.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Gets a repository by path
   * @param repoPath - The repository path
   * @returns The repository or undefined
   */
  public getRepository(repoPath: string): Repository | undefined {
    return this.repositories.get(repoPath);
  }

  /**
   * Updates the status of a repository
   * @param repoPath - The repository path
   * @param status - The new status
   * @param errorMessage - Optional error message
   */
  public updateRepositoryStatus(
    repoPath: string,
    status: IndexingStatus,
    errorMessage?: string
  ): void {
    const repo = this.repositories.get(repoPath);
    
    if (repo) {
      repo.status = status;
      // Only set errorMessage for Error status, clear it otherwise
      repo.errorMessage = status === IndexingStatus.Error ? errorMessage : undefined;
      
      if (status === IndexingStatus.Indexed) {
        repo.lastIndexed = new Date();
      }
      
      this.fireRepositoriesChanged();
      Logger.info(`Repository status updated: ${repo.name} -> ${status}`);
    }
  }

  /**
   * Removes a repository from tracking
   * @param repoPath - The repository path
   */
  public removeRepository(repoPath: string): void {
    if (this.repositories.delete(repoPath)) {
      this.fireRepositoriesChanged();
      Logger.info(`Repository removed from tracking: ${repoPath}`);
    }
  }

  /**
   * Fires the repositories changed event
   */
  private fireRepositoriesChanged(): void {
    this.onRepositoriesChangedEmitter.fire(this.getRepositories());
  }

  /**
   * Disposes the detector and cleans up resources
   */
  public dispose(): void {
    this.onRepositoriesChangedEmitter.dispose();
  }
}
