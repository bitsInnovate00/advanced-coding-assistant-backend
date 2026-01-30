import * as assert from 'assert';
import { Repository, IndexingStatus, RepositoryContextValue } from '../../repository/types';

suite('Repository Types Test Suite', () => {
  suite('IndexingStatus', () => {
    test('should have NotIndexed status', () => {
      assert.strictEqual(IndexingStatus.NotIndexed, 'not-indexed');
    });

    test('should have Indexing status', () => {
      assert.strictEqual(IndexingStatus.Indexing, 'indexing');
    });

    test('should have Indexed status', () => {
      assert.strictEqual(IndexingStatus.Indexed, 'indexed');
    });

    test('should have Error status', () => {
      assert.strictEqual(IndexingStatus.Error, 'error');
    });
  });

  suite('Repository', () => {
    test('should create a basic repository object', () => {
      const repo: Repository = {
        name: 'test-repo',
        path: '/path/to/repo',
        status: IndexingStatus.NotIndexed,
      };

      assert.strictEqual(repo.name, 'test-repo');
      assert.strictEqual(repo.path, '/path/to/repo');
      assert.strictEqual(repo.status, IndexingStatus.NotIndexed);
      assert.strictEqual(repo.errorMessage, undefined);
      assert.strictEqual(repo.lastIndexed, undefined);
    });

    test('should create a repository with error message', () => {
      const repo: Repository = {
        name: 'test-repo',
        path: '/path/to/repo',
        status: IndexingStatus.Error,
        errorMessage: 'Connection failed',
      };

      assert.strictEqual(repo.status, IndexingStatus.Error);
      assert.strictEqual(repo.errorMessage, 'Connection failed');
    });

    test('should create a repository with last indexed date', () => {
      const lastIndexed = new Date();
      const repo: Repository = {
        name: 'test-repo',
        path: '/path/to/repo',
        status: IndexingStatus.Indexed,
        lastIndexed,
      };

      assert.strictEqual(repo.status, IndexingStatus.Indexed);
      assert.strictEqual(repo.lastIndexed, lastIndexed);
    });
  });

  suite('RepositoryContextValue', () => {
    test('should have correct context values', () => {
      assert.strictEqual(RepositoryContextValue.Repository, 'repository');
      assert.strictEqual(RepositoryContextValue.NotIndexed, 'repository-not-indexed');
      assert.strictEqual(RepositoryContextValue.Indexing, 'repository-indexing');
      assert.strictEqual(RepositoryContextValue.Indexed, 'repository-indexed');
      assert.strictEqual(RepositoryContextValue.Error, 'repository-error');
    });
  });
});
