import {useEffect, useRef, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import { Icon } from '@iconify/react';
import {parseNearAmount} from 'near-api-js/lib/utils/format';

import {NEARType} from '../App';

import "./Home.css";
import {Project} from '../../../ts/grant';

const onSignInOut = (near: NEARType) => {
    if(!near.loaded) return;
    if(near.authorized) {
        near.walletConnection.signOut();
        document.location.reload();
    } else {
        near.walletConnection.requestSignIn(near.nearConfig.contractName, 'Dorahacks :: Sign In');
    }
}

const onDonate = async (near: NEARType) => {
    if(!near.loaded) return;
    if(near.authorized) {
        let tx = await near.grant.donate({}, {attachedDeposit: parseNearAmount("1")});
    } else {
        near.walletConnection.requestSignIn(near.nearConfig.contractName, 'Dorahacks :: Sign In');
    }
};

const onVote = async (near: NEARType, project: Project) => {
    if(!near.loaded) return;
    if(near.authorized) {
        let tx = await near.grant.vote({project_id: [project.round_id, project.owner], votes: 1}, {attachedDeposit: parseNearAmount("5")});
    } else {
        near.walletConnection.requestSignIn(near.nearConfig.contractName, 'Dorahacks :: Sign In');
    }
};

const App = ({near}: {near: NEARType}) => {
    const params = useParams();
    const [projects, setProjects] = useState<Project[]>([]);
    
    useEffect(() => {
        if(near.loaded) {
            (async () => {
                let projects = await near.grant.list_projects({});
                setProjects(projects);
            })();
        }
    }, [near.loaded]);

    if (!near.loaded) {
        return <>NO</>;
    }

    const currentRound = near.grantConfig.current_round;


    return (
        <div className={"bg-white text-gray-600 work-sans leading-normal text-base tracking-normal"}>

            <nav id="header" className={"w-full z-30 top-0 py-1"}>
                <div className={"w-full container mx-auto flex flex-wrap items-center justify-between mt-0 px-6 py-3"}>

                    <label htmlFor="menu-toggle" className={"cursor-pointer md:hidden block"}>
                        <svg className={"fill-current text-gray-900"} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                            <title>menu</title>
                            <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
                        </svg>
                    </label>
                    <input className={"hidden"} type="checkbox" id="menu-toggle" />

                    <div className={"hidden md:flex md:items-center md:w-auto w-full order-3 md:order-1"} id="menu">
                        <nav>
                            <ul className={"md:flex items-center justify-between text-base text-gray-700 pt-4 md:pt-0"}>
                                <li><a className={"inline-block no-underline hover:text-black hover:underline py-2 px-4"} href="https://Dorahacks.io/">Help Dora to hack the world</a></li>
                            </ul>
                        </nav>
                    </div>

                    <div className={"order-1 md:order-2"}>
                        <a className={"flex items-center tracking-wide no-underline hover:no-underline font-bold text-gray-800 text-xl "} href="#">
                           Fundue QF GRANTS
                        </a>
                    </div>

                    <div className={"order-2 md:order-3 flex items-center"} id="nav-content">

                        <a className={"inline-block no-underline hover:text-black"} href="#" onClick={() => onSignInOut(near)}>
                            <Icon icon={near.authorized ? "mdi:logout" : "mdi:login"} width="24" height="24" />
                        </a>
                    </div>
                </div>
            </nav>

            <section className={"bg-white py-8"}>

                <div className={"container mx-auto flex items-center flex-wrap pt-4 pb-12"}>

                    <nav id="store" className={"w-full z-30 top-0 px-6 py-1"}>
                        <div className={"w-full container mx-auto flex flex-wrap items-center justify-between mt-0 px-2 py-3"}>

                            <a className={"uppercase tracking-wide no-underline hover:no-underline font-bold text-gray-800 text-xl "} href="#" onClick={() => { onDonate(near) } }>
                                Season { currentRound?.id }  :: Shares {currentRound?.support_area} :: Support {parseInt(currentRound!.support_pool)/1e24} NEAR :: Click to donate
                            </a>
                        </div>
                    </nav>
                    {
                        projects.map((project: Project) => {
                            return (<div key={project.owner} className={"w-full md:w-1/3 xl:w-1/4 p-6 flex flex-col"}>
                                <a href="#" onClick={() => onVote(near, project)}>
                                    <img className={"hover:grow hover:shadow-lg"} src={`${project.image}?${project.owner}`} />
                                    <div className={"pt-3 flex items-center justify-between"}>
                                        <p className={""}>{project.name}</p>
                                        <Icon icon="ci:heart-outline" width={24} height={24} />
                                    </div>
                                    <p className={"pt-1 text-gray-900"}>Owner: <a target={"_blank"} href={`https://stats.gallery/${near.nearConfig.networkId}/${project.owner}`}>{project.owner}</a></p>
                                    <p className={"pt-1 text-gray-900"}>Votes: {project.total_votes}, share: {project.support_area}</p>
                                    <p className={"pt-1 text-gray-900"}>
                                        Amount: {(parseInt(project.grants)/1e24).toFixed(2)} + {(parseInt(currentRound!.support_pool) * project.support_area / currentRound!.support_area / 1e24).toFixed(2)} NEAR (Support)</p>
                                    <p className={"pt-1 text-gray-900"}><b>Click to vote</b></p>

                                </a>
                            </div>)
                        })
                    }
                </div>

            </section>

            <footer className={"container mx-auto bg-white py-8 border-t border-gray-400"}>
                <div className={"container flex px-3 py-8 "}>
                    <div className={"w-full mx-auto flex flex-wrap"}>
                        <div className={"flex w-full lg:w-1/2 "}>
                            <div className={"px-3 md:px-0"}>
                                <h3 className={"font-bold text-gray-900"}>About</h3>
                                <p className={"py-4"}>
                                    <a target={"_blank"} href={`https://stats.gallery/${near.nearConfig.networkId}/${near.nearConfig.contractName}/contract`}>{near.nearConfig.contractName}</a> - ver. {near.grantConfig.version}
                                </p>
                            </div>
                        </div>
                        <div className={"flex w-full lg:w-1/2 lg:justify-end lg:text-right"}>
                            <div className={"px-3 md:px-0"}>
                                <h3 className={"font-bold text-gray-900"}>Social</h3>
                                <ul className={"list-reset items-center pt-3"}>
                                    <li>
                                        <a className={"inline-block no-underline hover:text-black hover:underline py-1"} href="https://t.me/kalloc">
                                            <Icon icon="fa:telegram" width={24} height={24} />
                                        </a>
                                        &nbsp;
                                        <a className={"inline-block no-underline hover:text-black hover:underline py-1"} href="https://github.com/kalloc">
                                            <Icon icon="ci:github" width={24} height={24} />
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default App;
