import getRandomAvatar from '@fiora/utils/getRandomAvatar';
import Community from '../../../database/mongoose/models/community';
import Group from '../../../database/mongoose/models/group';
import Channel from '../../../database/mongoose/models/channel';
import * as communityRoutes from '../../src/routes/community';

jest.mock('../../../database/mongoose/models/community');
jest.mock('../../../database/mongoose/models/group');
jest.mock('../../../database/mongoose/models/channel');
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

describe('server/routes/community', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCommunity', () => {
        it('should create a new community successfully', async () => {
            const mockCommunity = {
                _id: 'community123',
                name: 'Tech Hub',
                avatar: 'avatar.png',
                description: 'Technology community',
                ownerId: 'user123',
                members: [
                    {
                        userId: 'user123',
                        role: 'owner',
                        joinedAt: new Date(),
                    },
                ],
                groups: [],
                channels: [],
                createTime: new Date(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(null);
            (Community.create as jest.Mock).mockResolvedValue(mockCommunity);
            (getRandomAvatar as jest.Mock).mockReturnValue('avatar.png');

            const ctx = mockContext({
                name: 'Tech Hub',
                description: 'Technology community',
            });

            const result = await communityRoutes.createCommunity(ctx as any);

            expect(Community.findOne).toHaveBeenCalledWith({
                name: 'Tech Hub',
            });
            expect(Community.create).toHaveBeenCalled();
            expect(result).toMatchObject({
                _id: 'community123',
                name: 'Tech Hub',
                description: 'Technology community',
            });
        });

        it('should fail if community name is empty', async () => {
            const ctx = mockContext({ name: '', description: '' });

            await expect(
                communityRoutes.createCommunity(ctx as any),
            ).rejects.toThrow('Community name cannot be empty');
        });

        it('should fail if community already exists', async () => {
            (Community.findOne as jest.Mock).mockResolvedValue({
                name: 'Tech Hub',
            });

            const ctx = mockContext({
                name: 'Tech Hub',
                description: 'Test',
            });

            await expect(
                communityRoutes.createCommunity(ctx as any),
            ).rejects.toThrow('This community already exists');
        });
    });

    describe('joinCommunity', () => {
        it('should join a community successfully', async () => {
            const mockCommunity = {
                _id: 'community123',
                members: [
                    { userId: 'user456', role: 'owner', joinedAt: new Date() },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({ communityId: 'community123' });

            const result = await communityRoutes.joinCommunity(ctx as any);

            expect(mockCommunity.members).toHaveLength(2);
            expect(mockCommunity.members[1].userId).toBe('user123');
            expect(mockCommunity.members[1].role).toBe('member');
            expect(mockCommunity.save).toHaveBeenCalled();
            expect(result).toMatchObject({ message: 'Successfully joined the community' });
        });

        it('should fail if already a member', async () => {
            const mockCommunity = {
                _id: 'community123',
                members: [
                    { userId: 'user123', role: 'member', joinedAt: new Date() },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({ communityId: 'community123' });

            await expect(
                communityRoutes.joinCommunity(ctx as any),
            ).rejects.toThrow('You are already a member of this community');
        });
    });

    describe('leaveCommunity', () => {
        it('should leave a community successfully', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user456',
                members: [
                    { userId: 'user456', role: 'owner', joinedAt: new Date() },
                    {
                        userId: 'user123',
                        role: 'member',
                        joinedAt: new Date(),
                    },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({ communityId: 'community123' });

            const result = await communityRoutes.leaveCommunity(ctx as any);

            expect(mockCommunity.members).toHaveLength(1);
            expect(mockCommunity.save).toHaveBeenCalled();
            expect(result).toMatchObject({ message: 'Successfully left the community' });
        });

        it('should fail if owner tries to leave', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user123',
                members: [
                    { userId: 'user123', role: 'owner', joinedAt: new Date() },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({ communityId: 'community123' });

            await expect(
                communityRoutes.leaveCommunity(ctx as any),
            ).rejects.toThrow('Community owner cannot leave the community');
        });

        it('should fail if not a member', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user456',
                members: [
                    { userId: 'user456', role: 'owner', joinedAt: new Date() },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({ communityId: 'community123' });

            await expect(
                communityRoutes.leaveCommunity(ctx as any),
            ).rejects.toThrow('You are not a member of this community');
        });
    });

    describe('addGroupToCommunity', () => {
        it('should add group to community successfully', async () => {
            const mockCommunity = {
                _id: 'community123',
                members: [
                    { userId: 'user123', role: 'admin', joinedAt: new Date() },
                ],
                groups: [],
                save: jest.fn(),
            };

            const mockGroup = {
                _id: 'group123',
                name: 'Test Group',
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);
            (Group.findOne as jest.Mock).mockResolvedValue(mockGroup);

            const ctx = mockContext({
                communityId: 'community123',
                groupId: 'group123',
            });

            const result = await communityRoutes.addGroupToCommunity(
                ctx as any,
            );

            expect(mockCommunity.groups).toContain('group123');
            expect(mockCommunity.save).toHaveBeenCalled();
            expect(result).toMatchObject({ message: 'Group successfully added to community' });
        });

        it('should fail if not admin or owner', async () => {
            const mockCommunity = {
                _id: 'community123',
                members: [
                    {
                        userId: 'user123',
                        role: 'member',
                        joinedAt: new Date(),
                    },
                ],
                groups: [],
                save: jest.fn(),
            };

            const mockGroup = {
                _id: 'group123',
                name: 'Test Group',
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);
            (Group.findOne as jest.Mock).mockResolvedValue(mockGroup);

            const ctx = mockContext({
                communityId: 'community123',
                groupId: 'group123',
            });

            await expect(
                communityRoutes.addGroupToCommunity(ctx as any),
            ).rejects.toThrow('Only community owners or admins can add groups');
        });

        it('should fail if group already added', async () => {
            const mockCommunity = {
                _id: 'community123',
                members: [
                    { userId: 'user123', role: 'owner', joinedAt: new Date() },
                ],
                groups: ['group123'],
                save: jest.fn(),
            };

            const mockGroup = {
                _id: 'group123',
                name: 'Test Group',
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);
            (Group.findOne as jest.Mock).mockResolvedValue(mockGroup);

            const ctx = mockContext({
                communityId: 'community123',
                groupId: 'group123',
            });

            await expect(
                communityRoutes.addGroupToCommunity(ctx as any),
            ).rejects.toThrow('This group is already in the community');
        });
    });

    describe('addChannelToCommunity', () => {
        it('should add channel to community successfully', async () => {
            const mockCommunity = {
                _id: 'community123',
                members: [
                    { userId: 'user123', role: 'owner', joinedAt: new Date() },
                ],
                channels: [],
                save: jest.fn(),
            };

            const mockChannel = {
                _id: 'channel123',
                name: 'Test Channel',
                communityId: null,
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);
            (Channel.findOne as jest.Mock).mockResolvedValue(mockChannel);

            const ctx = mockContext({
                communityId: 'community123',
                channelId: 'channel123',
            });

            const result = await communityRoutes.addChannelToCommunity(
                ctx as any,
            );

            expect(mockCommunity.channels).toContain('channel123');
            expect(mockCommunity.save).toHaveBeenCalled();
            expect(mockChannel.communityId).toBe('community123');
            expect(mockChannel.save).toHaveBeenCalled();
            expect(result).toMatchObject({ message: 'Channel successfully added to community' });
        });
    });

    describe('updateMemberRole', () => {
        it('should update member role successfully', async () => {
            const mockMember = {
                userId: 'user456',
                role: 'member',
                joinedAt: new Date(),
            };

            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user123',
                members: [
                    { userId: 'user123', role: 'owner', joinedAt: new Date() },
                    mockMember,
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({
                communityId: 'community123',
                memberId: 'user456',
                role: 'admin',
            });

            const result = await communityRoutes.updateMemberRole(ctx as any);

            expect(mockMember.role).toBe('admin');
            expect(mockCommunity.save).toHaveBeenCalled();
            expect(result).toMatchObject({ message: 'Member role successfully updated' });
        });

        it('should fail if not owner', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user456',
                members: [
                    { userId: 'user456', role: 'owner', joinedAt: new Date() },
                    {
                        userId: 'user123',
                        role: 'admin',
                        joinedAt: new Date(),
                    },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({
                communityId: 'community123',
                memberId: 'user789',
                role: 'admin',
            });

            await expect(
                communityRoutes.updateMemberRole(ctx as any),
            ).rejects.toThrow('Only community owners can update member roles');
        });

        it('should fail if trying to change owner role', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user123',
                members: [
                    { userId: 'user123', role: 'owner', joinedAt: new Date() },
                    { userId: 'user456', role: 'owner', joinedAt: new Date() },
                ],
                save: jest.fn(),
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({
                communityId: 'community123',
                memberId: 'user456',
                role: 'admin',
            });

            await expect(
                communityRoutes.updateMemberRole(ctx as any),
            ).rejects.toThrow('Cannot change owner role');
        });
    });

    describe('searchCommunities', () => {
        it('should search communities successfully', async () => {
            const mockCommunities = [
                {
                    _id: 'community1',
                    name: 'Tech Hub',
                    avatar: 'avatar1.png',
                    description: 'Technology',
                    members: [{ userId: 'user1' }, { userId: 'user2' }],
                },
                {
                    _id: 'community2',
                    name: 'Tech Enthusiasts',
                    avatar: 'avatar2.png',
                    description: 'Technology lovers',
                    members: [{ userId: 'user3' }],
                },
            ];

            const mockQuery = {
                limit: jest.fn().mockReturnThis(),
                sort: jest.fn().mockResolvedValue(mockCommunities),
            };

            (Community.find as jest.Mock).mockReturnValue(mockQuery);

            const ctx = mockContext({ searchText: 'Tech' });

            const result = await communityRoutes.searchCommunities(ctx as any);

            expect(Community.find).toHaveBeenCalledWith({
                name: { $regex: 'Tech', $options: 'i' },
            });
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                _id: 'community1',
                name: 'Tech Hub',
                membersCount: 2,
            });
        });
    });

    describe('deleteCommunity', () => {
        it('should delete community successfully', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user123',
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);
            (Community.deleteOne as jest.Mock).mockResolvedValue({ ok: 1 });

            const ctx = mockContext({ communityId: 'community123' });

            const result = await communityRoutes.deleteCommunity(ctx as any);

            expect(Community.deleteOne).toHaveBeenCalledWith({
                _id: 'community123',
            });
            expect(result).toMatchObject({ message: 'Community deleted successfully' });
        });

        it('should fail if not owner', async () => {
            const mockCommunity = {
                _id: 'community123',
                ownerId: 'user456',
            };

            (Community.findOne as jest.Mock).mockResolvedValue(mockCommunity);

            const ctx = mockContext({ communityId: 'community123' });

            await expect(
                communityRoutes.deleteCommunity(ctx as any),
            ).rejects.toThrow('Only community owner can delete the community');
        });
    });
});
