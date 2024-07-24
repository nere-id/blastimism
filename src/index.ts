import * as optimism from "@eth-optimism/sdk";  
import * as ethers from 'ethers';
import { yieldManagerAbi, optimismPortalAbi, getHintId, getBlastimismOpts } from "./utils";
import { CONFIG } from "./config";
import 'dotenv/config';

const l1Provider = new ethers.providers.JsonRpcProvider(process.env.L1_RPC!);
const l2Provider = new ethers.providers.JsonRpcProvider(process.env.L1_RPC!);

const l1Wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, l1Provider);
const l2Wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, l2Provider);

const NETWORK = 'MAINNET';
const messenger = new optimism.CrossChainMessenger(
    getBlastimismOpts(l1Wallet, l2Wallet, NETWORK)
);

const main = async () => {
  const ethWithdrawalHash = '0x91d7290dcc4bc5a93a80e7f0143bf3acd4bc683b1296e93afa5da8f8b60758ba';  
  const erc20WithdrawalHash = '0x762d473181483badd1daea906a43c4384d60a48cd1531684397ad44999715c05';
  // const testTxHash = '0x42ccb51b13cf02e4dbfcd71d6976cf8b4f1a10042c58e8b0327266da65c4bc14';
  const hintId = await getHintId(erc20WithdrawalHash, l1Provider);
  console.log('hintId: ', hintId);
}

main();