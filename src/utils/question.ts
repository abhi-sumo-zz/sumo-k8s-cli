import * as readline from 'readline'
import * as util from 'util'

// todo break this out into a common class that is statically available everywhere.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const questionGeneratorAsync = (rl: readline.Interface): (q: string) => Promise<string> => {
    // tslint:disable-next-line: no-any
    const q = (rl.question as any) as { [util.promisify.custom]: (question: string) => Promise<string> }

    q[util.promisify.custom] = (question: string) =>
        new Promise<string>(resolve => {
            rl.question(question, input => {
                resolve(input)
            })
        });

    // tslint:disable-next-line: no-any
    const question = (util.promisify(rl.question) as any) as (q: string) => Promise<string>
    return question;
}

const formattedQuestionGeneratorAsync = (rl: readline.Interface): (q: string) => Promise<string> => (q: string) => questionGeneratorAsync(rl)(q + " ")

const yesNoParser = (answer: string): string => {
    const formatted = answer.trim().toUpperCase();
    // if (formatted !== "Y" && formatted !== "N") {
    //     throw new Error("YES_NO_ERROR");
    // }

    return formatted;
}

const booleanFormatter = (answer: string): boolean => answer === "Y" ? true : false;

const setupQuestionsFactory = (generator: (question: string) => Promise<string>) =>
    async (question: string): Promise<boolean> => {
        return generator(question)
            .then((answer) => {
                return yesNoParser(answer);
            })
            .then(booleanFormatter);
    }


export { questionGeneratorAsync, yesNoParser, booleanFormatter, setupQuestionsFactory, formattedQuestionGeneratorAsync, rl };