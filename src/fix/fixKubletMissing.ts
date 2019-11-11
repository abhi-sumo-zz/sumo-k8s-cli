import { formattedQuestionGeneratorAsync, rl, setupQuestionsFactory } from "../utils/question";
import * as shell from 'shelljs';
import * as fs from 'fs';

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

const fixNonHelm = async () => {
    const cmd = "kubectl get servicemonitor/prometheus-operator-kubelet -o yaml > prometheus-operator-kubelet-servicemonitor.yaml";
    const proceed = await setupQuestionsFactory(questionGenerator)(
        `Cmd: ${cmd} Proceed? [Y/n]`
    );

    if (!proceed) {
        process.exit(0);
    }

    shell.exec(cmd);
    // read the file now, and replace the things that need replacing.
    let servicemonitor = fs.readFileSync("prometheus-operator-kubelet-servicemonitor.yaml", 'utf8');
    servicemonitor = servicemonitor.replace(/https/gi, "http");
    fs.writeFileSync("prometheus-operator-kubelet-servicemonitor.yaml", servicemonitor, "utf8");

    shell.exec("kubectl delete servicemonitor/prometheus-operator-kubelet");
    shell.exec("kubectl apply -f prometheus-operator-kubelet-servicemonitor.yaml");

    const rebootPrometheusCmd = `kubectl delete pods/prometheus-prometheus-operator-prometheus-0 --force --grace-period=0`;
    const rebootPrometheus = await setupQuestionsFactory(questionGenerator)(
        `(optional) Cmd: ${rebootPrometheusCmd} Proceed? [Y/n]`
    );

    // we only do this if the user wants to force it.
    if (rebootPrometheus) {
        shell.exec(rebootPrometheusCmd);
    }

    console.log("Hurrah! Your kubelet metrics should now be coming in!");
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
        await fixNonHelm();
    } else {
        console.log("Invalid option provided. You must provide `helm integrated`, `helm fresh`, or `non-helm` as your options.");
        process.exit(1);
    }
}

export { main as fixKubletMissing };