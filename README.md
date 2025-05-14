# kill-dev CLI Tool

Are you also to dumb to remember simple kill ports command? I've got your back.

A command-line utility to quickly find and terminate development server processes. It scans specified ports (or default common development ports) and allows you to interactively select and kill multiple processes.

## Features

- Scans default ports for common development servers:
  - Next.js/React: 3000-3010
  - Vite: 5173-5183
- Accepts custom port numbers or port ranges as arguments (e.g., `kill-dev 3000 8000-8010`).
- Provides an interactive checklist (use Spacebar to select, Enter to confirm) to choose which processes to terminate.
- Displays process name, PID, port, and part of the command for easy identification.
- Cross-platform compatibility (relies on `find-process` which works on macOS, Linux, and Windows).

## Prerequisites

- Node.js (version 14.0.0 or higher recommended)
- npm (comes with Node.js)

## Installation

### Option 1: Global Installation (Recommended for CLI usage)

Once the package is published to npm, you can install it globally:

```bash
npm install -g kill-dev
```

(Replace `kill-dev` with the actual package name if it's different on npm).

### Option 2: Install from a Git Repository (if you clone it)

1.  Clone the repository: # git clone <repository_url> # cd kill-dev-tool
    . Install dependencies:
    npm install
    . Link the package for local global use:
    ` npm link`
    This makes the `kill-dev` command available in your terminal, pointing to your local code.

## Usage

Run the command from your terminal:

```bash
kill-dev [port_or_range ...]
```

**Arguments:**
s

- `[port_or_range ...]`: (Optional) A list of specific ports (e.g., `3000 8080`) or port ranges (e.g., `3000-3005`). If no arguments are provided, the tool scans the default development ports.

**Options:**

- `-h`, `--help`: Display the help message.

**Examples:**

1.  **Scan default development ports:**

`kill-dev`

2.  **Scan a specific port:**
    ` kill-dev 3000`
3.  **Scan multiple specific ports:**
    `kill-dev 3000 8080 9001 `
4.  **Scan a port range:**
    ` kill-dev 8000-8005`
5.  **Scan a mix of specific ports and ranges:**
    ` kill-dev 3000 5000-5003 9090`
6.  **Display help:**
    ` kill-dev --help`
    After running the command, you will be presented with a list of active processes found on the scanned ports.

- Use the **Arrow Keys** to navigate the list.
- Press **Spacebar** to select or deselect a process.
- Press **Enter** to confirm and terminate the selected processes.

## Development (for contributors)

If you've cloned the source code and want to contribute or modify it:

1.  Navigate to the project directory (`kill-dev-tool`).
2.  Install dependencies: `npm install`.
3.  If you want to test your local changes using the `kill-dev` command globally, run `npm link`.
4.  Make your changes to `index.js` or other relevant files.
5.  Test by running `kill-dev` in your terminal.

## Publishing to npm (for package maintainers)

1. Ensure `package.json` is correctly configured (version, author, description, etc.).
2. log in to your npm account:` npm login`
   Publish the package:
   `npm publish`
   ` (If using a scope, e.g.,`@username/kill-dev`, use `npm publish --access public` for the first public publish).

## License

MIT

xxx yours sincerely,

Remco Stoeten
