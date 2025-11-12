import fetch from './utils/fetch';
import { User, GroupMember } from './state/reducer';

function saveUsername(username: string) {
    window.localStorage.setItem('username', username);
}

/**
 * Register new user
 * @param username Username
 * @param password Password
 * @param os Operating system
 * @param browser Browser
 * @param environment Environment info
 */
export async function register(
    username: string,
    password: string,
    os = '',
    browser = '',
    environment = '',
) {
    const [err, user] = await fetch('register', {
        username,
        password,
        os,
        browser,
        environment,
    });

    if (err) {
        return null;
    }

    saveUsername(user.username);
    return user;
}

/**
 * Login with username and password
 * @param username Username
 * @param password Password
 * @param os Operating system
 * @param browser Browser
 * @param environment Environment info
 */
export async function login(
    username: string,
    password: string,
    os = '',
    browser = '',
    environment = '',
) {
    const [err, user] = await fetch('login', {
        username,
        password,
        os,
        browser,
        environment,
    });

    if (err) {
        return null;
    }

    saveUsername(user.username);
    return user;
}

/**
 * Login with token
 * @param token Login token
 * @param os Operating system
 * @param browser Browser
 * @param environment Environment info
 */
export async function loginByToken(
    token: string,
    os = '',
    browser = '',
    environment = '',
) {
    const [err, user] = await fetch(
        'loginByToken',
        {
            token,
            os,
            browser,
            environment,
        },
        { toast: false },
    );

    if (err) {
        return null;
    }

    saveUsername(user.username);
    return user;
}

/**
 * Guest mode login
 * @param os Operating system
 * @param browser Browser
 * @param environment Environment info
 */
export async function guest(os = '', browser = '', environment = '') {
    const [err, res] = await fetch('guest', { os, browser, environment });
    if (err) {
        return null;
    }
    return res;
}

/**
 * Change user avatar
 * @param avatar New avatar URL
 */
export async function changeAvatar(avatar: string) {
    const [error] = await fetch('changeAvatar', { avatar });
    return !error;
}

/**
 * Change user password
 * @param oldPassword Old password
 * @param newPassword New password
 */
export async function changePassword(oldPassword: string, newPassword: string) {
    const [error] = await fetch('changePassword', {
        oldPassword,
        newPassword,
    });
    return !error;
}

/**
 * Change username
 * @param username New username
 */
export async function changeUsername(username: string) {
    const [error] = await fetch('changeUsername', {
        username,
    });
    return !error;
}

/**
 * Change group name
 * @param groupId Target group
 * @param name New name
 */
export async function changeGroupName(groupId: string, name: string) {
    const [error] = await fetch('changeGroupName', { groupId, name });
    return !error;
}

/**
 * Change group avatar
 * @param groupId Target group
 * @param name New avatar
 */
export async function changeGroupAvatar(groupId: string, avatar: string) {
    const [error] = await fetch('changeGroupAvatar', { groupId, avatar });
    return !error;
}

/**
 * Create group
 * @param name Group name
 */
export async function createGroup(name: string) {
    const [, group] = await fetch('createGroup', { name });
    return group;
}

/**
 * Delete group
 * @param groupId Group ID
 */
export async function deleteGroup(groupId: string) {
    const [error] = await fetch('deleteGroup', { groupId });
    return !error;
}

/**
 * Join group
 * @param groupId Group ID
 */
export async function joinGroup(groupId: string) {
    const [, group] = await fetch('joinGroup', { groupId });
    return group;
}

/**
 * Leave group
 * @param groupId Group ID
 */
export async function leaveGroup(groupId: string) {
    const [error] = await fetch('leaveGroup', { groupId });
    return !error;
}

/**
 * Add friend
 * @param userId Target user ID
 */
export async function addFriend(userId: string) {
    const [, user] = await fetch<User>('addFriend', { userId });
    return user;
}

/**
 * Delete friend
 * @param userId Target user ID
 */
export async function deleteFriend(userId: string) {
    const [err] = await fetch('deleteFriend', { userId });
    return !err;
}

/**
 * Get the last messages and unread number of a group of linkmans
 * @param linkmanIds Linkman ids who need to get the last messages
 */
export async function getLinkmansLastMessagesV2(linkmanIds: string[]) {
    const [, linkmanMessages] = await fetch('getLinkmansLastMessagesV2', {
        linkmans: linkmanIds,
    });
    return linkmanMessages;
}

/**
 * Get linkman history messages
 * @param linkmanId Linkman ID
 * @param existCount Number of messages already on client
 */
