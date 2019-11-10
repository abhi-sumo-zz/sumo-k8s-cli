/// <reference types="node" />
import * as readline from 'readline';
declare const rl: readline.Interface;
declare const questionGeneratorAsync: (rl: readline.Interface) => (q: string) => Promise<string>;
declare const formattedQuestionGeneratorAsync: (rl: readline.Interface) => (q: string) => Promise<string>;
declare const yesNoParser: (answer: string) => string;
declare const booleanFormatter: (answer: string) => boolean;
declare const setupQuestionsFactory: (generator: (question: string) => Promise<string>) => (question: string) => Promise<boolean>;
export { questionGeneratorAsync, yesNoParser, booleanFormatter, setupQuestionsFactory, formattedQuestionGeneratorAsync, rl };
