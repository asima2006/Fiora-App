/**
 * Utility functions for file downloads and exports
 */

/**
 * Download data as a file
 * @param data File content
 * @param filename Name of the file
 * @param mimeType MIME type of the file
 */
export function downloadFile(
    data: string | Blob,
    filename: string,
    mimeType: string,
): void {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from MIME type
 * @param mimeType MIME type
 * @returns File extension
 */
export function getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
        'application/json': 'json',
        'text/plain': 'txt',
        'text/html': 'html',
        'text/csv': 'csv',
        'application/pdf': 'pdf',
        'application/zip': 'zip',
    };

    return mimeMap[mimeType] || 'bin';
}

/**
 * Format date for export filename
 * @param date Date object
 * @returns Formatted date string (YYYY-MM-DD_HH-MM-SS)
 */
export function formatDateForFilename(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Sanitize filename by removing invalid characters
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    // Remove invalid characters for filenames (including control characters)
    // eslint-disable-next-line no-control-regex
    const invalidRegex = new RegExp('[<>:"/\\\\|?*\\x00-\\x1F]', 'g');
    return filename.replace(invalidRegex, '_').trim();
}

/**
 * Generate export filename
 * @param type Export type (e.g., 'chat', 'messages')
 * @param name Name of the conversation/entity
 * @param format File format
 * @returns Generated filename
 */
export function generateExportFilename(
    type: string,
    name: string,
    format: string,
): string {
    const timestamp = formatDateForFilename();
    const sanitizedName = sanitizeFilename(name);
    return `${type}_${sanitizedName}_${timestamp}.${format}`;
}

/**
 * Read file as text
 * @param file File object
 * @returns Promise resolving to file content as string
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Read file as data URL
 * @param file File object
 * @returns Promise resolving to data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns Promise resolving when copy is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
    } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

/**
 * Share file using Web Share API (if available)
 * @param data File content
 * @param filename Filename
 * @param mimeType MIME type
 * @returns Promise resolving when share is complete
 */
export async function shareFile(
    data: string | Blob,
    filename: string,
    mimeType: string,
): Promise<boolean> {
    if (!navigator.share) {
        return false;
    }

    try {
        const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
        const file = new File([blob], filename, { type: mimeType });

        await navigator.share({
            files: [file],
            title: filename,
        });

        return true;
    } catch (error) {
        console.error('Share failed:', error);
        return false;
    }
}

/**
 * Estimate export size based on message count
 * @param messageCount Number of messages
 * @param format Export format
 * @returns Estimated size in bytes
 */
export function estimateExportSize(
    messageCount: number,
    format: 'json' | 'txt' | 'html',
): number {
    // Rough estimates based on average message size
    const avgSizePerMessage: Record<string, number> = {
        json: 500,  // JSON with metadata
        txt: 200,   // Plain text
        html: 400,  // HTML with styling
    };

    return messageCount * avgSizePerMessage[format];
}

/**
 * Check if export size is reasonable
 * @param messageCount Number of messages
 * @param format Export format
 * @param maxSizeMB Maximum size in MB
 * @returns True if size is within limit
 */
export function isExportSizeReasonable(
    messageCount: number,
    format: 'json' | 'txt' | 'html',
    maxSizeMB: number = 50,
): boolean {
    const estimatedSize = estimateExportSize(messageCount, format);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return estimatedSize <= maxSizeBytes;
}

/**
 * Compress string using native compression (if available)
 * @param text Text to compress
 * @returns Compressed blob or original text
 */
export async function compressText(text: string): Promise<Blob | string> {
    if (!('CompressionStream' in window)) {
        return text;
    }

    try {
        const blob = new Blob([text]);
        const stream = blob.stream();
        const Compression = (window as any).CompressionStream;
        const compressedStream = stream.pipeThrough(
            new Compression('gzip'),
        );
        return await new Response(compressedStream).blob();
    } catch (error) {
        console.error('Compression failed:', error);
        return text;
    }
}

/**
 * Create a downloadable link element
 * @param data File content
 * @param filename Filename
 * @param mimeType MIME type
 * @returns Anchor element with download link
 */
export function createDownloadLink(
    data: string | Blob,
    filename: string,
    mimeType: string,
): HTMLAnchorElement {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.textContent = `Download ${filename}`;

    return a;
}

export default {
    downloadFile,
    formatFileSize,
    getExtensionFromMimeType,
    formatDateForFilename,
    sanitizeFilename,
    generateExportFilename,
    readFileAsText,
    readFileAsDataURL,
    copyToClipboard,
    shareFile,
    estimateExportSize,
    isExportSizeReasonable,
    compressText,
    createDownloadLink,
};
