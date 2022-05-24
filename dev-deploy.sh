#!/usr/bin/env bash

set -e
export NEAR_ENV=testnet
OWNER_ID=$1

realpath() {
    path=`eval echo "$1"`
    folder=$(dirname "$path")
    echo $(cd "$folder"; pwd)/$(basename "$path");
}

if [[ $OWNER_ID == "" ]];then
    echo $0 kalloc.testnet
    exit
fi

./build.sh

ROOT=$(dirname $(realpath $0))

if [[ ! -e ${ROOT}/neardev/grant ]]; then
INIT_GRANT_TIME=true
fi

if [[ ! -e ${ROOT}/neardev/grant/dev-account ]];then
    FIRST_TIME=true
fi
mkdir -p ${ROOT}/neardev/grant
echo "deploy"
near dev-deploy --wasmFile ${ROOT}/res/grant.wasm --projectKeyDirectory ${ROOT}/neardev/grant --initFunction ''
GRANT_CONTRACT=$(cat ${ROOT}/neardev/grant/dev-account)
if [[ $FIRST_TIME == true ]]; then
    near call ${GRANT_CONTRACT} init --accountId kalloc.testnet
fi
echo GRANT is ${GRANT_CONTRACT}
near call $(cat neardev/grant/dev-account) sudo_new_default_round --accountId kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "NEAR QF Grant", "description": "Built and maintaine near grant", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId a.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "NFT Analytics service", "description": "some description, maybe better to use ipfs as data link", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId b.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "L2 example implementation", "description": "developer l2 example for near", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId c.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "Project #4", "description": "Description #4", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId d.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "Project #5", "description": "Description #5", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId e.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "Project #6", "description": "Description #6", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId f.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "Project #7", "description": "Description #7", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId h.kalloc.testnet
near call $(cat neardev/grant/dev-account) new_project '{"name": "Project #8", "description": "Description #8", "external_url": "https://8gen.team", "image": "https://picsum.photos/400"}' --accountId i.kalloc.testnet
near call $(cat neardev/grant/dev-account) vote  '{"project_id": [1, "a.kalloc.testnet"], "votes": 10}' --deposit 100  --accountId kalloc.testnet
near call $(cat neardev/grant/dev-account) donate '{}' --deposit 5  --accountId kalloc.testnet
near call $(cat neardev/grant/dev-account) vote  '{"project_id": [1, "a.kalloc.testnet"], "votes": 5}' --deposit 100  --accountId a.kalloc.testnet
near call $(cat neardev/grant/dev-account) sudo_update_current_round '{"danger": true, "end_at": '$(date +%s)'}' --accountId kalloc.testnet
near call $(cat neardev/grant/dev-account) sudo_finish_current_round '{}' --accountId kalloc.testnet
near call $(cat neardev/grant/dev-account) withdraw '{"project_id": [1, "a.kalloc.testnet"], "amount": "100000000000000000000000"}' --accountId kalloc.testnet
near view $(cat neardev/grant/dev-account) round '{"round_id": 1}'
near view $(cat neardev/grant/dev-account) project '{"project_id": [1, "a.kalloc.testnet"]}'
near view $(cat neardev/grant/dev-account) grant_for '{"project_id": [1, "a.kalloc.testnet"]}'

