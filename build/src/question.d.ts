/// <reference types="node" />
import * as readline from 'readline';
declare const questionGeneratorAsync: (rl: readline.Interface) => (q: string) => Promise<string>;
export { questionGeneratorAsync };
