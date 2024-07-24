import * as optimism from "@eth-optimism/sdk";  
import * as ethers from 'ethers';
import { yieldManagerAbi, getLastCheckpointId, getLastCheckpointIdFromLogs, getWithdrawalHash, getRequestId, optimismPortalAbi, getHintId, getFinalizationEvent, getHintIdFromLogs, getProvedEvent } from "./utils";
import 'dotenv/config';
import test from "node:test";
import { parse } from "node:path";

const L1_CHAIN_ID = process.env.L1_CHAIN_ID;
const L2_CHAIN_ID = process.env.L2_CHAIN_ID;

const L1_USD = process.env.L1_TOKEN;
const USDB = process.env.L2_TOKEN;

const L1_RPC = process.env.L1_RPC;
const L2_RPC = process.env.L2_RPC;

const l1Provider = new ethers.providers.JsonRpcProvider(L1_RPC!);
const l2Provider = new ethers.providers.JsonRpcProvider(L2_RPC!);

const l1Wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, l1Provider);
const l2Wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, l2Provider);

const messengerConfig = {
  l1SignerOrProvider: l1Wallet,
  l2SignerOrProvider: l2Wallet,
  l1ChainId: L1_CHAIN_ID,
  l2ChainId: L2_CHAIN_ID,
  contracts: {
    l1: {
      AddressManager: process.env.ADDRESS_MANAGER,
      L1CrossDomainMessenger: process.env.L1_CROSS_DOMAIN_MESSENGER,
      L1StandardBridge: process.env.L1_STANDARD_BRIDGE,
      OptimismPortal: process.env.OPTIMISM_PORTAL,
      L2OutputOracle: process.env.L2_OUTPUT_ORACLE,      
      StateCommitmentChain: ethers.constants.AddressZero,
      CanonicalTransactionChain: ethers.constants.AddressZero,
      BondManager: ethers.constants.AddressZero
    }
  }
}

// @ts-ignore
const messenger = new optimism.CrossChainMessenger(messengerConfig);

const main = async () => {
  const portalInterface = new ethers.utils.Interface(optimismPortalAbi);
  const optimismPortal = new ethers.Contract(
    process.env.OPTIMISM_PORTAL!, 
    optimismPortalAbi, 
    l1Provider
  );  
  const yieldManager = new ethers.Contract(
    process.env.ETH_YIELD_MANAGER!, 
    yieldManagerAbi, 
    l1Provider
  );  

  const ethWithdrawalHash = '0x91d7290dcc4bc5a93a80e7f0143bf3acd4bc683b1296e93afa5da8f8b60758ba';  
  const erc20WithdrawalHash = '0x762d473181483badd1daea906a43c4384d60a48cd1531684397ad44999715c05';
  // const testTxHash = '0x42ccb51b13cf02e4dbfcd71d6976cf8b4f1a10042c58e8b0327266da65c4bc14';
  const hintId = await getHintId(erc20WithdrawalHash, l1Provider);
  console.log('hintId: ', hintId);
}

main();