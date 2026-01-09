# Contributing to LazorKit Demo

Thank you for your interest in contributing to the LazorKit Integration Example! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

We welcome contributions of all kinds:

- 🐛 **Bug Reports**: Found a bug? Open an issue!
- 💡 **Feature Suggestions**: Have an idea? Share it!
- 📝 **Documentation**: Improve tutorials, guides, or code comments
- 🔧 **Code Improvements**: Fix bugs, add features, improve code quality
- 🎨 **UI/UX Enhancements**: Improve the user interface or user experience

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/yourusername/passkey-lazorkit-demo.git
   cd passkey-lazorkit-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make your changes**
   - Write clean, well-commented code
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

5. **Test your changes**
   ```bash
   # Run the development server
   npm run dev:https
   
   # Check for TypeScript errors
   npx tsc --noEmit
   
   # Run linter
   npm run lint
   ```

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

7. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## 📋 Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` types (use `unknown` with type guards)
- Use interfaces for object shapes
- Use enums for constants

### React Components

- Use functional components with hooks
- Use `'use client'` directive for client components
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use meaningful component and prop names

### File Organization

- Follow the existing folder structure (see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md))
- Group related files together
- Use descriptive file names
- Keep files focused (one main export per file)

### Code Comments

- Add JSDoc comments for functions and components
- Explain "why" not just "what"
- Comment complex logic or algorithms
- Keep comments up-to-date with code changes

### Example:

```typescript
/**
 * Custom hook for transaction signing with automatic retry logic.
 * 
 * This hook wraps the LazorKit signAndSendTransaction method with:
 * - Automatic credential refresh on errors
 * - Retry logic with exponential backoff
 * - Better error handling and user feedback
 * 
 * @returns Object containing signTransaction function and loading state
 * 
 * @example
 * ```tsx
 * const { signTransaction, isSigning } = useTransactionSigning();
 * 
 * const signature = await signTransaction({
 *   instructions: [transferInstruction],
 * });
 * ```
 */
export function useTransactionSigning() {
  // Implementation...
}
```

## 🧪 Testing Guidelines

### Manual Testing

Before submitting a PR, test:

- [ ] **Passkey Authentication**: Connect/disconnect wallet
- [ ] **Transactions**: Send SOL transactions
- [ ] **Error Handling**: Test error scenarios
- [ ] **Responsive Design**: Test on mobile (320px+) and desktop
- [ ] **Browser Compatibility**: Test on Chrome, Safari, Firefox, Edge

### Testing Checklist

- [ ] Code compiles without TypeScript errors
- [ ] No linting errors
- [ ] All existing features still work
- [ ] New features work as expected
- [ ] Documentation is updated
- [ ] Code follows style guidelines

## 📝 Documentation Guidelines

### Code Documentation

- Add JSDoc comments for public functions
- Document complex algorithms or business logic
- Explain non-obvious code decisions
- Keep README and guides up-to-date

### Tutorial Updates

If you're updating tutorials:

- Keep step-by-step instructions clear
- Include code examples with explanations
- Link to relevant documentation
- Test all code examples work

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node.js version
6. **Screenshots**: If applicable

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: macOS 14
- Node.js: 18.17.0

## Screenshots
If applicable, add screenshots
```

## 💡 Feature Requests

When suggesting features:

1. **Problem**: What problem does this solve?
2. **Solution**: How should it work?
3. **Alternatives**: Other solutions considered?
4. **Use Cases**: Who would benefit?

## 🔍 Pull Request Guidelines

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Changes are tested manually
- [ ] Commit messages are clear

### PR Description

Include:

- **What**: What changes are made
- **Why**: Why these changes are needed
- **How**: How the changes work
- **Testing**: How to test the changes

### Example PR Description

```markdown
## What
Adds QR code scanner for recipient addresses in Send tab

## Why
Users currently have to manually type long Solana addresses, which is error-prone and time-consuming.

## How
- Integrated qr-scanner library
- Added QRScanner component with camera access
- Integrated into SendTab with scan button
- Validates scanned addresses as Solana PublicKeys

## Testing
- Tested on Chrome (desktop and mobile)
- Tested camera permission handling
- Tested invalid QR code rejection
- Tested address validation
```

## 📚 Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

## ❓ Questions?

- Open an issue for questions
- Check existing issues and PRs
- Review the [Documentation](./docs/README.md)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉
