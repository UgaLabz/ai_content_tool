## 🚀 INITIALIZATION: First Time Setup
**When Claude is first initialized in a project, IMMEDIATELY:**
1. Check for `/docs` directory in project root
2. Create it if missing
3. Audit existing docs or create standard templates
4. See "Initial Documentation Setup" section below for details

## 🚨 CRITICAL: Documentation First Rule 
**ALWAYS update documentation BEFORE committing any code changes**
- This is MANDATORY for ALL projects
- Documentation must be complete and accurate
- Include doc updates in the same commit as code
- When Claude's context usage drops below 10%, prioritize updating documentation to capture recent work and decisions
- Use low-context moments to ensure docs reflect the current state of the project

## 📏 File Size & Organization Rules
**ENFORCE STRICTLY - These prevent technical debt**

1. **Hard 200-line limit** - Files MUST NOT exceed 200 lines of code (excluding comments/imports)
   - When approaching 150 lines, start planning the split
   - Create logical subdirectories for split files
   - Each split file should have a single, clear responsibility

2. **Proactive directory planning** - ALWAYS plan directory structure BEFORE writing code
   - Group related functionality in logical subdirectories from the start
   - Use functional organization (by purpose) rather than technical layers
   - Create subdirectories when you have 3+ related files

3. **Immediate refactoring** - When a file hits 150 lines, refactor it immediately
   - Don't wait until 200+ lines to split
   - Plan the split to maintain logical cohesion
   - Update imports and dependencies properly

## 🏗️ Code Quality Rules
**MAINTAIN HIGH STANDARDS**

4. **Simplicity first** - Always choose the simplest solution that works
   - Prefer existing patterns over new ones
   - Avoid premature optimization
   - Write readable code over clever code

5. **No duplication** - Check for existing similar code before creating new functionality
   - Search the codebase for similar patterns
   - Refactor to share common logic
   - Create utility functions for repeated code

6. **Single responsibility** - Each file/function should have ONE clear purpose
   - Easy to name and describe
   - Easy to test independently
   - Easy to modify without affecting other parts

## 🔄 Development Process Rules
**WORKFLOW GUIDELINES**

7. **Iterative development** - Build on existing code rather than rewriting
   - Exhaust existing implementation options first
   - Only introduce new patterns when existing ones can't work
   - Remove old implementations when replacing them

8. **Regular commits** - Make frequent, logical commits during development
   - Commit after completing each logical unit of work
   - Group related changes together in single commits
   - Always update relevant documentation BEFORE committing
   - Write clear, descriptive commit messages

9. **Environment awareness** - Code must work across dev, test, and prod
   - No hardcoded environment-specific values
   - Use configuration for environment differences
   - Test in multiple environments when possible

10. **Clean server management** - Always clean up development servers
    - Kill existing servers before starting new ones
    - Check for running processes that might conflict
    - Use consistent ports and configurations

## 🎯 Task Focus Rules
**STAY ON TARGET**

11. **Scope discipline** - Only modify code relevant to the current task
    - Don't fix unrelated issues unless explicitly asked
    - Don't refactor unrelated code during feature work
    - Keep changes focused and testable

12. **Change impact analysis** - Always consider ripple effects
    - Identify what other code might be affected
    - Test related functionality after changes
    - Update documentation and tests accordingly

## 🛡️ Safety Rules
**PROTECT DATA AND FUNCTIONALITY**

13. **No fake data in production paths** - Mocking only for tests
    - Never add dummy/stub data to dev or prod code
    - Use real data or proper configuration
    - Clearly mark test-only code
TODO: Always ask before using fake data

14. **Environment file protection** - Never overwrite .env files without permission
    - Always ask before modifying environment configuration
    - Explain what changes are needed and why
    - Provide example configurations instead

15. **Working feature protection** - Don't change working architecture without good reason
    - If something works well, leave the core pattern alone
    - Only change architecture when explicitly requested
    - Test thoroughly when architectural changes are needed

## 📋 Testing & Validation Rules
**ENSURE QUALITY**

16. **Comprehensive testing** - Write tests for all major functionality
    - Unit tests for individual components
    - Integration tests for system interactions
    - Always test after making changes

17. **Post-change verification** - Always restart and test after changes
    - Start fresh server instance after modifications
    - Test the specific functionality that was changed
    - Verify no regressions in related areas

## 🗂️ Organization Rules
**MAINTAIN STRUCTURE**

18. **Logical grouping** - Organize code by function, not technical layer
    - Group related business logic together
    - Separate concerns clearly
    - Use intuitive directory names

19. **Consistent patterns** - Follow established project conventions
    - Use the same naming patterns throughout
    - Follow the same file organization principles
    - Maintain consistent code style

## 📖 Documentation Rules
**KEEP DOCS CURRENT**

20. **Documentation BEFORE commits** - ALWAYS update docs BEFORE committing code
    - Check if README.md needs updating for new features/setup
    - Update CHANGELOG.md with ALL changes
    - Update technical docs for implementation changes
    - Update troubleshooting for new issues/solutions
    - Include doc updates in the same commit as code changes

