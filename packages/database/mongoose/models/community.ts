import { Schema, model, Document } from 'mongoose';
import { COMMUNITY_NAME_REGEXP } from '@fiora/utils/const';

const CommunitySchema = new Schema({
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
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    announcementGroupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
    },
    members: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            role: {
                type: String,
                enum: ['owner', 'admin', 'member'],
                default: 'member',
            },
            joinedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    groups: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Group',
        },
    ],
    channels: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Channel',
        },
    ],
});

// Add validation for maximum groups
CommunitySchema.path('groups').validate((value: any[]) => value.length <= 10, 'A community can have a maximum of 10 groups');

export interface CommunityMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
}

export interface CommunityDocument extends Document {
    /** Community name */
    name: string;
    /** Avatar */
    avatar: string;
    /** Description */
    description: string;
    /** Owner ID */
    ownerId: string;
    /** Announcement group ID */
    announcementGroupId: string;
    /** Members list */
    members: CommunityMember[];
    /** Associated groups (max 10) */
    groups: string[];
    /** Associated channels */
    channels: string[];
    /** Create time */
    createTime: Date;
}

/**
 * Community Model
 * Community information - for organizing groups and channels
 */
const Community = model<CommunityDocument>('Community', CommunitySchema);

export default Community;
