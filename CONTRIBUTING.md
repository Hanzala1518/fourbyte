# Contributing to FOURBYTE

First off, thank you for considering contributing to FOURBYTE! 🎉

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear use case** - Why would this be useful?
- **Proposed solution** - How would it work?
- **Alternatives considered** - Other approaches you've thought about

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow the existing code style**
   - Use prettier for formatting
   - Follow Angular style guide for frontend
   - Use consistent naming conventions
3. **Write clear commit messages**
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
4. **Test your changes**
   - Ensure both client and server run without errors
   - Test on multiple browsers if UI changes
5. **Update documentation** if needed
6. **Submit the PR** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/fourbyte.git
cd fourbyte

# Install dependencies
cd server && npm install
cd ../client && npm install

# Start development
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npx ng serve
```

## Code Style

### TypeScript/JavaScript
- Use 2 spaces for indentation
- Use single quotes for strings
- Use meaningful variable names
- Add comments for complex logic

### Angular Components
- Use standalone components
- Follow Angular naming conventions
- Keep components focused and small
- Use RxJS observables for async operations

### CSS
- Use CSS custom properties for theming
- Follow BEM naming for complex components
- Keep animations subtle and purposeful

## Project Architecture

### Frontend (Angular)
- **Components** - UI building blocks
- **Services** - Business logic and state
- **Routing** - Navigation between views

### Backend (Node.js)
- **index.js** - Express server setup
- **socket.js** - Socket.IO event handlers
- **roomManager.js** - Room state management
- **rateLimiter.js** - Rate limiting logic
- **config.js** - Configuration constants

## Testing Checklist

Before submitting a PR:

- [ ] Server starts without errors
- [ ] Client starts without errors
- [ ] Can create a room
- [ ] Can join a room
- [ ] Messages send and receive
- [ ] Username editing works
- [ ] Reconnection works after disconnect
- [ ] Rate limiting prevents spam
- [ ] No console errors or warnings

## Questions?

Feel free to open an issue with the `question` label!
