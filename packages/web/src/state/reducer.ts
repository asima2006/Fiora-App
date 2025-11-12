import { isMobile } from '@fiora/utils/ua';
import getFriendId from '@fiora/utils/getFriendId';
import convertMessage from '@fiora/utils/convertMessage';
import getData from '../localStorage';
import {
    Action,
    ActionTypes,
    SetUserPayload,
    SetStatusPayload,
    AddLinkmanPayload,
    AddLinkmanHistoryMessagesPayload,
    SetLinkmansLastMessagesPayload,
    SetLinkmanPropertyPayload,
    UpdateMessagePayload,
    AddLinkmanMessagePayload,
    UpdateUserInfoPayload,
    DeleteMessagePayload,
    SetTypingStatusPayload,
    Community,
    Channel,
    AddCommunityPayload,
    RemoveCommunityPayload,
    UpdateCommunityPayload,
    SetCommunitiesPayload,
    AddChannelPayload,
    RemoveChannelPayload,
    UpdateChannelPayload,
    SetChannelsPayload,
} from './action';

/** Chat messages */
export interface Message {
    _id: string;
    type: string;
    content: string;
    from: {
        _id: string;
        username: string;
        avatar: string;
        originUsername: string;
        tag: string;
    };
    loading: boolean;
    percent: number;
    createTime: string;
    deleted?: boolean;
}

export interface MessagesMap {
    [messageId: string]: Message;
}

export interface GroupMember {
    user: {
        _id: string;
        username: string;
        avatar: string;
    };
    os: string;
    browser: string;
    environment: string;
}

/** Groups */
export interface Group {
    _id: string;
    name: string;
    avatar: string;
    createTime: string;
    creator: string;
    onlineMembers: GroupMember[];
    subscribers?: string[]; // For channels - array of subscriber IDs
}

/** Friends */
export interface Friend {
    _id: string;
    name: string;
    avatar: string;
    createTime: string;
}

/** Contacts */
export interface Linkman extends Group, User {
    type: string;
    unread: number;
    messages: MessagesMap;
    typingUsers?: { [userId: string]: string }; // Maps userId to username for typing indicator
}

export interface LinkmansMap {
    [linkmanId: string]: Linkman;
}

/** User information */
export interface User {
    _id: string;
    username: string;
    avatar: string;
    isOnline: boolean;
}

/** redux store state */
export interface State {
    /** User information */
    user: {
        _id: string;
        username: string;
        avatar: string;
        tag: string;
        isAdmin: boolean;
    } | null;
    linkmans: LinkmansMap;
    /** Focused contact */
    focus: string;
    /** Client connection status */
    connect: boolean;
    /** Communities list */
    communities: Community[];
    /** Channels list */
    channels: Channel[];
    /** Some status values of the client */
    status: {
        ready: boolean;
        /** Whether to show login register dialog */
        loginRegisterDialogVisible: boolean;
        /** Theme */
        theme: string;
        /** Theme primary color */
        primaryColor: string;
        /** Theme primary text color */
        primaryTextColor: string;
        /** Background image */
        backgroundImage: string;
        /** Enable aero effect */
        aero: boolean;
        /** New message sound notification switch */
        soundSwitch: boolean;
        /** Sound type */
        sound: string;
        /** New message desktop notification switch */
        notificationSwitch: boolean;
        /** New message voice reading switch */
        voiceSwitch: boolean;
        /** Whether to read aloud messages sent by oneself switch */
        selfVoiceSwitch: boolean;
        /**
         * User tag color mode
         * singleColor: fixed color
         * fixedColor: same word always same color
         * randomColor: same word keeps same color in each render
         */
        tagColorMode: string;
        /** Whether to show sidebar */
        sidebarVisible: boolean;
        /** Whether to show search + contact list bar */
        functionBarAndLinkmanListVisible: boolean;
        /** enable search expression when input some phrase */
        enableSearchExpression: boolean;
        /** Chat filter type: 'all', 'groups', 'friends', 'communities', 'channels' */
        chatFilter: string;
        /** Currently opened community when viewing communities */
        activeCommunityId: string;
    };
}

