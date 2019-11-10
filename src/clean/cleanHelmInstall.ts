import * as shell from 'shelljs';
import { formattedQuestionGeneratorAsync, rl, setupQuestionsFactory } from '../utils/question';

const questionGenerator = async (question: string): Promise<string> => formattedQuestionGeneratorAsync(rl)(question);

const cleanHelmInstall = async () => {
    const releaseName = await questionGenerator("What was your helm install releaseName? ");
    const namespace = await questionGenerator("What was your helm install namespace? ");

    console.log(`Beginning to clean ${releaseName} from helm`);
    const cmd = `helm del --purge ${releaseName} && kubectl delete ns ${namespace}`;
    const proceed = await setupQuestionsFactory(questionGenerator)(`Cmd: ${cmd}. Proceed? [Y/n]`);
    if (!proceed) {
        process.exit(0);
    }

    shell.exec(cmd);
}

export { cleanHelmInstall };