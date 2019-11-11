"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shell = require("shelljs");
const question_1 = require("../utils/question");
const questionGenerator = async (question) => question_1.formattedQuestionGeneratorAsync(question_1.rl)(question);
const main = async () => {
    // assumes you've run the install with non-helm already and therefore the files are located locally.
    const namespace = await questionGenerator("What was the namespacce where you installed fluentd & falco & fluent-bit?");
    console.log("Deleting fluent-bit");
    shell.exec(`kubectl delete -f fluent-bit.yaml -n ${namespace}`);
    console.log("Deleting falco");
    shell.exec(`kubectl delete -f falco.yaml -n ${namespace}`);
    console.log("Deleting fluentd-sumologic");
    shell.exec(`kubectl delete -f fluentd-sumologic.yaml -n ${namespace}`);
    // delete prometheus operator. it currently defaults to the default namespace
    console.log("Deleting prometheus operator");
    shell.exec("kubectl delete -f prometheus.yaml");
    shell.exec("kubectl delete -f rules.yaml");
    console.log("Cleaned up all the non-helm resources!");
};
exports.cleanNonHelmInstall = main;
//# sourceMappingURL=cleanNonHelmInstall.js.map