/**
 * Convert contacts to object structure with _id as key
 * @param linkmans Contact array
 */
function getLinkmansMap(linkmans: Linkman[]) {
    return linkmans.reduce((map: LinkmansMap, linkman) => {
        map[linkman._id] = linkman;
        return map;
    }, {});
}

/**
 * Convert messages to object structure with _id as key
 * @param messages Message array
 */
function getMessagesMap(messages: Message[]) {
    return messages.reduce((map: MessagesMap, message) => {
        map[message._id] = message;
        return map;
    }, {});
}

/**
 * Delete multiple key-value pairs in object
 * @param obj Target object
 * @param keys List of keys to delete
 */
function deleteObjectKeys<T extends Record<string, any>>(obj: T, keys: string[]): T {
    let entries = Object.entries(obj);
    const keysSet = new Set(keys);
    entries = entries.filter((entry) => !keysSet.has(entry[0]));
    return entries.reduce((result: any, entry) => {
        const [k, v] = entry;
        result[k] = v;
        return result;
    }, {});
}

/**
 * Delete a certain key-value pair in object
 * Directly calling delete to delete key-value pairs is said to have poor performance (I haven't verified)
 * @param obj Target object
 * @param key Key to delete
 */
function deleteObjectKey<T extends Record<string, any>>(obj: T, key: string): T {
    return deleteObjectKeys(obj, [key]);
}

/**
 * Initialize some common fields of contact
 * @param linkman Contact
 * @param type Contact type
 */
function initLinkmanFields(linkman: Linkman, type: string) {
    linkman.type = type;
    linkman.unread = 0;
    linkman.messages = {};
}

/**
 * Convert group data structure
 * @param group Group
 */
function transformGroup(group: Linkman): Linkman {
    initLinkmanFields(group, 'group');
    group.creator = group.creator || '';
    group.onlineMembers = [];
    return group;
}

/**
 * Convert friend data structure
 * @param friend Friend
 */
function transformFriend(friend: Linkman): Linkman {
    // @ts-ignore
    const { from, to } = friend;
    const transformedFriend = {
        _id: getFriendId(from, to._id),
        name: to.username,
        avatar: to.avatar,
        // @ts-ignore
        createTime: friend.createTime,
    };
    initLinkmanFields(transformedFriend as unknown as Linkman, 'friend');
    return transformedFriend as Linkman;
}

function transformTemporary(temporary: Linkman): Linkman {
    initLinkmanFields(temporary, 'temporary');
    return temporary;
}

const localStorage = getData();
export const initialState: State = {
    user: null,
    linkmans: {},
    focus: '',
    connect: false,
    communities: [],
    channels: [],
    status: {
        ready: false,
        loginRegisterDialogVisible: false,
        theme: localStorage.theme,
        primaryColor: localStorage.primaryColor,
        primaryTextColor: localStorage.primaryTextColor,
        backgroundImage: localStorage.backgroundImage,
        aero: localStorage.aero,
        soundSwitch: localStorage.soundSwitch,
        sound: localStorage.sound,
        notificationSwitch: localStorage.notificationSwitch,
        voiceSwitch: localStorage.voiceSwitch,
        selfVoiceSwitch: localStorage.selfVoiceSwitch,
        tagColorMode: localStorage.tagColorMode,
        sidebarVisible: !isMobile,
        functionBarAndLinkmanListVisible: !isMobile,
        enableSearchExpression: localStorage.enableSearchExpression,
        chatFilter: 'all',
        activeCommunityId: '',
    },
};

