import fs from "fs";
import path from "path";

import { Context } from "near-cli/context";
import * as nearAPI from "near-api-js";
import Big from "big.js";

import { Auction, Contract as MarketplaceContract, CreatePayload, NftStandard, NftToken } from "../ts/marketplace";
import { Contract as NFTContract, Token } from "../ts/nft";
import { Contract as FTContract } from "../ts/ft";


let { formatNearAmount, parseNearAmount } = nearAPI.utils.format;
const TGas = Big(10).pow(12);
const MaxGasPerTransaction = TGas.mul(300);
const MarketPurchaseGas = TGas.mul(100);
const NftMintGas = TGas.mul(40);
const NftApproveGas = TGas.mul(90);
const FtTransferCallGas = TGas.mul(200);
const MarketBidGas = TGas.mul(90);
const MarketCancelGas = TGas.mul(100);
const StorageCostPerByte = Big(10).pow(19);


function sleep(ms: number): Promise<NodeJS.Timeout> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getContractAddress(kind) {
    const root = path.dirname(__dirname);
    const filename = `${root}/neardev/${kind}/dev-account`;
    const address = fs.readFileSync(filename);
    return address.toString();
}

function getContracts(account: nearAPI.Account) {
    return {
        nft: new NFTContract(account, getContractAddress("nft")),
        ft: new FTContract(account, getContractAddress("ft")),
        marketplace: new MarketplaceContract(account, getContractAddress("marketplace")),
    }
}

async function nft_approve(account: nearAPI.Account, token: Token, payload?: CreatePayload) {
    console.log('nft_approve', account.accountId, token, payload);
    const { nft, marketplace } = getContracts(account);
    console.log(`${marketplace.contractId}`);
    return await nft.nft_approve({
        token_id: token.token_id,
        account_id: marketplace.contractId,
        msg: JSON.stringify(payload)
    },{
        gas: NftApproveGas.toString(),
        attachedDeposit: parseNearAmount('0.01')
    });
}

async function nft_mint(account: nearAPI.Account): Promise<Token> {
    console.log('nft_mint', account.accountId);
    const { nft } = getContracts(account);
    let token = await nft.nft_mint({receiver_id: account.accountId, token_metadata: {
        "title": "OBS rockz",
        "description": "Yeah, really",
        "media":"bafkreih5dbawfkg5j7jclibfjaxuwcabqd5oytbvffoikiuhy7al6kbphq",
        "media_hash":"/RhBYqjdT9IloCVIL0sIAYD67Ew1KVyFIofHwL8oLzw="
    }}, {
        gas: NftMintGas.toString(),
        attachedDeposit: parseNearAmount('0.01')
    });
    return token;
}

async function market_get_auction(account: nearAPI.Account, token: Token): Promise<Auction> {
    console.log('market_get_auction', account.accountId, token);
    const { nft, marketplace } = getContracts(account);
    // @ts-ignore
    const nftToken: NftToken = {
        standard: NftStandard.Nep171, id: token.token_id, account: nft.contractId,
    };
    return await marketplace.retrieve_by_nft_id({nft: nftToken});
}

async function nft_get(account: nearAPI.Account, token_id: string): Promise<Token|null> {
    console.log('nft_get', account.accountId, token_id);
    return await getContracts(account).nft.nft_token({ token_id: token_id });
}

async function ft_storage_deposit(account: nearAPI.Account, receiver_id: string) {
    console.log('ft_storage_deposit', account.accountId, receiver_id);
    const { ft } = getContracts(account);    
    await ft.storage_deposit({
        account_id: receiver_id,
        registration_only: true
    }, {
        attachedDeposit: parseNearAmount('0.01')
    });
}

async function ft_transfer_call(account: nearAPI.Account, receiver_id: string, amount: number, msg: Object) {
    console.log('ft_transfer_call', account.accountId, receiver_id, amount, msg);
    const { ft } = getContracts(account);    
    await ft.ft_transfer_call({
        receiver_id,
        amount: amount.toString(),
        msg: JSON.stringify(msg),
    },{
        gas: FtTransferCallGas.toString(),
        attachedDeposit: 1,
    });
}

// Test cases

