# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.9.4] - 2025-12-17

### Changed
- Rename package from `@csvms/cli` to `csvms` for simpler installation

## [0.9.3] - 2025-12-17

### Fixed
- Fix test script to pass when no test files exist

## [0.9.2] - 2025-12-17

### Fixed
- Fix CI workflow: clean node_modules and package-lock.json before install to resolve rollup optional dependencies issue

## [0.9.1] - 2025-12-17

### Fixed
- Fix CI workflow: use `npm install` instead of `npm ci` to resolve rollup optional dependencies issue

## [0.9.0] - 2025-12-17

### Added
- Initial release
- CMS-like UI for editing CSV files with list and detail form views
- YAML/JSON schema definition for forms, validation, and normalization rules
- CSV normalization on save for stable Git diffs (column order, newlines, quoting, sorting)
- Security features: workspace path restriction, path traversal prevention
- Single dataset mode with `--schema` option
- Table and tile view modes with drag-and-drop row reordering
- Keyboard navigation support
- Quick search functionality
- Diff view for changes before saving
- Read-only mode support

### Security
- Path traversal protection
- Workspace boundary enforcement

[Unreleased]: https://github.com/foo-ogawa/csvms/compare/v0.9.4...HEAD
[0.9.4]: https://github.com/foo-ogawa/csvms/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/foo-ogawa/csvms/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/foo-ogawa/csvms/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/foo-ogawa/csvms/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/foo-ogawa/csvms/releases/tag/v0.9.0

