import { formattedQuestionGeneratorAsync, rl, setupQuestionsFactory } from "../utils/question";
import { cleanHelmInstall } from "./cleanHelmInstall";
import { cleanNonHelmInstall } from "./cleanNonHelmInstall";

// file responsible for cleaning up all the objects....

const questionGenerator = async (question: string): Promise<string> => formattedQuestionGeneratorAsync(rl)(question);

const main = async () => {
    console.log("Executing clean script");

    // ask if you installed via helm or installed with non-helm
    const isHelm = await setupQuestionsFactory(questionGenerator)('Did you install via helm (y) or non-helm (n)? [Y/n]');
    if (isHelm) {
        // helm install
        await cleanHelmInstall();
    } else {
        // non-helm install
        await cleanNonHelmInstall();
    }

    const deleteSumoCollector = await setupQuestionsFactory(questionGenerator)
        ('Should we cleanup the Sumo Collectors associated with K8s? [Y/n]');

    if (deleteSumoCollector) {
        console.log("TODO: Delete Sumo collector code...");
    }

}

export { main as clean };