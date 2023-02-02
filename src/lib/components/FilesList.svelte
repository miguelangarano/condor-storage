<script>
    import { format } from "date-fns";
    export let files;


    function openFile(url){
        window.open(url, "_blank");
    }
</script>

<div class="flex w-full items-center justify-center">
    <div class="overflow-x-auto">
        <table class="table w-full">
            <!-- head -->
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Uploader</th>
                    <th>Link</th>
                </tr>
            </thead>
            <tbody>
                {#each files as { fileDescription, fileHash, fileId, fileName, fileType, uploadTime, uploader }}
                    <tr>
                        <th>{fileId}</th>
                        <td>{fileName}</td>
                        <td>{fileDescription}</td>
                        <td>{fileType}</td>
                        <td
                            >{format(
                                new Date(uploadTime * 1000),
                                "MMM Do 'of' yyyy 'at' HH:mm"
                            )}</td
                        >
                        <td>{uploader}</td>
                        <td>
                            <button
                                class="btn bg-teal-600"
                                on:click={()=>openFile(`https://condor.infura-ipfs.io/ipfs/${fileHash}`)}
                            >
                                Open
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
