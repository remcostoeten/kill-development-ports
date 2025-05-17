# kill-dev

Are you also to dumb to remember simple kill ports command? I've got your back. A powerful CLI tool to find and kill development server processes on specified or common dev ports. 

## Features

- 🔍 Automatically scans common development ports (Next.js, React, Vite)
- 🎯 Supports specific port numbers or port ranges
- 📋 Interactive process selection
- 💪 Works on Windows, macOS, and Linux

## Installation

### Using GitHub Packages

1. First, authenticate with GitHub Packages. Create or edit your `~/.npmrc` file:
```bash
@remcostoeten:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

2. Install the package:
```bash
npm install -g @remcostoeten/kill-dev
```

To create a GitHub token:
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic). Or click [here](https://github.com/settings/personal-access-tokens/new) (make sure you're logged in)
2. Generate a new token with `read:packages` scope
3. Copy the token and use it in your `.npmrc` file

## Usage

```bash
# Scan default ports (3000-3010, 5173-5183)
kill-dev

# Scan specific port
kill-dev 3000

# Scan multiple ports
kill-dev 3000 8080

# Scan port range
kill-dev 3000-3005

# Mix ports and ranges
kill-dev 3000 8000-8010
```

### Alternative Command

You can also use the `kill-port` command which works exactly the same:

```bash
kill-port 3000
```

### Interactive Selection

1. The tool will scan for processes on the specified ports
2. Select processes using:
   - `Space` to select/deselect individual processes
   - `a` to toggle all processes
   - `i` to invert selection
   - `Enter` to confirm and proceed

## Default Ports

- Next.js/React: 3000-3010
- Vite: 5173-5183

## Requirements

- Node.js >= 14.0.0

## License

MIT © [Remco Stoeten](https://github.com/remcostoeten)
