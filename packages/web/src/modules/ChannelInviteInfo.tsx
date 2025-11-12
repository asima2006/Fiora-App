/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import fetch from '../utils/fetch';
import Dialog from '../components/Dialog';
import Avatar from '../components/Avatar';

import Style from './InfoDialog.less';
import { State } from '../state/reducer';
import Button from '../components/Button';
import { subscribeChannel, getLinkmanHistoryMessages } from '../service';
import useAction from '../hooks/useAction';

type ChannelBasicInfo = {
    name: string;
    avatar: string;
    subscribers?: string[] | number; // Can be array of IDs or count
    subscribersCount?: number;
};

function ChannelInviteInfo() {
    const channelId = window.sessionStorage.getItem('inviteChannelId') || '';
    const action = useAction();
    const [visible, updateVisible] = useState(!!channelId);
    const [channel, updateChannel] = useState<ChannelBasicInfo>();
    const [largerAvatar, toggleLargetAvatar] = useState(false);
    const selfId = useSelector((state: State) => state.user?._id);
    const hasLinkman = useSelector((state: State) => !!state.linkmans[channelId]);

    useEffect(() => {
        if (!channelId) {
            return;
        }
        // Only fetch channel info if user is logged in
        if (!selfId) {
            // Set a placeholder for non-logged-in users
            updateChannel({
                name: 'Channel',
                avatar: '',
                subscribersCount: 0,
            });
            return;
        }
        (async () => {
            const [error, channelInfo] = await fetch('getChannelBasicInfo', {
                channelId,
            });
            if (!error) {
                updateChannel((channelInfo as unknown) as ChannelBasicInfo);
            }
        })();
    }, [channelId, selfId]);

    function clearInviteId() {
        window.sessionStorage.removeItem('inviteChannelId');
    }

    function handleClose() {
        updateVisible(false);
    }

    async function handleSubscribeChannel() {
        const channelRes = await subscribeChannel(channelId);
        if (channelRes) {
            // Ensure the channel has all required properties
            const channelLinkman = {
                ...channelRes,
                type: 'channel',
                messages: {},
                unread: 0,
            };
            action.addLinkman(channelLinkman, true);

            const messages = await getLinkmanHistoryMessages(channelId, 0);
            if (messages) {
                action.addLinkmanHistoryMessages(channelId, messages);
            }
        }
        clearInviteId();
        handleClose();
    }

    function handleFocusChannel() {
        action.setFocus(channelId);
        clearInviteId();
        handleClose();
    }

    return (
        <Dialog
            className={Style.infoDialog}
            visible={visible}
            onClose={handleClose}
            title="Invite you to subscribe to the channel"
        >
            {visible && channel && (
                <div className={Style.coantainer}>
                    <div className={Style.header}>
                        <Avatar
                            size={60}
                            src={channel.avatar}
                            onMouseEnter={() => toggleLargetAvatar(true)}
                            onMouseLeave={() => toggleLargetAvatar(false)}
                        />
                        <img
                            className={`${Style.largeAvatar} ${
                                largerAvatar ? 'show' : 'hide'
                            }`}
                            src={channel.avatar}
                            alt="Channel Avatar"
                        />
                        <p>{channel.name}</p>
                    </div>
                    <div className={Style.info}>
                        {selfId && (
                            <div className={Style.onlineStatus}>
                                <p className={Style.onlineText}>Subscribers:</p>
                                <div>
                                    {channel.subscribersCount !== undefined 
                                        ? channel.subscribersCount 
                                        : Array.isArray(channel.subscribers) 
                                            ? channel.subscribers.length 
                                            : channel.subscribers || 0
                                    } people
                                </div>
                            </div>
                        )}
                        {selfId ? (
                            hasLinkman ? (
                                <Button onClick={handleFocusChannel}>
                                    View Channel
                                </Button>
                            ) : (
                                <Button onClick={handleSubscribeChannel}>
                                    Subscribe
                                </Button>
                            )
                        ) : (
                            <Button
                                onClick={() =>
                                    action.setStatus(
                                        'loginRegisterDialogVisible',
                                        true,
                                    )
                                }
                            >
                                Login / Register
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

export default ChannelInviteInfo;
