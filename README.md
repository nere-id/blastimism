# Blastimism 

Doing bridge stuff on Blast with the Optimism SDK

## Overview

Blast is based on the `op-stack` and utilizes much of the same bridging architecture that you may be familiar with from other `op-stack` chains. As a result, Blast builders can take advantage of existing tooling like the Optimism SDK to programatically bridge funds and pass messages to/from Blast and Ethereum mainnet. 

For the most part, you can use the Optimism SDK like you normally would, but there are a few points at which Blast requires some modifications to common patterns. This mainly comes into play in the context of withdrawal transactions, i.e. transactions that are initiated on L2 and finalized on L1. 

This repo includes some code examples that identify these points of departure and demonstrate how to handle them.