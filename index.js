#!/usr/bin/env node

// Required modules
const inquirer = require("inquirer"); // For interactive prompts
const chalk = require("chalk"); // For styling terminal output
const findProcess = require("find-process"); // For finding processes by port

// Default port ranges
// Next.js and React typically use ports 3000 and above
const DEFAULT_PORTS_REACT_NEXT = Array.from({ length: 11 }, (_, i) => 3000 + i); // 3000-3010
// Vite typically uses 5173 and above
const DEFAULT_PORTS_VITE = Array.from({ length: 11 }, (_, i) => 5173 + i); // 5173-5183
const DEFAULT_PORTS = [
  ...new Set([...DEFAULT_PORTS_REACT_NEXT, ...DEFAULT_PORTS_VITE]),
]; // Combine and ensure uniqueness

/**
 * Parses command-line arguments to determine which ports to scan.
 * @param {string[]} args - Array of command-line arguments.
 * @returns {number[]} An array of unique port numbers.

function parsePortsFromArgs(args) {
  if (args.length === 0) {
    return DEFAULT_PORTS; // Return default ports if no arguments are provided
  }

  const ports = new Set(); // Use a Set to store ports to avoid duplicates
  for (const arg of args) {
    if (arg.includes("-")) {
      // Handle port ranges (e.g., "3000-3005")
      const [startStr, endStr] = arg.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (
        !isNaN(start) &&
        !isNaN(end) &&
        start <= end &&
        start > 0 &&
        end <= 65535
      ) {
        for (let i = start; i <= end; i++) {
          ports.add(i);
        }
      } else {
        console.warn(
          chalk.yellow(`Warning: Invalid port range '${arg}'. Skipping.`)
        );
      }
    } else {
      // Handle single ports
      const port = parseInt(arg, 10);
      if (!isNaN(port) && port > 0 && port <= 65535) {
        ports.add(port);
      } else {
        console.warn(chalk.yellow(`Warning: Invalid port '${arg}'. Skipping.`));
      }
    }
  }
  return Array.from(ports); // Convert Set to Array
}

/**
 * Retrieves information about a process running on a specific port.
 * @param {number} port - The port number to check.
 * @returns {Promise<object|null>} A promise that resolves to process info or null if no process is found.
 */
async function getProcessInfoForPort(port) {
  try {
    // First try find-process
    const list = await findProcess("port", port);
    if (list && list.length > 0) {
      const processInfo = list[0];
      let workingDir;

      // Get working directory for the process
      if (process.platform !== "win32") {
        const { exec } = require("child_process");
        try {
          const pwdPromise = new Promise((resolve) => {
            exec(`lsof -p ${processInfo.pid} | grep cwd`, (error, stdout) => {
              if (!error && stdout) {
                const match = stdout.match(/\s(\/.+?)$/m);
                resolve(match ? match[1].trim() : "N/A");
              } else {
                resolve("N/A");
              }
            });
          });
          workingDir = await pwdPromise;
        } catch {
          workingDir = "N/A";
        }
      }

      return {
        port,
        pid: processInfo.pid,
        name: processInfo.name,
        cmd: processInfo.cmd
          ? processInfo.cmd.split(" ")[0].split(/[\\/]/).pop()
          : "N/A",
        fullCmd: processInfo.cmd || "N/A",
        workingDir: workingDir || "N/A",
      };
    }

    // If find-process didn't find anything and we're on Unix-like system, try lsof
    if (process.platform !== "win32") {
      const { exec } = require("child_process");
      const lsofPromise = new Promise((resolve, reject) => {
        exec(`lsof -i :${port} -P -n`, (error, stdout, stderr) => {
          if (error && error.code !== 1) {
            reject(error);
            return;
          }
          resolve(stdout);
        });
      });

      const lsofOutput = await lsofPromise;
      const lines = lsofOutput.split("\n");
      const processLines = lines.filter(
        (line) => line && !line.startsWith("COMMAND")
      );

      if (processLines.length > 0) {
        const parts = processLines[0].split(/\s+/);
        const pid = parseInt(parts[1], 10);

        // Get working directory
        let workingDir = "N/A";
        try {
          const pwdPromise = new Promise((resolve) => {
            exec(`lsof -p ${pid} | grep cwd`, (error, stdout) => {
              if (!error && stdout) {
                const match = stdout.match(/\s(\/.+?)$/m);
                resolve(match ? match[1].trim() : "N/A");
              } else {
                resolve("N/A");
              }
            });
          });
          workingDir = await pwdPromise;
        } catch {
          workingDir = "N/A";
        }

        return {
          port,
          pid,
          name: parts[0],
          cmd: parts[0],
          fullCmd: parts[0],
          workingDir,
        };
      }
    }
  } catch (error) {
    // console.error(chalk.red(`Error finding process for port ${port}: ${error.message}`));
  }
  return null;
}

