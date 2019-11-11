"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const question_1 = require("../utils/question");
const cleanHelmInstall_1 = require("./cleanHelmInstall");
const cleanNonHelmInstall_1 = require("./cleanNonHelmInstall");
// file responsible for cleaning up all the objects....
const questionGenerator = async (question) => question_1.formattedQuestionGeneratorAsync(question_1.rl)(question);
const main = async () => {
    console.log("Executing clean script");
    // ask if you installed via helm or installed with non-helm
    const isHelm = await question_1.setupQuestionsFactory(questionGenerator)('Did you install via helm (y) or non-helm (n)? [Y/n]');
    if (isHelm) {
        // helm install
        await cleanHelmInstall_1.cleanHelmInstall();
    }
    else {
        // non-helm install
        await cleanNonHelmInstall_1.cleanNonHelmInstall();
    }
    const deleteSumoCollector = await question_1.setupQuestionsFactory(questionGenerator)('Should we cleanup the Sumo Collectors associated with K8s? [Y/n]');
    if (deleteSumoCollector) {
        console.log("TODO: Delete Sumo collector code...");
    }
};
exports.clean = main;
//# sourceMappingURL=clean.js.map