async function purchaseOBS(account: nearAPI.Account) {
    console.log('purchaseOBS', account.accountId);
    const { marketplace, ft } = getContracts(account);
    const obs_amount = await ft.ft_balance_of({ account_id: account.accountId});
    await marketplace.purchase({}, {gas: MarketPurchaseGas.toString(), attachedDeposit: parseNearAmount("2.0005")});
    const obs_amount_2 = await ft.ft_balance_of({account_id: account.accountId});
    const diff = ((parseInt(obs_amount_2) - parseInt(obs_amount)) / 1e18).toFixed();
    console.table([parseInt(obs_amount)/1e18, parseInt(obs_amount_2)/1e18, diff]);
}

async function auctionWhitelist(account: nearAPI.Account) {

}


async function auctionNEAR(account: nearAPI.Account) {
    console.log('auctionNEAR', account.accountId);
    const { nft, ft, marketplace } = getContracts(account);
    let token = await nft_mint(account);
    await nft_approve(account, token, {
        initial_price: parseNearAmount('1'),
        deadline: Math.floor((new Date().getTime())/1000 + 20),
    });
    let token2 = await nft_get(account, token.token_id);

    let auction = await market_get_auction(account, token);
    let tx = await marketplace.bid({
        auction_id: auction.id
    },{
        gas: MarketBidGas.toString(),
        attachedDeposit: parseNearAmount('1.1')
    });
    let token3 = await nft_get(account, token.token_id);

    if(testsMatrix.openBiSea721auctionCancel) {
        console.log('cancel', {auction_id: auction.id});
        await marketplace.cancel({auction_id: auction.id}, {gas: MarketCancelGas.toString()});
    } else {
        await sleep(10_000);
        await marketplace.bid({ auction_id: auction.id },{gas: MarketBidGas.toString(), attachedDeposit: parseNearAmount('1.2')});
    }
    let token4 = await nft_get(account, token.token_id);
    console.table([token, token2, token3, token4]);
}

async function auctionToken(account: nearAPI.Account) {
    console.log('auctionToken', account.accountId);
    const { nft, ft, marketplace } = getContracts(account);
    let token = await nft_mint(account);

    await ft_storage_deposit(account, marketplace.contractId);

    await nft_approve(account, token, {
        initial_price: 1e18.toString(),
        ft: ft.contractId,
        deadline: Math.floor((new Date().getTime())/1000 + 20),
    });
    let token2 = await nft_get(account, token.token_id);
    let auction = await market_get_auction(account, token);

    await ft_transfer_call(account, marketplace.contractId, 1.1e18, {auction_id: auction.id});
    let token3 = await nft_get(account, token.token_id);

    if(testsMatrix.openBiSea721auctionCancel) {
        await marketplace.cancel({auction_id: auction.id}, {gas: MarketCancelGas.toString()});
    } else {
        await sleep(10_000);
        await ft_transfer_call(account, marketplace.contractId, 1.2e18, {auction_id: auction.id});
    }
    let token4 = await nft_get(account, token.token_id);
    console.table([token, token2, token3, token4]);
}

async function claimOBS(account) {

}

async function withdrawalToSuperAdmin(account) {

}


let testsMatrix = {
    purchaseOBS:true,
    openBiSea721auctionWhitelist:true, // first launch need
    openBiSea721auctionMainCoin:true,
    openBiSea721auctionToken:true,
    openBiSea721auctionCancel:false,
    openBiSeaClaimOBS:true,
    withdrawalToSuperAdmin:false,
}
module.exports.main = async function main({account, near, nearAPI: nearAPI, argv}: Context) {
    if(!account) {
        console.error("AccountId must be defined");
        process.exit(1);
    }

    if(testsMatrix.purchaseOBS) {
        console.log("Run purchaseOBS");
        await purchaseOBS(account);
    }

    if(testsMatrix.openBiSea721auctionWhitelist) {
        console.log("Run auctionWhitelist");
        await auctionWhitelist(account);
    }

    if(testsMatrix.openBiSea721auctionMainCoin) {
        console.log("Run auctionNEAR");
        await auctionNEAR(account);
    }

    if(testsMatrix.openBiSea721auctionToken) {
        console.log("Run auctionToken");
        await auctionToken(account);
    }

    if(testsMatrix.openBiSeaClaimOBS) {
        console.log("Run claimOBS");
        await claimOBS(account);
    }

    if(testsMatrix.withdrawalToSuperAdmin) {
        console.log("Run withdrawalToSuperAdmin");
        await withdrawalToSuperAdmin(account);
    }
}


