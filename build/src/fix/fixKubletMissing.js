"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const question_1 = require("../utils/question");
const shell = require("shelljs");
const questionGenerator = async (question) => question_1.formattedQuestionGeneratorAsync(question_1.rl)(question);
const fixHelmFresh = async () => {
    const releaseName = await questionGenerator("What is your helm install releaseName?");
    const namespace = await questionGenerator("What is your helm install namespace?");
    const cmd = `helm upgrade ${releaseName} sumologic/sumologic --namespace ${namespace} --set prometheus-operator.kubelet.serviceMonitor.https=false --reuse-values`;
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)(`Cmd: ${cmd} Proceed? [Y/n]`);
    if (!proceed) {
        console.log("Will not continue!");
        process.exit(0);
    }
    shell.exec(cmd);
    console.log("Hurrah! Kubelet metrics should now be coming through!");
};
const main = async () => {
    console.log("Starting the fix for kubelet metrics...");
    const installMechanism = (await questionGenerator("How did you install the collection setup? [helm fresh, helm integrated, non-helm]")).toLowerCase();
    if (installMechanism === "helm fresh") {
        // patch for helm fresh
        await fixHelmFresh();
    }
    else if (installMechanism === "helm integrated") {
        // patch for helm integrated
        console.log("TODO");
    }
    else if (installMechanism === "non-helm") {
        // patch for non-helm
        console.log("TODO");
    }
    else {
        console.log("Invalid option provided. You must provide `helm integrated`, `helm fresh`, or `non-helm` as your options.");
        process.exit(1);
    }
};
exports.fixKubletMissing = main;
//# sourceMappingURL=fixKubletMissing.js.map