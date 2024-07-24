import { CrossChainMessenger } from "@eth-optimism/sdk";

export class BlastCrossChainMessenger extends CrossChainMessenger{
    foo() {
        console.log('foo');
    }
}