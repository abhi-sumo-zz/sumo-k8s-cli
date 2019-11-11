"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shell = require("shelljs");
const question_1 = require("../../../utils/question");
const freshInstallHelm_1 = require("../../helm/fresh/freshInstallHelm");
const fs = require("fs");
// this script does the nonhelm install for all the components. Downloading all the necessary files
// and making all the necessary changes to the yamls scripts.
const questionGenerator = async (question) => question_1.formattedQuestionGeneratorAsync(question_1.rl)(question);
const assertFluentdAndEventsPreconditions = (opts) => {
    const answer = shell.exec(`kubectl get ns | grep ${opts.namespace}`).trim();
    console.log("Answer to kubectl get ns: " + answer);
    if (answer !== "") {
        // namespace exists. Abort and ask for either a clean or an upgrade
        console.log(`${opts.namespace} namespace pre-exists. Please either run the 'clean' or 'upgrade' tasks.`);
        process.exit(1);
    }
    // verify that the collector doesn't already exist.
    const collectorListCmd = `curl -u '${opts.accessId}:${opts.accessKey}' -X GET ${opts.endpoint}collectors?limit=1000`;
    const response = shell.exec(collectorListCmd);
    if (response.includes(opts.collectorName ? opts.collectorName : opts.clusterName)) {
        console.log("Please utilize a different collector name. The provided name is already taken.");
        process.exit(1);
    }
};
const assertPrometheusOperatorPreconditions = () => {
    // verify there is no existing prometheus operator instance.
    const answer3 = shell.exec("kubectl get all --all-namespaces | grep prometheus-operator").trim();
    console.log("answer3: " + answer3);
    if (answer3 !== "") {
        console.log("You already have prometheus operator installed. Consider running the integrated install steps.");
        process.exit(1);
    }
};
const setupFluentdAndEvents = async (answers) => {
    console.log("Setting up SumoLogic collectors and fluentd and fluentd-events");
    assertFluentdAndEventsPreconditions(answers);
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)("Is it okay to download the `setup.sh` script as `sumo-setup.sh` from github? [Y/n]");
    if (!proceed) {
        console.log("Exiting because setup.sh script is required to proceed.");
        process.exit(0);
    }
    shell.exec("curl -s https://raw.githubusercontent.com/SumoLogic/sumologic-kubernetes-collection/master/deploy/docker/setup/setup.sh > sumo-setup.sh");
    shell.exec("chmod +x sumo-setup.sh");
    // run the setup.sh script
    // TODO: Move getHelmInstallStdOptions to a util file and change the reference to the util.
    const cmd = `./sumo-setup.sh -c ${answers.collectorName} -k ${answers.clusterName} `
        + `-n ${answers.namespace} ${answers.endpoint} ${answers.accessId} ${answers.accessKey}`;
    const proceedWithCmd = await question_1.setupQuestionsFactory(questionGenerator)(`Proceed to run cmd: ${cmd}? [Y/n]`);
    if (!proceedWithCmd) {
        process.exit(0);
    }
    shell.exec(cmd);
};
const setupPrometheusOperator = async (answers) => {
    console.log("Setting up Prometheus Operator");
    assertPrometheusOperatorPreconditions();
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)("Is it okay to download the `prometheus-overrides.yaml` from github? [Y/n]");
    if (!proceed) {
        process.exit(0);
    }
    shell.exec("curl -LJO https://raw.githubusercontent.com/SumoLogic/sumologic-kubernetes-collection/v0.10.0/deploy/helm/prometheus-overrides.yaml > prometheus-overrides.yaml");
    let overrides = fs.readFileSync("prometheus-overrides.yaml", 'utf8');
    overrides = overrides.replace("cluster: kubernetes", `cluster: ${answers.clusterName}`);
    const re1 = /\-sumologic.sumologic'"/gi;
    const re2 = /\- sumologic'"/gi;
    const re3 = /\collection'"/gi;
    overrides = overrides.replace(re1, `-sumologic.${answers.namespace}`);
    overrides = overrides.replace(re2, `- ${answers.namespace}`);
    overrides = overrides.replace(re3, `${answers.releaseName}`);
    // write back the file with all the overriden namespace information
    fs.writeFileSync("prometheus-overrides.yaml", overrides, "utf8");
    shell.exec("helm fetch stable/prometheus-operator");
    // todo: Make it so that hte version number is generic, so this doesn't break when the version changes.
    shell.exec(`helm template prometheus-operator-6.11.0.tgz --name prometheus-operator --set dryRun=true -f prometheus-overrides.yaml > prometheus.yaml`);
    const proceedToApply = await question_1.setupQuestionsFactory(questionGenerator)("Proceed to run `kubectl apply -f prometheus.yaml`? [Y/n]");
    if (!proceedToApply) {
        process.exit(0);
    }
    // todo: enable it so you can actually change the namespace prometheus installs into. Right now this will only install into Default.
    console.log("Note: This will install Prometheus in the default namespace.");
    shell.exec("kubectl apply -f prometheus.yaml");
};
// todo: make it v1.14 aware so that if its v1.14+ it automatically updates the v1alpha1 flag to v1beta1
const setupFluentBit = async (answers) => {
    console.log("Setting up fluent-bit");
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)("Is it okay to download the `fluent-bit-overrides.yaml` from github? [Y/n]");
    if (!proceed) {
        process.exit(0);
    }
    shell.exec("curl -LJO https://raw.githubusercontent.com/SumoLogic/sumologic-kubernetes-collection/v0.10.0/deploy/helm/fluent-bit-overrides.yaml");
    console.log("helm fetch");
    const answer = shell.exec("helm fetch stable/fluent-bit");
    console.log(answer);
    // todo: make the below command version agnostic
    const fluentBitTgz = shell.exec("ls | grep fluent-bit.*.tgz").trim();
    console.log("TGZ: " + fluentBitTgz);
    const cmd = `helm template ${fluentBitTgz} --name fluent-bit --set dryRun=true -f fluent-bit-overrides.yaml > fluent-bit.yaml`;
    const proceedCmd = await question_1.setupQuestionsFactory(questionGenerator)(`Cmd: ${cmd}. [Y/n]`);
    if (!proceedCmd) {
        process.exit(0);
    }
    shell.exec(cmd);
    // extract the version of k8s server running.
    const versionString = shell.exec("kubectl version | grep -o 'Server .* Minor:\".*\", GitVersion' | grep -o 'Minor:.*\"'").trim();
    console.log("Kubectl Version string: " + versionString);
    // todo: make this tslint clean.
    // tslint:disable-next-line: ban
    const version = parseInt(versionString.substr(7, versionString.length - 1), 10);
    console.log("Kubectl Version: " + version);
    if (version >= 13) {
        console.log("Replacing v1alpha1 with v1beta1");
        // replace v1alpha1 flag with v1beta1
        let overrides = fs.readFileSync("fluent-bit.yaml", 'utf8');
        overrides = overrides.replace(/v1alpha1/gi, `v1beta1`);
        // write back the file with all the overriden v1beta1 information
        fs.writeFileSync("fluent-bit.yaml", overrides, "utf8");
    }
    const applyCmd = `kubectl apply -f fluent-bit.yaml -n ${answers.namespace}`;
    const proceedToApply = await question_1.setupQuestionsFactory(questionGenerator)(`Proceed to run ${applyCmd}? [Y/n]`);
    if (!proceedToApply) {
        process.exit(0);
    }
    shell.exec(applyCmd);
};
const setupFalco = async (answers) => {
    console.log("Setting up Falco!");
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)("Is it okay to download the `falco-overrides.yaml` from github? [Y/n]");
    if (!proceed) {
        process.exit(0);
    }
    shell.exec("curl -LJO https://raw.githubusercontent.com/SumoLogic/sumologic-kubernetes-collection/v0.10.0/deploy/helm/falco-overrides.yaml");
    shell.exec("helm fetch stable/falco");
    const falcoTgz = shell.exec("ls | grep falco.*.tgz").trim();
    console.log("TGZ: " + falcoTgz);
    shell.exec(`helm template ${falcoTgz} --name falco --set dryRun=true -f falco-overrides.yaml > falco.yaml`);
    const cmd = `kubectl apply -f falco.yaml -n ${answers.namespace}`;
    const cmdProceed = await question_1.setupQuestionsFactory(questionGenerator)(`Cmd: ${cmd}. [Y/n]`);
    if (!cmdProceed) {
        process.exit(0);
    }
    shell.exec(cmd);
};
const setupPrometheusRules = async (answers) => {
    console.log("Setting up prometheus rules!");
    console.log("This will install the additional prometheus rules in the default namespace!");
    shell.exec("kubectl apply -f rules.yaml");
};
const main = async () => {
    console.log("non-helm install");
    const proceed = await question_1.setupQuestionsFactory(questionGenerator)('Do you want to proceed with the non-helm installation? [Y/n]');
    if (!proceed) {
        process.exit(0);
    }
    const answers = await freshInstallHelm_1.getHelmInstallStdOptions();
    const installFluentd = await question_1.setupQuestionsFactory(questionGenerator)("Do you want to install sumo collectors, fluentd, and fluentd-events? [Y/n]");
    if (installFluentd) {
        await setupFluentdAndEvents(answers);
    }
    const installFluentBit = await question_1.setupQuestionsFactory(questionGenerator)("Do you want to install fluent-bit? [Y/n]");
    if (installFluentBit) {
        await setupFluentBit(answers);
    }
    const installPrometheusOperator = await question_1.setupQuestionsFactory(questionGenerator)("Do you want to install a new prometheus operator? [Y/n]");
    if (installPrometheusOperator) {
        await setupPrometheusOperator(answers);
    }
    const installFalco = await question_1.setupQuestionsFactory(questionGenerator)("Do you want to install Faclo? [Y/n]");
    if (installFalco) {
        await setupFalco(answers);
    }
    const installPrometheusRules = await question_1.setupQuestionsFactory(questionGenerator)("Do you want to install the additional Prometheus Rules? [Y/n]");
    if (installPrometheusRules) {
        await setupPrometheusRules(answers);
    }
};
exports.nonHelmInstall = main;
//# sourceMappingURL=nonHelmInstall.js.map