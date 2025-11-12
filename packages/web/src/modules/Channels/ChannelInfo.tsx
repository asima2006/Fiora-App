import React, { useState, useContext } from 'react';
import { useSelector } from 'react-redux';

import readDiskFIle from '../../utils/readDiskFile';
import uploadFile, { getOSSFileUrl } from '../../utils/uploadFile';
import Style from './ChannelInfo.less';
import useIsLogin from '../../hooks/useIsLogin';
import { State } from '../../state/reducer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Message from '../../components/Message';
import Avatar from '../../components/Avatar';
import Tooltip from '../../components/Tooltip';
import Dialog from '../../components/Dialog';
import {
    deleteChannel,
    unsubscribeChannel,
} from '../../service';
import useAction from '../../hooks/useAction';
import config from '../../../../config/client';
import { ShowUserOrGroupInfoContext } from '../../context';

interface ChannelInfoProps {
    visible: boolean;
    onClose: () => void;
    channelId: string;
    avatar: string;
    creator: string;
    onlineMembers: any[];
}

function ChannelInfo(props: ChannelInfoProps) {
    const { visible, onClose, channelId, avatar, creator, onlineMembers = [] } = props;

    const action = useAction();
    const isLogin = useIsLogin();
    const selfId = useSelector((state: State) => state.user?._id);
    const [deleteConfirmDialog, setDialogStatus] = useState(false);
    const [channelName, setChannelName] = useState('');
    const context = useContext(ShowUserOrGroupInfoContext);

    async function handleChangeChannelName() {
        // TODO: Implement changeChannelName API
        Message.info('Change channel name feature coming soon');
        if (channelName) {
            action.setLinkmanProperty(channelId, 'name', channelName);
        }
    }

    async function handleChangeChannelAvatar() {
        const image = await readDiskFIle(
            'blob',
            'image/png,image/jpeg,image/gif',
        );
        if (!image) {
            return;
        }
        if (image.length > config.maxAvatarSize) {
            // eslint-disable-next-line consistent-return
            return Message.error('Failed to set channel avatar, please select an image smaller than 1.5MB');
        }

        try {
            // Upload image (will be used when changeChannelAvatar API is implemented)
            await uploadFile(
                image.result as Blob,
                `ChannelAvatar/${selfId}_${Date.now()}.${image.ext}`,
            );
            // TODO: Implement changeChannelAvatar API
            // const isSuccess = await changeChannelAvatar(channelId, imageUrl);
            // if (isSuccess) {
            action.setLinkmanProperty(
                channelId,
                'avatar',
                URL.createObjectURL(image.result as Blob),
            );
            Message.success('Channel avatar changed successfully');
            // }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            Message.error('Failed to upload channel avatar');
        }
    }

    async function handleDeleteChannel() {
        const [err] = await deleteChannel(channelId);
        if (err) {
            Message.error(err);
            return;
        }
        setDialogStatus(false);
        onClose();
        action.removeLinkman(channelId);
        Message.success('Channel deleted successfully');
    }

    async function handleUnsubscribe() {
        const isSuccess = await unsubscribeChannel(channelId);
        if (isSuccess) {
            onClose();
            action.removeLinkman(channelId);
            Message.success('Unsubscribed from channel successfully');
        }
    }

    function handleClickMask(e: React.MouseEvent) {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    function handleShowUserInfo(userInfo: any) {
        if (userInfo._id === selfId) {
            return;
        }
        // @ts-ignore
        context.showUserInfo(userInfo);
        onClose();
    }

    return (
        <div
            className={`${Style.channelInfo} ${visible ? 'show' : 'hide'}`}
            onClick={handleClickMask}
            role="button"
            data-float-panel="true"
        >
            <div
                className={`${Style.container} ${
                    visible ? Style.show : Style.hide
                }`}
            >
                <p className={Style.title}>Channel Information</p>
                <div className={Style.content}>
                    {isLogin && selfId === creator ? (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>Change Channel Name</p>
                            <Input
                                className={Style.input}
                                value={channelName}
                                onChange={setChannelName}
                            />
                            <Button
                                className={Style.button}
                                onClick={handleChangeChannelName}
                            >
                                Confirm Change
                            </Button>
                        </div>
                    ) : null}
                    {isLogin && selfId === creator ? (
                        <div className={Style.block}>
                            <p className={Style.blockTitle}>Change Channel Avatar</p>
                            <img
                                className={Style.avatar}
                                src={getOSSFileUrl(avatar)}
                                alt="Channel avatar preview"
                                onClick={handleChangeChannelAvatar}
                            />
                        </div>
                    ) : null}

                    <div className={Style.block}>
                        <p className={Style.blockTitle}>Functions</p>
                        {selfId === creator ? (
                            <Button
                                className={Style.button}
                                type="danger"
                                onClick={() => setDialogStatus(true)}
                            >
                                Delete Channel
                            </Button>
                        ) : (
                            <Button
                                className={Style.button}
                                type="danger"
                                onClick={handleUnsubscribe}
                            >
                                Unsubscribe
                            </Button>
                        )}
                    </div>
                    <div className={Style.block}>
                        <p className={Style.blockTitle}>
                            Online Members &nbsp;<span>{onlineMembers?.length || 0}</span>
                        </p>
                        <div>
                            {onlineMembers?.map((member) => (
                                <div
                                    key={member.user._id}
                                    className={Style.onlineMember}
                                >
                                    <div
                                        className={Style.userinfoBlock}
                                        onClick={() =>
                                            handleShowUserInfo(member.user)
                                        }
                                        role="button"
                                    >
                                        <Avatar
                                            size={24}
                                            src={member.user.avatar}
                                        />
                                        <p className={Style.username}>
                                            {member.user.username}
                                        </p>
                                    </div>
                                    <Tooltip
                                        placement="top"
                                        trigger={['hover']}
                                        overlay={
                                            <span>{member.environment}</span>
                                        }
                                    >
                                        <p className={Style.clientInfoText}>
                                            {member.browser}
                                            &nbsp;&nbsp;
                                            {member.os ===
                                            'Windows Server 2008 R2 / 7'
                                                ? 'Windows 7'
                                                : member.os}
                                        </p>
                                    </Tooltip>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Dialog
                        className={Style.deleteChannelConfirmDialog}
                        title="Confirm delete channel?"
                        visible={deleteConfirmDialog}
                        onClose={() => setDialogStatus(false)}
                    >
                        <Button
                            className={Style.deleteChannelConfirmButton}
                            type="danger"
                            onClick={handleDeleteChannel}
                        >
                            Confirm
                        </Button>
                        <Button
                            className={Style.deleteChannelConfirmButton}
                            onClick={() => setDialogStatus(false)}
                        >
                            Cancel
                        </Button>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

export default ChannelInfo;
