# Documentation Consolidation Plan

## Current State Analysis

### Root Level Files (16 files)
- `README.md` - Main project README ✅ Keep
- `CHANGELOG.md` - Version history ✅ Keep  
- `LICENSE` - License file ✅ Keep
- `BEDROCK_SETUP.md` - AWS setup guide → Merge into docs/
- `REFACTOR_SUMMARY.md` - Development notes → Archive
- `coordination.md` - Agent coordination → Move to docs/
- `memory-bank.md` - Memory system → Move to docs/
- `llms-install.md` - Installation guide → Merge into README/docs
- `CLAUDE_4_SUPPORT.md` - Claude 4 info → Merge into docs/
- `CLAUDE.md` - Claude integration → Merge into docs/

### Docs Directory (16 files)
- `README.md` - Documentation index ✅ Keep
- `configuration.md` - Config guide ✅ Keep (enhance)
- `tutorial.md` - Getting started ✅ Keep
- `command-reference.md` - CLI commands ✅ Keep
- `cli-reference.md` - Duplicate CLI ref → Merge
- `task-structure.md` - Task format ✅ Keep
- `examples.md` - Usage examples ✅ Keep
- `auto-detection.md` - AWS auto-detection ✅ Keep
- `troubleshooting.md` - Problem solving ✅ Keep
- `licensing.md` - License info → Remove (redundant)
- `migration-guide.md` - Migration info ✅ Keep
- `api-reference.md` - API docs ✅ Keep
- `typescript-api.md` - TypeScript API ✅ Keep
- `mcp-tools-reference.md` - MCP integration ✅ Keep
- `integration-examples.md` - Integration guide ✅ Keep
- `platform-integrations.md` - Platform guide ✅ Keep

### Legacy/Development Files (70+ files)
- `.claude/` directory - Claude AI configs → Archive
- `.roo/` directory - Development rules → Archive  
- `.github/` templates ✅ Keep
- `assets/` guides → Review and consolidate
- `scripts/README.md` → Merge into main docs
- `tests/README.md` → Merge into main docs
- `memory/` READMEs → Archive

## Consolidation Strategy

### Phase 1: Root Level Cleanup
1. **Merge AWS Setup**: BEDROCK_SETUP.md → docs/aws-setup.md
2. **Merge Installation**: llms-install.md → docs/installation.md  
3. **Merge Claude Info**: CLAUDE*.md → docs/claude-integration.md
4. **Archive Development**: REFACTOR_SUMMARY.md → archive/
5. **Move Coordination**: coordination.md → docs/advanced/coordination.md
6. **Move Memory**: memory-bank.md → docs/advanced/memory-system.md

### Phase 2: Docs Directory Optimization
1. **Merge CLI References**: cli-reference.md + command-reference.md → docs/cli-reference.md
2. **Remove Redundant**: licensing.md (use root LICENSE)
3. **Enhance Configuration**: Merge AWS setup into configuration.md
4. **Create Advanced Section**: Move complex topics to docs/advanced/
5. **Reorganize by User Journey**: Getting Started → Usage → Advanced → Reference

### Phase 3: Legacy Cleanup
1. **Archive Development Files**: Move .claude/, .roo/ to archive/
2. **Consolidate Asset Guides**: Merge assets/*.md into relevant docs
3. **Clean Script Docs**: Merge scripts/README.md into docs/development.md
4. **Clean Test Docs**: Merge tests/README.md into docs/development.md

### Phase 4: New Structure
```
docs/
├── README.md                    # Documentation index
├── getting-started/
│   ├── installation.md          # Installation & setup
│   ├── tutorial.md              # Step-by-step guide
│   ├── aws-setup.md             # AWS Bedrock setup
│   └── auto-detection.md        # Zero-config setup
├── usage/
│   ├── cli-reference.md         # Combined CLI docs
│   ├── examples.md              # Usage examples
│   ├── task-structure.md        # Task format
│   └── configuration.md         # Configuration guide
├── integration/
│   ├── mcp-tools.md             # MCP integration
│   ├── platform-integrations.md # Platform guides
│   ├── claude-integration.md    # Claude-specific
│   └── integration-examples.md  # Integration examples
├── reference/
│   ├── api-reference.md         # REST API
│   ├── typescript-api.md        # TypeScript API
│   └── migration-guide.md       # Migration info
├── advanced/
│   ├── coordination.md          # Agent coordination
│   ├── memory-system.md         # Memory management
│   └── development.md           # Dev setup & testing
└── troubleshooting.md           # Problem solving
```

## Implementation Steps

1. Create new directory structure
2. Consolidate and merge overlapping content
3. Update cross-references and links
4. Archive legacy development files
5. Update main README with new doc structure
6. Create redirects/aliases for moved content

## Benefits

- **Reduced Redundancy**: Eliminate duplicate information
- **Better Organization**: Logical user journey structure  
- **Easier Maintenance**: Single source of truth for each topic
- **Improved Discovery**: Clear navigation and categorization
- **Cleaner Repository**: Archive development artifacts 