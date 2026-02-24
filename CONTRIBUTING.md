# Contributing to ProtVista-UniProt

Thank you for your interest in contributing to ProtVista-UniProt! This document provides guidelines for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc` or `package.json`)
- Yarn v1

### Development Setup

1. Create a fork and clone this on your local machine:
   ```bash
   git clone [https://github.com/YOUR-USERNAME/protvista-uniprot.git](https://github.com/YOUR-USERNAME/protvista-uniprot.git)
   cd protvista-uniprot
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Run the development server:
   ```bash
   yarn start
   ```
4. Run tests:
   ```bash
   yarn test
   ```

## Making Changes

### Branch Naming

- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates

### Development Workflow

1. Create a new branch from `main`.
2. Make your changes.
3. Write/update tests as needed.
4. Ensure all tests pass: `yarn test`.
5. Update documentation if applicable.
6. Commit your changes with clear, descriptive messages.

### Commit Messages

- Use present tense ("Add feature" not "Added feature").
- Be descriptive but concise.
- Reference issues when applicable (e.g., "Fix #123").

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a PR against the `main` branch.
3. Fill out the PR template completely.
4. Link any related issues.
5. Wait for review and address feedback.

### PR Checklist

Before submitting, ensure:

- Code follows the project's style guidelines
- Tests pass locally
- New tests added for new functionality
- Documentation updated if needed
- No console errors or warnings
- Screenshots included for visual changes

## Testing

### Running Tests

```bash
yarn test          # Run all tests
yarn test:watch    # Run tests in watch mode
yarn test:coverage # Generate coverage report
```

### Writing Tests

- Write unit tests for new components/functions.
- Include visual regression tests for UI changes when possible.
- Test edge cases and error conditions.
- Aim to maintain or improve code coverage.

## Code Style

- We use ESLint and Prettier for code formatting (automated in CI).
- Follow TypeScript best practices.
- Write clear, self-documenting code.
- Add JSDoc comments for public APIs.

## Reporting Bugs

When reporting bugs, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Screenshots or recordings if applicable

Use the GitHub issue tracker and apply the appropriate labels.

## Requesting Features

For feature requests:

- Check if it already exists in the issues.
- Describe the use case and expected behavior.
- Explain why this would be valuable.
- Be open to discussion about implementation.

## Questions?

If you have questions or need help:

- Check existing issues and discussions.
- Open a new issue with the `question` label.
- Reach out to the maintainers.
- Attend our monthly office hours, hosted virtually - more info below.

### Office Hours

We host monthly office hours to answer questions, discuss contributions, and help new contributors get started.

- **When:** [Which] Tuesday of each month, 11am-12pm GMT/BST
- **Where:** [Link to video call]

**What to expect:**

- Q&A about contributing to ProtVista-UniProt
- Help with development setup
- Discussion of upcoming features or roadmap
- Code review guidance

**How to join:**

- No registration required, just drop in.
- Check our [calendar/issues/discussions] for the next session.
- Can't make it? Post questions in advance and we'll address them.

Everyone is welcome, whether you're a first-time contributor or a regular!

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to ProtVista-UniProt! 🎉
