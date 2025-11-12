import { Schema, model, Document } from 'mongoose';

const SocketSchema = new Schema({
    createTime: { type: Date, default: Date.now },

    id: {
        type: String,
        unique: true,
        index: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    ip: String,
    os: {
        type: String,
        default: '',
    },
    browser: {
        type: String,
        default: '',
    },
    environment: {
        type: String,
        default: '',
    },
});

export interface SocketDocument extends Document {
    /** Socket connection ID */
    id: string;
    /** Associated user ID */
    user: any;
    /** IP address */
    ip: string;
    /** System */
    os: string;
    /** Browser */
    browser: string;
    /** Detailed environment information */
    environment: string;
    /** Create time */
    createTime: Date;
}

/**
 * Socket Model
 * Client socket connection information
 */
const Socket = model<SocketDocument>('Socket', SocketSchema);

export default Socket;
