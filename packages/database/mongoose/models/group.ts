import { Schema, model, Document } from 'mongoose';
import { GROUP_NAME_REGEXP } from '@fiora/utils/const';

const GroupSchema = new Schema({
    createTime: { type: Date, default: Date.now },

    name: {
        type: String,
        trim: true,
        unique: true,
        match: GROUP_NAME_REGEXP,
        index: true,
    },
    avatar: String,
    announcement: {
        type: String,
        default: '',
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    // Reference to community (if this group belongs to a community)
    communityId: {
        type: Schema.Types.ObjectId,
        ref: 'Community',
        default: null,
    },
    // Enhanced group management with roles
    memberRoles: [
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
});

export interface GroupMemberRole {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
}

export interface GroupDocument extends Document {
    /** Group name */
    name: string;
    /** Avatar */
    avatar: string;
    /** Announcement */
    announcement: string;
    /** Creator */
    creator: string;
    /** Is default group */
    isDefault: boolean;
    /** Members (legacy - for backward compatibility) */
    members: string[];
    /** Community ID (if this group belongs to a community) */
    communityId?: string;
    /** Member roles (enhanced) */
    memberRoles?: GroupMemberRole[];
    /** Creation timestamp */
    createTime: Date;
}

/**
 * Group Model
 * Group information
 */
const Group = model<GroupDocument>('Group', GroupSchema);

export default Group;
