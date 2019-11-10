// This file will be the basic cli page.
import * as readline from 'readline'
import { questionGeneratorAsync, setupQuestionsFactory, rl } from './utils/question';
import { freshInstallHelm } from './install/helm/fresh/freshInstallHelm';
import { clean } from './clean/clean';
import { fixKubletMissing } from './fix/fixKubletMissing';

const runFixJobs = async (args: string[]): Promise<void> => {
    if (args.length < 2) {
        console.log("Fix requires the job you want to run as well.");
        process.exit(1);
    }
    const job = args[1];
    if (job === "kubelet") {
        await fixKubletMissing();
    } else {
        console.log("Invalid job provided!");
        process.exit(0);
    }
}

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
        await freshInstallHelm();
    } else if (cliCmd === "clean") {
        // do clean
        await clean();
    } else if (cliCmd === "upgrade") {
        // do upgrade
    } else if (cliCmd === "fix") {
        // do fix
        await runFixJobs(args);
    } else {
        console.log("You have to provide a valid option. Options include: `install`, `upgrade`, `fix`, and `clean`");
        process.exit(1);
    }

    rl.close();
};

main();
