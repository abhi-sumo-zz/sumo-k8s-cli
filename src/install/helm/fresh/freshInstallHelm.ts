import * as readline from 'readline'
import * as shell from 'shelljs';
import { setupQuestionsFactory, questionGeneratorAsync, formattedQuestionGeneratorAsync, rl } from "../../../utils/question";

interface SumoHelmStdOptions {
    clusterName: string;
    endpoint: string;
    accessId: string;
    accessKey: string;
    collectorName?: string;
    releaseName?: string;
    namespace?: string;
}

type ValuesOptString = " -f helm-sumologic-values-substituted.yaml" | "";

const questionGenerator = async (question: string): Promise<string> => formattedQuestionGeneratorAsync(rl)(question);

const confirmHelmInstall = async (): Promise<boolean> =>
    setupQuestionsFactory(questionGenerator)('This will install sumo logic collection with Helm. Are you sure you want to proceed? [Y/n]');

const installSumoHelmRepo = async (): Promise<void> => {
    console.log("Starting the helm install process...");
    const proceed = await setupQuestionsFactory(questionGenerator)(
        "Cmd: `helm repo add sumologic https://sumologic.github.io/sumologic-kubernetes-collection` Proceed? [Y/n]"
    );
    if (proceed) {
        shell.exec("helm repo add sumologic https://sumologic.github.io/sumologic-kubernetes-collection");
        console.log("Successfully added helm repo");
    }
}

const isValuesFileBasedInstall = async (): Promise<boolean> => {
    const answer = await setupQuestionsFactory(questionGenerator)("Will you be providing a values.yaml file? [Y/n]");
    return answer;
}

const verifyStdOpts = (stdOpts: SumoHelmStdOptions): void => {
    console.log('TODO: verficiation function needs to be written');
}

const getHelmInstallStdOptions = async (): Promise<SumoHelmStdOptions> => {
    console.log("We need some standard options to execute the helm chart.");
    const clusterName = await questionGenerator("What is your `ClusterName`? ");
    const endpoint = await questionGenerator("What is your SumoLogic api `endpoint`? ");
    const accessId = await questionGenerator("What is your SumoLogic `accessId`? ");
    const accessKey = await questionGenerator("What is your SumoLogic `accessKey`? ");
    let collectorName = await questionGenerator("What is your SumoLogic `collectorName`? (defaults to clusterName if blank)");
    let releaseName = await questionGenerator("What is your helm chart `releaseName`? (defaults to collection if blank)");
    let namespace = await questionGenerator("What is your helm chart `namespace`? (defaults to sumologic if blank)");
    collectorName = collectorName ? collectorName : clusterName;
    releaseName = releaseName ? releaseName : "collection";
    namespace = namespace ? namespace : "sumologic";

    const stdOpts = {
        clusterName,
        endpoint,
        accessId,
        accessKey,
        collectorName,
        releaseName,
        namespace
    };

    verifyStdOpts(stdOpts);
    return stdOpts;
}

