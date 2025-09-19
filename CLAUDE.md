# Project Assistant Instructions

## Project Overview
You are developing a web application for creating and sharing travel maps. This project follows strict Test-Driven Development (TDD) methodology and maintains comprehensive documentation.

## Core Development Principles

### 1. Test-Driven Development (TDD)
- **Always** write tests BEFORE implementing features
- Each feature must have corresponding test coverage
- No code changes without passing tests
- Available testing tools:
  - Puppeteer for end-to-end UI testing
  - Playwright for cross-browser UI testing
  - Unit/integration testing frameworks as needed

### 2. Documentation Requirements

#### Required Documents
- **DESIGN.md**: Contains all graphical design, UX decisions, and product roadmap
- **TECH.md**: Documents technical architecture, technology choices, and implementation strategies
- **CHANGELOG.md**: Maintains incremental record of all changes

#### Documentation Workflow
After EVERY change:
1. Update relevant documentation files
2. Challenge and validate existing decisions based on new findings
3. Document rationale for any deviations from original plan
4. Keep documentation synchronized with codebase

### 3. Version Control Workflow

#### Commit Standards
- Create atomic, focused commits
- Write clear, concise commit messages in imperative mood
- Do NOT reference AI assistance in commit messages
- Example: "Add user authentication endpoint" not "Claude added auth endpoint"

#### Pull Request Process
1. Create feature branch from main
2. Ensure ALL tests pass before committing
3. Update CHANGELOG.md with changes
4. Create descriptive PR with:
   - Summary of changes
   - Testing performed
   - Documentation updates
   - Any breaking changes
5. Push to remote repository

### 4. Development Workflow

1. **Analyze** requirement and update DESIGN.md if needed
2. **Write** failing test for new feature
3. **Implement** minimal code to pass test
4. **Refactor** while keeping tests green
5. **Document** technical decisions in TECH.md
6. **Log** changes in CHANGELOG.md
7. **Commit** with appropriate message
8. **Push** via pull request

## Quality Checklist
Before each commit, verify:
- [ ] All existing tests pass
- [ ] New tests written for new features
- [ ] Documentation updated
- [ ] CHANGELOG.md entry added
- [ ] Code follows project conventions
- [ ] No console errors or warnings
- [ ] Cross-browser compatibility checked (if UI change)

## Error Handling
- If tests fail, fix issues before proceeding
- Document unexpected behaviors or limitations discovered
- Consider rollback if changes break existing functionality
- Update TECH.md with lessons learned from failures

## Decision Making
When facing technical choices:
1. Consult existing documentation first
2. Consider long-term maintainability
3. Prioritize user experience
4. Document rationale for decisions
5. Be prepared to justify deviations from original plan