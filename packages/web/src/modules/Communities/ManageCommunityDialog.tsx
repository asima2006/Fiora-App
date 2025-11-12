import React, { useState } from 'react';
import Message from '../../components/Message';
import Dialog from '../../components/Dialog';
import Input from '../../components/Input';
import {
    promoteMemberToAdmin,
    demoteMemberFromAdmin,
    addGroupToCommunity,
} from '../../service';
import './ManageCommunityDialog.less';

interface Member {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

interface Props {
    communityId: string;
    communityName: string;
    isOwner: boolean;
    members: Member[];
    groupsCount: number;
    onClose: () => void;
    onUpdate: () => void;
}

function ManageCommunityDialog({
    communityId,
    communityName,
    isOwner,
    members,
    groupsCount,
    onClose,
    onUpdate,
}: Props) {
    const [activeTab, setActiveTab] = useState<'groups' | 'members'>('groups');
    const [groupId, setGroupId] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleAddGroup = async () => {
        if (!groupId.trim()) {
            Message.error('Please enter a group ID');
            return;
        }

        if (groupsCount >= 50) {
            Message.error('Community has reached the maximum limit of 50 groups');
            return;
        }

        setProcessing(true);
        const result = await addGroupToCommunity(communityId, groupId.trim());
        setProcessing(false);

        if (result) {
            Message.success('Group added to community successfully');
            setGroupId('');
            onUpdate();
        }
    };

    const handlePromoteMember = async (userId: string) => {
        if (!isOwner) {
            Message.error('Only the community owner can promote members');
            return;
        }

        setProcessing(true);
        const result = await promoteMemberToAdmin(communityId, userId);
        setProcessing(false);

        if (result) {
            Message.success('Member promoted to admin successfully');
            onUpdate();
        }
    };

    const handleDemoteMember = async (userId: string) => {
        if (!isOwner) {
            Message.error('Only the community owner can demote admins');
            return;
        }

        setProcessing(true);
        const result = await demoteMemberFromAdmin(communityId, userId);
        setProcessing(false);

        if (result) {
            Message.success('Admin demoted to member successfully');
            onUpdate();
        }
    };

    const regularMembers = members.filter((m) => m.role === 'member');
    const admins = members.filter((m) => m.role === 'admin' || m.role === 'owner');

    return (
        <Dialog
            className="manage-community-dialog"
            visible
            title={`Manage ${communityName}`}
            onClose={onClose}
        >
            <div className="manage-community-content">
                {/* Tabs */}
                <div className="manage-tabs">
                    <button
                        type="button"
                        className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
                        onClick={() => setActiveTab('groups')}
                    >
                        Groups
                    </button>
                    <button
                        type="button"
                        className={`tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                        disabled={!isOwner}
                    >
                        Members {!isOwner && '(Owner Only)'}
                    </button>
                </div>

                {/* Groups Tab */}
                {activeTab === 'groups' && (
                    <div className="tab-content">
                        <div className="section">
                            <h3>Add Group to Community</h3>
                            <p className="info-text">
                                Groups Count: {groupsCount} / 50
                            </p>
                            <div className="add-group-form">
                                <Input
                                    value={groupId}
                                    onChange={setGroupId}
                                    onEnter={handleAddGroup}
                                    placeholder="Enter group ID"
                                />
                                <button
                                    type="button"
                                    className="action-button primary"
                                    onClick={handleAddGroup}
                                    disabled={processing || groupsCount >= 50}
                                >
                                    {processing ? 'Adding...' : 'Add Group'}
                                </button>
                            </div>
                            {groupsCount >= 50 && (
                                <p className="warning-text">
                                    Maximum group limit reached (50 groups)
                                </p>
                            )}
                        </div>

                        <div className="section">
                            <h3>How to find Group ID:</h3>
                            <ol className="instructions">
                                <li>Go to the group you want to add</li>
                                <li>Look at the URL or group info</li>
                                <li>Copy the Group ID (a long string of characters)</li>
                                <li>Paste it in the input above</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Members Tab (Owner Only) */}
                {activeTab === 'members' && isOwner && (
                    <div className="tab-content">
                        <div className="section">
                            <h3>Promote Members to Admin</h3>
                            <p className="info-text">
                                Admins can create/delete groups, manage members, and send announcements.
                            </p>
                            <div className="members-list">
                                {regularMembers.length === 0 ? (
                                    <p className="empty-state">No regular members to promote</p>
                                ) : (
                                    regularMembers.map((member) => (
                                        <div key={member.userId} className="member-row">
                                            <div className="member-info">
                                                <span className="member-id">{member.userId}</span>
                                                <span className="role-badge member">Member</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="action-button primary"
                                                onClick={() => handlePromoteMember(member.userId)}
                                                disabled={processing}
                                            >
                                                Promote to Admin
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="section">
                            <h3>Demote Admins to Member</h3>
                            <div className="members-list">
                                {admins.length === 0 ? (
                                    <p className="empty-state">No admins to demote</p>
                                ) : (
                                    admins.map((admin) => {
                                        const isOwnerAdmin = admin.role === 'owner';
                                        return (
                                            <div key={admin.userId} className="member-row">
                                                <div className="member-info">
                                                    <span className="member-id">{admin.userId}</span>
                                                    <span
                                                        className={`role-badge ${isOwnerAdmin ? 'owner' : 'admin'}`}
                                                    >
                                                        {isOwnerAdmin ? 'Owner' : 'Admin'}
                                                    </span>
                                                </div>
                                                {!isOwnerAdmin && (
                                                    <button
                                                        type="button"
                                                        className="action-button danger"
                                                        onClick={() => handleDemoteMember(admin.userId)}
                                                        disabled={processing}
                                                    >
                                                        Demote to Member
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Not Owner Warning */}
                {activeTab === 'members' && !isOwner && (
                    <div className="tab-content">
                        <div className="not-owner-warning">
                            <h3>Owner Only Feature</h3>
                            <p>Only the community owner can manage member roles.</p>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
}

export default ManageCommunityDialog;
