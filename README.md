# sumo-k8s-cli

The Sumo-k8s-cli is a project to make a wizard like experience for installing the k8s collector for sumo logic. Ideally, it will be robust enough to go through the various different edge cases.

## How it will work.
The cli is a node project that can be installed for now by cloning the repo. Eventually will figure out how to ship it as a binary.

## The cli steps:
1. Will check if there is an active kubectl lying around.
2. If yes, will continue:
2a. it will print the name of the cluster currently connected, and ask if you wish to install the collectors on this system.
2b. It will ask if you are running an upgrade or a fresh install or a delete.
2c. If fresh install it will ask:
2d. Helm? or Non-Helm?
2e. Existing Prometheus? No Existing Prometheus?
3. Based on the options it will run through the installation commands against your kubernetes cluster.

At the end it will run a verification step, and fix any issues (such as missing kubelet)
It should feel like magic.
