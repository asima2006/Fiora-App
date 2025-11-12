import assert from 'assert';
import { Types } from '@fiora/database/mongoose';
import Community, {
    CommunityMember,
} from '@fiora/database/mongoose/models/community';
import Group, { GroupDocument } from '@fiora/database/mongoose/models/group';
import Channel from '@fiora/database/mongoose/models/channel';
import getRandomAvatar from '@fiora/utils/getRandomAvatar';
import Message from '@fiora/database/mongoose/models/message';

const { isValid } = Types.ObjectId;

/**
 * Create community
 * @param ctx Context
 */
export async function createCommunity(
    ctx: Context<{ name: string; description?: string }>,
) {
    const { name, description = '' } = ctx.data;
    assert(name, 'Community name cannot be empty');

    const community = await Community.findOne({ name });
    assert(!community, 'This community already exists');

    let newCommunity = null;
    let announcementGroup = null;

    try {
        // Create announcement group first
        announcementGroup = await Group.create({
            name: `${name} - Announcements`,
            avatar: getRandomAvatar(),
            announcement: 'This is the announcement group. Only admins can post here.',
            creator: ctx.socket.user,
            isDefault: false,
            members: [ctx.socket.user],
            memberRoles: [
                {
                    userId: ctx.socket.user,
                    role: 'owner',
                    joinedAt: new Date(),
                },
            ],
        });

        // Create community with announcement group linked
        newCommunity = await Community.create({
            name,
            description,
            avatar: getRandomAvatar(),
            ownerId: ctx.socket.user,
            members: [
                {
                    userId: ctx.socket.user,
                    role: 'owner',
                    joinedAt: new Date(),
                },
            ],
            groups: [announcementGroup._id],
            channels: [],
            announcementGroupId: announcementGroup._id,
        });

        // Link announcement group to community
        announcementGroup.communityId = newCommunity._id;
        await announcementGroup.save();
    } catch (err) {
        // Rollback: If community creation fails, delete the announcement group
        if (announcementGroup) {
            await Group.deleteOne({ _id: announcementGroup._id });
        }

        if ((err as Error).name === 'ValidationError') {
            return 'Community name contains unsupported characters or incorrect format';
        }
        throw err;
    }

    return {
        _id: newCommunity._id,
        name: newCommunity.name,
        avatar: newCommunity.avatar,
        description: newCommunity.description,
        ownerId: newCommunity.ownerId,
        announcementGroupId: newCommunity.announcementGroupId,
        createTime: newCommunity.createTime,
    };
}

/**
 * Get community information
 * @param ctx Context
 */
