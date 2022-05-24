import { useState, createContext, useEffect } from "react";
import { Route, Navigate, Routes } from "react-router-dom";

// @ts-ignore
import * as nearAPI from 'near-api-js';
import { Config, Contract as GrantContract } from "../../ts/grant";    

import Home from "./views/Home";
import "./index.css";
import { getConfig } from './config';

const NEARContext = createContext({});


export type NEARType = { 
    grant: GrantContract,
    grantConfig: Config,
    userBalance: number,
    currentUser: {
        accountId: any, 
        balance: string,
    },
    nearConfig: {
        networkId: string,
        nodeUrl: string,
        contractName: string,
        walletUrl: string,
        helperUrl: string,
    },
    walletConnection: nearAPI.WalletConnection,
    loaded: true,
    authorized: true,
} | {
    grant: GrantContract,
    grantConfig: Config,
    userBalance: 0,
    currentUser: undefined,
    nearConfig: {
        networkId: string,
        nodeUrl: string,
        contractName: string,
        walletUrl: string,
        helperUrl: string,
    },
    walletConnection: nearAPI.WalletConnection,
    loaded: true,
    authorized: false,
} | {
    loaded: false,
    authorized: false,
};

async function initNEARContract(): Promise<NEARType> {
    const nearConfig = getConfig(process.env.NEAR_ENV || 'testnet');
    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
    const near = await nearAPI.connect({ keyStore, ...nearConfig, headers: {} });
    const walletConnection = new nearAPI.WalletConnection(near, "exv");
    const grant = new GrantContract(
        walletConnection.account(),
        nearConfig.contractName,
    );
    let config = await grant.config();
    let base = {
        grant,
        grantConfig: config,
        nearConfig,
        walletConnection,
    };
    if (walletConnection.isSignedIn()) {
        let currentUser = {
            accountId: walletConnection.getAccountId(),
            balance: (await walletConnection.account().state()).amount,
        };
        return { 
            userBalance: 0,
            currentUser,
            authorized: true,
            loaded: true,
            ...base,
        };
    } else {
        return { 
            userBalance: 0,
            currentUser: undefined,
            authorized: false,
            loaded: true,
            ...base,
        };
    }
}


export default function App() {
    const [near, setNear] = useState({ authorized: false, loaded: false } as NEARType);

    useEffect(() => {
        initNEARContract().then(setNear);
    }, []);

    return (
        <NEARContext.Provider value={near}>
            <Routes>
                <Route path="/" element={<Home near={near} />} />
                <Route path="/test/:mode" element={<Home near={near} />} />
                <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
        </NEARContext.Provider>
    );
}