const assertStdReleaseInstallPreconditions = (opts: SumoHelmStdOptions) => {
    // verify that there is no pre-existing sumologic namespace. Otherwise quit and ask for an upgrade or clean command.
    // TODO: assumes kubectl exists, this should be verified at the beginning.
    const answer = shell.exec(`kubectl get ns | grep ${opts.namespace}`).trim();
    console.log("Answer to kubectl get ns: " + answer);
    if (answer !== "") {
        // sumologic exists. Abort and ask for either a clean or an upgrade
        console.log(`${opts.namespace} namespace pre-exists. Please either run the 'clean' or 'upgrade' tasks.`);
        process.exit(1);
    }

    // verify that no release exists with name collection from sumologic
    const answer2 = shell.exec(`helm ls | grep -E '${opts.releaseName}.*sumologic'`).trim();
    console.log("Helm ls answer: " + answer2);
    if (answer !== "") {
        console.log(`A release with the name ${opts.releaseName} from sumologic already exists. Please run the clean operation or the upgrade operation.`);
        process.exit(1);
    }

    // verify there is no existing prometheus operator instance.
    const answer3 = shell.exec("kubectl get all --all-namespaces | grep prometheus-operator").trim();
    console.log("answer3: " + answer3);
    if (answer3 !== "") {
        console.log("You already have prometheus operator installed. Consider running the integrated install steps.");
        process.exit(1);
    }

    // verify that the clusterroles don't already exist
    const answer4 = shell.exec("kubectl get clusterroles | grep -e prometheus-operator -e sumologic").trim();
    console.log("clusterRole check: " + answer4);
    if (answer4 !== "") {
        console.log("You have some left over clusterroles. Please clean them up by running the `clean` command.");
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

const hasCrds = (): boolean => {
    const answer = shell.exec("kubectl get crds | grep monitoring.coreos.com");
    console.log(answer);
    console.log(answer.includes("monitoring.coreos"));
    if (answer.includes("monitoring.coreos")) {
        return true;
    }

    return false;
}

// either outputs empty string or outputs -f helm-sumo-values.yaml
const addValuesOpt = async (opts: SumoHelmStdOptions): Promise<ValuesOptString> => {
    if (opts.releaseName !== 'collection' && opts.namespace !== 'sumologic') {
        // do the values.yaml replace first.
        const proceed = await setupQuestionsFactory(questionGenerator)(
            "Going to download the values.yaml file as helm-sumologic-values.yaml "
            + "in the local directory. Proceed? [Y/n]"
        );
        shell.exec("curl https://raw.githubusercontent.com/SumoLogic/sumologic-kubernetes-collection/master/deploy/helm/sumologic/values.yaml > helm-sumologic-values.yaml");

        // now do the replace to make the fixes to the file based on the name.
        console.log("Executing SED replace commands.");
        shell.exec(`cat helm-sumologic-values.yaml `
            + ` | sed 's/\-sumologic.sumologic'"/-sumologic.${opts.namespace}/g"`
            + ` | sed 's/\- sumologic'"/- ${opts.namespace}/g"`
            + ` | sed 's/\collection'"/${opts.releaseName}/g"`
            + ` > helm-sumologic-values-substituted.yaml`);

        return " -f helm-sumologic-values-substituted.yaml";
    }

    return "";
}

const installViaHelm = async (opts: SumoHelmStdOptions): Promise<void> => {
    console.log("Adding Sumologic repo to helm repos");
    const crdsExist = hasCrds();
    const valuesOpt = await addValuesOpt(opts);
    const cmd = "helm install sumologic/sumologic "
        + " --name " + opts.releaseName
        + " --namespace " + opts.namespace
        + valuesOpt
        + " --set sumologic.endpoint=" + opts.endpoint
        + " --set sumologic.accessId=" + opts.accessId
        + " --set sumologic.accessKey=" + opts.accessKey
        + " --set sumologic.collectorName=" + opts.collectorName
        + ' --set prometheus-operator.prometheus.prometheusSpec.externalLabels.cluster=' + opts.clusterName
        + ' --set sumologic.clusterName=' + opts.clusterName
        + (crdsExist ? " --no-crd-hook" : "");
    const proceed = await setupQuestionsFactory(questionGenerator)(
        "Cmd: " + cmd + " Proceed? [Y/n]"
    );
    if (proceed) {
        shell.exec(cmd);
        console.log("Successfully installed the chart.");
    }
}

// open questions: Should we do this via a fix command? Might be easier than doing a proper check here.
// maybe we provide a check command? Similar to DD....
const verifyHelmInstall = (stdOpts: SumoHelmStdOptions) => {
    // 1) verify that the prometheus instance has started up - TODO: ignore for now.
    // 2) verify that there aren't any 429 Throttling logs in fluentd
    // 3) verify that prometheus's kubelet target is not getting 401 / down.
    // 4) verfiy that falco is working.
}

// assumes that you are doing a fresh install of the chart using helm
// Will fail if you a) already have the chart installed, have prometheus-operator already installed,
// or have a sumologic namespace lying around you are trying to install into.
const freshInstallHelm = async () => {
    // assume fresh install, with helm
    const confirm = await confirmHelmInstall();
    if (confirm) {
        // commence the command line call to do the install.
        const hasHelmInstalled = shell.which("helm");
        if (!hasHelmInstalled) {
            console.log("You do not have helm installed. Please execute the helm install cli steps first.");
            return;
        } else {
            await installSumoHelmRepo();
            // has helm proceed by asking for necessary parameters.
            const isValuesInstall = await isValuesFileBasedInstall();
            if (!isValuesInstall) {
                const options = await getHelmInstallStdOptions();
                assertStdReleaseInstallPreconditions(options);
                await installViaHelm(options);
                // verify the installation succeeded
                await verifyHelmInstall(options);
            } else {
                // do the values file based install
                // const file = await getValuesFile();
                console.log("TODO: This case is currently not supported!");
                process.exit(0);
            }
        }
    }
}

export { freshInstallHelm, getHelmInstallStdOptions };