import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import readDiskFile from '../../utils/readDiskFile';
import uploadFile, { getOSSFileUrl } from '../../utils/uploadFile';
import Style from './CommunityManagePanel.less';
import useIsLogin from '../../hooks/useIsLogin';
import { State } from '../../state/reducer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Message from '../../components/Message';
import Avatar from '../../components/Avatar';
import Dialog from '../../components/Dialog';
import {
    getCommunityInfo,
    leaveCommunity,
    deleteCommunity,
    promoteCommunityMember,
    demoteCommunityMember,
    createGroup,
    addGroupToCommunity,
    changeCommunityName,
    changeCommunityAvatar,
} from '../../service';
import useAction from '../../hooks/useAction';
import config from '../../../../config/client';

interface CommunityMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

interface CommunityManagePanelProps {
    visible: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
    communityAvatar: string;
}

function CommunityManagePanel(props: CommunityManagePanelProps) {
    const { visible, onClose, communityId, communityName, communityAvatar } = props;
    
    const action = useAction();
    const isLogin = useIsLogin();
    const selfId = useSelector((state: State) => state.user?._id);
    const linkmans = useSelector((state: State) => state.linkmans);
    const [leaveConfirmDialog, setLeaveDialogStatus] = useState(false);
    const [deleteConfirmDialog, setDeleteDialogStatus] = useState(false);
    const [newCommunityName, setNewCommunityName] = useState('');
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [ownerId, setOwnerId] = useState('');
    
    // Create Group states
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    
    const isOwner = selfId === ownerId;
    const userMember = members.find(m => m.userId === selfId);
    const isAdmin = userMember?.role === 'admin';
    const isAdminOrOwner = isOwner || isAdmin;
    
    // Get friends from linkmans (type === 'friend')
    const friends = Object.values(linkmans).filter(linkman => linkman.type === 'friend');

    async function fetchCommunityData() {
        const data = await getCommunityInfo(communityId);
        if (data) {
            setMembers(data.members || []);
            setOwnerId(data.ownerId);
        }
    }

    useEffect(() => {
        if (visible && communityId) {
            fetchCommunityData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, communityId]);

    async function handleChangeCommunityName() {
        if (!newCommunityName.trim()) {
            Message.error('Please enter a community name');
            return;
        }

        const isSuccess = await changeCommunityName(communityId, newCommunityName);
        if (isSuccess) {
            Message.success('Community name changed successfully');
            setNewCommunityName('');
        }
    }

    async function handleChangeCommunityAvatar() {
        const image = await readDiskFile(
            'blob',
            'image/png,image/jpeg,image/gif',
        );
        if (!image) {
            return;
        }
        if (image.length > config.maxAvatarSize) {
            Message.error('Failed to set community avatar, please select an image smaller than 1.5MB');
            return;
        }

        try {
            const avatarUrl = await uploadFile(
                image.result as Blob,
                `CommunityAvatar/${communityId}_${Date.now()}`,
            );

            const isSuccess = await changeCommunityAvatar(communityId, avatarUrl);
            if (isSuccess) {
                Message.success('Community avatar updated successfully');
            }
        } catch (err) {
            console.error(err);
            Message.error('Failed to upload community avatar');
        }
    }

    async function handlePromoteMember(userId: string) {
        const isSuccess = await promoteCommunityMember(communityId, userId);
        if (isSuccess) {
            Message.success('Member promoted to admin successfully');
            await fetchCommunityData();
        }
    }

    async function handleDemoteMember(userId: string) {
        const isSuccess = await demoteCommunityMember(communityId, userId);
        if (isSuccess) {
            Message.success('Admin demoted to member successfully');
            await fetchCommunityData();
        }
    }

    async function handleDeleteCommunity() {
        const isSuccess = await deleteCommunity(communityId);
        if (isSuccess) {
            setDeleteDialogStatus(false);
            onClose();
            action.removeCommunity(communityId);
            Message.success('Community deleted successfully');
        }
    }

    async function handleLeaveCommunity() {
        const isSuccess = await leaveCommunity(communityId);
        if (isSuccess) {
            setLeaveDialogStatus(false);
            onClose();
            action.removeCommunity(communityId);
            Message.success('Left community successfully');
        }
    }

    async function handleCreateGroup() {
        if (!newGroupName.trim()) {
            Message.error('Please enter a group name');
            return;
        }

        try {
            const group = await createGroup(newGroupName);
            if (group) {
                // Add the group to the community
                const isSuccess = await addGroupToCommunity(communityId, group._id);
                if (isSuccess) {
                    Message.success(`Group "${newGroupName}" created and added to community!`);
                    setNewGroupName('');
                    setSelectedFriends([]);
                    setShowCreateGroup(false);
                    
                    // Refresh community data
                    await fetchCommunityData();
                } else {
                    Message.error('Group created but failed to add to community');
                }
            }
        } catch (error) {
            console.error('Error creating group:', error);
            Message.error('Failed to create group');
        }
    }

    function toggleFriendSelection(friendId: string) {
        setSelectedFriends((prev: string[]) => 
            prev.includes(friendId) 
                ? prev.filter((id: string) => id !== friendId)
                : [...prev, friendId]
        );
    }

    function handleClickMask(e: React.MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleShowUserInfo(userId: string) {
        if (userId === selfId) {
            return;
        }
        // TODO: Fetch user info and show
        onClose();
    }

    function getRoleBadge(role: string) {
        if (role === 'owner') {
            return <span className={`${Style.roleBadge} ${Style.owner}`}>👑 Owner</span>;
        }
        if (role === 'admin') {
            return <span className={`${Style.roleBadge} ${Style.admin}`}>⭐ Admin</span>;
        }
        return <span className={`${Style.roleBadge} ${Style.member}`}>Member</span>;
    }

    return (
        <div
            className={`${Style.communityManagePanel} ${visible ? Style.show : Style.hide}`}
            onClick={handleClickMask}
            role="button"
            data-float-panel="true"
        >
            <div className={`${Style.container} ${visible ? Style.show : Style.hide}`}>
                <div className={Style.header}>
                    <p className={Style.title}>🏛️ Community Management</p>
                    <p className={Style.subtitle}>{communityName}</p>
                </div>

                <div className={Style.content}>
                    {/* Change Community Name - Owner Only */}
                    {isLogin && isOwner && (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>📝 Change Community Name</p>
                            <Input
                                className={Style.input}
                                value={newCommunityName}
                                onChange={setNewCommunityName}
                                placeholder={communityName}
                            />
                            <Button
                                className={Style.button}
                                onClick={handleChangeCommunityName}
                            >
                                ✓ Confirm Change
                            </Button>
                        </div>
                    )}

                    {/* Change Community Avatar - Owner Only */}
                    {isLogin && isOwner && (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>🖼️ Change Community Avatar</p>
                            <div 
                                className={Style.avatarPreview} 
                                onClick={handleChangeCommunityAvatar}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleChangeCommunityAvatar();
                                    }
                                }}
                            >
                                <img
                                    src={getOSSFileUrl(communityAvatar)}
                                    alt="Community avatar"
                                />
                                <div className={Style.avatarOverlay}>
                                    <p>📤 Click to upload</p>
                                    <p className={Style.avatarHint}>Max: 1.5MB</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Member Management - Owner Only */}
                    {isLogin && isOwner && (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>
                                👥 Members <span>{members.length}</span>
                            </p>
                            <div className={Style.membersList}>
                                {members.map((member) => (
                                    <div key={member.userId} className={Style.memberItem}>
                                        <div
                                            className={Style.memberInfo}
                                            onClick={() => handleShowUserInfo(member.userId)}
                                            role="button"
                                        >
                                            <Avatar size={36} src="/avatar/0.jpg" />
                                            <div className={Style.memberDetails}>
                                                <p className={Style.memberName}>
                                                    User {member.userId.slice(-4)}
                                                </p>
                                                {getRoleBadge(member.role)}
                                            </div>
                                        </div>
                                        {member.userId !== selfId && member.role !== 'owner' && (
                                            <div className={Style.memberActions}>
                                                {member.role === 'member' ? (
                                                    <Button
                                                        className={Style.promoteBtn}
                                                        onClick={() => handlePromoteMember(member.userId)}
                                                    >
                                                        ⬆ Promote
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className={Style.demoteBtn}
                                                        type="danger"
                                                        onClick={() => handleDemoteMember(member.userId)}
                                                    >
                                                        ⬇ Demote
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create Group - Owner & Admin */}
                    {isLogin && isAdminOrOwner && (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>➕ Create Group in Community</p>
                            {!showCreateGroup ? (
                                <Button
                                    className={Style.button}
                                    onClick={() => setShowCreateGroup(true)}
                                >
                                    + Create New Group
                                </Button>
                            ) : (
                                <>
                                    <Input
                                        className={Style.input}
                                        value={newGroupName}
                                        onChange={setNewGroupName}
                                        placeholder="Enter group name"
                                    />
                                    
                                    <p className={Style.blockTitle} style={{ fontSize: '12px', marginTop: '16px' }}>
                                        Select Friends to Add ({selectedFriends.length} selected)
                                    </p>
                                    <div className={Style.friendsList}>
                                        {friends.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                                No friends available
                                            </p>
                                        ) : (
                                            friends.map((friend) => (
                                                <div
                                                    key={friend._id}
                                                    className={`${Style.friendItem} ${
                                                        selectedFriends.includes(friend._id) ? Style.selected : ''
                                                    }`}
                                                    onClick={() => toggleFriendSelection(friend._id)}
                                                    role="button"
                                                    tabIndex={0}
                                                >
                                                    <Avatar size={32} src={friend.avatar} />
                                                    <span className={Style.friendName}>{friend.username}</span>
                                                    <div className={Style.checkbox}>
                                                        {selectedFriends.includes(friend._id) && '✓'}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <Button
                                            className={Style.button}
                                            onClick={handleCreateGroup}
                                        >
                                            ✓ Create
                                        </Button>
                                        <Button
                                            className={Style.button}
                                            onClick={() => {
                                                setShowCreateGroup(false);
                                                setNewGroupName('');
                                                setSelectedFriends([]);
                                            }}
                                        >
                                            ✕ Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Community Info - For All Members */}
                    {!isOwner && (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>ℹ️ Community Information</p>
                            <div className={Style.infoGrid}>
                                <div className={Style.infoItem}>
                                    <strong>Name:</strong>
                                    <span>{communityName}</span>
                                </div>
                                <div className={Style.infoItem}>
                                    <strong>Members:</strong>
                                    <span>{members.length} people</span>
                                </div>
                                {userMember && (
                                    <div className={Style.infoItem}>
                                        <strong>Your Role:</strong>
                                        {getRoleBadge(userMember.role)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className={Style.block}>
                        <p className={Style.blockTitle}>⚙️ Actions</p>
                        {isOwner ? (
                            <Button
                                className={Style.dangerButton}
                                type="danger"
                                onClick={() => setDeleteDialogStatus(true)}
                            >
                                🗑️ Delete Community
                            </Button>
                        ) : (
                            <Button
                                className={Style.dangerButton}
                                type="danger"
                                onClick={() => setLeaveDialogStatus(true)}
                            >
                                🚪 Leave Community
                            </Button>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    className={Style.confirmDialog}
                    title="⚠️ Delete Community"
                    visible={deleteConfirmDialog}
                    onClose={() => setDeleteDialogStatus(false)}
                >
                    <div className={Style.dialogContent}>
                        <p>Are you sure you want to delete this community?</p>
                        <p className={Style.warningText}>
                            This action cannot be undone!
                        </p>
                        <div className={Style.confirmButtons}>
                            <Button onClick={() => setDeleteDialogStatus(false)}>
                                Cancel
                            </Button>
                            <Button type="danger" onClick={handleDeleteCommunity}>
                                Confirm Delete
                            </Button>
                        </div>
                    </div>
                </Dialog>

                {/* Leave Confirmation Dialog */}
                <Dialog
                    className={Style.confirmDialog}
                    title="🚪 Leave Community"
                    visible={leaveConfirmDialog}
                    onClose={() => setLeaveDialogStatus(false)}
                >
                    <div className={Style.dialogContent}>
                        <p>Are you sure you want to leave this community?</p>
                        <div className={Style.confirmButtons}>
                            <Button onClick={() => setLeaveDialogStatus(false)}>
                                Cancel
                            </Button>
                            <Button type="danger" onClick={handleLeaveCommunity}>
                                Confirm Leave
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}

export default CommunityManagePanel;
