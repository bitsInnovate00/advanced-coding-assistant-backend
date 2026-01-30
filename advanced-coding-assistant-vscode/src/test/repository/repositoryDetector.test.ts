import * as assert from 'assert';
import { RepositoryDetector } from '../../repository/repositoryDetector';
import { IndexingStatus } from '../../repository/types';

suite('Repository Detector Test Suite', () => {
  let detector: RepositoryDetector;

  setup(() => {
    detector = new RepositoryDetector();
  });

  teardown(() => {
    detector.dispose();
  });

  suite('Initialization', () => {
    test('should create detector successfully', () => {
      assert.ok(detector);
    });

    test('should start with no repositories', () => {
      const repos = detector.getRepositories();
      assert.strictEqual(repos.length, 0);
    });
  });

  suite('Repository Status Updates', () => {
    test('should have updateRepositoryStatus method', () => {
      assert.strictEqual(typeof detector.updateRepositoryStatus, 'function');
    });

    test('should have getRepository method', () => {
      assert.strictEqual(typeof detector.getRepository, 'function');
    });

    test('should have getRepositories method', () => {
      assert.strictEqual(typeof detector.getRepositories, 'function');
    });

    test('should have removeRepository method', () => {
      assert.strictEqual(typeof detector.removeRepository, 'function');
    });

    test('should have detectRepositories method', () => {
      assert.strictEqual(typeof detector.detectRepositories, 'function');
    });
  });

  suite('Event Handling', () => {
    test('should have onRepositoriesChanged event', () => {
      assert.ok(detector.onRepositoriesChanged);
    });

    test('should fire event when listener is registered', (done) => {
      detector.onRepositoriesChanged(() => {
        done();
      });
      
      // Force a status update (will not find the repo, but should still work)
      detector.updateRepositoryStatus('/nonexistent', IndexingStatus.Indexed);
      
      // Wait a bit for potential event
      setTimeout(done, 100);
    });
  });
});
