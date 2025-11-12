import { Schema, model, Document } from 'mongoose';

const FileSchema = new Schema({
    createTime: { type: Date, default: Date.now, index: true },

    filename: {
        type: String,
        required: true,
    },
    originalName: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    uploadedTo: {
        type: String,
        required: true,
        index: true,
    },
    uploadedToType: {
        type: String,
        enum: ['group', 'user', 'channel', 'community'],
        required: true,
    },
    thumbnail: {
        type: String,
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        format: String,
    },
    downloadCount: {
        type: Number,
        default: 0,
    },
    deleted: {
        type: Boolean,
        default: false,
    },
});

export interface FileDocument extends Document {
    /** Original filename */
    filename: string;
    /** User-provided original name */
    originalName: string;
    /** MIME type */
    mimeType: string;
    /** File size in bytes */
    size: number;
    /** File URL */
    url: string;
    /** User who uploaded the file */
    uploadedBy: string;
    /** Target (group/user/channel/community ID) */
    uploadedTo: string;
    /** Target type */
    uploadedToType: 'group' | 'user' | 'channel' | 'community';
    /** Thumbnail URL for images/videos */
    thumbnail?: string;
    /** Additional metadata */
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
        format?: string;
    };
    /** Download count */
    downloadCount: number;
    /** Creation timestamp */
    createTime: Date;
    /** Is deleted */
    deleted: boolean;
}

/**
 * File Model
 * File metadata and information
 */
const File = model<FileDocument>('File', FileSchema);

export default File;
