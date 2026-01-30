import * as vscode from 'vscode';
import { Repository, IndexingStatus, RepositoryContextValue } from './types';
import { RepositoryDetector } from './repositoryDetector';

/**
 * Tree item representing a repository in the sidebar
 */
export class RepositoryTreeItem extends vscode.TreeItem {
  constructor(public readonly repository: Repository) {
    super(repository.name, vscode.TreeItemCollapsibleState.None);

    this.description = this.getDescription();
    this.tooltip = this.getTooltip();
    this.iconPath = this.getIconPath();
    this.contextValue = this.getContextValue();

    // Make item clickable to reveal in OS file explorer
    this.command = {
      command: 'revealFileInOS',
      title: 'Reveal in File Explorer',
      arguments: [vscode.Uri.file(repository.path)],
    };
  }

  /**
   * Gets the description text based on status
   */
  private getDescription(): string {
    switch (this.repository.status) {
      case IndexingStatus.Indexed:
        return 'Indexed';
      case IndexingStatus.Indexing:
        return 'Indexing...';
      case IndexingStatus.Error:
        return 'Error';
      case IndexingStatus.NotIndexed:
      default:
        return 'Not indexed';
    }
  }

  /**
   * Gets the tooltip text
   */
  private getTooltip(): string {
    let tooltip = `${this.repository.name}\n${this.repository.path}\n\nStatus: ${this.repository.status}`;

    if (this.repository.lastIndexed) {
      tooltip += `\nLast indexed: ${this.repository.lastIndexed.toLocaleString()}`;
    }

    if (this.repository.errorMessage) {
      tooltip += `\nError: ${this.repository.errorMessage}`;
    }

    return tooltip;
  }

  /**
   * Gets the icon based on status
   */
  private getIconPath(): vscode.ThemeIcon {
    switch (this.repository.status) {
      case IndexingStatus.Indexed:
        return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
      case IndexingStatus.Indexing:
        return new vscode.ThemeIcon('sync~spin');
      case IndexingStatus.Error:
        return new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
      case IndexingStatus.NotIndexed:
      default:
        return new vscode.ThemeIcon('repo');
    }
  }

  /**
   * Gets the context value for command enablement
   */
  private getContextValue(): string {
    switch (this.repository.status) {
      case IndexingStatus.Indexed:
        return RepositoryContextValue.Indexed;
      case IndexingStatus.Indexing:
        return RepositoryContextValue.Indexing;
      case IndexingStatus.Error:
        return RepositoryContextValue.Error;
      case IndexingStatus.NotIndexed:
      default:
        return RepositoryContextValue.NotIndexed;
    }
  }
}

/**
 * Tree data provider for the repository sidebar view
 */
export class RepositoryTreeProvider implements vscode.TreeDataProvider<RepositoryTreeItem> {
  private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<
    RepositoryTreeItem | undefined | null | void
  >();

  /**
   * Event fired when tree data changes
   */
  public readonly onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;

  constructor(private readonly repositoryDetector: RepositoryDetector) {
    // Listen for repository changes
    this.repositoryDetector.onRepositoriesChanged(() => {
      this.refresh();
    });
  }

  /**
   * Refreshes the tree view
   */
  public refresh(): void {
    this.onDidChangeTreeDataEmitter.fire();
  }

  /**
   * Gets the tree item for an element
   * @param element - The element
   * @returns The tree item
   */
  public getTreeItem(element: RepositoryTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Gets the children of an element
   * @param element - The parent element (undefined for root)
   * @returns Array of child tree items
   */
  public getChildren(element?: RepositoryTreeItem): vscode.ProviderResult<RepositoryTreeItem[]> {
    if (element) {
      // No children for repository items
      return [];
    }

    // Root level - return all repositories
    const repositories = this.repositoryDetector.getRepositories();
    return repositories.map(repo => new RepositoryTreeItem(repo));
  }

  /**
   * Gets the parent of an element
   * @param _element - The element
   * @returns The parent element or undefined
   */
  public getParent(_element: RepositoryTreeItem): vscode.ProviderResult<RepositoryTreeItem> {
    // All repositories are at root level
    return undefined;
  }

  /**
   * Disposes the provider and cleans up resources
   */
  public dispose(): void {
    this.onDidChangeTreeDataEmitter.dispose();
  }
}
