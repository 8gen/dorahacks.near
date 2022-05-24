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

ROOT=$(dirname $(realpath $0))

if [[ -e ${ROOT}/neardev/grant ]]; then
    GRANT_CONTRACT=$(cat ${ROOT}/neardev/grant/dev-account)
    near delete ${GRANT_CONTRACT} ${OWNER_ID}
    rm -rf ${ROOT}/neardev/grant
fi