export async function getCommunityInfo(
    ctx: Context<{ communityId: string }>,
) {
    const { communityId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');

    const community = await Community.findOne({ _id: communityId })
        .populate('groups', 'name avatar')
        .populate('channels', 'name avatar description');

    assert(community, 'Community does not exist');

    return {
        _id: community._id,
        name: community.name,
        avatar: community.avatar,
        description: community.description,
        ownerId: community.ownerId,
        members: community.members,
        groups: community.groups,
        channels: community.channels,
        announcementGroupId: community.announcementGroupId,
        createTime: community.createTime,
    };
}

/**
 * Get basic community information (for public invite page)
 * @param ctx Context
 */
export async function getCommunityBasicInfo(
    ctx: Context<{ communityId: string }>,
) {
    const { communityId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');

    const community = await Community.findOne({ _id: communityId })
        .select('name avatar description members createTime');

    assert(community, 'Community does not exist');

    return {
        name: community.name,
        avatar: community.avatar,
        description: community.description,
        memberCount: community.members.length,
        createTime: community.createTime,
    };
}

/**
 * Join community
 * @param ctx Context
 */
export async function joinCommunity(ctx: Context<{ communityId: string }>) {
    const { communityId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    const isMember = community.members.some(
        (member) => member.userId.toString() === ctx.socket.user.toString(),
    );
    assert(!isMember, 'You are already a member of this community');

    // Add member to community
    community.members.push({
        userId: ctx.socket.user,
        role: 'member',
        joinedAt: new Date(),
    } as CommunityMember);

    await community.save();

    // Auto-add to announcement group
    let announcementGroupData = null;
    if (community.announcementGroupId) {
        const announcementGroup = await Group.findOne({ _id: community.announcementGroupId });
        if (announcementGroup) {
            // Add to members array if not already there
            if (!announcementGroup.members.includes(ctx.socket.user)) {
                announcementGroup.members.push(ctx.socket.user);
            }

            // Add to memberRoles if not already there
            const hasRole = announcementGroup.memberRoles?.some(
                (mr) => mr.userId.toString() === ctx.socket.user.toString(),
            );
            if (!hasRole) {
                if (!announcementGroup.memberRoles) {
                    announcementGroup.memberRoles = [];
                }
                announcementGroup.memberRoles.push({
                    userId: ctx.socket.user,
                    role: 'member',
                    joinedAt: new Date(),
                });
            }

            await announcementGroup.save();

            // Get recent messages from announcement group
            const messages = await Message.find(
                { toGroup: announcementGroup._id },
                {
                    type: 1,
                    content: 1,
                    from: 1,
                    createTime: 1,
                },
                { sort: { createTime: -1 }, limit: 3 },
            ).populate('from', { username: 1, avatar: 1 });
            messages.reverse();

            // Join socket room
            ctx.socket.join(announcementGroup._id.toString());

            announcementGroupData = {
                _id: announcementGroup._id,
                name: announcementGroup.name,
                avatar: announcementGroup.avatar,
                createTime: announcementGroup.createTime,
                creator: announcementGroup.creator,
                messages,
            };
        }
    }

    // Get all groups in community for display
    const allGroups = await Group.find({ _id: { $in: community.groups } })
        .select('_id name avatar members');

    return {
        _id: community._id,
        name: community.name,
        avatar: community.avatar,
        description: community.description,
        createTime: community.createTime,
        announcementGroup: announcementGroupData,
        availableGroups: allGroups.map((g) => ({
            _id: g._id,
            name: g.name,
            avatar: g.avatar,
            memberCount: g.members.length,
            isMember: g.members.some((m) => m.toString() === ctx.socket.user.toString()),
        })),
    };
}

/**
 * Leave community
 * @param ctx Context
 */
export async function leaveCommunity(ctx: Context<{ communityId: string }>) {
    const { communityId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');
    assert(
        community.ownerId.toString() !== ctx.socket.user.toString(),
        'Community owner cannot leave the community',
    );

    const index = community.members.findIndex(
        (member) => member.userId.toString() === ctx.socket.user.toString(),
    );
    assert(index !== -1, 'You are not a member of this community');

    // Remove from community
    community.members.splice(index, 1);
    await community.save();

    // Remove from announcement group
    if (community.announcementGroupId) {
        const announcementGroup = await Group.findOne({ _id: community.announcementGroupId });
        if (announcementGroup) {
            // Remove from members array
            const memberIndex = announcementGroup.members.findIndex(
                (memberId) => memberId.toString() === ctx.socket.user.toString(),
            );
            if (memberIndex !== -1) {
                announcementGroup.members.splice(memberIndex, 1);
            }

            // Remove from memberRoles
            if (announcementGroup.memberRoles) {
                const roleIndex = announcementGroup.memberRoles.findIndex(
                    (mr) => mr.userId.toString() === ctx.socket.user.toString(),
                );
                if (roleIndex !== -1) {
                    announcementGroup.memberRoles.splice(roleIndex, 1);
                }
            }

            await announcementGroup.save();
        }
    }

    return {
        message: 'Successfully left the community',
    };
}

/**
 * Add group to community
 * @param ctx Context
 */
export async function addGroupToCommunity(
    ctx: Context<{ communityId: string; groupId: string }>,
) {
    const { communityId, groupId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(isValid(groupId), 'Invalid group ID');

    const [community, group] = await Promise.all([
        Community.findOne({ _id: communityId }),
        Group.findOne({ _id: groupId }),
    ]);

    assert(community, 'Community does not exist');
    assert(group, 'Group does not exist');

    // Check permissions - must be community owner or admin
    const member = community.members.find(
        (m) => m.userId.toString() === ctx.socket.user.toString(),
    );
    assert(
        member && (member.role === 'owner' || member.role === 'admin'),
        'Only community owners or admins can add groups',
    );

    // Check if already added
    const isAlreadyAdded = community.groups.some(
        (gId) => gId.toString() === groupId,
    );
    assert(!isAlreadyAdded, 'This group is already in the community');

    // Check 10 group limit (including announcement group)
    assert(
        community.groups.length < 10,
        'Community has reached the maximum limit of 10 groups',
    );

    // Set the group's communityId to link it to this community
    group.communityId = communityId;
    await group.save();

    community.groups.push(groupId);
    await community.save();

    return {
        message: 'Group successfully added to community',
    };
}

/**
 * Create group in community (bypasses personal group limit)
 * @param ctx Context
 */
export async function createGroupInCommunity(
    ctx: Context<{ communityId: string; name: string }>,
) {
    const { communityId, name } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(name, 'Group name cannot be empty');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Check permissions - must be community owner or admin
    const member = community.members.find(
        (m) => m.userId.toString() === ctx.socket.user.toString(),
    );
    assert(
        member && (member.role === 'owner' || member.role === 'admin'),
        'Only community owners or admins can create groups',
    );

    // Check 10 group limit (including announcement group)
    assert(
        community.groups.length < 10,
        'Community has reached the maximum limit of 10 groups',
    );

    // Check if group name already exists globally
    const existingGroup = await Group.findOne({ name });
    assert(!existingGroup, 'This group name already exists');

    // Create the group
    let newGroup = null;
    try {
        newGroup = await Group.create({
            name,
            avatar: getRandomAvatar(),
            creator: ctx.socket.user,
            members: [ctx.socket.user],
            communityId, // Link group to community
        } as GroupDocument);
    } catch (err) {
        throw new Error('Failed to create group');
    }

    // Add to community
    community.groups.push(newGroup._id);
    await community.save();

    // Populate creator info
    await newGroup.populate('creator');

    return {
        _id: newGroup._id,
        name: newGroup.name,
        avatar: newGroup.avatar,
        creator: newGroup.creator,
        createTime: newGroup.createTime,
    };
}

/**
 * Add channel to community
 * @param ctx Context
 */
export async function addChannelToCommunity(
    ctx: Context<{ communityId: string; channelId: string }>,
) {
    const { communityId, channelId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(isValid(channelId), 'Invalid channel ID');

    const [community, channel] = await Promise.all([
        Community.findOne({ _id: communityId }),
        Channel.findOne({ _id: channelId }),
    ]);

    assert(community, 'Community does not exist');
    assert(channel, 'Channel does not exist');

    // Check permissions
    const member = community.members.find(
        (m) => m.userId.toString() === ctx.socket.user.toString(),
    );
    assert(
        member && (member.role === 'owner' || member.role === 'admin'),
        'Only community owners or admins can add channels',
    );

    // Check if already added
    const isAlreadyAdded = community.channels.some(
        (cId) => cId.toString() === channelId,
    );
    assert(!isAlreadyAdded, 'This channel is already in the community');

    community.channels.push(channelId);
    await community.save();

    // Update channel's communityId
    channel.communityId = communityId;
    await channel.save();

    return {
        message: 'Channel successfully added to community',
    };
}

/**
 * Update member role
 * @param ctx Context
 */
export async function updateMemberRole(
    ctx: Context<{
        communityId: string;
        memberId: string;
        role: 'admin' | 'member';
    }>,
) {
    const { communityId, memberId, role } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(isValid(memberId), 'Invalid member ID');
    assert(['admin', 'member'].includes(role), 'Invalid role');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Only owner can update roles
    assert(
        community.ownerId.toString() === ctx.socket.user.toString(),
        'Only community owners can update member roles',
    );

    const member = community.members.find(
        (m) => m.userId.toString() === memberId,
    );
    assert(member, 'Member does not exist');
    assert(member.role !== 'owner', 'Cannot change owner role');

    member.role = role;
    await community.save();

    return {
        message: 'Member role successfully updated',
    };
}

/**
 * Get user's joined communities list
 * @param ctx Context
 */
export async function getMyCommunities(ctx: Context<{}>) {
    const communities = await Community.find({
        'members.userId': ctx.socket.user,
    })
        .populate('groups', 'name avatar')
        .sort({ createTime: -1 });

    return communities.map((community) => {
        const groups = Array.isArray(community.groups)
            ? (community.groups as unknown as Array<{ _id: Types.ObjectId; name: string; avatar?: string }>)
            : [];
        const announcementGroupId = community.announcementGroupId
            ? community.announcementGroupId.toString()
            : '';

        const announcementGroup = announcementGroupId
            ? groups.find((group) => group._id.toString() === announcementGroupId)
            : undefined;

        const otherGroups = groups
            .filter((group) => group._id.toString() !== announcementGroupId)
            .slice(0, 3);

        return {
            _id: community._id.toString(),
            name: community.name,
            avatar: community.avatar,
            description: community.description,
            ownerId: community.ownerId ? community.ownerId.toString() : '',
            members: community.members.map((m) => ({
                userId: m.userId.toString(),
                role: m.role,
                joinedAt: m.joinedAt,
            })),
            membersCount: community.members.length,
            groupsCount: groups.length,
            channelsCount: community.channels.length,
            createTime: community.createTime,
            announcementGroupId: announcementGroupId || undefined,
            announcementGroup: announcementGroup
                ? {
                    _id: announcementGroup._id.toString(),
                    name: announcementGroup.name,
                    avatar: announcementGroup.avatar,
                }
                : undefined,
            groupPreviews: otherGroups.map((group) => ({
                _id: group._id.toString(),
                name: group.name,
                avatar: group.avatar,
            })),
            hasMoreGroups:
                groups.length >
                otherGroups.length + (announcementGroup ? 1 : 0),
            hiddenGroupsCount: Math.max(
                0,
                groups.length - otherGroups.length - (announcementGroup ? 1 : 0),
            ),
        };
    });
}

/**
 * Search communities
 * @param ctx Context
 */
export async function searchCommunities(ctx: Context<{ searchText: string }>) {
    const { searchText } = ctx.data;
    assert(searchText, 'Search text cannot be empty');

    const communities = await Community.find({
        name: { $regex: searchText, $options: 'i' },
    })
        .limit(10)
        .sort({ createTime: -1 });

    return communities.map((community) => ({
        _id: community._id,
        name: community.name,
        avatar: community.avatar,
        description: community.description,
        membersCount: community.members.length,
    }));
}

/**
 * Promote member to admin
 * @param ctx Context
 */
export async function promoteMemberToAdmin(
    ctx: Context<{ communityId: string; userId: string }>,
) {
    const { communityId, userId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(isValid(userId), 'Invalid user ID');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Only owner can promote members
    assert(
        community.ownerId.toString() === ctx.socket.user.toString(),
        'Only community owner can promote members to admin',
    );

    const member = community.members.find(
        (m) => m.userId.toString() === userId.toString(),
    );
    assert(member, 'User is not a member of this community');
    assert(member.role === 'member', 'User is already an admin or owner');

    member.role = 'admin';
    await community.save();

    // Update role in announcement group
    if (community.announcementGroupId) {
        const announcementGroup = await Group.findOne({ _id: community.announcementGroupId });
        if (announcementGroup && announcementGroup.memberRoles) {
            const memberRole = announcementGroup.memberRoles.find(
                (mr) => mr.userId.toString() === userId.toString(),
            );
            if (memberRole) {
                memberRole.role = 'admin';
                await announcementGroup.save();
            }
        }
    }

    return {
        message: 'Member successfully promoted to admin',
    };
}

/**
 * Demote admin to member
 * @param ctx Context
 */
export async function demoteMemberFromAdmin(
    ctx: Context<{ communityId: string; userId: string }>,
) {
    const { communityId, userId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(isValid(userId), 'Invalid user ID');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Only owner can demote admins
    assert(
        community.ownerId.toString() === ctx.socket.user.toString(),
        'Only community owner can demote admins',
    );

    const member = community.members.find(
        (m) => m.userId.toString() === userId.toString(),
    );
    assert(member, 'User is not a member of this community');
    assert(member.role === 'admin', 'User is not an admin');

    member.role = 'member';
    await community.save();

    // Update role in announcement group
    if (community.announcementGroupId) {
        const announcementGroup = await Group.findOne({ _id: community.announcementGroupId });
        if (announcementGroup && announcementGroup.memberRoles) {
            const memberRole = announcementGroup.memberRoles.find(
                (mr) => mr.userId.toString() === userId.toString(),
            );
            if (memberRole) {
                memberRole.role = 'member';
                await announcementGroup.save();
            }
        }
    }

    return {
        message: 'Admin successfully demoted to member',
    };
}

/**
 * Change community name
 * @param ctx Context
 */
export async function changeCommunityName(
    ctx: Context<{ communityId: string; name: string }>,
) {
    const { communityId, name } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(name, 'Community name cannot be empty');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Only owner can change name
    assert(
        community.ownerId.toString() === ctx.socket.user.toString(),
        'Only community owner can change the name',
    );

    // Check if name already exists
    const existingCommunity = await Community.findOne({ name });
    assert(!existingCommunity || existingCommunity._id.toString() === communityId, 'Community name already exists');

    community.name = name;
    await community.save();

    return {
        message: 'Community name changed successfully',
    };
}

/**
 * Change community avatar
 * @param ctx Context
 */
export async function changeCommunityAvatar(
    ctx: Context<{ communityId: string; avatar: string }>,
) {
    const { communityId, avatar } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');
    assert(avatar, 'Avatar URL cannot be empty');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Only owner can change avatar
    assert(
        community.ownerId.toString() === ctx.socket.user.toString(),
        'Only community owner can change the avatar',
    );

    community.avatar = avatar;
    await community.save();

    return {
        message: 'Community avatar changed successfully',
    };
}

/**
 * Delete community (duplicate - keeping this one, removing line 450-476)
 * @param ctx Context
 */
export async function deleteCommunity(
    ctx: Context<{ communityId: string }>,
) {
    const { communityId } = ctx.data;
    assert(isValid(communityId), 'Invalid community ID');

    const community = await Community.findOne({ _id: communityId });
    assert(community, 'Community does not exist');

    // Only owner can delete
    assert(
        community.ownerId.toString() === ctx.socket.user.toString(),
        'Only community owner can delete the community',
    );

    // Delete all associated groups (including announcement group)
    if (community.groups && community.groups.length > 0) {
        await Group.deleteMany({ _id: { $in: community.groups } });
    }

    // Delete community
    await Community.deleteOne({ _id: communityId });

    return {
        message: 'Community deleted successfully',
    };
}
