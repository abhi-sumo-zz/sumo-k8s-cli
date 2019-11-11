"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const question_1 = require("./utils/question");
const freshInstallHelm_1 = require("./install/helm/fresh/freshInstallHelm");
const clean_1 = require("./clean/clean");
const fixKubletMissing_1 = require("./fix/fixKubletMissing");
const nonHelmInstall_1 = require("./install/nonhelm/fresh/nonHelmInstall");
const runFixJobs = async (args) => {
    if (args.length < 2) {
        console.log("Fix requires the job you want to run as well.");
        process.exit(1);
    }
    const job = args[1];
    if (job === "kubelet") {
        await fixKubletMissing_1.fixKubletMissing();
    }
    else {
        console.log("Invalid job provided!");
        process.exit(0);
    }
};
const runInstall = async (args) => {
    if (args.length < 2) {
        console.log("install requires the install type you want to run as well. Options: `helm`, `nonhelm`");
        process.exit(0);
    }
    const install = args[1];
    if (install === "helm") {
        await freshInstallHelm_1.freshInstallHelm();
    }
    else if (install === "nonhelm") {
        await nonHelmInstall_1.nonHelmInstall();
    }
    else {
        console.log("You must provide a valid option. Options: `helm`, `nonhelm`.");
        process.exit(1);
    }
};
/**
 * yarn cli install - runs the install script
 * yarn cli clean - runs the clean script
 * yarn cli upgrade - runs the upgrade script
 * yarn cli fix - runs various fix operations that one can do like enabling kubelet.
 */
const main = async () => {
    console.log("This is the sumo-k8s-cli for installing the Sumologic collectors for K8s.");
    const args = process.argv.slice(2);
    console.log(`Arguments passed in: ${args.join(", ")}`);
    if (args.length < 1) {
        console.log("You must provide a cli action. Available actions include: `install`, `upgrade`, `clean`, `fix`");
        process.exit(1);
    }
    const cliCmd = args[0];
    if (cliCmd === "install") {
        await runInstall(args);
    }
    else if (cliCmd === "clean") {
        // do clean
        await clean_1.clean();
    }
    else if (cliCmd === "upgrade") {
        // do upgrade
    }
    else if (cliCmd === "fix") {
        // do fix
        await runFixJobs(args);
    }
    else {
        console.log("You have to provide a valid option. Options include: `install`, `upgrade`, `fix`, and `clean`");
        process.exit(1);
    }
    question_1.rl.close();
};
main();
//# sourceMappingURL=index.js.map