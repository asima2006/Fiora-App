/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/button-has-type */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import fetch from '../../utils/fetch';
import { State } from '../../state/reducer';
import './CommunityList.less';

interface Community {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    membersCount: number;
    groupsCount: number;
    channelsCount: number;
    createTime: string;
}

function CommunityList() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<Community[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCommunityName, setNewCommunityName] = useState('');
    const [newCommunityDescription, setNewCommunityDescription] = useState('');
    const isLogin = useSelector((state: State) => !!state.user);

    // Get my communities
    useEffect(() => {
        if (!isLogin) return;

        async function fetchCommunities() {
            const result = await fetch('getMyCommunities', {});
            if (result) {
                setCommunities(result as Community[]);
            }
        }
        fetchCommunities();
    }, [isLogin]);

    // Search communities
    const handleSearch = async () => {
        if (!searchText.trim()) {
            setSearchResults([]);
            return;
        }

        const result = await fetch('searchCommunities', { searchText });
        if (result) {
            setSearchResults(result as Community[]);
        }
    };

    // Create community
    const handleCreateCommunity = async () => {
        if (!newCommunityName.trim()) {
            return;
        }

        const result = await fetch('createCommunity', {
            name: newCommunityName,
            description: newCommunityDescription,
        });

        if (result) {
            // Refresh community list
            const updated = await fetch('getMyCommunities', {});
            if (updated) {
                setCommunities(updated as Community[]);
            }
            setShowCreateModal(false);
            setNewCommunityName('');
            setNewCommunityDescription('');
        }
    };

    // Join community
    const handleJoinCommunity = async (communityId: string) => {
        const result = await fetch('joinCommunity', { communityId });
        if (result) {
            // Refresh community list
            const updated = await fetch('getMyCommunities', {});
            if (updated) {
                setCommunities(updated as Community[]);
            }
            setSearchResults([]);
            setSearchText('');
        }
    };

    // Leave community
    const handleLeaveCommunity = async (communityId: string) => {
        // eslint-disable-next-line no-alert
        if (
            !window.confirm(
                'Are you sure you want to leave this community?',
            )
        ) {
            return;
        }

        const result = await fetch('leaveCommunity', { communityId });
        if (result) {
            setCommunities(communities.filter((c) => c._id !== communityId));
        }
    };

    if (!isLogin) {
        return (
            <div className="community-list">
                <div className="community-empty">
                    Please login first to view communities
                </div>
            </div>
        );
    }

    return (
        <div className="community-list">
            <div className="community-header">
                <h3>Community List</h3>
                <div className="community-actions">
                    <button
                        className="community-create-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + Create Community
                    </button>
                </div>
                <div className="community-search">
                    <input
                        type="text"
                        placeholder="Search communities..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                    />
                    <button onClick={handleSearch}>Search</button>
                </div>
            </div>

            {showCreateModal && (
                <div className="community-modal">
                    <div className="community-modal-content">
                        <h4>Create New Community</h4>
                        <div className="community-form">
                            <div className="community-form-group">
                                <label>Community Name *</label>
                                <input
                                    type="text"
                                    placeholder="Enter community name"
                                    value={newCommunityName}
                                    onChange={(e) =>
                                        setNewCommunityName(e.target.value)
                                    }
                                />
                            </div>
                            <div className="community-form-group">
                                <label>Description</label>
                                <textarea
                                    placeholder="Enter community description"
                                    value={newCommunityDescription}
                                    onChange={(e) =>
                                        setNewCommunityDescription(
                                            e.target.value,
                                        )
                                    }
                                    rows={3}
                                />
                            </div>
                            <div className="community-form-actions">
                                <button
                                    className="community-btn-primary"
                                    onClick={handleCreateCommunity}
                                    disabled={!newCommunityName.trim()}
                                >
                                    Create
                                </button>
                                <button
                                    className="community-btn-secondary"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewCommunityName('');
                                        setNewCommunityDescription('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {searchResults.length > 0 && (
                <div className="community-search-results">
                    <h4>Search Results</h4>
                    {searchResults.map((community) => {
                        const isMember = communities.some(
                            (c) => c._id === community._id,
                        );
                        return (
                            <div key={community._id} className="community-item">
                                <img
                                    src={community.avatar}
                                    alt={community.name}
                                    className="community-avatar"
                                />
                                <div className="community-info">
                                    <div className="community-name">
                                        {community.name}
                                    </div>
                                    <div className="community-description">
                                        {community.description}
                                    </div>
                                    <div className="community-stats">
                                        {community.membersCount} members
                                    </div>
                                </div>
                                {!isMember && (
                                    <button
                                        className="community-join-btn"
                                        onClick={() =>
                                            handleJoinCommunity(community._id)
                                        }
                                    >
                                        Join
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="community-my-communities">
                <h4>My Communities</h4>
                {communities.length === 0 ? (
                    <div className="community-empty">
                        No communities yet, create one or search to join
                    </div>
                ) : (
                    communities.map((community) => (
                        <div key={community._id} className="community-item">
                            <img
                                src={community.avatar}
                                alt={community.name}
                                className="community-avatar"
                            />
                            <div className="community-info">
                                <div className="community-name">
                                    {community.name}
                                </div>
                                <div className="community-description">
                                    {community.description}
                                </div>
                                <div className="community-stats">
                                    {community.membersCount} members •{' '}
                                    {community.groupsCount} groups •{' '}
                                    {community.channelsCount} channels
                                </div>
                            </div>
                            <button
                                className="community-leave-btn"
                                onClick={() =>
                                    handleLeaveCommunity(community._id)
                                }
                            >
                                Leave
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CommunityList;
