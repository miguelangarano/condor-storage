<script lang="ts">
    import Web3 from "web3";
    import Storage from "./abis/Storage.json";
    import { create } from "ipfs-http-client";
    import Loader from "./lib/components/Loader.svelte";
    import { toSvg } from "jdenticon";
    import FilesList from "./lib/components/FilesList.svelte";
    import CondorBase from "./assets/condor-base.svg";
    import SignClient from "@walletconnect/sign-client";
    import { Web3Modal } from "@web3modal/standalone";

    const projectId = import.meta.env.VITE_INFURA_PROJECT_ID_IPFS;
    const projectSecret = import.meta.env.VITE_INFURA_API_KEY_IPFS;
    const authorization =
        "Basic " + window.btoa(projectId + ":" + projectSecret);

    const ipfs = create({
        url: `${import.meta.env.VITE_INFURA_IPFS_URL}/api/v0`,
        headers: {
            authorization,
        },
    });

    const state = {
        loading: false,
        account: undefined,
        accountSvg: undefined,
        storage: undefined,
        fileCount: 0,
        files: [],
        file: {
            buffer: undefined,
            type: undefined,
            name: "",
            description: "",
        },
        fileId: undefined,
        fileError: undefined,
        transactionHash: undefined,
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
            startWalletConnectProcess();
        }
    }

    async function startWalletConnectProcess() {
        const web3Modal = new Web3Modal({
            projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
            standaloneChains: ["eip155:5"],
        });
        const signClient = await SignClient.init({
            projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
        });
        const { uri, approval } = await signClient.connect({
            requiredNamespaces: {
                eip155: {
                    methods: ["eth_sign"],
                    chains: ["eip155:5"],
                    events: ["accountsChanged"],
                },
            },
        });

        if (uri) {
            console.log("URI::", uri)
            web3Modal.openModal({ uri, standaloneChains: ["eip155:5"] });
            console.log("WAITING APPROVAL::")
            await approval();
            console.log("APPROVED::")
            web3Modal.closeModal();
        }
    }

    async function loadBlockchainData() {
        const web3 = window["web3"];
        const accounts = await web3.eth.getAccounts();
        state.account = accounts[0];
        state.accountSvg = toSvg(state.account, 50);

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

    function onDescriptionChange(event) {
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

    function cleanData() {
        setTimeout(() => {
            state.fileError = undefined;
            state.fileId = undefined;
            state.transactionHash = undefined;
            loadBlockchainData();
        }, 3000);
    }

    function uploadFile() {
        state.loading = true;
        ipfs.add(state.file.buffer)
            .then((result) => {
                state.fileId = result.path;
                state.storage.methods
                    .uploadFile(
                        result.path,
                        result.size,
                        state.file.type,
                        state.file.name,
                        state.file.description
                    )
                    .send({ from: state.account })
                    .on("transactionHash", (hash) => {
                        state.loading = false;
                        state.transactionHash = hash;
                        cleanData();
                    })
                    .on("error", function (error) {
                        state.fileError = error.message;
                        state.loading = false;
                        cleanData();
                    });
            })
            .catch((error) => {
                state.loading = false;
                state.fileError = error;
            });
    }
</script>

<div class="flex w-full items-center mt-20 flex-col gap-10 relative">
    <div
        class="appbar flex fixed top-0 right-0 p-2 w-full justify-between drop-shadow-lg"
    >
        <div>
            <img src={CondorBase} alt="" height="60px" width="60px" />
        </div>
        <div>
            {#if state.accountSvg}
                <div class="flex gap-5 items-center">
                    {`...${state.account.slice(-10)}`}{@html state.accountSvg}
                </div>
            {:else}
                <button class="btn bg-teal-600" on:click={init}>
                    Connect
                </button>
            {/if}
        </div>
    </div>

    <span class="text-white text-2xl">Upload here your file</span>
    <input
        type="text"
        placeholder="Type the file description"
        value={state.file.description}
        class="input w-full max-w-xs"
        on:change={onDescriptionChange}
    />
    <input
        type="file"
        class="file-input w-full max-w-xs"
        value={""}
        on:change={handleFileChange}
    />
    <button
        class="btn bg-teal-600 btn-wide"
        on:click={uploadFile}
        disabled={state.loading ||
            state.file.buffer == undefined ||
            state.file.description == "" ||
            state.account == undefined}
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
                href={`${import.meta.env.VITE_CONDOR_INFURA_IPFS_URL}/ipfs/${
                    state.fileId
                }`}
                target="_blank"
                rel="noreferrer">{state.fileId}</a
            ></span
        >
        <span>Contract successfully created: {state.transactionHash}</span>
    {/if}
    {#if state.fileError}
        <span>File upload failed: {state.fileError}</span>
    {/if}

    {#if state.files.length >= 0}
        <FilesList files={state.files} />
    {/if}
</div>
