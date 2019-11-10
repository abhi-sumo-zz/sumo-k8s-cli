import { formattedQuestionGeneratorAsync, rl, setupQuestionsFactory } from "../utils/question";
import * as shell from 'shelljs';

// this script will enable the kubelet metrics missing error to be patched.

type InstallMechanism = "helm fresh" | "helm integrated" | "non-helm";

const questionGenerator = async (question: string): Promise<string> => formattedQuestionGeneratorAsync(rl)(question);

const fixHelmFresh = async () => {
    const releaseName = await questionGenerator("What is your helm install releaseName?");
    const namespace = await questionGenerator("What is your helm install namespace?");
    const cmd = `helm upgrade ${releaseName} sumologic/sumologic --namespace ${namespace} --set prometheus-operator.kubelet.serviceMonitor.https=false --reuse-values`
    const proceed = await setupQuestionsFactory(questionGenerator)(
        `Cmd: ${cmd} Proceed? [Y/n]`
    );

    if (!proceed) {
        console.log("Will not continue!")
        process.exit(0);
    }

    shell.exec(cmd);
    console.log("Hurrah! Kubelet metrics should now be coming through!");
}

const main = async () => {
    console.log("Starting the fix for kubelet metrics...");
    const installMechanism = (await questionGenerator("How did you install the collection setup? [helm fresh, helm integrated, non-helm]")).toLowerCase();
    if (installMechanism === "helm fresh") {
        // patch for helm fresh
        await fixHelmFresh();
    } else if (installMechanism === "helm integrated") {
        // patch for helm integrated
        console.log("TODO");
    } else if (installMechanism === "non-helm") {
        // patch for non-helm
        console.log("TODO");
    } else {
        console.log("Invalid option provided. You must provide `helm integrated`, `helm fresh`, or `non-helm` as your options.");
        process.exit(1);
    }
}

export { main as fixKubletMissing };