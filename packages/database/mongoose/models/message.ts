import { Schema, model, Document } from 'mongoose';
import Group from './group';
import User from './user';

const MessageSchema = new Schema({
    createTime: { type: Date, default: Date.now, index: true },

    from: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    to: {
        type: String,
        index: true,
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'code', 'inviteV2', 'system'],
        default: 'text',
    },
    content: {
        type: String,
        default: '',
    },
    deleted: {
        type: Boolean,
        default: false,
    },
    // Real-time enhancements
    deliveredTo: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    readBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
});

export interface MessageDocument extends Document {
    /** Sender */
    from: string;
    /** Recipient - group _id for groups, concatenated user _ids for private chats */
    to: string;
    /** Message type: text, image, file, code, inviteV2, system */
    type: string;
    /** Content - may be stored as JSON for certain message types */
    content: string;
    /** Creation timestamp */
    createTime: Date;
    /** Has it been deleted */
    deleted: boolean;
    /** Users who received the message (delivery receipts) */
    deliveredTo?: string[];
    /** Users who read the message (read receipts) */
    readBy?: string[];
}

/**
 * Message Model
 * Chat message
 */
const Message = model<MessageDocument>('Message', MessageSchema);

export default Message;

interface SendMessageData {
    to: string;
    type: string;
    content: string;
}

export async function handleInviteV2Message(message: SendMessageData) {
    if (message.type === 'inviteV2') {
        const inviteInfo = JSON.parse(message.content);
        if (inviteInfo.inviter && inviteInfo.group) {
            const [user, group] = await Promise.all([
                User.findOne({ _id: inviteInfo.inviter }),
                Group.findOne({ _id: inviteInfo.group }),
            ]);
            if (user && group) {
                message.content = JSON.stringify({
                    inviter: inviteInfo.inviter,
                    inviterName: user?.username,
                    group: inviteInfo.group,
                    groupName: group.name,
                });
            }
        }
    }
}

export async function handleInviteV2Messages(messages: SendMessageData[]) {
    return Promise.all(
        messages.map(async (message) => {
            if (message.type === 'inviteV2') {
                await handleInviteV2Message(message);
            }
        }),
    );
}
