"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
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
//# sourceMappingURL=question.js.map