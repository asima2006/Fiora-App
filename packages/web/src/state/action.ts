import { Group, Friend, Message, Linkman } from './reducer';

// eslint-disable-next-line import/prefer-default-export
export enum ActionTypes {
    /** Set guest information */
    SetGuest = 'SetGuest',
    /** Set user information */
    SetUser = 'SetUser',
    /** Update user information */
    UpdateUserInfo = 'UpdateUserInfo',
    /** Update client status */
    SetStatus = 'SetStatus',
    /** Logout */
    Logout = 'Logout',
    /** Set user avatar */
    SetAvatar = 'SetAvatar',
    /** Add new contact */
    AddLinkman = 'AddLinkman',
    /** Remove specified contact */
    RemoveLinkman = 'RemoveLinkman',
    /** Set focused contact */
    SetFocus = 'SetFocus',
    /** Set each contact's history messages */
    SetLinkmansLastMessages = 'SetLinkmansLastMessages',
    /** Add contact history messages */
    AddLinkmanHistoryMessages = 'AddLinkmanHistoryMessages',
    /** Add contact new message */
    AddLinkmanMessage = 'AddLinkmanMessage',
    /** Set contact specified property value */
    SetLinkmanProperty = 'SetLinkmanProperty',
    /** Update message */
    UpdateMessage = 'UpdateMessage',
    /** Delete message */
    DeleteMessage = 'DeleteMessage',
    /** Socket connection successful */
    Connect = 'Connect',
    /** Socket disconnect */
    Disconnect = 'Disconnect',
    /** Aliyun OSS ready */
    Ready = 'Ready',
    /** Set typing status */
    SetTypingStatus = 'SetTypingStatus',
    /** Update message read status */
    UpdateMessageReadStatus = 'UpdateMessageReadStatus',
    /** Add community */
    AddCommunity = 'AddCommunity',
    /** Remove community */
    RemoveCommunity = 'RemoveCommunity',
    /** Update community */
    UpdateCommunity = 'UpdateCommunity',
    /** Set communities list */
    SetCommunities = 'SetCommunities',
    /** Add channel */
    AddChannel = 'AddChannel',
    /** Remove channel */
    RemoveChannel = 'RemoveChannel',
    /** Update channel */
    UpdateChannel = 'UpdateChannel',
    /** Set channels list */
    SetChannels = 'SetChannels',
}

export type SetGuestPayload = Group;

export type SetUserPayload = {
    _id: string;
    username: string;
    tag: string;
    avatar: string;
    groups: Group[];
    friends: Friend[];
    isAdmin: boolean;
};

export type UpdateUserInfoPayload = Object;

export interface SetStatusPayload {
    key: string;
    value: any;
}

export type SetAvatarPayload = string;

export interface AddLinkmanPayload {
    linkman: Linkman;
    focus: boolean;
}

export type SetFocusPayload = string;

export interface SetLinkmansLastMessagesPayload {
    [linkmanId: string]: {
        messages: Message[];
        unread: number;
    };
}

export interface AddLinkmanHistoryMessagesPayload {
    linkmanId: string;
    messages: Message[];
}

export interface AddLinkmanMessagePayload {
    linkmanId: string;
    message: Message;
}

export interface SetLinkmanPropertyPayload {
    linkmanId: string;
    key: string;
    value: any;
}

export type RemoveLinkmanPayload = string;

export interface UpdateMessagePayload {
    linkmanId: string;
    messageId: string;
    value: any;
}

export interface DeleteMessagePayload {
    linkmanId: string;
    messageId: string;
    shouldDelete: boolean;
}

export interface SetTypingStatusPayload {
    linkmanId: string;
    userId: string;
    username: string;
    isTyping: boolean;
}

export interface UpdateMessageReadStatusPayload {
    linkmanId: string;
    messageId: string;
    userId: string;
    status: 'delivered' | 'read';
}

export interface CommunityGroupPreview {
    _id: string;
    name: string;
    avatar?: string;
}

export interface CommunityMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

export interface Community {
    groups: any;
    _id: string;
    name: string;
    avatar: string;
    description: string;
    ownerId: string;
    members: CommunityMember[];
    announcementGroupId?: string;
    announcementGroup?: CommunityGroupPreview;
    groupPreviews?: CommunityGroupPreview[];
    hasMoreGroups?: boolean;
    hiddenGroupsCount?: number;
    membersCount: number;
    groupsCount: number;
    channelsCount: number;
    createTime: string;
    unread?: number; // Unread message count from all groups in the community
}

export interface Channel {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    creator: string;
    subscribers: string[];
    subscribersCount: number;
    createTime: string;
}

export type AddCommunityPayload = Community;
export type RemoveCommunityPayload = string;
export interface UpdateCommunityPayload {
    communityId: string;
    data: Partial<Community>;
}
export type SetCommunitiesPayload = Community[];

export type AddChannelPayload = Channel;
export type RemoveChannelPayload = string;
export interface UpdateChannelPayload {
    channelId: string;
    data: Partial<Channel>;
}
export type SetChannelsPayload = Channel[];

export interface Action {
    type: ActionTypes;
    payload:
        | SetUserPayload
        | UpdateUserInfoPayload
        | SetGuestPayload
        | SetStatusPayload
        | SetAvatarPayload
        | AddLinkmanPayload
        | SetFocusPayload
        | AddLinkmanHistoryMessagesPayload
        | AddLinkmanMessagePayload
        | SetLinkmanPropertyPayload
        | RemoveLinkmanPayload
        | SetLinkmansLastMessagesPayload
        | UpdateMessagePayload
        | DeleteMessagePayload
        | SetTypingStatusPayload
        | UpdateMessageReadStatusPayload
        | AddCommunityPayload
        | RemoveCommunityPayload
        | UpdateCommunityPayload
        | SetCommunitiesPayload
        | AddChannelPayload
        | RemoveChannelPayload
        | UpdateChannelPayload
        | SetChannelsPayload;
}
