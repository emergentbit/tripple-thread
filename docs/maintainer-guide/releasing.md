# Release Process

This document outlines the process for creating and publishing new releases of Tripple Thread.

## Version Management

### Semantic Versioning

The project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

Example: `2.1.3`
- Major: 2
- Minor: 1
- Patch: 3

## Release Checklist

### Pre-release

1. **Code Quality**
   ```bash
   # Run all checks
   npm run lint
   npm run type-check
   npm test
   ```

2. **Documentation**
   - Update API documentation
   - Update examples
   - Review README.md
   - Check internal links

3. **Dependencies**
   ```bash
   # Check for outdated dependencies
   npm outdated

   # Update dependencies if needed
   npm update
   ```

4. **Test Coverage**
   ```bash
   # Verify 100% coverage
   npm run test:coverage
   ```

### Version Bump

1. **Update Version**
   ```bash
   # Bump version
   npm version [major|minor|patch]
   ```

2. **Update CHANGELOG.md**
   ```markdown
   # Changelog

   ## [2.1.0] - 2024-03-15

   ### Added
   - SPARQL query support
   - New graph visualization tools

   ### Changed
   - Improved query performance
   - Updated dependencies

   ### Fixed
   - Memory leak in large datasets
   - URI validation edge cases
   ```

3. **Update Package Files**
   - package.json
   - package-lock.json
   - yarn.lock (if using Yarn)

## Release Process

### Creating the Release

1. **Create Release Branch**
   ```bash
   git checkout -b release/v2.1.0
   ```

2. **Build and Test**
   ```bash
   # Clean build
   npm run clean
   npm ci
   npm run build

   # Run all tests
   npm test
   ```

3. **Update Documentation**
   ```bash
   # Update version references
   sed -i 's/2.0.0/2.1.0/g' README.md
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "chore(release): prepare v2.1.0"
   ```

### Publishing

1. **Merge to Main**
   ```bash
   git checkout main
   git merge release/v2.1.0
   git tag -a v2.1.0 -m "Release v2.1.0"
   ```

2. **Push to Repository**
   ```bash
   git push origin main
   git push origin v2.1.0
   ```

3. **Publish to npm**
   ```bash
   # Build the package
   npm run build

   # Publish to npm
   npm publish
   ```

## Post-release

### Verification

1. **Install Check**
   ```bash
   # Create test directory
   mkdir test-install
   cd test-install

   # Test installation
   npm init -y
   npm install tripple-thread@latest

   # Verify basic functionality
   node -e "
   const { GraphManager } = require('tripple-thread');
   console.log('Installation successful');
   "
   ```

2. **Documentation Check**
   - Verify documentation site is updated
   - Check npm package page
   - Validate external links

3. **Example Projects**
   - Update example projects
   - Test with new version
   - Update documentation

### Announcements

1. **GitHub Release**
   - Create detailed release notes
   - Attach build artifacts
   - Link to CHANGELOG

2. **Communication**
   - Update release thread
   - Notify contributors
   - Update relevant issues

## Hotfix Process

### Emergency Fixes

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/v2.1.1
   ```

2. **Apply Fix**
   - Make minimal necessary changes
   - Add tests
   - Update documentation

3. **Release Process**
   - Follow abbreviated release process
   - Focus on critical changes
   - Fast-track testing

## Release Automation

### GitHub Actions

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

### Release Scripts

```json
{
  "scripts": {
    "prepare-release": "npm run clean && npm run build && npm test",
    "version": "npm run prepare-release && git add -A",
    "postversion": "git push && git push --tags"
  }
}
```

## Troubleshooting

### Common Issues

1. **Failed Builds**
   - Check build logs
   - Verify dependencies
   - Test in clean environment

2. **Publishing Errors**
   - Verify npm credentials
   - Check package.json
   - Validate npm registry

3. **Version Conflicts**
   - Check git tags
   - Verify package version
   - Review CHANGELOG

## See Also

- [Architecture](./architecture.md)
- [Development Setup](./development-setup.md)
- [Contributing Guidelines](./contributing.md)
- [Testing Guide](./testing.md)