export async function getLinkmanHistoryMessages(
    linkmanId: string,
    existCount: number,
) {
    const [, messages] = await fetch('getLinkmanHistoryMessages', {
        linkmanId,
        existCount,
    });
    return messages;
}

/**
 * Get default group history messages
 * @param existCount Number of messages already on client
 */
export async function getDefaultGroupHistoryMessages(existCount: number) {
    const [, messages] = await fetch('getDefaultGroupHistoryMessages', {
        existCount,
    });
    return messages;
}

/**
 * Search users and groups
 * @param keywords Keywords
 */
export async function search(keywords: string) {
    const [, result] = await fetch('search', { keywords });
    return result;
}

/**
 * Search expressions
 * @param keywords Keywords
 */
export async function searchExpression(keywords: string) {
    const [, result] = await fetch('searchExpression', { keywords });
    return result;
}

/**
 * Send message
 * @param to Target
 * @param type Message type
 * @param content Message content
 */
export async function sendMessage(to: string, type: string, content: string) {
    return fetch('sendMessage', { to, type, content });
}

/**
 * Delete message
 * @param messageId Message ID to delete
 */
export async function deleteMessage(messageId: string) {
    const [err] = await fetch('deleteMessage', { messageId });
    return !err;
}

/**
 * Get online members of target group
 * @param groupId Target group ID
 */
export const getGroupOnlineMembers = (() => {
    let cache: {
        groupId: string;
        key: string;
        members: GroupMember[];
    } = {
        groupId: '',
        key: '',
        members: [],
    };
    return async function _getGroupOnlineMembers(
        groupId: string,
    ): Promise<GroupMember[]> {
        const [, result] = await fetch('getGroupOnlineMembersV2', {
            groupId,
            cache: cache.groupId === groupId ? cache.key : undefined,
        });
        if (!result) {
            return [];
        }

        if (result.cache === cache.key) {
            return cache.members as GroupMember[];
        }
        cache = {
            groupId,
            key: result.cache,
            members: result.members,
        };
        return result.members;
    };
})();

/**
 * Get online members of default group
 */
export async function getDefaultGroupOnlineMembers() {
    const [, members] = await fetch('getDefaultGroupOnlineMembers');
    return members;
}

/**
 * Ban user
 * @param username Target username
 */
export async function sealUser(username: string) {
    const [err] = await fetch('sealUser', { username });
    return !err;
}

/**
 * Ban IP
 * @param ip IP address
 */
export async function sealIp(ip: string) {
    const [err] = await fetch('sealIp', { ip });
    return !err;
}

/**
 * Ban all online IPs of user
 * @param userId User ID
 */
export async function sealUserOnlineIp(userId: string) {
    const [err] = await fetch('sealUserOnlineIp', { userId });
    return !err;
}

/**
 * Get banned users list
 */
export async function getSealList() {
    const [, sealList] = await fetch('getSealList');
    return sealList;
}

export async function getSystemConfig() {
    const [, systemConfig] = await fetch('getSystemConfig');
    return systemConfig;
}

/**
 * Reset specified user's password
 * @param username Target username
 */
export async function resetUserPassword(username: string) {
    const [, res] = await fetch('resetUserPassword', { username });
    return res;
}

/**
 * Update specified user's tag
 * @param username Target username
 * @param tag Tag
 */
export async function setUserTag(username: string, tag: string) {
    const [err] = await fetch('setUserTag', { username, tag });
    return !err;
}

/**
 * Get user's online IPs
 * @param userId User ID
 */
export async function getUserIps(userId: string) {
    const [, res] = await fetch('getUserIps', { userId });
    return res;
}

export async function getUserOnlineStatus(userId: string) {
    const [, res] = await fetch('getUserOnlineStatus', { userId });
    return res && res.isOnline;
}

export async function updateHistory(linkmanId: string, messageId: string) {
    const [, result] = await fetch('updateHistory', { linkmanId, messageId });
    return !!result;
}

export async function toggleSendMessage(enable: boolean) {
    const [, result] = await fetch('toggleSendMessage', { enable });
    return !!result;
}

export async function toggleNewUserSendMessage(enable: boolean) {
    const [, result] = await fetch('toggleNewUserSendMessage', { enable });
    return !!result;
}

/**
 * Export messages from a conversation to a file
 * @param linkmanId ID of the conversation (group or friend)
 * @param format Export format (json, txt, or html)
 * @param startDate Optional start date filter
 * @param endDate Optional end date filter
 */
