<script lang="ts">
    import Web3 from "web3";
    import Storage from "./abis/Storage.json";
    import { create } from "ipfs-http-client";
    import Loader from "./lib/components/Loader.svelte";
    import FilesList from "./lib/components/FilesList.svelte";

    const projectId = "2LAWhy9ydAsdo4Yg811heyFWJ62";
    const projectSecret = "c356c621b36da52fd3bbbd55d5066c49";
    const authorization = "Basic " + window.btoa(projectId + ":" + projectSecret);

    const ipfs = create({
        url: "https://ipfs.infura.io:5001/api/v0",
        headers: {
            authorization
        }
    });

    const state = {
        loading: false,
        account: undefined,
        storage: undefined,
        fileCount: 0,
        files: [],
        file: {
            buffer: undefined,
            type: undefined,
            name: "",
            description: ""
        },
        fileId: undefined,
        fileError: undefined,
        transactionHash: undefined
    };

    async function init() {
        await loadWeb3();
        await loadBlockchainData();
    }

    async function loadWeb3() {
        if (window["ethereum"]) {
            window["web3"] = new Web3(window["ethereum"]);
            await window["ethereum"].request({ method: "eth_requestAccounts" });
        } else if (window["web3"]) {
            window["web3"] = new Web3(window["web3"].currentProvider);
        } else {
            window.alert("Non-ethereum browser detected.");
        }
    }

    async function loadBlockchainData() {
        const web3 = window["web3"];
        const accounts = await web3.eth.getAccounts();
        state.account = accounts[0];

        const networkId = await web3.eth.net.getId();
        const networkData = Storage.networks[networkId];

        if (networkData) {
            const storage = await new web3.eth.Contract(
                Storage.abi,
                networkData.address
            );
            state.storage = storage;
            const fileCount = await storage.methods.fileCount().call();
            state.fileCount = fileCount;
            const files = [];
            for (var i = fileCount; i >= 1; i--) {
                const file = await storage.methods.files(i).call();
                files.push(file);
            }
            state.files = [...files];
        } else {
            alert(
                "Condor Storage contract not deployed to the current network."
            );
        }
    }

    function onDescriptionChange(event){
        state.file.description = event.target.value;
    }

    function handleFileChange(event) {
        const file = event.target.files[0];
        const reader = new window.FileReader();

        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
            state.file.buffer = new Uint8Array(reader.result as ArrayBuffer);
            state.file.type = file.type;
            state.file.name = file.name;
        };
    }

    function uploadFile() {
        state.loading = true;
        ipfs.add(state.file.buffer)
            .then((result) => {
                state.fileId = result.path;
                try{
                    state.storage.methods
                    .uploadFile(result.path, result.size, state.file.type, state.file.name, state.file.description)
                    .send({from: state.account})
                    .on('transactionHash', ((hash) => {
                        state.loading = false;
                        state.transactionHash = hash;
                        setTimeout(()=> {
                            state.file.buffer = undefined;
                            state.file.description = "";
                            state.file.name = "";
                            state.file.type = undefined;
                            state.fileError = undefined;
                            state.fileId = undefined;
                            state.transactionHash = undefined;
                            loadBlockchainData();
                        }, 3000)
                    }))
                }catch(error){
                    state.loading = false;
                    state.fileError = error;
                }
            })
            .catch((error) => {
                state.loading = false;
                state.fileError = error;
            });
    }

    init();
</script>

<div class="flex w-full items-center mt-20 flex-col gap-10">
    <span class="text-white text-2xl">Upload here your file</span>
    <input type="text" placeholder="Type here" value={state.file.description} class="input w-full max-w-xs" on:change={onDescriptionChange} />
    <input
        type="file"
        class="file-input w-full max-w-xs"
        value={""}
        on:change={handleFileChange}
    />
    <button
        class="btn bg-teal-600 btn-wide"
        on:click={uploadFile}
        disabled={state.loading || state.file.buffer==undefined || state.file.description==""}
    >
        <div class="flex items-center h-full gap-5">
            {#if state.loading}
                <Loader />
            {:else}
                <span>Submit file</span>
            {/if}
        </div>
    </button>
    {#if state.fileId && state.transactionHash}
        <span
            >File uploaded successfully: <a
                href="https://condor.infura-ipfs.io/ipfs/{state.fileId}"
                target="_blank"
                rel="noreferrer">{state.fileId}</a
            ></span
        >
        <span>Contract successfully created: {state.transactionHash}</span>
    {/if}
    {#if state.fileError}
        <span>File upload failed: {state.fileError}</span>
    {/if}

    {#if state.files.length>=0}
        <FilesList files={state.files} />
    {/if}
</div>