/**
 * Displays a help message for the CLI tool.
 */
function displayHelp() {
  const border = chalk.cyan("━".repeat(80));
  const section = chalk.cyan("─".repeat(40));

  console.log(border);
  console.log(
    chalk.bold.cyan(`
   ██╗  ██╗██╗██╗     ██╗      ██████╗ ███████╗██╗   ██╗
   ██║ ██╔╝██║██║     ██║     ██╔════╝ ██╔════╝██║   ██║
   █████╔╝ ██║██║     ██║     ██║  ███╗█████╗  ██║   ██║
   ██╔═██╗ ██║██║     ██║     ██║   ██║██╔══╝  ╚██╗ ██╔╝
   ██║  ██╗██║███████╗███████╗╚██████╔╝███████╗ ╚████╔╝ 
   ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝  ╚═══╝  
`)
  );
  console.log(border);

  console.log(chalk.bold.yellow("\n📋 Description:"));
  console.log(
    "  A powerful CLI tool to find and terminate development server processes."
  );
  console.log(
    "  Perfect for cleaning up those pesky development servers that won't quit!"
  );

  console.log(chalk.bold.yellow("\n🛠  Usage:"));
  console.log(`  ${chalk.green("kill-dev")} [options] [port_or_range ...]`);

  console.log(chalk.bold.yellow("\n📌 Arguments:"));
  console.log(
    "  port_or_range    Single port (3000) or port range (3000-3005)"
  );

  console.log(chalk.bold.yellow("\n🔧 Options:"));
  console.log("  -h, --help     Show this help menu");

  console.log(chalk.bold.yellow("\n🎯 Default Ports:"));
  console.log(`  • Next.js/React: ${chalk.green("3000-3010")}`);
  console.log(`  • Vite: ${chalk.green("5173-5183")}`);

  console.log(chalk.bold.yellow("\n💡 Examples:"));
  console.log(section);
  console.log(
    `  ${chalk.green("kill-dev")}                   ${chalk.gray(
      "# Scan default ports"
    )}`
  );
  console.log(
    `  ${chalk.green("kill-dev 3000")}              ${chalk.gray(
      "# Scan specific port"
    )}`
  );
  console.log(
    `  ${chalk.green("kill-dev 3000 8080")}         ${chalk.gray(
      "# Scan multiple ports"
    )}`
  );
  console.log(
    `  ${chalk.green("kill-dev 3000-3005")}         ${chalk.gray(
      "# Scan port range"
    )}`
  );
  console.log(
    `  ${chalk.green("kill-dev 3000 8000-8010")}    ${chalk.gray(
      "# Mix ports and ranges"
    )}`
  );

  console.log(chalk.bold.yellow("\n🎮 Controls:"));
  console.log(`  ${chalk.cyan("Space")}    Select/deselect process`);
  console.log(`  ${chalk.cyan("a")}        Toggle all processes`);
  console.log(`  ${chalk.cyan("i")}        Invert selection`);
  console.log(`  ${chalk.cyan("Enter")}    Confirm and proceed`);

  console.log(border + "\n");
}

/**
 * Attempts to kill a process with increasing force if needed
 * @param {object} proc - Process information object
 * @returns {Promise<boolean>} - Whether the process was successfully terminated
 */
async function killProcess(proc) {
  const signals = ["SIGTERM", "SIGINT", "SIGKILL"];
  const { exec } = require("child_process");

  for (const signal of signals) {
    try {
      process.kill(proc.pid, signal);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Give process time to terminate

      try {
        process.kill(proc.pid, 0);
        if (process.platform !== "win32") {
          await new Promise((resolve, reject) => {
            exec(`kill -${signal.replace("SIG", "")} ${proc.pid}`, (error) => {
              if (error && error.code !== 1) reject(error);
              else resolve();
            });
          });
        }
      } catch (e) {
        if (e.code === "ESRCH") return true; // Process terminated
      }
    } catch (err) {
      if (err.code === "ESRCH") return true; // Process terminated
      if (err.code === "EPERM" && signal !== signals[signals.length - 1])
        continue;
      throw err;
    }
  }

  try {
    process.kill(proc.pid, 0);
    return false;
  } catch (e) {
    return e.code === "ESRCH";
  }
}

/**
 * Verifies if a port is still in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - Whether the port is in use
 */
async function isPortInUse(port) {
  const { exec } = require("child_process");
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      exec(`lsof -i :${port} -P -n`, (error) => resolve(!error));
    } else {
      exec(`netstat -ano | findstr :${port}`, (error) => resolve(!error));
    }
  });
}

/**
 * Main function to run the CLI tool.
 */
