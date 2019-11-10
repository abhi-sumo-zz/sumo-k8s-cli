"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shell = require("shelljs");
const question_1 = require("../utils/question");
const questionGenerator = async (question) => question_1.formattedQuestionGeneratorAsync(question_1.rl)(question);
const cleanHelmInstall = async () => {
    const releaseName = await questionGenerator("What was your helm install releaseName? ");
    const namespace = await questionGenerator("What was your helm install namespace? ");
    console.log(`Beginning to clean ${releaseName} from helm`);
    const cmd = `helm del --purge ${releaseName} && kubectl delete ns ${namespace}`;
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)(`Cmd: ${cmd}. Proceed? [Y/n]`);
    if (!proceed) {
        process.exit(0);
    }
    shell.exec(cmd);
};
exports.cleanHelmInstall = cleanHelmInstall;
//# sourceMappingURL=cleanHelmInstall.js.map