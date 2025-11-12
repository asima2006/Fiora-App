import assert from 'assert';
import { Types } from '@fiora/database/mongoose';
import Channel from '@fiora/database/mongoose/models/channel';
import Message from '@fiora/database/mongoose/models/message';
import getRandomAvatar from '@fiora/utils/getRandomAvatar';

const { isValid } = Types.ObjectId;

/**
 * Create channel
 * @param ctx Context
 */
export async function createChannel(
    ctx: Context<{ name: string; description?: string }>,
) {
    const { name, description = '' } = ctx.data;
    assert(name, 'Channel name cannot be empty');

    const channel = await Channel.findOne({ name });
    assert(!channel, 'This channel already exists');

    let newChannel = null;
    try {
        newChannel = await Channel.create({
            name,
            description,
            avatar: getRandomAvatar(),
            creator: ctx.socket.user,
            subscribers: [ctx.socket.user],
        });
    } catch (err) {
        if ((err as Error).name === 'ValidationError') {
            return 'Channel name contains unsupported characters or incorrect format';
        }
        throw err;
    }

    // Creator automatically joins channel room
    ctx.socket.join(newChannel._id.toString());

    return {
        _id: newChannel._id,
        name: newChannel.name,
        avatar: newChannel.avatar,
        description: newChannel.description,
        creator: newChannel.creator,
        createTime: newChannel.createTime,
    };
}

/**
 * Subscribe to channel
 * @param ctx Context
 */
export async function subscribeChannel(
    ctx: Context<{ channelId: string }>,
) {
    const { channelId } = ctx.data;
    assert(isValid(channelId), 'Invalid channel ID');

    const channel = await Channel.findOne({ _id: channelId });
    assert(channel, 'Channel does not exist');

    const isSubscribed = channel.subscribers.find(
        (subscriberId) =>
            subscriberId.toString() === ctx.socket.user.toString(),
    );
    assert(!isSubscribed, 'You are already subscribed to this channel');

    channel.subscribers.push(ctx.socket.user);
    await channel.save();

    // Join Socket.IO room to receive broadcasts
    ctx.socket.join(channelId);

    return {
        _id: channel._id,
        name: channel.name,
        avatar: channel.avatar,
        description: channel.description,
        creator: channel.creator,
        subscribers: channel.subscribers,
        createTime: channel.createTime,
    };
}

/**
 * Unsubscribe from channel
 * @param ctx Context
 */
export async function unsubscribeChannel(
    ctx: Context<{ channelId: string }>,
) {
    const { channelId } = ctx.data;
    assert(isValid(channelId), 'Invalid channel ID');

    const channel = await Channel.findOne({ _id: channelId });
    assert(channel, 'Channel does not exist');

    const index = channel.subscribers.findIndex(
        (subscriberId) =>
            subscriberId.toString() === ctx.socket.user.toString(),
    );
    assert(index !== -1, 'You are not subscribed to this channel');

    channel.subscribers.splice(index, 1);
    await channel.save();

    // Leave Socket.IO room
    ctx.socket.leave(channelId);

    return {
        message: 'Unsubscribed successfully',
    };
}

/**
 * Publish channel announcement (Creator only)
 * @param ctx Context
 */
export async function publishAnnouncement(
    ctx: Context<{ channelId: string; content: string }>,
) {
    const { channelId, content } = ctx.data;
    assert(isValid(channelId), 'Invalid channel ID');
    assert(content, 'Announcement content cannot be empty');
    assert(content.length <= 2048, 'Announcement content cannot exceed 2048 characters');

    const channel = await Channel.findOne({ _id: channelId });
    assert(channel, 'Channel does not exist');
    assert(
        channel.creator.toString() === ctx.socket.user.toString(),
        'Only channel creator can publish announcements',
    );

    // Save announcement message
    const message = await Message.create({
        from: ctx.socket.user,
        to: channelId,
        type: 'system',
        content: `[Channel Announcement] ${content}`,
    });

    const messageData = {
        _id: message._id,
        createTime: message.createTime,
        from: {
            _id: ctx.socket.user,
            username: 'Channel',
            avatar: channel.avatar,
        },
        to: channelId,
        type: 'system',
        content: `[Channel Announcement] ${content}`,
    };

    // Broadcast to all subscribers
    ctx.socket.emit(channelId, 'message', messageData);

    return messageData;
}

/**
 * Get channel information
 * @param ctx Context
 */
export async function getChannelInfo(ctx: Context<{ channelId: string }>) {
    const { channelId } = ctx.data;
    assert(isValid(channelId), 'Invalid channel ID');

    const channel = await Channel.findOne({ _id: channelId });
    assert(channel, 'Channel does not exist');

    return {
        _id: channel._id,
        name: channel.name,
        avatar: channel.avatar,
        description: channel.description,
        creator: channel.creator,
        subscribersCount: channel.subscribers.length,
        createTime: channel.createTime,
    };
}

/**
 * Get user's subscribed channels list
 * @param ctx Context
 */
export async function getSubscribedChannels(ctx: Context<{}>) {
    const channels = await Channel.find({
        subscribers: ctx.socket.user,
    }).sort({ createTime: -1 });

    // Join all subscribed channel rooms for real-time messages
    channels.forEach((channel) => {
        ctx.socket.join(channel._id.toString());
    });

    return channels.map((channel) => ({
        _id: channel._id,
        name: channel.name,
        avatar: channel.avatar,
        description: channel.description,
        creator: channel.creator,
        subscribers: channel.subscribers,
        subscribersCount: channel.subscribers.length,
        verified: channel.verified,
        createTime: channel.createTime,
    }));
}

/**
 * Get all channels for discovery
 * @param ctx Context
 */
export async function getAllChannels(ctx: Context<{}>) {
    const channels = await Channel.find({})
        .sort({ subscribers: -1, createTime: -1 })
        .limit(50);

    const userId = ctx.socket.user;

    return channels.map((channel) => ({
        _id: channel._id,
        name: channel.name,
        avatar: channel.avatar,
        description: channel.description,
        subscribersCount: channel.subscribers.length,
        verified: channel.verified,
        isSubscribed: channel.subscribers.some(
            (sub) => sub.toString() === userId.toString()
        ),
        createTime: channel.createTime,
    }));
}

/**
 * Search channels
 * @param ctx Context
 */
export async function searchChannels(ctx: Context<{ searchText: string }>) {
    const { searchText } = ctx.data;
    assert(searchText, 'Search text cannot be empty');

    const channels = await Channel.find({
        name: { $regex: searchText, $options: 'i' },
    })
        .limit(10)
        .sort({ createTime: -1 });

    return channels.map((channel) => ({
        _id: channel._id,
        name: channel.name,
        avatar: channel.avatar,
        description: channel.description,
        subscribersCount: channel.subscribers.length,
    }));
}

/**
 * Delete channel (Creator only)
 * @param ctx Context
 */
export async function deleteChannel(ctx: Context<{ channelId: string }>) {
    const { channelId } = ctx.data;
    assert(isValid(channelId), 'Invalid channel ID');

    const channel = await Channel.findOne({ _id: channelId });
    assert(channel, 'Channel does not exist');
    assert(
        channel.creator.toString() === ctx.socket.user.toString(),
        'Only channel creator can delete the channel',
    );

    await Channel.deleteOne({ _id: channelId });

    // Broadcast channel deletion message to all subscribers
    ctx.socket.emit(channelId, 'deleteChannel', { channelId });

    return {
        message: 'Channel deleted successfully',
    };
}
