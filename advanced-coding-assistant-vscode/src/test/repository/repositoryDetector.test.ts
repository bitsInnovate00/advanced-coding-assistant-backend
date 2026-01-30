import * as assert from 'assert';
import { RepositoryDetector } from '../../repository/repositoryDetector';

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

    test('should allow event listener registration', () => {
      // Verify that the event can be subscribed to without errors
      const disposable = detector.onRepositoriesChanged(() => {
        // Event listener registered
      });
      
      assert.ok(disposable);
      assert.strictEqual(typeof disposable.dispose, 'function');
      
      // Clean up
      disposable.dispose();
    });
  });
});