export async function exportMessages(
    linkmanId: string,
    format: 'json' | 'txt' | 'html' = 'json',
    startDate?: string,
    endDate?: string,
) {
    const [err, result] = await fetch('exportMessages', {
        linkmanId,
        format,
        startDate,
        endDate,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Export all conversations for the current user
 * @param format Export format (json, txt, or html)
 */
export async function exportAllConversations(
    format: 'json' | 'txt' | 'html' = 'json',
) {
    const [err, result] = await fetch('exportAllConversations', { format });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Save a draft message
 * @param linkmanId ID of the conversation
 * @param content Draft message content
 */
export async function saveDraft(linkmanId: string, content: string) {
    const [err] = await fetch('saveDraft', { linkmanId, content });
    return !err;
}

/**
 * Get saved draft message
 * @param linkmanId ID of the conversation
 */
export async function getDraft(linkmanId: string) {
    const [err, result] = await fetch('getDraft', { linkmanId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Delete a draft message
 * @param linkmanId ID of the conversation
 */
export async function deleteDraft(linkmanId: string) {
    const [err] = await fetch('deleteDraft', { linkmanId });
    return !err;
}

/**
 * Create a new channel
 * @param name Channel name
 * @param description Channel description
 */
export async function createChannel(name: string, description = '') {
    return fetch('createChannel', { name, description });
}

/**
 * Subscribe to a channel
 * @param channelId Channel ID
 */
export async function subscribeChannel(channelId: string) {
    const [err, result] = await fetch('subscribeChannel', { channelId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Unsubscribe from a channel
 * @param channelId Channel ID
 */
export async function unsubscribeChannel(channelId: string) {
    const [err, result] = await fetch('unsubscribeChannel', { channelId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Publish an announcement to a channel
 * @param channelId Channel ID
 * @param content Announcement content
 */
export async function publishAnnouncement(channelId: string, content: string) {
    const [err, result] = await fetch('publishAnnouncement', {
        channelId,
        content,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Get channel information
 * @param channelId Channel ID
 */
export async function getChannelInfo(channelId: string) {
    const [err, result] = await fetch('getChannelInfo', { channelId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Get list of subscribed channels
 */
export async function getSubscribedChannels() {
    return fetch('getSubscribedChannels', {});
}

/**
 * Get all channels for discovery
 */
export async function getAllChannels() {
    return fetch('getAllChannels', {});
}

/**
 * Search for channels
 * @param searchText Search query
 */
export async function searchChannels(searchText: string) {
    return fetch('searchChannels', { searchText });
}

/**
 * Delete a channel
 * @param channelId Channel ID
 */
export async function deleteChannel(channelId: string) {
    const [err, result] = await fetch('deleteChannel', { channelId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Create a new community
 * @param name Community name
 * @param description Community description
 */
export async function createCommunity(name: string, description = '') {
    return fetch('createCommunity', { name, description });
}

/**
 * Get community information
 * @param communityId Community ID
 */
export async function getCommunityInfo(communityId: string) {
    const [err, result] = await fetch('getCommunityInfo', { communityId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Get basic community information (for public invite page)
 * @param communityId Community ID
 */
export async function getCommunityBasicInfo(communityId: string) {
    const [err, result] = await fetch('getCommunityBasicInfo', { communityId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Join a community
 * @param communityId Community ID
 */
export async function joinCommunity(communityId: string) {
    const [err, result] = await fetch('joinCommunity', { communityId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Leave a community
 * @param communityId Community ID
 */
export async function leaveCommunity(communityId: string) {
    const [err, result] = await fetch('leaveCommunity', { communityId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Promote member to admin
 * @param communityId Community ID
 * @param userId User ID
 */
export async function promoteCommunityMember(communityId: string, userId: string) {
    const [err, result] = await fetch('promoteMemberToAdmin', { communityId, userId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Demote admin to member
 * @param communityId Community ID
 * @param userId User ID
 */
export async function demoteCommunityMember(communityId: string, userId: string) {
    const [err, result] = await fetch('demoteMemberFromAdmin', { communityId, userId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Change community name
 * @param communityId Community ID
 * @param name New name
 */
export async function changeCommunityName(communityId: string, name: string) {
    const [err, result] = await fetch('changeCommunityName', { communityId, name });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Change community avatar
 * @param communityId Community ID
 * @param avatar Avatar URL
 */
export async function changeCommunityAvatar(communityId: string, avatar: string) {
    const [err, result] = await fetch('changeCommunityAvatar', { communityId, avatar });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Delete community (owner only)
 * @param communityId Community ID
 */
export async function deleteCommunity(communityId: string) {
    const [err, result] = await fetch('deleteCommunity', { communityId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Add a group to a community
 * @param communityId Community ID
 * @param groupId Group ID
 */
export async function addGroupToCommunity(
    communityId: string,
    groupId: string,
) {
    const [err, result] = await fetch('addGroupToCommunity', {
        communityId,
        groupId,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Create a group directly in a community (bypasses personal group limit)
 * @param communityId Community ID
 * @param name Group name
 */
export async function createGroupInCommunity(
    communityId: string,
    name: string,
) {
    const [err, result] = await fetch('createGroupInCommunity', {
        communityId,
        name,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Add a channel to a community
 * @param communityId Community ID
 * @param channelId Channel ID
 */
export async function addChannelToCommunity(
    communityId: string,
    channelId: string,
) {
    const [err, result] = await fetch('addChannelToCommunity', {
        communityId,
        channelId,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Update a member's role in a community
 * @param communityId Community ID
 * @param memberId Member user ID
 * @param role New role ('admin' or 'member')
 */
export async function updateMemberRole(
    communityId: string,
    memberId: string,
    role: 'admin' | 'member',
) {
    const [err, result] = await fetch('updateMemberRole', {
        communityId,
        memberId,
        role,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Get list of communities the user is a member of
 */
export async function getMyCommunities() {
    return fetch('getMyCommunities', {});
}

/**
 * Search for communities
 * @param searchText Search query
 */
export async function searchCommunities(searchText: string) {
    return fetch('searchCommunities', { searchText });
}

/**
 * Promote a member to admin
 * @param communityId Community ID
 * @param userId User ID
 */
export async function promoteMemberToAdmin(
    communityId: string,
    userId: string,
) {
    const [err, result] = await fetch('promoteMemberToAdmin', {
        communityId,
        userId,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Demote an admin to member
 * @param communityId Community ID
 * @param userId User ID
 */
export async function demoteMemberFromAdmin(
    communityId: string,
    userId: string,
) {
    const [err, result] = await fetch('demoteMemberFromAdmin', {
        communityId,
        userId,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Send typing indicator
 * @param to Recipient (linkman ID)
 * @param isTyping Whether user is typing
 */
export async function sendTypingIndicator(to: string, isTyping: boolean) {
    const [err, result] = await fetch('sendTypingIndicator', { to, isTyping });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Send read receipt
 * @param messageId Message ID
 * @param linkmanId Linkman ID
 */
export async function sendReadReceipt(messageId: string, linkmanId: string) {
    const [err, result] = await fetch('sendReadReceipt', {
        messageId,
        linkmanId,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Send delivery receipt
 * @param messageId Message ID
 * @param linkmanId Linkman ID
 */
export async function sendDeliveryReceipt(
    messageId: string,
    linkmanId: string,
) {
    const [err, result] = await fetch('sendDeliveryReceipt', {
        messageId,
        linkmanId,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Get message read status
 * @param messageId Message ID
 */
export async function getMessageReadStatus(messageId: string) {
    const [err, result] = await fetch('getMessageReadStatus', { messageId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Update group member role
 * @param groupId Group ID
 * @param userId User ID
 * @param role New role
 */
export async function updateGroupMemberRole(
    groupId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
) {
    const [err, result] = await fetch('updateGroupMemberRole', {
        groupId,
        userId,
        role,
    });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Kick member from group
 * @param groupId Group ID
 * @param userId User ID
 */
export async function kickGroupMember(groupId: string, userId: string) {
    const [err, result] = await fetch('kickGroupMember', { groupId, userId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Get group members with their roles
 * @param groupId Group ID
 */
export async function getGroupMembersWithRoles(groupId: string) {
    const [err, result] = await fetch('getGroupMembersWithRoles', { groupId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Promote member to admin
 * @param groupId Group ID
 * @param userId User ID
 */
export async function promoteToAdmin(groupId: string, userId: string) {
    const [err, result] = await fetch('promoteToAdmin', { groupId, userId });
    if (err) {
        return null;
    }
    return result;
}

/**
 * Demote admin to member
 * @param groupId Group ID
 * @param userId User ID
 */
export async function demoteToMember(groupId: string, userId: string) {
    const [err, result] = await fetch('demoteToMember', { groupId, userId });
    if (err) {
        return null;
    }
    return result;
}
