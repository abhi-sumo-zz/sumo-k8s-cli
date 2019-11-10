interface SumoHelmStdOptions {
    clusterName: string;
    endpoint: string;
    accessId: string;
    accessKey: string;
    collectorName?: string;
    releaseName?: string;
    namespace?: string;
}
declare const getHelmInstallStdOptions: () => Promise<SumoHelmStdOptions>;
declare const freshInstallHelm: () => Promise<void>;
export { freshInstallHelm, getHelmInstallStdOptions };
