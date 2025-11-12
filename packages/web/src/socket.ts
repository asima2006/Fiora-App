import IO from 'socket.io-client';
import platform from 'platform';

import convertMessage from '@fiora/utils/convertMessage';
import getFriendId from '@fiora/utils/getFriendId';
import config from '@fiora/config/client';
import notification from './utils/notification';
import voice from './utils/voice';
import { initOSS } from './utils/uploadFile';
import playSound from './utils/playSound';
import { Message, Linkman } from './state/reducer';
import {
    ActionTypes,
    SetLinkmanPropertyPayload,
    AddLinkmanHistoryMessagesPayload,
    AddLinkmanMessagePayload,
    DeleteMessagePayload,
} from './state/action';
import {
    guest,
    loginByToken,
    getLinkmanHistoryMessages,
    getLinkmansLastMessagesV2,
    getSubscribedChannels,
} from './service';
import store from './state/store';

const { dispatch } = store;

const options = {
    // reconnectionDelay: 1000,
};

// Resolve server URL robustly in browser: if config.server points to localhost
// but the page is served from a remote host, replace localhost with the
// current page hostname so the client connects back to the real server.
function resolveServerUrl(raw: string) {
    if (!raw) return raw;
    let url = raw;
    // If schema-less (//host:port), add current page protocol
    if (url.startsWith('//')) {
        url = `${window.location.protocol}${url}`;
    }
    try {
        const parsed = new URL(url, window.location.href);
        // If config uses localhost but page is not localhost, swap to page host
        if (parsed.hostname === 'localhost' && window.location.hostname !== 'localhost') {
            parsed.hostname = window.location.hostname;
            // keep port from parsed
            return parsed.toString();
        }
        return parsed.toString();
    } catch (e) {
        // fallback: simple replace
        if (url.indexOf('localhost') !== -1 && window.location.hostname !== 'localhost') {
            return url.replace(/localhost/g, window.location.hostname);
        }
        return url;
    }
}

const serverUrl = resolveServerUrl(config.server);
console.info('[socket] connecting to', serverUrl);
const socket = IO(serverUrl, options);

async function loginFailback() {
    const defaultGroup = await guest(
        platform.os?.family,
        platform.name,
        platform.description,
    );
    if (defaultGroup) {
        const { messages } = defaultGroup;
        dispatch({
            type: ActionTypes.SetGuest,
            payload: defaultGroup,
        });

        messages.forEach(convertMessage);
        dispatch({
            type: ActionTypes.AddLinkmanHistoryMessages,
            payload: {
                linkmanId: defaultGroup._id,
                messages,
            },
        });
    }
}

socket.on('connect', async () => {
    dispatch({ type: ActionTypes.Connect, payload: '' });

    await initOSS();
    dispatch({ type: ActionTypes.Ready, payload: '' });

    const token = window.localStorage.getItem('token');
    if (token) {
        const user = await loginByToken(
            token,
            platform.os?.family,
            platform.name,
            platform.description,
        );
        if (user) {
            dispatch({
                type: ActionTypes.SetUser,
                payload: user,
            });
            const linkmanIds = [
                ...user.groups.map((group: any) => group._id),
                ...user.friends.map((friend: any) =>
                    getFriendId(friend.from, friend.to._id),
                ),
            ];
            
            // Fetch subscribed channels
            const [, channels] = await getSubscribedChannels();
            if (channels && channels.length > 0) {
                dispatch({
                    type: ActionTypes.SetChannels,
                    payload: channels,
                });
                // Add channel IDs to linkmanIds to fetch their messages
                linkmanIds.push(...channels.map((channel: any) => channel._id));
            }
            
            const linkmanMessages = await getLinkmansLastMessagesV2(linkmanIds);
            Object.values(linkmanMessages).forEach(
                // @ts-ignore
                ({ messages }: { messages: Message[] }) => {
                    messages.forEach(convertMessage);
                },
            );
            dispatch({
                type: ActionTypes.SetLinkmansLastMessages,
                payload: linkmanMessages,
            });
            return;
        }
    }
    loginFailback();
});

socket.on('disconnect', () => {
    // @ts-ignore
    dispatch({ type: ActionTypes.Disconnect, payload: null });
});

let windowStatus = 'focus';
window.onfocus = () => {
    windowStatus = 'focus';
};
window.onblur = () => {
    windowStatus = 'blur';
};

