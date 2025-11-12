import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import Message from './Message';
import Style from './FileUpload.less';

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
    accept?: string;
    maxSize?: number; // in bytes
    disabled?: boolean;
}

interface UploadProgress {
    filename: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
}

function FileUpload({
    onUpload,
    accept = '*',
    maxSize = 100 * 1024 * 1024, // 100MB default
    disabled = false,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<Map<string, UploadProgress>>(
        new Map(),
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (file.size > maxSize) {
            return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(
                0,
            )}MB limit`;
        }

        if (accept !== '*') {
            const acceptedTypes = accept.split(',').map((t) => t.trim());
            const fileExtension = `.${file.name.split('.').pop()}`;
            const mimeType = file.type;

            const isAccepted = acceptedTypes.some(
                (type) =>
                    type === fileExtension ||
                    type === mimeType ||
                    (type.endsWith('/*') &&
                        mimeType.startsWith(type.replace('/*', ''))),
            );

            if (!isAccepted) {
                return `File type not accepted. Allowed: ${accept}`;
            }
        }

        return null;
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        // Use Promise.all over an array of async tasks to avoid for/continue/await-in-loop
        const uploadTasks = fileArray.map(async (file) => {
            const error = validateFile(file);
            if (error) {
                Message.error(error);
                return;
            }

            const uploadId = `${file.name}-${Date.now()}-${Math.random()}`;
            setUploads((prev) =>
                new Map(prev).set(uploadId, {
                    filename: file.name,
                    progress: 0,
                    status: 'uploading',
                }),
            );

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setUploads((prev) => {
                    const newMap = new Map(prev);
                    const upload = newMap.get(uploadId);
                    if (upload && upload.progress < 90) {
                        newMap.set(uploadId, {
                            ...upload,
                            progress: Math.min(upload.progress + 10, 90),
                        });
                    }
                    return newMap;
                });
            }, 200);

            try {
                await onUpload(file);

                clearInterval(progressInterval);

                setUploads((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(uploadId, {
                        filename: file.name,
                        progress: 100,
                        status: 'success',
                    });
                    return newMap;
                });

                // Remove success notification after 3 seconds
                setTimeout(() => {
                    setUploads((prev) => {
                        const newMap = new Map(prev);
                        newMap.delete(uploadId);
                        return newMap;
                    });
                }, 3000);
            } catch (err) {
                clearInterval(progressInterval);

                setUploads((prev) => {
                    const newMap = new Map(prev);
                    newMap.set(uploadId, {
                        filename: file.name,
                        progress: 0,
                        status: 'error',
                        error: (err as Error).message,
                    });
                    return newMap;
                });

                Message.error(`Failed to upload ${file.name}`);
            }
        });

        await Promise.all(uploadTasks);
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const { files } = e.dataTransfer;
        await handleFiles(files);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        await handleFiles(e.target.files);
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <>
            <div
                className={`${Style.fileUpload} ${
                    isDragging ? Style.dragging : ''
                } ${disabled ? Style.disabled : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                role="button"
                tabIndex={0}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    multiple
                    style={{ display: 'none' }}
                    disabled={disabled}
                />
                <div className={Style.icon}>
                    <i className="iconfont icon-file" />
                </div>
                <p className={Style.text}>
                    {isDragging
                        ? 'Drop files here'
                        : 'Click or drag files here to upload'}
                </p>
                <p className={Style.hint}>
                    Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
                </p>
            </div>

            {uploads.size > 0 && (
                <div className={Style.uploadProgress}>
                    {Array.from(uploads.entries()).map(([id, upload]) => (
                        <div key={id} className={Style.uploadItem}>
                            <div className={Style.uploadInfo}>
                                <span className={Style.filename}>
                                    {upload.filename}
                                </span>
                                <span
                                    className={`${Style.status} ${
                                        Style[upload.status]
                                    }`}
                                >
                                    {upload.status === 'uploading' &&
                                        `${upload.progress}%`}
                                    {upload.status === 'success' && '✓'}
                                    {upload.status === 'error' && '✗'}
                                </span>
                            </div>
                            {upload.status === 'uploading' && (
                                <div className={Style.progressBar}>
                                    <div
                                        className={Style.progressFill}
                                        style={{ width: `${upload.progress}%` }}
                                    />
                                </div>
                            )}
                            {upload.error && (
                                <p className={Style.error}>{upload.error}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default FileUpload;
