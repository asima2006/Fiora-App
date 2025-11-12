import assert from 'assert';
import { Types } from '@fiora/database/mongoose';
import Group from '@fiora/database/mongoose/models/group';
import User from '@fiora/database/mongoose/models/user';
import Socket from '@fiora/database/mongoose/models/socket';

const { isValid } = Types.ObjectId;

interface UpdateMemberRoleData {
    groupId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
}

interface KickMemberData {
    groupId: string;
    userId: string;
}

/**
 * Get member role in group
 */
function getMemberRole(group: any, userId: string): string | null {
    if (!group.memberRoles || group.memberRoles.length === 0) {
        // Legacy mode - creator is owner, everyone else is member
        if (group.creator.toString() === userId) {
            return 'owner';
        }
        if (group.members.some((m: any) => m.toString() === userId)) {
            return 'member';
        }
        return null;
    }

    const memberRole = group.memberRoles.find(
        (mr: any) => mr.userId.toString() === userId,
    );
    return memberRole ? memberRole.role : null;
}

/**
 * Check if user has permission (owner or admin)
 */
function hasAdminPermission(group: any, userId: string): boolean {
    const role = getMemberRole(group, userId);
    return role === 'owner' || role === 'admin';
}

/**
 * Update member role in group
 * @param ctx Context
 */
export async function updateGroupMemberRole(ctx: Context<UpdateMemberRoleData>) {
    const { groupId, userId, role } = ctx.data;
    assert(isValid(groupId), 'Invalid group ID');
    assert(isValid(userId), 'Invalid user ID');
    assert(['owner', 'admin', 'member'].includes(role), 'Invalid role');

    const group = await Group.findOne({ _id: groupId });
    assert(group, 'Group does not exist');

    const currentUser = ctx.socket.user.toString();
    const currentUserRole = getMemberRole(group, currentUser);
    
    // Only owners can promote to owner or change owner role
    if (role === 'owner' || getMemberRole(group, userId) === 'owner') {
        assert(
            currentUserRole === 'owner',
            'Only group owners can manage owner role',
        );
    } else {
        // Admins and owners can manage other roles
        assert(
            hasAdminPermission(group, currentUser),
            'Only group owners or admins can update member roles',
        );
    }

    const targetUser = await User.findOne({ _id: userId });
    assert(targetUser, 'User does not exist');

    // Ensure target user is a group member
    assert(
        group.members.some((m) => m.toString() === userId),
        'User is not a member of this group',
    );

    // Initialize memberRoles if not present (migration from legacy)
    if (!group.memberRoles || group.memberRoles.length === 0) {
        group.memberRoles = group.members.map((memberId) => ({
            userId: memberId,
            role:
                memberId.toString() === group.creator.toString()
                    ? 'owner'
                    : 'member',
            joinedAt: group.createTime,
        }));
    }

    // Update role
    const memberRole = group.memberRoles.find(
        (mr) => mr.userId.toString() === userId,
    );
    if (memberRole) {
        memberRole.role = role;
    } else {
        group.memberRoles.push({
            userId,
            role,
            joinedAt: new Date(),
        });
    }

    // If promoting to owner, demote current owner to admin
    if (role === 'owner' && currentUserRole === 'owner') {
        const currentOwnerRole = group.memberRoles.find(
            (mr) => mr.userId.toString() === currentUser,
        );
        if (currentOwnerRole) {
            currentOwnerRole.role = 'admin';
        }
        group.creator = userId;
    }

    await group.save();

    // Notify all group members
    const sockets = await Socket.find({ user: { $in: group.members } });
    const socketIds = sockets.map((s) => s.id);

    ctx.socket.emit(socketIds, 'groupMemberRoleUpdated', {
        groupId,
        userId,
        role,
        updatedBy: currentUser,
    });

    return {
        message: 'Member role successfully updated',
        memberRoles: group.memberRoles,
    };
}

/**
 * Kick member from group
 * @param ctx Context
 */
export async function kickGroupMember(ctx: Context<KickMemberData>) {
    const { groupId, userId } = ctx.data;
    assert(isValid(groupId), 'Invalid group ID');
    assert(isValid(userId), 'Invalid user ID');

    const group = await Group.findOne({ _id: groupId });
    assert(group, 'Group does not exist');
    assert(!group.isDefault, 'Cannot kick members from default group');

    const currentUser = ctx.socket.user.toString();
    assert(
        hasAdminPermission(group, currentUser),
        'Only group owners or admins can kick members',
    );

    const targetRole = getMemberRole(group, userId);
    assert(targetRole !== null, 'User is not a member of this group');
    assert(targetRole !== 'owner', 'Cannot kick group owner');

    // Admins cannot kick other admins
    if (getMemberRole(group, currentUser) === 'admin') {
        assert(
            targetRole !== 'admin',
            'Admins cannot kick other admins',
        );
    }

    // Remove from members list
    group.members = group.members.filter((m) => m.toString() !== userId);

    // Remove from memberRoles
    if (group.memberRoles) {
        group.memberRoles = group.memberRoles.filter(
            (mr) => mr.userId.toString() !== userId,
        );
    }

    await group.save();

    // Notify all group members including the kicked user
    const notifyUsers = [...group.members, userId];
    const sockets = await Socket.find({ user: { $in: notifyUsers } });
    const socketIds = sockets.map((s) => s.id);

    ctx.socket.emit(socketIds, 'memberKicked', {
        groupId,
        userId,
        kickedBy: currentUser,
    });

    return {
        message: 'Member successfully kicked from group',
    };
}

/**
 * Get group members with their roles
 * @param ctx Context
 */
export async function getGroupMembersWithRoles(
    ctx: Context<{ groupId: string }>,
) {
    const { groupId } = ctx.data;
    assert(isValid(groupId), 'Invalid group ID');

    const group = await Group.findOne({ _id: groupId }).populate(
        'members',
        'username avatar',
    );
    assert(group, 'Group does not exist');

    // Initialize memberRoles if not present (migration from legacy)
    let {memberRoles} = group;
    if (!memberRoles || memberRoles.length === 0) {
        memberRoles = group.members.map((memberId: any) => ({
            userId: memberId,
            role:
                memberId.toString() === group.creator.toString()
                    ? 'owner'
                    : 'member',
            joinedAt: group.createTime,
        }));
    }

    return {
        groupId,
        members: memberRoles,
    };
}

/**
 * Promote member to admin
 * @param ctx Context
 */
export async function promoteToAdmin(ctx: Context<{ groupId: string; userId: string }>) {
    return updateGroupMemberRole({
        socket: ctx.socket,
        data: {
            ...ctx.data,
            role: 'admin',
        },
    } as Context<UpdateMemberRoleData>);
}

/**
 * Demote admin to member
 * @param ctx Context
 */
export async function demoteToMember(ctx: Context<{ groupId: string; userId: string }>) {
    return updateGroupMemberRole({
        socket: ctx.socket,
        data: {
            ...ctx.data,
            role: 'member',
        },
    } as Context<UpdateMemberRoleData>);
}