let prevFrom: string | null = '';
let prevName = '';
socket.on('message', async (message: any) => {
    convertMessage(message);

    const state = store.getState();
    const isSelfMessage = message.from._id === state.user?._id;
    if (isSelfMessage && message.from.tag !== state.user?.tag) {
        dispatch({
            type: ActionTypes.UpdateUserInfo,
            payload: {
                tag: message.from.tag,
            },
        });
    }

    const linkman = state.linkmans[message.to];
    let title = '';
    if (linkman) {
        dispatch({
            type: ActionTypes.AddLinkmanMessage,
            payload: {
                linkmanId: message.to,
                message,
            } as AddLinkmanMessagePayload,
        });
        if (linkman.type === 'group') {
            title = `${message.from.username} said to everyone in ${linkman.name}:`;
        } else if (linkman.type === 'channel') {
            title = `${message.from.username} posted in ${linkman.name}:`;
        } else {
            title = `${message.from.username} said to you:`;
        }
    } else {
        // Contact does not exist and is a message sent by oneself, do not create new contact
        if (isSelfMessage) {
            return;
        }
        const newLinkman = {
            _id: getFriendId(state.user?._id as string, message.from._id),
            type: 'temporary',
            createTime: Date.now(),
            avatar: message.from.avatar,
            name: message.from.username,
            messages: [],
            unread: 1,
        };
        dispatch({
            type: ActionTypes.AddLinkman,
            payload: {
                linkman: newLinkman as unknown as Linkman,
                focus: false,
            },
        });
        title = `${message.from.username} said to you:`;

        const messages = await getLinkmanHistoryMessages(newLinkman._id, 0);
        if (messages) {
            dispatch({
                type: ActionTypes.AddLinkmanHistoryMessages,
                payload: {
                    linkmanId: newLinkman._id,
                    messages,
                } as AddLinkmanHistoryMessagesPayload,
            });
        }
    }

    if (windowStatus === 'blur' && state.status.notificationSwitch) {
        notification(
            title,
            message.from.avatar,
            message.type === 'text'
                ? message.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                : `[${message.type}]`,
            Math.random().toString(),
        );
    }

    if (state.status.soundSwitch) {
        const soundType = state.status.sound;
        playSound(soundType);
    }

    if (state.status.voiceSwitch) {
        if (message.type === 'text') {
            const text = message.content
                .replace(
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
                    '',
                )
                .replace(/#/g, '');

            if (text.length > 100) {
                return;
            }

            const from =
                // eslint-disable-next-line no-nested-ternary
                linkman && linkman.type === 'group'
                    ? `${message.from.username}${
                        linkman.name === prevName ? '' : ` in ${linkman.name}`
                    } said`
                    : linkman && linkman.type === 'channel'
                        ? `${message.from.username}${
                            linkman.name === prevName ? '' : ` in ${linkman.name}`
                        } posted`
                        : `${message.from.username} said to you`;
            if (text) {
                voice.push(
                    from !== prevFrom ? from + text : text,
                    message.from.username,
                );
            }
            prevFrom = from;
            prevName = message.from.username;
        } else if (message.type === 'system') {
            voice.push(message.from.originUsername + message.content, '');
            prevFrom = null;
        }
    }
});

socket.on(
    'changeGroupName',
    ({ groupId, name }: { groupId: string; name: string }) => {
        dispatch({
            type: ActionTypes.SetLinkmanProperty,
            payload: {
                linkmanId: groupId,
                key: 'name',
                value: name,
            } as SetLinkmanPropertyPayload,
        });
    },
);

socket.on('deleteGroup', ({ groupId }: { groupId: string }) => {
    dispatch({
        type: ActionTypes.RemoveLinkman,
        payload: groupId,
    });
});

socket.on('changeTag', (tag: string) => {
    dispatch({
        type: ActionTypes.UpdateUserInfo,
        payload: {
            tag,
        },
    });
});

socket.on(
    'deleteMessage',
    ({
        linkmanId,
        messageId,
        isAdmin,
    }: {
        linkmanId: string;
        messageId: string;
        isAdmin: boolean;
    }) => {
        dispatch({
            type: ActionTypes.DeleteMessage,
            payload: {
                linkmanId,
                messageId,
                shouldDelete: isAdmin,
            } as DeleteMessagePayload,
        });
    },
);

// Real-time enhancements
socket.on(
    'typing',
    ({
        userId,
        username,
        linkmanId,
        isTyping,
    }: {
        userId: string;
        username: string;
        linkmanId: string;
        isTyping: boolean;
    }) => {
        dispatch({
            type: ActionTypes.SetTypingStatus,
            payload: {
                linkmanId,
                userId,
                username,
                isTyping,
            },
        });
    },
);

socket.on(
    'readReceipt',
    ({
        messageId,
        linkmanId,
        userId,
    }: {
        messageId: string;
        linkmanId: string;
        userId: string;
    }) => {
        dispatch({
            type: ActionTypes.UpdateMessageReadStatus,
            payload: {
                linkmanId,
                messageId,
                userId,
                status: 'read',
            },
        });
    },
);

socket.on(
    'deliveryReceipt',
    ({
        messageId,
        linkmanId,
        userId,
    }: {
        messageId: string;
        linkmanId: string;
        userId: string;
    }) => {
        dispatch({
            type: ActionTypes.UpdateMessageReadStatus,
            payload: {
                linkmanId,
                messageId,
                userId,
                status: 'delivered',
            },
        });
    },
);

export default socket;
