# CI workflow (deferred)
This file is the GitHub Actions workflow we want to enable once the local git credential gets the `workflow` OAuth scope.

## To enable CI:
1. Run `gh auth refresh -h github.com -s workflow` (or generate a token with `workflow` scope)
2. Move this file: `mkdir -p .github/workflows && mv docs/ops/ci.yml .github/workflows/ci.yml`
3. Commit and push.

The workflow runs typecheck + build on push and PR to main.