/*
async function test() {
    let testsMatrix = {
        purchaseOBS:false,
        openBiSea721auctionWhitelist:true, // first launch need
        openBiSea721auctionMainCoin:true,
        openBiSea721auctionToken:false,
        openBiSeaClaimOBS:true,
        withdrawalToSuperAdmin:false,
    }


    try{

        if (testsMatrix.purchaseOBS === true) {
            let balanceAccount = web3.utils.fromWei(await web3.eth.getBalance(accMain.address), 'ether');
            let balanceGPAccountAddress = web3.utils.fromWei(await tokenOBS.methods.balanceOf(accGP.address).call(), 'ether');
            let purchaseAmountMainCoin = '0.05'
            let purchaseAmount = web3.utils.toWei(purchaseAmountMainCoin, 'ether')

            let tokensForPurchaseAmountResult = await openBiSea.methods.purchaseTokensQuantityFor(purchaseAmount).call()
            if (tokensForPurchaseAmountResult['0'] === '0' || tokensForPurchaseAmountResult['1'] === '0') {
                throw new Error('tokensForPurchaseAmountResult show a zero OBS tokens in back of ' + purchaseAmount);
            }
            let tokensInBack = web3.utils.fromWei(tokensForPurchaseAmountResult['0']);

            let purchaseTokensOBSResult = await openBiSeaGP.methods.purchaseTokens(accLP.address).send({
                from: accGP.address,
                value: purchaseAmount,
                chainId:network
            });
            console.log('purchaseTokensOBSResult:', purchaseTokensOBSResult.transactionHash);
            cumulativeGasUsed = cumulativeGasUsed + purchaseTokensOBSResult.gasUsed

            let tokensForPurchaseAmountResultAfter = await openBiSea.methods.purchaseTokensQuantityFor(purchaseAmount).call()
            let tokensInBackAfter = web3.utils.fromWei(tokensForPurchaseAmountResultAfter['0']);

            if (parseFloat(tokensInBackAfter) <= parseFloat(tokensInBack)) {
                //throw new Error('feesMulitpier wrong flow');
                console.log('===========parseFloat(tokensInBackAfter) <= parseFloat(tokensInBack)========')
            }

            let balanceGPAccountAddressAfter = web3.utils.fromWei(await tokenOBS.methods.balanceOf(accGP.address).call(), 'ether');

            if (parseFloat(balanceGPAccountAddressAfter) === parseFloat(balanceGPAccountAddress)) {
                throw new Error('purchaseTokens() wrong flow.');
            }
        }


        console.log('-----------------------------------START OPEN BI SEA AUCTION NFT-----------------------------------');

        console.log('-----------------------------------LP seller, GP buyer-----------------------------------');

        // =================================================================
        // check Auction contract
        const NFT_LP = new web3LP.eth.Contract(JSON.parse(NFTAbi), NFTAddress);
        const NFT_GP = new web3GP.eth.Contract(JSON.parse(NFTAbi), NFTAddress);
        // const NFT1155 = new web3.eth.Contract(JSON.parse(TestERC1155Abi), TestERC1155Contract);
        // let totalNFTs = await NFT_GP.methods.totalSupply().call();
        // let latestIndex = (parseInt(totalNFTs) - 1)
        //
        // let latestIndexString = latestIndex + ''
        // console.log(`latestIndexString [${latestIndexString}]`);
        //
        // let owner = await NFT_GP.methods.ownerOf(latestIndexString).call() + ''
        // console.log(`NFT.methods.ownerOf is [${owner}]`);


        let gasPrice = await web3.eth.getGasPrice()
        let contractsNFTWhitelistedBefore = await openBiSeaAuction.methods.contractsNFTWhitelisted().call();
        console.log('contractsNFTWhitelistedBefore:', contractsNFTWhitelistedBefore);

        if (testsMatrix.openBiSea721auctionWhitelist === true) {

            let resultWhitelistEstimateGas = await openBiSeaAuction.methods.whitelistContractAdmin('0xe782382E1777b100102a8723E3253665800E475F').estimateGas({
                from: accMain.address,
                chainId:network,
                gas:8000000,
                gasPrice:gasPrice
            });


            let resultWhitelist = await openBiSeaAuction.methods.whitelistContractAdmin('0xe782382E1777b100102a8723E3253665800E475F').send({
                from: accMain.address,
                chainId:network,
                gas:resultWhitelistEstimateGas,
                gasPrice:gasPrice
            });
            console.log(`openBiSeaAuction.methods.whitelistContractAdmin result: ${resultWhitelist.transactionHash}`);
            cumulativeGasUsed = cumulativeGasUsed + resultWhitelist.gasUsed
        }

        let contractsNFTWhitelistedAfter = await openBiSeaAuction.methods.contractsNFTWhitelisted().call();
        console.log('contractsNFTWhitelistedAfter:', contractsNFTWhitelistedAfter);

        let isContractNFTWhitelisted = await openBiSeaAuction.methods.isContractNFTWhitelisted(NFTAddress).call();
        console.log('isContractNFTWhitelisted:', isContractNFTWhitelisted);

        let deadline = Math.floor(+new Date() / 1000 + 60) + ''
        const NFT_main = new web3.eth.Contract(JSON.parse(NFTAbi), NFTAddress);
        let price = web3.utils.toWei('0.19', 'ether')
        let bidAmount = 0.2

        // ERC721 BNB

        if (testsMatrix.openBiSea721auctionMainCoin === true) {
            console.log('-----------------------------------openBiSea721auctionMainCoin LP seller, GP buyer-----------------------------------');

            console.log(' 721 START:');

            const nonce = await web3.eth.getTransactionCount(accMain.address);
            // console.log(' nonce:', nonce);

            let resultMintNewNFT = await NFT_main.methods.mint(accLP.address, "ipfs://QmfJhX3rRGKSQngdQd3FJxwVr6SaEyjm5wKMFUVimUxoQH").send({
                from: accMain.address,
                // gas: 500000,
                nonce: nonce,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultMintNewNFT.gasUsed

            let getNFTon = await openBiSeaAuction.methods.getNFTon(accLP.address).call();
            console.log('getNFTon:', getNFTon);

            console.log(' resultMintNewNFT:', resultMintNewNFT.transactionHash);
            let lpNFTAddressBalance = await NFT_main.methods.balanceOf(accLP.address).call();
            console.log(' lpNFTAddressBalance AFTER:', lpNFTAddressBalance);

            let latestIndex = resultMintNewNFT.events.Transfer.returnValues.tokenId;

            // latestIndex = latestIndex + 1
            // console.log(' latestIndex AFTER:', latestIndex + '');
            //
            // owner = await NFT_main.methods.ownerOf(latestIndex + '').call() + ''
            // console.log(` NFT.methods.ownerOf AFTER is ${owner} latestIndex:${latestIndex}`);
            let nonceLp = await web3LP.eth.getTransactionCount(accLP.address);

            let resultApprovalNFTAuction = await NFT_LP.methods.approve(OpenBiSeaAuctionAddress, latestIndex + '').send({
                from: accLP.address,
                gas: 500000,
                nonce: nonceLp,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultApprovalNFTAuction.gasUsed

            console.log(` resultApprovalNFTAuction: ${resultApprovalNFTAuction.transactionHash}`);
            console.log(`NFT.methods.ownerOf AFTER is [${await NFT_main.methods.ownerOf(latestIndex).call()}]`);

            deadline = Math.floor(+new Date() / 1000 + 60) + ''
            nonceLp = await web3LP.eth.getTransactionCount(accLP.address);
            let resultCreateAuction = await openBiSeaLP.methods.createAuction(NFTAddress, latestIndex + '', price, deadline, false, '0x0000000000000000000000000000000000000000').send({
                from: accLP.address,
                gas: 500000,
                nonce: nonceLp,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultCreateAuction.gasUsed

            console.log(`FIRST auctionNFT.methods.createAuction result: ${resultCreateAuction.transactionHash}  gasUsed: ${resultCreateAuction.gasUsed}`);

            let getNFTsAuctionList = await openBiSeaAuction.methods.getNFTsAuctionList(NFTAddress).call();
            console.log('FIRST getNFTsAuctionList:' + getNFTsAuctionList);

            let getAllAuctionsList = await openBiSeaAuction.methods.getAllAuctionsList().call();
            console.log('FIRST getAllAuctionsList:' + getAllAuctionsList);

            nonceLp = await web3LP.eth.getTransactionCount(accLP.address);

            let resultCancel = await openBiSeaLP.methods.cancelAuction(NFTAddress, latestIndex + '', false).send({
                from: accLP.address,
                gas: 500000,
                nonce: nonceLp,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultCancel.gasUsed

            console.log(`auctionNFT.methods.cancel result: ${resultCancel.transactionHash}`);

            // resultApprovalNFT = await NFT.methods.approve(auctionNFTAddress,latestIndex+ '').send({
            //     from: accStartup.address
            // });
            // console.log(`SECOND returnTestERC721.methods.approve result: ${resultApprovalNFT.transactionHash}`);
            nonceLp = await web3LP.eth.getTransactionCount(accLP.address);

            resultApprovalNFTAuction = await NFT_LP.methods.approve(OpenBiSeaAuctionAddress, latestIndex + '').send({
                from: accLP.address,
                gas: 500000,
                nonce: nonceLp,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultApprovalNFTAuction.gasUsed

            console.log(`SECOND resultApprovalNFTAuction: ${resultApprovalNFTAuction.transactionHash}`);

            nonceLp = await web3LP.eth.getTransactionCount(accLP.address);

            resultCreateAuction = await openBiSeaLP.methods.createAuction(NFTAddress, latestIndex + '', web3.utils.toWei('0.0001', 'ether'), Math.floor(+new Date() / 1000 + 40) + '', false, '0x0000000000000000000000000000000000000000').send({
                from: accLP.address,
                gas: 500000,
                nonce: nonceLp,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultCreateAuction.gasUsed

            console.log(`SECOND auctionNFT.methods.createAuction result: ${resultCreateAuction.transactionHash}`);
            getNFTsAuctionList = await openBiSeaAuction.methods.getNFTsAuctionList(NFTAddress).call();
            console.log('SECOND getNFTsAuctionList:', getNFTsAuctionList);
            let bidAmount = 0.2
            let consumersRevenueAmountLPbefore = await openBiSeaAuction.methods.consumersRevenueAmount(accLP.address).call();
            console.log( 'consumersRevenueAmountLPbefore:',  web3.utils.fromWei(consumersRevenueAmountLPbefore, 'ether'));

            let totalIncomeBefore = await openBiSea.methods.totalIncome().call();
            console.log( 'totalIncomeBefore:',  web3.utils.fromWei(totalIncomeBefore, 'ether'));

            for (let i = 0; i < 50; i++) {
                let getNFTsAuctionList2 = await openBiSeaAuction.methods.getNFTsAuctionList(NFTAddress).call();
                console.log('getNFTsAuctionList2:', getNFTsAuctionList2);
                if (getNFTsAuctionList2.length > 0) {
                    // let last = web3.utils.toBN(getNFTsAuctionList2[getNFTsAuctionList2.length - 1]);
                    // let accLPBN = web3.utils.toBN(accLP.address);
                    // let accLPBN1 = BigInt(accLP.address);
                    // let last1 = BigInt(getNFTsAuctionList2[getNFTsAuctionList2.length - 1]);
                    // let indexStartup1 = (last1 - accLPBN1).toString();
                    // let indexStartup = (last.sub(accLPBN)).toString();
                    // if (indexStartup === latestIndex + '') {
                    bidAmount = bidAmount + 0.0001;
                    let nonceGP = await web3GP.eth.getTransactionCount(accGP.address);
                    console.log(`start Bid amount ${bidAmount}`);
                    let resultBid = await openBiSeaGP.methods.bid(NFTAddress, latestIndex, false,"0x0000000000000000000000000000000000000000").send({
                        from: accGP.address,
                        value: web3.utils.toWei(Number(bidAmount).toFixed(4) + '', 'ether'),
                        gas: 500000,
                        nonce: nonceGP,
                        chainId:network
                    });
                    cumulativeGasUsed = cumulativeGasUsed + resultBid.gasUsed
                    let eventsKeys = Object.keys(resultBid.events)
                    console.log(`resultBid amount ${bidAmount} result: ${resultBid.transactionHash} gasUsed: ${resultBid.gasUsed} eventsKeys.length: ${eventsKeys.length}`);
                    if (eventsKeys.length > 1) {
                        if (i === 0) throw new Error('OBS based auction wrong flow.');
                        console.log('----------------------------------- Main coin based auction done -----------------------------------');
                        break
                    }
                    // } else {
                    //     //break//throw new Error('indexStartup wrong .');/// GLITCH!!!! BSC RETURN WRONG ARRAY!
                    // }
                } else {
                    break
                }
            }

            // totalNFTs = await NFT_main.methods.totalSupply().call();
            // latestIndex = (parseInt(totalNFTs) - 1)
            let consumersRevenueAmountLPafter = await openBiSeaAuction.methods.consumersRevenueAmount(accLP.address).call();
            console.log( ' consumersRevenueAmountLPafter',  web3.utils.fromWei(consumersRevenueAmountLPafter, 'ether'));
            let totalIncomeAfter = await openBiSea.methods.totalIncome().call();
            console.log( 'totalIncomeAfter:',  web3.utils.fromWei(totalIncomeAfter, 'ether'));

            let ownerAfter = await NFT_main.methods.ownerOf(latestIndex + '').call() + ''
            if (ownerAfter.toLowerCase() !== accGP.address.toLowerCase()) {
                throw new Error('Open Bi Sea() wrong flow.');
            }
        }


        if (testsMatrix.openBiSea721auctionToken === true) {
            console.log('-----------------------------------openBiSea721auctionToken LP seller, GP buyer-----------------------------------');

            // let resultMintNewNFTestimateGas = await NFT_main.methods.mint(accLP.address,"ipfs://QmbbNnhixeMemZAo9WS7Y6feJWArTiqHji8ZgQdKiNqNhS").estimateGas({
            //     from: accMain.address,
            //     chainId:network,
            //     // gas:8000000,
            //     // gasPrice:gasPrice
            // });

            let resultMintNewNFT = await NFT_main.methods.mint(accLP.address,"ipfs://QmfJhX3rRGKSQngdQd3FJxwVr6SaEyjm5wKMFUVimUxoQH").send({
                from: accMain.address,
                chainId:network,
                // gas:resultMintNewNFTestimateGas,
                // gasPrice:gasPrice
            });
            cumulativeGasUsed = cumulativeGasUsed + resultMintNewNFT.gasUsed

            console.log('resultMintNewNFT to LP:', resultMintNewNFT.transactionHash);
            let lpNFTAddressBalance = await NFT_main.methods.balanceOf(accLP.address).call();
            console.log('lpNFTAddressBalance AFTER:', lpNFTAddressBalance);

            let latestIndex = resultMintNewNFT.events.Transfer.returnValues.tokenId;

            // totalNFTs = await NFT_main.methods.totalSupply().call();
            // latestIndex = (parseInt(totalNFTs) - 1)
            // owner = await NFT_main.methods.ownerOf(latestIndex + '').call() + ''
            // console.log(`NFT.methods.ownerOf AFTER is [${owner}]`);

            // token auctions
            let token = tokenOBS;
            let tokenGP = tokenOBS_GP;
            let tokenAddress = OBSAddress;
            let prefix = 'OBS';


            if (testsMatrix.openBiSea721auctionTokenUSD === true) {
                token = new web3.eth.Contract(JSON.parse(OBSAbi), usdAddress);
                tokenGP = new web3GP.eth.Contract(JSON.parse(OBSAbi), usdAddress);
                tokenAddress = usdAddress;
                prefix = 'USD'
            }


            let balanceOBS = await token.methods.balanceOf(accGP.address).call()


            let resultApprovalNFT = await NFT_LP.methods.approve(OpenBiSeaAuctionAddress, latestIndex + '').send({
                from: accLP.address,
                gas: 500000,
                chainId:network
            });
            console.log(prefix + ' resultApprovalNFT LP:', resultApprovalNFT.transactionHash);
            cumulativeGasUsed = cumulativeGasUsed + resultApprovalNFT.gasUsed

            deadline = Math.floor(+new Date() / 1000 + 60) + ''
            let resultCreateAuction = await openBiSeaLP.methods.createAuction(NFTAddress, latestIndex + '', price, deadline, false, tokenAddress).send({
                from: accLP.address,
                gas: 500000,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultCreateAuction.gasUsed

            console.log(`${prefix} + ' FIRST auctionNFT.methods.createAuction result: ${resultCreateAuction.transactionHash}  gasUsed: ${resultCreateAuction.gasUsed}`);

            let getNFTsAuctionList = await openBiSeaAuction.methods.getNFTsAuctionList(NFTAddress).call();
            console.log(prefix + ' FIRST getNFTsAuctionList:' + getNFTsAuctionList);

            let getAllAuctionsList = await openBiSeaAuction.methods.getAllAuctionsList().call();
            console.log(prefix + ' FIRST getAllAuctionsList:' + getAllAuctionsList);


            let resultCancel = await openBiSeaLP.methods.cancelAuction(NFTAddress, latestIndex + '', false).send({
                from: accLP.address,
                gas: 500000,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultCancel.gasUsed

            console.log(`${prefix} auctionNFT.methods.cancel result: ${resultCancel.transactionHash}`);

            resultApprovalNFT = await NFT_LP.methods.approve(OpenBiSeaAuctionAddress, latestIndex + '').send({
                from: accLP.address,
                gas: 500000,
                chainId:network
            });
            console.log(`${prefix} SECOND returnTestERC721.methods.approve result: ${resultApprovalNFT.transactionHash}`);
            cumulativeGasUsed = cumulativeGasUsed + resultApprovalNFT.gasUsed

            deadline = Math.floor(+new Date() / 1000 + 60) + ''

            resultCreateAuction = await openBiSeaLP.methods.createAuction(NFTAddress, latestIndex + '', web3.utils.toWei('0.0001', 'ether'), deadline + '', false, tokenAddress).send({
                from: accLP.address,
                gas: 500000,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + resultCreateAuction.gasUsed

            console.log(`${prefix} SECOND auctionNFT.methods.createAuction result: ${resultCreateAuction.transactionHash}`);
            getNFTsAuctionList = await openBiSeaAuction.methods.getNFTsAuctionList(NFTAddress).call();
            console.log(prefix + ' SECOND getNFTsAuctionList:', getNFTsAuctionList);

            console.log('----------------------------------- GP START ' + prefix + ' approval-----------------------------------');

            let result = await tokenGP.methods.approve(openBiSeaAddress, balanceOBS).send({
                from: accGP.address,
                gas: 500000,
                chainId:network
            });

            console.log(prefix + '1 token.methods.approve:', result.transactionHash);
            cumulativeGasUsed = cumulativeGasUsed + result.gasUsed

            let allowanceOBS = web3.utils.fromWei(await token.methods.allowance(accGP.address, openBiSeaAddress).call(), 'ether');
            // console.log('allowanceBUSD:', allowanceBUSD);
            if (parseFloat(allowanceOBS) < 1) {
                throw new Error('allowanceOBS() wrong .');
            }
            let bidAmountOBS = 0.2
            let consumersRevenueAmountLPbefore = await openBiSeaAuction.methods.consumersRevenueAmount(accLP.address).call();
            console.log(prefix + 'consumersRevenueAmountLPbefore:',  web3.utils.fromWei(consumersRevenueAmountLPbefore, 'ether'));

            let totalIncomeBefore = await openBiSea.methods.totalIncome().call();
            console.log(prefix + 'totalIncomeBefore:',  web3.utils.fromWei(totalIncomeBefore, 'ether'));


            for (let i = 0; i < 50; i++) {
                let getNFTsAuctionList2 = await openBiSeaAuction.methods.getNFTsAuctionList(NFTAddress).call();
                console.log(prefix + ' getNFTsAuctionList:', getNFTsAuctionList2);
                if (getNFTsAuctionList2.length > 0) {
                    // let lastAuction = getNFTsAuctionList2[getNFTsAuctionList2.length - 1]
                    // let last = web3.utils.toBN(lastAuction);
                    // let accLPBN = web3.utils.toBN(accLP.address);
                    // var tokenId = last.sub(accLPBN).toNumber() + '';
                    // if (tokenId === latestIndex + '') {
                    bidAmountOBS = bidAmountOBS + 0.0001
                    let resultBid = await openBiSeaGP.methods.bidToken(NFTAddress, latestIndex, web3.utils.toWei(Number(bidAmountOBS).toFixed(4) + '', 'ether'), false,accLP.address, tokenAddress).send({
                        from: accGP.address,
                        gas: 500000,
                        chainId:network
                    });
                    cumulativeGasUsed = cumulativeGasUsed + resultBid.gasUsed

                    console.log(`${prefix} resultBid amount ${bidAmountOBS} result: ${resultBid.transactionHash} gasUsed: ${resultBid.gasUsed}`);
                    // } else {
                    //     throw new Error('indexStartup wrong .');
                    // }
                    let eventsKeys = Object.keys(resultBid.events)
                    console.log(`${prefix} resultBid amount ${bidAmountOBS} result: ${resultBid.transactionHash} gasUsed: ${resultBid.gasUsed} eventsKeys.length: ${eventsKeys.length}`);
                    if (eventsKeys.length > 4) {
                        if (i === 0) throw new Error('OBS based auction wrong flow.');
                        console.log('----------------------------------- OBS based auction done -----------------------------------');
                        break
                    }

                } else {
                    if (i === 0) throw new Error('OBS based auction wrong flow.');
                    console.log('----------------------------------- OBS based auction done -----------------------------------');
                    break;
                }
            }

            let consumersRevenueAmountLPafter = await openBiSeaAuction.methods.consumersRevenueAmount(accLP.address).call();
            console.log(prefix + ' consumersRevenueAmountLPafter',  web3.utils.fromWei(consumersRevenueAmountLPafter, 'ether'));
            let totalIncomeAfter = await openBiSea.methods.totalIncome().call();
            console.log(prefix + 'totalIncomeAfter:',  web3.utils.fromWei(totalIncomeAfter, 'ether'));
        }

        deadline = Math.floor(+new Date() / 1000  + 60) + ''

        if (testsMatrix.openBiSeaClaimOBS === true) {
            let consumersRevenueAmountLP = await openBiSeaAuction.methods.consumersRevenueAmount(accLP.address).call();
            console.log('consumersRevenueAmountLP:',  web3.utils.fromWei(consumersRevenueAmountLP, 'ether'));

            let consumersRevenueAmountGP = await openBiSeaAuction.methods.consumersRevenueAmount(accGP.address).call();
            console.log('consumersRevenueAmountGP:', web3.utils.fromWei(consumersRevenueAmountGP, 'ether'));

            console.log('expected OBS to claim GP:', (bidAmount / parseFloat(web3.utils.fromWei('93834360575382889', 'ether')) / 2) / 100 * 5 );


            let claimFreeTokensResultGP = await openBiSeaGP.methods.claimFreeTokens().send({
                from: accGP.address,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + claimFreeTokensResultGP.gasUsed

            console.log(`claimFreeTokensResult GP result: ${claimFreeTokensResultGP.transactionHash} gasUsed: ${claimFreeTokensResultGP.gasUsed} events ${JSON.stringify(claimFreeTokensResultGP.events)}`);
            let claimFreeTokensResultLP = await openBiSeaLP.methods.claimFreeTokens().send({
                from: accLP.address,
                chainId:network
            });
            cumulativeGasUsed = cumulativeGasUsed + claimFreeTokensResultLP.gasUsed

            console.log(`claimFreeTokensResult LP result: ${claimFreeTokensResultLP.transactionHash} gasUsed: ${claimFreeTokensResultLP.gasUsed} events ${JSON.stringify(claimFreeTokensResultLP.events)}`);

        }
        console.log('-----------------------------------END OPEN BI SEA AUCTION NFT-----------------------------------');

        if (testsMatrix.withdrawalToSuperAdmin === true) {
            console.log('-----------------------------------START  withdrawal OBS from pool to SUPERADMIN -----------------------------------');
            let withdrawSuperAdminResult = await openBiSea.methods._withdrawSuperAdmin(accMain.address, OBSAddress, web3.utils.toWei('0.1', 'ether')).send({
                from: accMain.address,
                chainId:network
            });
            console.log('withdrawSuperAdminResult:', withdrawSuperAdminResult.transactionHash);
            cumulativeGasUsed = cumulativeGasUsed + withdrawSuperAdminResult.gasUsed

            console.log('-----------------------------------END  withdrawal to SUPERADMIN -----------------------------------');
        }
        let totalExpenses = gasPrice * cumulativeGasUsed
        let totalExpensesMainCoin = web3.utils.fromWei(totalExpenses + '', 'ether');
        console.log('totalExpenses Main Coin:' + totalExpensesMainCoin);

        // await checkTokensForClaimTest()


        process.exit(1)

    } catch(e) {
        console.log(`Error: ${e.name}:${e.message}`, e.stack);
        process.exit(1)
    }
}
test()
    */
