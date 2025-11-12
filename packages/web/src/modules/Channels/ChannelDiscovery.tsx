import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAllChannels } from '../../service';
import Message from '../../components/Message';
import LinkmanComponent from '../FunctionBarAndLinkmanList/Linkman';
import CreateChannelDialog from './CreateChannelDialog';
import useAction from '../../hooks/useAction';
import { State } from '../../state/reducer';

import Style from './ChannelDiscovery.less';

interface Channel {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    subscribersCount: number;
    verified: boolean;
    isSubscribed: boolean;
    creator?: string;
    createTime?: string;
}

interface ChannelDiscoveryProps {
    onChannelClick?: (channel: Channel) => void;
}

function ChannelDiscovery({ onChannelClick }: ChannelDiscoveryProps) {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const action = useAction();
    const linkmans = useSelector((state: State) => state.linkmans);

    async function loadChannels() {
        setLoading(true);
        const [err, result] = await getAllChannels();
        setLoading(false);

        if (err) {
            Message.error('Failed to load channels');
            return;
        }

        setChannels(result as Channel[]);
    }

    useEffect(() => {
        loadChannels();
    }, []);

    function formatFollowerCount(count: number): string {
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    }

    return (
        <div className={Style.channelDiscovery}>
            <div className={Style.searchBar}>
                <input
                    type="text"
                    placeholder="Search channels"
                    className={Style.searchInput}
                />
                <button 
                    type="button" 
                    className={Style.createButton}
                    onClick={() => setShowCreateDialog(true)}
                    title="Create new channel"
                >
                    <span>+</span>
                </button>
            </div>

            <div className={Style.discoveryContent}>
                {loading && (
                    <div className={Style.centerMessage}>
                        <div className={Style.loading}>Loading channels...</div>
                    </div>
                )}
                
                {!loading && channels.length === 0 && (
                    <div className={Style.centerMessage}>
                        <h3>Stay updated on your favorite topics</h3>
                        <p>Find channels to follow below</p>
                        <div className={Style.noChannelsMessage}>No channels available</div>
                    </div>
                )}

                {!loading && channels.length > 0 && (
                    <div className={Style.channelList}>
                        {channels.map((channel) => (
                            <LinkmanComponent
                                key={channel._id}
                                id={channel._id}
                                name={channel.name}
                                avatar={channel.avatar}
                                preview={`${formatFollowerCount(channel.subscribersCount)} followers${channel.verified ? ' ✓' : ''}`}
                                time={new Date()}
                                unread={0}
                                type="group"
                                onClick={() => {
                                    if (onChannelClick) {
                                        onChannelClick(channel);
                                    } else {
                                        // Check if channel is already in linkmans, if not add it first
                                        if (!linkmans[channel._id]) {
                                            // Add channel to Redux state with required properties
                                            action.addChannel({
                                                ...channel,
                                                creator: channel.creator || '',
                                                createTime: channel.createTime || new Date().toISOString(),
                                                subscribers: []
                                            });
                                        }
                                        // Open channel chat by setting focus
                                        action.setFocus(channel._id);
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CreateChannelDialog
                visible={showCreateDialog}
                onClose={() => {
                    setShowCreateDialog(false);
                    loadChannels(); // Refresh channel list after creating
                }}
            />
        </div>
    );
}

export default ChannelDiscovery;
