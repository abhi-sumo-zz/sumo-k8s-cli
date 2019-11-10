"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline = require("readline");
const util = require("util");
// todo break this out into a common class that is statically available everywhere.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
exports.rl = rl;
const questionGeneratorAsync = (rl) => {
    // tslint:disable-next-line: no-any
    const q = rl.question;
    q[util.promisify.custom] = (question) => new Promise(resolve => {
        rl.question(question, input => {
            resolve(input);
        });
    });
    // tslint:disable-next-line: no-any
    const question = util.promisify(rl.question);
    return question;
};
exports.questionGeneratorAsync = questionGeneratorAsync;
const formattedQuestionGeneratorAsync = (rl) => (q) => questionGeneratorAsync(rl)(q + " ");
exports.formattedQuestionGeneratorAsync = formattedQuestionGeneratorAsync;
const yesNoParser = (answer) => {
    const formatted = answer.trim().toUpperCase();
    // if (formatted !== "Y" && formatted !== "N") {
    //     throw new Error("YES_NO_ERROR");
    // }
    return formatted;
};
exports.yesNoParser = yesNoParser;
const booleanFormatter = (answer) => answer === "Y" ? true : false;
exports.booleanFormatter = booleanFormatter;
const setupQuestionsFactory = (generator) => async (question) => {
    return generator(question)
        .then((answer) => {
        return yesNoParser(answer);
    })
        .then(booleanFormatter);
};
exports.setupQuestionsFactory = setupQuestionsFactory;
//# sourceMappingURL=question.js.map