async function main() {
  const args = process.argv.slice(2); // Get command-line arguments, excluding 'node' and script path

  // Check for help flags
  if (args.includes("--help") || args.includes("-h")) {
    displayHelp();
    return;
  }

  const targetPorts = parsePortsFromArgs(args);

  if (targetPorts.length === 0 && args.length > 0) {
    // User provided args, but none were valid ports
    console.log(
      chalk.yellow(
        "No valid ports to scan. Please provide valid port numbers or ranges."
      )
    );
    displayHelp();
    return;
  }
  if (targetPorts.length === 0 && args.length === 0) {
    // Should not happen if DEFAULT_PORTS is populated
    console.log(
      chalk.yellow("No default ports configured and no ports specified.")
    );
    return;
  }

  console.log(
    chalk.blue(`Scanning for processes on ports: ${targetPorts.join(", ")} ...`)
  );

  // Asynchronously get process information for all target ports
  const processesPromises = targetPorts.map((port) =>
    getProcessInfoForPort(port)
  );
  const foundProcessesRaw = await Promise.all(processesPromises);
  // Filter out null results (ports with no active processes or errors)
  const activeProcesses = foundProcessesRaw.filter((p) => p !== null);

  if (activeProcesses.length === 0) {
    console.log(
      chalk.green("No active processes found on the specified ports.")
    );
    return;
  }

  // Prepare choices for the inquirer prompt
  const choices = activeProcesses.map((p) => ({
    name: `${chalk.bold(p.name)} (PID: ${chalk.yellow(
      p.pid.toString()
    )}) on port ${chalk.magenta(p.port.toString())} ${chalk.gray(`(${p.cmd})`)}
    ${chalk.dim("📂 " + p.workingDir)}`,
    value: p,
    short: `Port ${p.port} (PID ${p.pid})`,
  }));

  try {
    // Prompt the user to select processes to kill
    const { processesToKill } = await inquirer.prompt([
      {
        type: "checkbox", // Allows multiple selections
        name: "processesToKill",
        message:
          "Select processes to kill (Space to select/deselect, Enter to confirm):",
        choices: choices,
        pageSize: Math.min(choices.length, 15), // Limit display size for long lists
      },
    ]);

    if (!processesToKill || processesToKill.length === 0) {
      console.log(chalk.yellow("No processes selected to kill. Exiting."));
      return;
    }

    console.log(chalk.blue("\nAttempting to terminate selected processes..."));
    let successCount = 0;
    let failCount = 0;

    for (const proc of processesToKill) {
      try {
        console.log(
          chalk.yellow(
            `Terminating ${proc.name} (PID: ${proc.pid}) on port ${proc.port}...`
          )
        );

        const killed = await killProcess(proc);
        const portStillInUse = await isPortInUse(proc.port);

        if (killed && !portStillInUse) {
          console.log(
            chalk.green(
              `  ✓ Successfully terminated process ${proc.name} (PID: ${proc.pid}) on port ${proc.port}`
            )
          );
          successCount++;
        } else {
          console.log(
            chalk.red(
              `  ✗ Failed to fully terminate process ${proc.name} (PID: ${proc.pid}) on port ${proc.port}`
            )
          );
          if (portStillInUse) {
            console.log(
              chalk.yellow(
                `    Port ${proc.port} is still in use. You may need to terminate the process manually with:`
              )
            );
            console.log(chalk.yellow(`    sudo kill -9 ${proc.pid}`));
          }
          failCount++;
        }
      } catch (err) {
        console.error(
          chalk.red(
            `  Failed to signal process ${proc.name} (PID: ${proc.pid}) on port ${proc.port}: ${err.message}`
          )
        );
        if (err.code === "EPERM") {
          console.error(
            chalk.yellow(
              "    Reason: Insufficient permissions. Try running with sudo:"
            )
          );
          console.error(chalk.yellow(`    sudo kill-dev`));
        }
        failCount++;
      }
    }

    // Print summary
    console.log(chalk.blue("\nTermination Summary:"));
    if (successCount > 0) {
      console.log(
        chalk.green(
          `  ${successCount} process(es) were successfully terminated.`
        )
      );
    }
    if (failCount > 0) {
      console.log(
        chalk.red(`  ${failCount} process(es) could not be terminated.`)
      );
    }
  } catch (error) {
    // Handle errors from inquirer (e.g., TTY errors)
    if (error.isTtyError) {
      console.error(
        chalk.red(
          "Error: Interactive prompt could not be rendered in this environment."
        )
      );
      console.error(chalk.yellow("Try running in a standard terminal."));
    } else {
      console.error(
        chalk.red(
          "An unexpected error occurred during the interactive prompt:"
        ),
        error
      );
    }
  }
}

// Execute the main function and catch any top-level unhandled promise rejections
main().catch((err) => {
  console.error(
    chalk.red.bold("A critical error occurred in the kill-dev application:")
  );
  console.error(err);
  process.exit(1);
});
