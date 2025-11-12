import Channel from '../../../database/mongoose/models/channel';
import Message from '../../../database/mongoose/models/message';
import * as channelRoutes from '../../src/routes/channel';
import getRandomAvatar from '@fiora/utils/getRandomAvatar';

jest.mock('../../../database/mongoose/models/channel');
jest.mock('../../../database/mongoose/models/message');
jest.mock('@fiora/utils/getRandomAvatar');

const mockContext = (data: any, userId = 'user123') => ({
    data,
    socket: {
        id: 'socket123',
        ip: '127.0.0.1',
        user: userId,
        isAdmin: false,
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
    },
});

describe('server/routes/channel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createChannel', () => {
        it('should create a new channel successfully', async () => {
            const mockChannel = {
                _id: 'channel123',
                name: 'Announcements',
                avatar: 'avatar.png',
                description: 'Official announcements',
                creator: 'user123',
                subscribers: ['user123'],
                createTime: new Date(),
                save: jest.fn(),
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(null);
            (Channel.create as jest.Mock).mockResolvedValue(mockChannel);
            (getRandomAvatar as jest.Mock).mockReturnValue('avatar.png');

            const ctx = mockContext({
                name: 'Announcements',
                description: 'Official announcements',
            });

            const result = await channelRoutes.createChannel(ctx as any);

            expect(Channel.findOne).toHaveBeenCalledWith({
                name: 'Announcements',
            });
            expect(Channel.create).toHaveBeenCalled();
            expect(ctx.socket.join).toHaveBeenCalledWith('channel123');
            expect(result).toMatchObject({
                _id: 'channel123',
                name: 'Announcements',
                description: 'Official announcements',
            });
        });

        it('should fail if channel name is empty', async () => {
            const ctx = mockContext({ name: '', description: '' });

            await expect(
                channelRoutes.createChannel(ctx as any),
            ).rejects.toThrow('Channel name cannot be empty');
        });

        it('should fail if channel name already exists', async () => {
            (Channel.findOne as jest.Mock).mockResolvedValue({
                name: 'Announcements',
            });

            const ctx = mockContext({
                name: 'Announcements',
                description: 'Test',
            });

            await expect(
                channelRoutes.createChannel(ctx as any),
            ).rejects.toThrow('This channel already exists');
        });
    });

    describe('subscribeChannel', () => {
        it('should subscribe to a channel successfully', async () => {
            const mockChannel = {
                _id: 'channel123',
                name: 'Announcements',
                avatar: 'avatar.png',
                description: 'Test',
                subscribers: [],
                createTime: new Date(),
                save: jest.fn(),
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({ channelId: 'channel123' });

            const result = await channelRoutes.subscribeChannel(ctx as any);

            expect(mockChannel.subscribers).toContain('user123');
            expect(mockChannel.save).toHaveBeenCalled();
            expect(ctx.socket.join).toHaveBeenCalledWith('channel123');
            expect(result).toMatchObject({
                _id: 'channel123',
                name: 'Announcements',
            });
        });

        it('should fail if already subscribed', async () => {
            const mockChannel = {
                _id: 'channel123',
                subscribers: ['user123'],
                save: jest.fn(),
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({ channelId: 'channel123' });

            await expect(
                channelRoutes.subscribeChannel(ctx as any),
            ).rejects.toThrow('You are already subscribed to this channel');
        });

        it('should fail if channel does not exist', async () => {
            (Channel.findOne as jest.Mock).mockResolvedValue(null);

            const ctx = mockContext({ channelId: 'channel123' });

            await expect(
                channelRoutes.subscribeChannel(ctx as any),
            ).rejects.toThrow('Channel does not exist');
        });
    });

    describe('unsubscribeChannel', () => {
        it('should unsubscribe from a channel successfully', async () => {
            const mockChannel = {
                _id: 'channel123',
                subscribers: ['user123', 'user456'],
                save: jest.fn(),
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({ channelId: 'channel123' });

            const result = await channelRoutes.unsubscribeChannel(ctx as any);

            expect(mockChannel.subscribers).toEqual(['user456']);
            expect(mockChannel.save).toHaveBeenCalled();
            expect(ctx.socket.leave).toHaveBeenCalledWith('channel123');
            expect(result).toMatchObject({ message: 'Unsubscribed successfully' });
        });

        it('should fail if not subscribed', async () => {
            const mockChannel = {
                _id: 'channel123',
                subscribers: ['user456'],
                save: jest.fn(),
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({ channelId: 'channel123' });

            await expect(
                channelRoutes.unsubscribeChannel(ctx as any),
            ).rejects.toThrow('You are not subscribed to this channel');
        });
    });

    describe('publishAnnouncement', () => {
        it('should publish announcement successfully', async () => {
            const mockChannel = {
                _id: 'channel123',
                name: 'Announcements',
                avatar: 'avatar.png',
                creator: 'user123',
                subscribers: ['user123', 'user456'],
            };

            const mockMessage = {
                _id: 'message123',
                from: 'user123',
                to: 'channel123',
                type: 'system',
                content: '[Channel Announcement] Important update',
                createTime: new Date(),
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);
            (Message.create as jest.Mock).mockResolvedValue(mockMessage);

            const ctx = mockContext({
                channelId: 'channel123',
                content: 'Important update',
            });

            const result = await channelRoutes.publishAnnouncement(ctx as any);

            expect(Message.create).toHaveBeenCalledWith({
                from: 'user123',
                to: 'channel123',
                type: 'system',
                content: '[Channel Announcement] Important update',
            });
            expect(ctx.socket.emit).toHaveBeenCalledWith(
                'channel123',
                'message',
                expect.objectContaining({
                    _id: 'message123',
                    type: 'system',
                }),
            );
            expect(result).toMatchObject({
                _id: 'message123',
                type: 'system',
            });
        });

        it('should fail if not the creator', async () => {
            const mockChannel = {
                _id: 'channel123',
                creator: 'user456',
                subscribers: ['user123', 'user456'],
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({
                channelId: 'channel123',
                content: 'Update',
            });

            await expect(
                channelRoutes.publishAnnouncement(ctx as any),
            ).rejects.toThrow('只有频道创建者可以发Paper公告');
        });

        it('should fail if content is too long', async () => {
            const mockChannel = {
                _id: 'channel123',
                creator: 'user123',
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({
                channelId: 'channel123',
                content: 'x'.repeat(2049),
            });

            await expect(
                channelRoutes.publishAnnouncement(ctx as any),
            ).rejects.toThrow('Announcement content cannot exceed 2048 characters');
        });
    });

    describe('searchChannels', () => {
        it('should search channels successfully', async () => {
            const mockChannels = [
                {
                    _id: 'channel1',
                    name: 'Tech Announcements',
                    avatar: 'avatar1.png',
                    description: 'Tech news',
                    subscribers: ['user1', 'user2'],
                },
                {
                    _id: 'channel2',
                    name: 'General Announcements',
                    avatar: 'avatar2.png',
                    description: 'General news',
                    subscribers: ['user3'],
                },
            ];

            const mockQuery = {
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockChannels),
            };

            (Channel.find as jest.Mock).mockReturnValue(mockQuery);

            const ctx = mockContext({ searchText: 'Announcements' });

            const result = await channelRoutes.searchChannels(ctx as any);

            expect(Channel.find).toHaveBeenCalledWith({
                name: { $regex: 'Announcements', $options: 'i' },
            });
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                _id: 'channel1',
                name: 'Tech Announcements',
                subscribersCount: 2,
            });
        });

        it('should fail if search text is empty', async () => {
            const ctx = mockContext({ searchText: '' });

            await expect(
                channelRoutes.searchChannels(ctx as any),
            ).rejects.toThrow('Search text cannot be empty');
        });
    });

    describe('deleteChannel', () => {
        it('should delete channel successfully', async () => {
            const mockChannel = {
                _id: 'channel123',
                creator: 'user123',
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);
            (Channel.deleteOne as jest.Mock).mockResolvedValue({ ok: 1 });

            const ctx = mockContext({ channelId: 'channel123' });

            const result = await channelRoutes.deleteChannel(ctx as any);

            expect(Channel.deleteOne).toHaveBeenCalledWith({
                _id: 'channel123',
            });
            expect(ctx.socket.emit).toHaveBeenCalledWith(
                'channel123',
                'deleteChannel',
                { channelId: 'channel123' },
            );
            expect(result).toMatchObject({ message: 'Channel deleted successfully' });
        });

        it('should fail if not the creator', async () => {
            const mockChannel = {
                _id: 'channel123',
                creator: 'user456',
            };

            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({ channelId: 'channel123' });

            await expect(
                channelRoutes.deleteChannel(ctx as any),
            ).rejects.toThrow('Only channel creator can delete the channel');
        });
    });
});
