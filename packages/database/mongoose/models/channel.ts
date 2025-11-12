import { Schema, model, Document } from 'mongoose';
import { COMMUNITY_NAME_REGEXP } from '@fiora/utils/const';

const ChannelSchema = new Schema({
    createTime: { type: Date, default: Date.now },

    name: {
        type: String,
        trim: true,
        unique: true,
        match: COMMUNITY_NAME_REGEXP,
        index: true,
    },
    avatar: String,
    description: {
        type: String,
        default: '',
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    subscribers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'Community',
        default: null,
    },
    verified: {
        type: Boolean,
        default: false,
    },
});

export interface ChannelDocument extends Document {
    /** Channel name */
    name: string;
    /** Avatar */
    avatar: string;
    /** Description */
    description: string;
    /** Creator */
    creator: string;
    /** Subscribers list */
    subscribers: string[];
    /** 所属社区ID */
    communityId: string | null;
    /** Verified badge */
    verified: boolean;
    /** Create time */
    createTime: Date;
}

/**
 * Channel Model
 * Channel information - 用于广播公告
 */
const Channel = model<ChannelDocument>('Channel', ChannelSchema);

export default Channel;
