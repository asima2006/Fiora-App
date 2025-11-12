export interface ReadFileResult {
    /** File name */
    filename: string;
    /** File extension */
    ext: string;
    /** File type */
    type: string;
    /** File content */
    result: Blob | ArrayBuffer | string;
    /** File length */
    length: number;
}

/**
 * Read local file
 * @param {string} resultType Data type, {blob|base64}, default blob
 * @param {string} accept Optional file type, default * / *
 */
export default async function readDiskFIle(
    resultType = 'blob',
    accept = '*/*',
) {
    const result: ReadFileResult | null = await new Promise((resolve) => {
        const $input = document.createElement('input');
        $input.style.display = 'none';
        $input.setAttribute('type', 'file');
        $input.setAttribute('accept', accept);
        
        let isResolved = false;
        
        // Determine whether the user clicked cancel, the native does not provide a dedicated event, use hack method to implement
        $input.onclick = () => {
            // @ts-ignore
            $input.value = null;
            document.body.onfocus = () => {
                // The onfocus event will trigger before the $input.onchange event, so a delay is needed
                setTimeout(() => {
                    // Only resolve as cancelled if not already resolved by file selection
                    if (!isResolved && $input.value.length === 0) {
                        isResolved = true;
                        resolve(null);
                    }
                    document.body.onfocus = null;
                }, 500);
            };
        };
        
        $input.onchange = (e: Event) => {
            // Mark as resolved to prevent cancel detection from interfering
            isResolved = true;
            // Clean up focus handler since we have a file
            document.body.onfocus = null;
            
            // @ts-ignore
            const file = e.target.files[0];
            if (!file) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = function handleLoad() {
                if (!this.result) {
                    resolve(null);
                    return;
                }
                
                const fileResult = {
                    filename: file.name,
                    ext: file.name
                        .split('.')
                        .pop()
                        .toLowerCase(),
                    type: file.type,
                    // @ts-ignore
                    result: this.result,
                    length:
                        resultType === 'blob'
                            ? (this.result as ArrayBuffer).byteLength
                            : (this.result as string).length,
                };
                
                // @ts-ignore
                resolve(fileResult);
            };

            switch (resultType) {
                case 'blob': {
                    reader.readAsArrayBuffer(file);
                    break;
                }
                case 'base64': {
                    reader.readAsDataURL(file);
                    break;
                }
                default: {
                    reader.readAsArrayBuffer(file);
                }
            }
        };
        $input.click();
    });

    if (result && resultType === 'blob') {
        const blob = new Blob(
            [new Uint8Array(result.result as ArrayBuffer)],
            {
                type: result.type,
            },
        );
        result.result = blob;
    }
    
    return result;
}
