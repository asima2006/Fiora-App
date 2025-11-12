import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import fetch from '../../utils/fetch';
import { State } from '../../state/reducer';
import './ChannelList.less';

interface Channel {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    subscribersCount: number;
    createTime: string;
}

function ChannelList() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<Channel[]>([]);
    const isLogin = useSelector((state: State) => !!state.user);

    // Get subscribed channels
    useEffect(() => {
        if (!isLogin) return;

        async function fetchChannels() {
            const result = await fetch('getSubscribedChannels', {});
            if (result) {
                setChannels(result as Channel[]);
            }
        }
        fetchChannels();
    }, [isLogin]);

    // Search channels
    const handleSearch = async () => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        const result = await fetch('searchChannels', { searchText });
        if (result) {
            setSearchResults(result as Channel[]);
        }
    };

    // Subscribe to channel
    const handleSubscribe = async (channelId: string) => {
        const result = await fetch('subscribeChannel', { channelId });
        if (result) {
            // Refresh channel list
            const updated = await fetch('getSubscribedChannels', {});
            if (updated) {
                setChannels(updated as Channel[]);
            }
            setSearchResults([]);
            setSearchText('');
        }
    };

    // Unsubscribe from channel
    const handleUnsubscribe = async (channelId: string) => {
        const result = await fetch('unsubscribeChannel', { channelId });
        if (result) {
            setChannels(channels.filter((c) => c._id !== channelId));
        }
    };

    if (!isLogin) {
        return (
            <div className="channel-list">
                <div className="channel-empty">Please login first to view channels</div>
            </div>
        );
    }

    return (
        <div className="channel-list">
            <div className="channel-header">
                <h3>Channel List</h3>
                <div className="channel-search">
                    <input
                        type="text"
                        placeholder="Search channels..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                    />
                    {/* eslint-disable-next-line react/button-has-type */}
                    <button onClick={handleSearch}>Search</button>
                </div>
            </div>

            {searchResults.length > 0 && (
                <div className="channel-search-results">
                    <h4>Search Results</h4>
                    {searchResults.map((channel) => {
                        const isSubscribed = channels.some(
                            (c) => c._id === channel._id,
                        );
                        return (
                            <div key={channel._id} className="channel-item">
                                <img
                                    src={channel.avatar}
                                    alt={channel.name}
                                    className="channel-avatar"
                                />
                                <div className="channel-info">
                                    <div className="channel-name">
                                        {channel.name}
                                    </div>
                                    <div className="channel-description">
                                        {channel.description}
                                    </div>
                                    <div className="channel-stats">
                                        {channel.subscribersCount} subscribers
                                    </div>
                                </div>
                                {!isSubscribed && (
                                    /* eslint-disable-next-line react/button-has-type */
                                    <button
                                        className="channel-subscribe-btn"
                                        onClick={() =>
                                            handleSubscribe(channel._id)
                                        }
                                    >
                                        Subscribe
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="channel-subscribed">
                <h4>My Subscriptions</h4>
                {channels.length === 0 ? (
                    <div className="channel-empty">
                        No subscribed channels yet, try the search function
                    </div>
                ) : (
                    channels.map((channel) => (
                        <div key={channel._id} className="channel-item">
                            <img
                                src={channel.avatar}
                                alt={channel.name}
                                className="channel-avatar"
                            />
                            <div className="channel-info">
                                <div className="channel-name">
                                    {channel.name}
                                </div>
                                <div className="channel-description">
                                    {channel.description}
                                </div>
                                <div className="channel-stats">
                                    {channel.subscribersCount} subscribers
                                </div>
                            </div>
                            {/* eslint-disable-next-line react/button-has-type */}
                            <button
                                className="channel-unsubscribe-btn"
                                onClick={() => handleUnsubscribe(channel._id)}
                            >
                                Unsubscribe
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ChannelList;
