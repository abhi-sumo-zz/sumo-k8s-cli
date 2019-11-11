import * as shell from 'shelljs';
import { setupQuestionsFactory, formattedQuestionGeneratorAsync, rl } from '../utils/question';

const questionGenerator = async (question: string): Promise<string> => formattedQuestionGeneratorAsync(rl)(question);

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
}

export { main as cleanNonHelmInstall };