function reducer(state: State = initialState, action: Action): State {
    switch (action.type) {
        case ActionTypes.Ready: {
            return {
                ...state,
                status: {
                    ...state.status,
                    ready: true,
                },
            };
        }
        case ActionTypes.Connect: {
            return {
                ...state,
                connect: true,
            };
        }
        case ActionTypes.Disconnect: {
            return {
                ...state,
                connect: false,
            };
        }

        case ActionTypes.SetGuest: {
            const group = action.payload as Linkman;
            transformGroup(group);
            return {
                ...state,
                user: {
                    _id: '',
                    username: '',
                    avatar: '',
                    tag: '',
                    isAdmin: false,
                },
                linkmans: {
                    [group._id]: group,
                },
                focus: group._id,
            };
        }

        case ActionTypes.SetUser: {
            const { _id, username, avatar, tag, groups, friends, isAdmin } =
                action.payload as SetUserPayload;
            // @ts-ignore
            const linkmans: Linkman[] = [
                // @ts-ignore
                ...groups.map(transformGroup),
                // @ts-ignore
                ...friends.map(transformFriend),
            ];

            // If not logged in before, set the focused contact to the first contact
            let { focus } = state;
            /* istanbul ignore next */
            if (!state.user && linkmans.length > 0) {
                focus = linkmans[0]._id;
            }

            return {
                ...state,
                user: {
                    _id,
                    username,
                    avatar,
                    tag,
                    isAdmin,
                },
                linkmans: getLinkmansMap(linkmans),
                focus,
            };
        }

        case ActionTypes.UpdateUserInfo: {
            const payload = action.payload as UpdateUserInfoPayload;
            return {
                ...state,
                // @ts-ignore
                user: {
                    ...state.user,
                    ...payload,
                },
            };
        }

        case ActionTypes.Logout: {
            return {
                ...initialState,
                status: {
                    ...state.status,
                },
            };
        }

        case ActionTypes.SetAvatar: {
            return {
                ...state,
                // @ts-ignore
                user: {
                    ...state.user,
                    avatar: action.payload as string,
                },
            };
        }

        case ActionTypes.SetFocus: {
            const focus = action.payload as string;
            if (!state.linkmans[focus]) {
                /* istanbul ignore next */
                if (!__TEST__) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `ActionTypes.SetFocus Error: 联系人 ${focus} 不存在`,
                    );
                }
                return state;
            }

            /**
             * 为了优化性能
             * 如果目标联系人的旧消息个数超过50条, 仅保留50条
             */
            const { messages } = state.linkmans[focus];
            const messageKeys = Object.keys(messages);
            let reserveMessages = messages;
            if (messageKeys.length > 50) {
                reserveMessages = deleteObjectKeys(
                    messages,
                    messageKeys.slice(0, messageKeys.length - 50),
                );
            }

            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [focus]: {
                        ...state.linkmans[focus],
                        messages: reserveMessages,
                        unread: 0,
                    },
                },
                focus,
            };
        }

        case ActionTypes.AddLinkman: {
            const payload = action.payload as AddLinkmanPayload;
            const { linkman } = payload;
            const focus = payload.focus ? linkman._id : state.focus;

            let transformedLinkman = linkman;
            switch (linkman.type) {
                case 'group': {
                    transformedLinkman = transformGroup(linkman);
                    break;
                }
                case 'friend': {
                    transformedLinkman = transformFriend(linkman);
                    break;
                }
                case 'temporary': {
                    transformedLinkman = transformTemporary(linkman);
                    transformedLinkman.unread = 1;
                    break;
                }
                case 'channel': {
                    // Channel already has all required fields from the API
                    initLinkmanFields(linkman, 'channel');
                    transformedLinkman = linkman;
                    break;
                }
                default: {
                    return state;
                }
            }

            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [transformedLinkman._id]: transformedLinkman,
                },
                focus,
            };
        }

        case ActionTypes.RemoveLinkman: {
            const linkmans = deleteObjectKey(
                state.linkmans,
                action.payload as string,
            );
            const linkmanIds = Object.keys(linkmans);
            const focus = linkmanIds.length > 0 ? linkmanIds[0] : '';
            return {
                ...state,
                linkmans: {
                    ...linkmans,
                },
                focus,
            };
        }

        case ActionTypes.SetLinkmansLastMessages: {
            const linkmansMessages =
                action.payload as SetLinkmansLastMessagesPayload;
            const { linkmans } = state;
            const newState = { ...state, linkmans: {} };
            
            Object.keys(linkmans).forEach((linkmanId) => {
                // @ts-ignore
                newState.linkmans[linkmanId] = {
                    ...linkmans[linkmanId],
                    ...(linkmansMessages[linkmanId]
                        ? {
                            messages: getMessagesMap(
                                linkmansMessages[linkmanId].messages,
                            ),
                            unread: linkmansMessages[linkmanId].unread,
                        }
                        : {}),
                };
            });
            return newState;
        }

        case ActionTypes.AddLinkmanHistoryMessages: {
            const payload = action.payload as AddLinkmanHistoryMessagesPayload;
            const messagesMap = getMessagesMap(payload.messages);
            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [payload.linkmanId]: {
                        ...state.linkmans[payload.linkmanId],
                        messages: {
                            ...messagesMap,
                            ...state.linkmans[payload.linkmanId].messages,
                        },
                    },
                },
            };
        }

        case ActionTypes.AddLinkmanMessage: {
            const payload = action.payload as AddLinkmanMessagePayload;
            let { unread } = state.linkmans[payload.linkmanId];
            if (state.focus !== payload.linkmanId) {
                unread++;
            }
            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [payload.linkmanId]: {
                        ...state.linkmans[payload.linkmanId],
                        messages: {
                            ...state.linkmans[payload.linkmanId].messages,
                            [payload.message._id]: payload.message,
                        },
                        unread,
                    },
                },
            };
        }

        case ActionTypes.DeleteMessage: {
            const { linkmanId, messageId, shouldDelete } =
                action.payload as DeleteMessagePayload;
            if (!state.linkmans[linkmanId]) {
                /* istanbul ignore next */
                if (!__TEST__) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `ActionTypes.DeleteMessage Error: 联系人 ${linkmanId} 不存在`,
                    );
                }
                return state;
            }

            const newMessages = shouldDelete
                ? deleteObjectKey(state.linkmans[linkmanId].messages, messageId)
                : {
                    ...state.linkmans[linkmanId].messages,
                    [messageId]: convertMessage({
                        ...state.linkmans[linkmanId].messages[messageId],
                        deleted: true,
                    }),
                };

            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [linkmanId]: {
                        ...state.linkmans[linkmanId],
                        messages: newMessages,
                    },
                },
            };
        }

        case ActionTypes.SetLinkmanProperty: {
            const payload = action.payload as SetLinkmanPropertyPayload;
            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [payload.linkmanId]: {
                        ...state.linkmans[payload.linkmanId],
                        [payload.key]: payload.value,
                    },
                },
            };
        }

        case ActionTypes.UpdateMessage: {
            const payload = action.payload as UpdateMessagePayload;

            let messages = {};
            if (payload.value._id) {
                messages = {
                    ...deleteObjectKey(
                        state.linkmans[payload.linkmanId].messages,
                        payload.messageId,
                    ),
                    [payload.value._id]: payload.value,
                };
            } else {
                messages = {
                    ...state.linkmans[payload.linkmanId].messages,
                    [payload.messageId]: {
                        ...state.linkmans[payload.linkmanId].messages[
                            payload.messageId
                        ],
                        ...payload.value,
                    },
                };
            }

            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [payload.linkmanId]: {
                        ...state.linkmans[payload.linkmanId],
                        messages,
                    },
                },
            };
        }

        case ActionTypes.SetStatus: {
            const payload = action.payload as SetStatusPayload;
            return {
                ...state,
                status: {
                    ...state.status,
                    [payload.key]: payload.value,
                },
            };
        }

        case ActionTypes.SetTypingStatus: {
            const payload = action.payload as SetTypingStatusPayload;
            const linkman = state.linkmans[payload.linkmanId];
            if (!linkman) {
                return state;
            }

            const typingUsers = { ...(linkman.typingUsers || {}) };
            
            if (payload.isTyping) {
                // Add user to typing list with their username
                typingUsers[payload.userId] = payload.username;
            } else {
                // Remove user from typing list
                delete typingUsers[payload.userId];
            }

            return {
                ...state,
                linkmans: {
                    ...state.linkmans,
                    [payload.linkmanId]: {
                        ...linkman,
                        typingUsers: Object.keys(typingUsers).length > 0 ? typingUsers : undefined,
                    },
                },
            };
        }

        case ActionTypes.SetCommunities: {
            const payload = action.payload as SetCommunitiesPayload;
            return {
                ...state,
                communities: payload,
            };
        }

        case ActionTypes.AddCommunity: {
            const payload = action.payload as AddCommunityPayload;
            return {
                ...state,
                communities: [...state.communities, payload],
            };
        }

        case ActionTypes.RemoveCommunity: {
            const payload = action.payload as RemoveCommunityPayload;
            return {
                ...state,
                communities: state.communities.filter(c => c._id !== payload),
            };
        }

        case ActionTypes.UpdateCommunity: {
            const payload = action.payload as UpdateCommunityPayload;
            return {
                ...state,
                communities: state.communities.map(c => 
                    c._id === payload.communityId 
                        ? { ...c, ...payload.data }
                        : c
                ),
            };
        }

        case ActionTypes.SetChannels: {
            const payload = action.payload as SetChannelsPayload;
            
            // Add all channels to linkmans so they can be focused
            // Preserve existing messages and unread count if linkman already exists
            const channelLinkmans = payload.reduce((acc: any, channel: any) => {
                const existingLinkman = state.linkmans[channel._id];
                acc[channel._id] = {
                    _id: channel._id,
                    name: channel.name,
                    avatar: channel.avatar,
                    type: 'channel',
                    createTime: channel.createTime || new Date().toISOString(),
                    creator: channel.creator || '',
                    subscribers: channel.subscribers || [],
                    onlineMembers: existingLinkman?.onlineMembers || [],
                    username: channel.name,
                    isOnline: false,
                    // Preserve existing messages and unread if they exist
                    messages: existingLinkman?.messages || {},
                    unread: existingLinkman?.unread || 0,
                };
                return acc;
            }, {});
            
            return {
                ...state,
                channels: payload,
                linkmans: {
                    ...state.linkmans,
                    ...channelLinkmans,
                },
            };
        }

        case ActionTypes.AddChannel: {
            const payload = action.payload as AddChannelPayload;
            
            // Add channel to linkmans so it can be focused
            const channelLinkman = {
                _id: payload._id,
                name: payload.name,
                avatar: payload.avatar,
                type: 'channel' as const,
                createTime: new Date().toISOString(),
                creator: payload.creator || '',
                subscribers: payload.subscribers || [],
                onlineMembers: [],
                username: payload.name,
                isOnline: false,
                messages: {},
                unread: 0,
            };
            
            return {
                ...state,
                channels: [...state.channels, payload],
                linkmans: {
                    ...state.linkmans,
                    [payload._id]: channelLinkman,
                },
            };
        }

        case ActionTypes.RemoveChannel: {
            const payload = action.payload as RemoveChannelPayload;
            
            // Remove channel from linkmans as well
            const newLinkmans = { ...state.linkmans };
            delete newLinkmans[payload];
            
            return {
                ...state,
                channels: state.channels.filter(ch => ch._id !== payload),
                linkmans: newLinkmans,
            };
        }

        case ActionTypes.UpdateChannel: {
            const payload = action.payload as UpdateChannelPayload;
            const updatedChannels = state.channels.map(ch => 
                ch._id === payload.channelId 
                    ? { ...ch, ...payload.data }
                    : ch
            );
            
            // Also update the linkman if it exists
            const linkman = state.linkmans[payload.channelId];
            const updatedLinkmans = linkman ? {
                ...state.linkmans,
                [payload.channelId]: {
                    ...linkman,
                    ...payload.data,
                }
            } : state.linkmans;
            
            return {
                ...state,
                channels: updatedChannels,
                linkmans: updatedLinkmans,
            };
        }

        default:
            return state;
    }
}

export default reducer;
