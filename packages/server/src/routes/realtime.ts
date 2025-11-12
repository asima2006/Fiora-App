import assert from 'assert';
import { Types } from '@fiora/database/mongoose';
import Group from '@fiora/database/mongoose/models/group';
import User from '@fiora/database/mongoose/models/user';
import Message from '@fiora/database/mongoose/models/message';
import Socket from '@fiora/database/mongoose/models/socket';

const { isValid } = Types.ObjectId;

interface TypingData {
    to: string;
    isTyping: boolean;
}

interface ReadReceiptData {
    messageId: string;
    linkmanId: string;
}

/**
 * Send typing indicator
 * @param ctx Context
 */
export async function sendTypingIndicator(ctx: Context<TypingData>) {
    const { to, isTyping } = ctx.data;
    assert(to, 'Recipient cannot be empty');

    const user = ctx.socket.user.toString();
    
    // Get current user's information to include username
    const currentUser = await User.findOne({ _id: user });
    assert(currentUser, 'User does not exist');
    
    let targetSockets: string[] = [];
    
    if (isValid(to)) {
        // Group message - broadcast to all group members
        const group = await Group.findOne({ _id: to });
        assert(group, 'Group does not exist');
        
        // Get all sockets of group members
        const sockets = await Socket.find({ user: { $in: group.members } });
        targetSockets = sockets
            .filter((s) => s.user.toString() !== user)
            .map((s) => s.id);
    } else {
        // Private message - send to specific user
        const userId = to.replace(user, '');
        assert(isValid(userId), 'Invalid user ID');
        
        const targetUser = await User.findOne({ _id: userId });
        assert(targetUser, 'User does not exist');
        
        const sockets = await Socket.find({ user: userId });
        targetSockets = sockets.map((s) => s.id);
    }

    // Broadcast typing indicator to target sockets with username
    ctx.socket.emit(targetSockets, 'typing', {
        userId: user,
        username: currentUser.username,
        linkmanId: to,
        isTyping,
    });

    return {
        success: true,
    };
}

/**
 * Send read receipt
 * @param ctx Context
 */
export async function sendReadReceipt(ctx: Context<ReadReceiptData>) {
    const { messageId, linkmanId } = ctx.data;
    assert(isValid(messageId), 'Invalid message ID');
    assert(linkmanId, 'Linkman ID cannot be empty');

    const message = await Message.findOne({ _id: messageId });
    assert(message, 'Message does not exist');

    const user = ctx.socket.user.toString();
    
    // Add user to message read receipts
    if (!message.readBy) {
        message.readBy = [];
    }
    
    if (!message.readBy.includes(user)) {
        message.readBy.push(user);
        await message.save();
    }

    // Get message sender's sockets
    const senderSockets = await Socket.find({ user: message.from });
    const socketIds = senderSockets.map((s) => s.id);

    // Send read receipt to message sender
    ctx.socket.emit(socketIds, 'readReceipt', {
        messageId,
        linkmanId,
        userId: user,
        timestamp: new Date(),
    });

    return {
        success: true,
    };
}

/**
 * Send delivery receipt
 * @param ctx Context
 */
export async function sendDeliveryReceipt(ctx: Context<ReadReceiptData>) {
    const { messageId, linkmanId } = ctx.data;
    assert(isValid(messageId), 'Invalid message ID');
    assert(linkmanId, 'Linkman ID cannot be empty');

    const message = await Message.findOne({ _id: messageId });
    assert(message, 'Message does not exist');

    const user = ctx.socket.user.toString();
    
    // Add user to message delivery receipts
    if (!message.deliveredTo) {
        message.deliveredTo = [];
    }
    
    if (!message.deliveredTo.includes(user)) {
        message.deliveredTo.push(user);
        await message.save();
    }

    // Get message sender's sockets
    const senderSockets = await Socket.find({ user: message.from });
    const socketIds = senderSockets.map((s) => s.id);

    // Send delivery receipt to message sender
    ctx.socket.emit(socketIds, 'deliveryReceipt', {
        messageId,
        linkmanId,
        userId: user,
        timestamp: new Date(),
    });

    return {
        success: true,
    };
}

/**
 * Get message read status
 * @param ctx Context
 */
export async function getMessageReadStatus(
    ctx: Context<{ messageId: string }>,
) {
    const { messageId } = ctx.data;
    assert(isValid(messageId), 'Invalid message ID');

    const message = await Message.findOne({ _id: messageId }).populate(
        'readBy deliveredTo',
        'username avatar',
    );
    assert(message, 'Message does not exist');

    return {
        messageId,
        readBy: message.readBy || [],
        deliveredTo: message.deliveredTo || [],
    };
}