21. **Documentation updates** - Update docs when structure changes
    - Modify affected documentation immediately
    - Keep file path references current
    - Explain architectural decisions

22. **Clear communication** - Explain changes and reasoning
    - Document why decisions were made
    - Provide examples of new patterns
    - Make onboarding easy for new developers

## 📚 Initial Documentation Setup
**When Claude is initialized in a project for the first time**

### Documentation Directory Check
1. **Check for docs folder** - Look for `/docs` directory in project root
   - If missing, create it immediately
   - If exists, audit existing documentation

2. **Documentation Audit** - If docs exist, verify they meet standards:
   - Check for completeness and accuracy
   - Ensure consistent formatting (prefer Markdown)
   - Update outdated information
   - Fix broken links and references
   - Maintain existing good documentation
   TODO: Remove "- Update outdated information" from this list

3. **Required Documentation Templates** - Create these if missing:
   - **README.md** - Project overview, setup, and usage instructions
   - **ARCHITECTURE.md** - System architecture and design decisions
   - **API.md** - API endpoints, request/response formats
   - **DATABASE.md** - Schema design, relationships, migrations
   - **SECURITY.md** - Security measures, authentication, authorization
   - **DEPLOYMENT.md** - Deployment procedures and environments
   - **TESTING.md** - Testing strategy and running tests
   - **CONTRIBUTING.md** - Contribution guidelines and code standards
   - **CHANGELOG.md** - Version history and changes
   - **TROUBLESHOOTING.md** - Common issues and solutions

4. **Project-Specific Documentation** - Based on project type, also create:
   - **UI_COMPONENTS.md** - For frontend projects
   - **SERVICES.md** - For microservices architecture
   - **CONFIGURATION.md** - For complex configuration needs
   - **PERFORMANCE.md** - For performance-critical applications
   - **INTEGRATION.md** - For third-party integrations

5. **Documentation Standards** - All docs should follow:
   - Clear table of contents for long documents
   - Code examples with syntax highlighting
   - Diagrams where helpful (using Mermaid or ASCII)
   - Consistent heading hierarchy
   - Links to related documentation
   - Last updated date at the top

## 🔌 MCP (Model Context Protocol) Configuration
**Launch and utilize these MCP servers when available in the project:**

### Core MCP Servers
- **filesystem** - Enhanced file system access with search and batch operations
- **memory** - Persistent memory across Claude sessions for context retention
- **github** - Direct GitHub repository interactions
- **gdrive** - Google Drive integration for document and file management
- **gmail** - Email integration for notifications and communications
- **postgres** - PostgreSQL database access

### MCP Usage Guidelines
1. Check available MCPs at session start using the UI
2. Use filesystem MCP for bulk file operations instead of multiple Read/Write calls
3. Use memory MCP to store important context and decisions
4. Leverage github MCP for repository operations instead of git commands
5. Use gdrive MCP for backing up important project documents
6. Use gmail MCP for sending project notifications or reports
7. Use postgres MCP for database operations - To connect to different databases (like `uganomics` or `posse_rewards`), modify the connection URL and PGDATABASE environment variable in `~/.config/claude/claude_desktop_config.json` accordingly

## ✅ Pre-Approved Commands
**Claude can run these commands without asking for permission each time**

### Development Commands
- `npm install` / `yarn install` / `pnpm install` - Installing dependencies
- `npm run dev` / `yarn dev` / `pnpm dev` - Starting development server
- `npm run build` / `yarn build` / `pnpm build` - Building the project
- `npm run test` / `yarn test` / `pnpm test` - Running tests
- `npm run lint` / `yarn lint` / `pnpm lint` - Running linter
- `npm run format` / `yarn format` / `pnpm format` - Formatting code
TODO: Add NVM commands

### Git Commands
- `git status` - Checking repository status
- `git diff` - Viewing changes
- `git log` - Viewing commit history
- `git branch` - Listing branches
- `git add .` - Staging files (only when explicitly working on commits)
- `git commit -m` - Creating commits (only when explicitly requested)
TODO: Add git push/pull commands

### File Operations
- `ls` / `ls -la` - Listing directory contents
- `cat` - Reading file contents
- `mkdir` - Creating directories
- `touch` - Creating empty files
- `rm` - Removing files (with caution, ask for confirmation on important files)

### Process Management
- `ps aux | grep` - Finding running processes
- `kill` / `pkill` - Stopping processes (only development servers)
- `lsof -i` - Checking port usage

### Environment Commands
- `node --version` / `npm --version` - Checking versions
- `which` - Finding command locations
- `env | grep` - Checking environment variables (never display secrets)
TODO: Add env variables commands
TODO: Add Flutter commands
TODO: Add Android commands
TODO: Add iOS commands
TODO: Add React Native commands
TODO: Add React commands
TODO: Add Python commands

### Testing & Debugging
- `curl` - Testing API endpoints
- `ping` - Testing connectivity
- `netstat` / `ss` - Checking network connections

### Note on Restrictions
- NO commands that modify system configuration
- NO commands that access sensitive data or credentials
- NO destructive commands without explicit request
- Always ask before running commands not on this list