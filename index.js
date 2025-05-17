#!/usr/bin/env node

const inquirer = require("inquirer");
const chalk = require("chalk");
const { exec } = require("child_process");

// Default ports to scan (Next.js/React and Vite common ports)
const DEFAULT_PORTS = [
  // Next.js/React ports (3000-3010)
  ...Array.from({ length: 11 }, (_, i) => 3000 + i),
  // Vite ports (5173-5183)
  ...Array.from({ length: 11 }, (_, i) => 5173 + i)
];

/**
 * Parse command-line arguments for port numbers
 */
function parsePortsFromArgs(args) {
  if (args.length === 0) return DEFAULT_PORTS;
  
  const ports = new Set();
  for (const arg of args) {
    if (arg.includes("-")) {
      // Handle port ranges (e.g., "3000-3005")
      const [startStr, endStr] = arg.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end && start > 0 && end <= 65535) {
        for (let i = start; i <= end; i++) {
          ports.add(i);
        }
      } else {
        console.warn(chalk.yellow(`Warning: Invalid port range '${arg}'. Skipping.`));
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
  return Array.from(ports);
}

/**
 * Find processes running on a specific port
 */
async function findProcessesByPort(port) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -P -n -F pcn 2>/dev/null`;
    
    exec(cmd, (error, stdout) => {
      if (error || !stdout) {
        resolve(null);
        return;
      }
      
      if (process.platform === 'win32') {
        // Parse Windows netstat output
        const lines = stdout.trim().split('\n');
        const processes = new Set();
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parseInt(parts[4], 10);
            if (!isNaN(pid)) {
              processes.add(pid);
            }
          }
        }
        
        if (processes.size > 0) {
          // Get process names for the PIDs
          const pids = Array.from(processes);
          Promise.all(pids.map(pid => getProcessNameByPid(pid))).then(names => {
            resolve(pids.map((pid, i) => ({
              pid,
              name: names[i] || 'unknown',
              port
            })));
          });
        } else {
          resolve(null);
        }
      } else {
        // Parse Unix lsof output
        const lines = stdout.split('\n');
        const processes = {};
        let currentPid = null;
        
        for (const line of lines) {
          if (line.startsWith('p')) {
            currentPid = parseInt(line.slice(1), 10);
            processes[currentPid] = { pid: currentPid, name: 'unknown', port };
          } else if (line.startsWith('c') && currentPid) {
            processes[currentPid].name = line.slice(1);
          }
        }
        
        const result = Object.values(processes);
        resolve(result.length > 0 ? result : null);
      }
    });
  });
}

/**
 * Get process name by PID on Windows
 */
async function getProcessNameByPid(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (error, stdout) => {
        if (error || !stdout) {
          resolve('unknown');
          return;
        }
        
        try {
          // Parse CSV format
          const match = stdout.match(/"([^"]+)"/);
          resolve(match ? match[1] : 'unknown');
        } catch (e) {
          resolve('unknown');
        }
      });
    } else {
      exec(`ps -p ${pid} -o comm=`, (error, stdout) => {
        resolve(error ? 'unknown' : stdout.trim());
      });
    }
  });
}

/**
 * Kill process by PID
 */
async function killProcess(pid) {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `taskkill /PID ${pid} /F`
      : `kill -9 ${pid}`;
    
    exec(cmd, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const ports = parsePortsFromArgs(args);
  
  console.log(chalk.blue(`Scanning for processes on ports: ${ports.join(', ')}...`));
  
  // Find processes on all ports
  const processesPromises = ports.map(findProcessesByPort);
  const results = await Promise.all(processesPromises);
  
  // Flatten and filter results
  const allProcesses = results
    .filter(result => result !== null)
    .flat();
  
  if (allProcesses.length === 0) {
    console.log(chalk.green("No active processes found on the specified ports."));
    return;
  }
  
  // Prepare choices for selection
  const choices = allProcesses.map(proc => ({
    name: `Port ${chalk.cyan(proc.port)} (PID ${chalk.yellow(proc.pid)}) - ${chalk.bold(proc.name)}`,
    value: proc,
    short: `Port ${proc.port} (PID ${proc.pid})`
  }));
  
  try {
    // Prompt user to select processes
    const { selectedProcesses } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedProcesses',
      message: 'Select processes to kill:',
      choices: choices,
      pageSize: Math.min(choices.length, 15)
    }]);
    
    if (selectedProcesses.length === 0) {
      console.log(chalk.yellow("No processes selected. Exiting."));
      return;
    }
    
    console.log(chalk.blue("\nAttempting to terminate selected processes..."));
    let successCount = 0;
    
    for (const proc of selectedProcesses) {
      console.log(chalk.yellow(`Terminating process on port ${proc.port} (PID: ${proc.pid})...`));
      const success = await killProcess(proc.pid);
      
      if (success) {
        console.log(chalk.green(`  ✓ Successfully terminated process (PID: ${proc.pid}) on port ${proc.port}`));
        successCount++;
      } else {
        console.log(chalk.red(`  ✗ Failed to terminate process (PID: ${proc.pid}) on port ${proc.port}`));
      }
    }
    
    console.log(chalk.blue("\nTermination Summary:"));
    console.log(chalk.green(`  ${successCount} process(es) were successfully terminated.`));
    
    if (successCount < selectedProcesses.length) {
      console.log(chalk.red(`  ${selectedProcesses.length - successCount} process(es) could not be terminated.`));
      console.log(chalk.yellow("  You may need to run this command with elevated privileges (sudo)."));
    }
  } catch (error) {
    console.error(chalk.red("An error occurred:"), error.message);
  }
}

main().catch(error => {
  console.error(chalk.red("A critical error occurred:"), error);
  process.exit(1);
});