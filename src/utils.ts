import { BigNumber } from 'ethers';
import { TransactionDescription } from 'ethers/lib/utils';
import * as ethers from 'ethers';
import 'dotenv/config';

const ETH_YIELD_MANAGER = process.env.ETH_YIELD_MANAGER!;
const OPTIMISM_PORTAL = process.env.OPTIMISM_PORTAL!;

interface WithdrawalTransaction {
    nonce: BigNumber;
    sender: string;
    target: string;
    value: BigNumber;
    gasLimit: BigNumber;
    data: string;
}

export const yieldManagerAbi = [    
    "function findCheckpointHint(uint256 requestId, uint256 start, uint256 end) view returns (uint256)",    
    "event WithdrawalsFinalized(uint256 indexed from, uint256 indexed to, uint256 indexed checkpointId, uint256 amountOfETHLocked, uint256 timestamp, uint256 sharePrice)",
    "function getLastCheckpointId() view returns (uint256)"    
];

export const optimismPortalAbi = [
    `function proveWithdrawalTransaction(
        tuple(uint256 nonce, address sender, address target, uint256 value, uint256 gasLimit, bytes data) _tx,
        uint256 _l2OutputIndex, 
        tuple(
            bytes32 version,
            bytes32 stateRoot,
            bytes32 messagePasserStorageRoot,
            bytes32 latestBlockhash
        ) _outputRootProof, 
        bytes[] _withdrawalProof
    )`,
    "event WithdrawalProven(bytes32 indexed withdrawalHash, address indexed from, address indexed to, uint256 requestId)"    
];

export const hashWithdrawalTransaction = (tx: WithdrawalTransaction): string => {
    return ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
            ["uint256", "address", "address", "uint256", "uint256", "bytes"],
            Object.values(tx)
        )
    );
}

const extractWithdrawalTransaction = (tx: TransactionDescription): WithdrawalTransaction => {        
    return {
        nonce: tx.args[0].nonce,
        sender: tx.args[0].sender,
        target: tx.args[0].target,
        value: tx.args[0].value,
        gasLimit: tx.args[0].gasLimit,
        data: tx.args[0].data
    }    
}

export const getHintId = async (hash: string, provider: ethers.providers.Provider): Promise<number> => {
    const optimismPortal = new ethers.Contract(OPTIMISM_PORTAL, optimismPortalAbi, provider);      
    const rawTransaction = await provider.getTransaction(hash);            
    const withdrawalProvenTransaction = optimismPortal.interface.parseTransaction(rawTransaction);                    
    const withdrawalTransaction = extractWithdrawalTransaction(withdrawalProvenTransaction);
    
    // If this withdrawal doesn't carry any ETH value, we know it is an ERC20 withdrawal in which case
    // hintId will always just be 0
    if (withdrawalTransaction.value.eq(0)) return 0;
    
    // Otherwise, we need to do some more work:
    const withdrawalHash = hashWithdrawalTransaction(withdrawalTransaction);
    // Use withdrawalHash to get requestId    
    const withdrawalProvenEvent = (await optimismPortal.queryFilter(optimismPortal.filters.WithdrawalProven(withdrawalHash, null, null)))[0];    
    const requestId = withdrawalProvenEvent?.args?.requestId.toNumber();    
    if (requestId === undefined) {
        throw new Error('Error: unable to locate requestId for this transaction.');
    }
    
    // With the requestId, now all we need is the last chekpoint. We'll need a yieldmanager for the remainder
    const yieldManager = new ethers.Contract(ETH_YIELD_MANAGER, yieldManagerAbi, provider);
    const lastCheckpointId = (await yieldManager.getLastCheckpointId()).toNumber();
    // Finally, we have everything we need to get our hintId
    const hintId = (await yieldManager.findCheckpointHint(requestId, 1, lastCheckpointId)).toNumber();
    return hintId;
}


// Get lastCheckpointId through event logs so works for both Testnet / Mainnet
// Takes about twice as long as direct method but unavailable on testnet.
export const getLastCheckpointIdFromLogs = async (yieldManager: ethers.Contract): Promise<number> => {
    const filter = yieldManager.filters.WithdrawalsFinalized();
    const blockNumber = await yieldManager.provider.getBlockNumber();    
    let fromBlock = 0;
    let toBlock =  blockNumber;
    const events = await yieldManager.queryFilter(filter, fromBlock, toBlock);
    if (!events.length) {
        throw new Error("No checkpoint found");
    }
    const lastEvent = events.pop();
    const checkpointId = (lastEvent?.args?.checkpointId).toNumber();
    return checkpointId;
}

