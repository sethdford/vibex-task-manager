# Changelog

## [0.17.3] - 2025-06-14

### Added
- **Zero-Configuration Setup**: AWS Bedrock models are now automatically detected and configured during `init`
- **Intelligent Model Selection**: Automatically chooses optimal models based on availability and use case
- **`vibex-task-manager config-detect` Command**: Manually detect available models with region and profile options
- **Graceful Fallback**: Helpful guidance when AWS credentials aren't available
- **Auto-Detection Documentation**: Comprehensive guide for the new zero-config feature

### Fixed
- Added postbuild script to copy supported-models.json to dist directory
- Fixed missing supported-models.json error during initialization

### Enhanced
- Updated README with prominent zero-configuration setup information
- Improved documentation for AWS Bedrock auto-detection
- Enhanced tutorial and command reference with auto-detection details

## [0.17.2] - 2025-06-14

### Fixed
- Fixed init command to use correct command for auto-detection (removed npx)
- Init command now properly detects and runs config-detect command
- Auto-detection runs correctly during project initialization

## [0.17.1] - 2025-06-14

### Fixed
- Fixed CLI commands to use compiled TypeScript files
- Added `config-detect` and `config-setup` commands
- Auto-detection now runs during `init` command
- Proper bin entry points for compiled code

## [0.17.0] - 2025-06-14

### Added
- AWS Bedrock auto-detection for zero-configuration setup
- Automatically detects and configures available Claude models
- Smart model recommendations based on availability and use case
- `config detect` command to manually check available models
- Multi-region support for Bedrock model detection
- Graceful fallback when Bedrock isn't available

### Changed
- `init` command now auto-detects Bedrock models by default
- `config setup` uses auto-detection when no models specified
- Improved error messages when models aren't accessible

### Fixed
- Better handling of AWS credential detection
- More informative error messages for Bedrock access issues

## [0.16.2] - 2025-06-14

### Initial Release
- Complete TypeScript refactoring
- AWS Bedrock integration with all Claude models
- MCP server fully converted to TypeScript
- Comprehensive type definitions and validation
- Retry logic with exponential backoff
- All references changed from "Task Master" to "Vibex Task Manager"