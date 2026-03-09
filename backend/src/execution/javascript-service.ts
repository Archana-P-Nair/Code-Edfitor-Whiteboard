import { VM } from 'vm2';

export const executeJavaScript = (code: string, stdin: string): {
  output: string;
  status: string;
  time: string;
  memory: string;
} => {
  let consoleOutput = '';
  const vm = new VM({
    timeout: 1000,
    sandbox: {
      stdin,
      console: {
        log: (...args: any[]) => {
          consoleOutput += args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ') + '\n';
        }
      }
    }
  });
  const startTime = performance.now();
  try {
    vm.run(code);
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);
    return {
      output: consoleOutput || 'No output',
      status: 'Success',
      time: `${executionTime}ms`,
      memory: '1KB'
    };
  } catch (error: any) {
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);
    return {
      output: error.message,
      status: 'Error',
      time: `${executionTime}ms`,
      memory: '1KB'
    };
  }
};
