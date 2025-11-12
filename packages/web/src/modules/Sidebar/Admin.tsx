import React, { useEffect, useState } from 'react';

import { css } from 'linaria';
import Style from './Admin.less';
import Common from './Common.less';
import Dialog from '../../components/Dialog';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Message from '../../components/Message';
import {
    getSealList,
    resetUserPassword,
    sealUser,
    setUserTag,
    sealIp,
    toggleSendMessage,
    toggleNewUserSendMessage,
    getSystemConfig,
} from '../../service';

const styles = {
    button: css`
        min-width: 100px;
        height: 36px;
        margin-right: 12px;
        padding: 0 10px;
    `,
};

type SystemConfig = {
    disableSendMessage: boolean;
    disableNewUserSendMessage: boolean;
};

interface AdminProps {
    visible: boolean;
    onClose: () => void;
}

function Admin(props: AdminProps) {
    const { visible, onClose } = props;

    const [tagUsername, setTagUsername] = useState('');
    const [tag, setTag] = useState('');
    const [resetPasswordUsername, setResetPasswordUsername] = useState('');
    const [sealUsername, setSealUsername] = useState('');
    const [sealList, setSealList] = useState({ users: [], ips: [] });
    const [sealIpAddress, setSealIpAddress] = useState('');
    const [systemConfig, setSystemConfig] = useState<SystemConfig>();

    async function handleGetSealList() {
        const sealListRes = await getSealList();
        if (sealListRes) {
            setSealList(sealListRes);
        }
    }
    async function handleGetSystemConfig() {
        const systemConfigRes = await getSystemConfig();
        if (systemConfigRes) {
            setSystemConfig(systemConfigRes);
        }
    }
    useEffect(() => {
        if (visible) {
            handleGetSystemConfig();
            handleGetSealList();
        }
    }, [visible]);

    /**
     * Handle updating user tag
     */
    async function handleSetTag() {
        const isSuccess = await setUserTag(tagUsername, tag.trim());
        if (isSuccess) {
            Message.success('User tag updated successfully, please refresh page to update data');
            setTagUsername('');
            setTag('');
        }
    }

    /**
     * Handle reset user password operation
     */
    async function handleResetPassword() {
        const res = await resetUserPassword(resetPasswordUsername);
        if (res) {
            Message.success(`User password has been reset to: ${res.newPassword}`);
            setResetPasswordUsername('');
        }
    }
    /**
     * Handle ban user operation
     */
    async function handleSeal() {
        const isSuccess = await sealUser(sealUsername);
        if (isSuccess) {
            Message.success('User banned successfully');
            setSealUsername('');
            handleGetSealList();
        }
    }

    async function handleSealIp() {
        const isSuccess = await sealIp(sealIpAddress);
        if (isSuccess) {
            Message.success('IP banned successfully');
            setSealIpAddress('');
            handleGetSealList();
        }
    }

    async function handleDisableSendMessage() {
        const isSuccess = await toggleSendMessage(false);
        if (isSuccess) {
            Message.success('Mute enabled successfully');
            handleGetSystemConfig();
        }
    }
    async function handleEnableSendMessage() {
        const isSuccess = await toggleSendMessage(true);
        if (isSuccess) {
            Message.success('Mute disabled successfully');
            handleGetSystemConfig();
        }
    }

    async function handleDisableSNewUserendMessage() {
        const isSuccess = await toggleNewUserSendMessage(false);
        if (isSuccess) {
            Message.success('New user mute enabled successfully');
            handleGetSystemConfig();
        }
    }
    async function handleEnableNewUserSendMessage() {
        const isSuccess = await toggleNewUserSendMessage(true);
        if (isSuccess) {
            Message.success('New user mute disabled successfully');
            handleGetSystemConfig();
        }
    }

    return (
        <Dialog
            className={Style.admin}
            visible={visible}
            title="Admin Console"
            onClose={onClose}
        >
            <div className={Common.container}>
                <div className={Common.block}>
                    {!systemConfig?.disableSendMessage ? (
                        <Button
                            className={styles.button}
                            type="danger"
                            onClick={handleDisableSendMessage}
                        >
                            Enable Mute
                        </Button>
                    ) : (
                        <Button
                            className={styles.button}
                            onClick={handleEnableSendMessage}
                        >
                            Disable Mute
                        </Button>
                    )}
                    {!systemConfig?.disableNewUserSendMessage ? (
                        <Button
                            className={styles.button}
                            type="danger"
                            onClick={handleDisableSNewUserendMessage}
                        >
                            Enable New User Mute
                        </Button>
                    ) : (
                        <Button
                            className={styles.button}
                            onClick={handleEnableNewUserSendMessage}
                        >
                            Disable New User Mute
                        </Button>
                    )}
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Update User Tag</p>
                    <div className={Style.inputBlock}>
                        <Input
                            className={`${Style.input} ${Style.tagUsernameInput}`}
                            value={tagUsername}
                            onChange={setTagUsername}
                            placeholder="Username to update tag"
                        />
                        <Input
                            className={`${Style.input} ${Style.tagInput}`}
                            value={tag}
                            onChange={setTag}
                            placeholder="Tag content"
                        />
                        <Button className={Style.button} onClick={handleSetTag}>
                            Confirm
                        </Button>
                    </div>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Reset User Password</p>
                    <div className={Style.inputBlock}>
                        <Input
                            className={Style.input}
                            value={resetPasswordUsername}
                            onChange={setResetPasswordUsername}
                            placeholder="Username to reset password"
                        />
                        <Button
                            className={Style.button}
                            onClick={handleResetPassword}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>

                <div className={Common.block}>
                    <p className={Common.title}>Ban User</p>
                    <div className={Style.inputBlock}>
                        <Input
                            className={Style.input}
                            value={sealUsername}
                            onChange={setSealUsername}
                            placeholder="Username to ban"
                        />
                        <Button className={Style.button} onClick={handleSeal}>
                            Confirm
                        </Button>
                    </div>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Banned Users List</p>
                    <div className={Style.sealList}>
                        {sealList.users.map((username) => (
                            <span className={Style.sealUsername} key={username}>
                                {username}
                            </span>
                        ))}
                    </div>
                </div>

                <div className={Common.block}>
                    <p className={Common.title}>Ban IP</p>
                    <div className={Style.inputBlock}>
                        <Input
                            className={Style.input}
                            value={sealIpAddress}
                            onChange={setSealIpAddress}
                            placeholder="IP to ban"
                        />
                        <Button className={Style.button} onClick={handleSealIp}>
                            Confirm
                        </Button>
                    </div>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Banned IPs List</p>
                    <div className={Style.sealList}>
                        {sealList.ips.map((ip) => (
                            <span className={Style.sealUsername} key={ip}>
                                {ip}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default Admin;
