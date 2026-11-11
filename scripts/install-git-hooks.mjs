// Points git at the versioned hooks directory, so the pre-push gate runs on every clone.
// Runs from `npm install` (prepare). Outside a git checkout, e.g. in a Docker build, it does nothing.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.git')) {
  try {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
    console.log('Git hooks path set to .githooks');
  } catch (error) {
    console.warn(
      'Could not configure the git hooks path; run "git config core.hooksPath .githooks".',
      error instanceof Error ? error.message : error,
    );
  }
}
