import React from 'react';
import { useSelector } from 'react-redux';
import CopyToClipboard from 'react-copy-to-clipboard';
import { css } from 'linaria';

import { isMobile } from '@fiora/utils/ua';
import { State } from '../../state/reducer';
import useIsLogin from '../../hooks/useIsLogin';
import useAction from '../../hooks/useAction';
import IconButton from '../../components/IconButton';
import Avatar from '../../components/Avatar';
import Message from '../../components/Message';

import Style from './HeaderBar.less';
import useAero from '../../hooks/useAero';

const styles = {
    count: css`
        font-size: 14px;
        @media (max-width: 500px) {
            font-size: 12px;
        }
    `,
    typing: css`
        display: block;
        font-size: 15px;
        font-weight: normal;
        color: rgba(7, 0, 0, 0.6);
        font-style: italic;
        margin-top: 2px;
        @media (max-width: 500px) {
            font-size: 11px;
        }
    `,
};

type Props = {
    id: string;
    /** Contact name, empty when no contact */
    name: string;
    /** Contact type, empty when no contact */
    type: string;
    /** Avatar URL */
    avatar?: string;
    onlineMembersCount?: number;
    isOnline?: boolean;
    /** Function button click event */
    onClickFunction: () => void;
    /** Typing users */
    /** Typing users */
    typingUsers?: string[];
    /** Is this group part of a community */
    isGroupInCommunity?: boolean;
};

function HeaderBar(props: Props) {
    const {
        id,
        name,
        type,
        avatar,
        onlineMembersCount,
        isOnline,
        onClickFunction,
        typingUsers = [],
        isGroupInCommunity = false,
    } = props;

    const action = useAction();
    const connectStatus = useSelector((state: State) => state.connect);
    const isLogin = useIsLogin();
    const sidebarVisible = useSelector(
        (state: State) => state.status.sidebarVisible,
    );
    const functionBarAndLinkmanListVisible = useSelector(
        (state: State) => state.status.functionBarAndLinkmanListVisible,
    );
    const aero = useAero();

    function handleShareGroup() {
        Message.success('Invitation link copied to clipboard, go invite others to join the group');
    }

    function handleShareChannel() {
        Message.success('Channel invite link copied to clipboard');
    }

    function getTypingText() {
        if (typingUsers.length === 0) return null;
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} is typing...`;
        }
        if (typingUsers.length === 2) {
            return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
        }
        return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
    }

    return (
        <div className={Style.headerBar} {...aero}>
            <div className={Style.buttonContainer}>
                {isMobile ? (
                    <>
                        <IconButton
                            width={40}
                            height={40}
                            icon="feature"
                            iconSize={24}
                            onClick={() =>
                                action.setStatus('sidebarVisible', !sidebarVisible)
                            }
                        />
                        <IconButton
                            width={40}
                            height={40}
                            icon="friends"
                            iconSize={24}
                            onClick={() =>
                                action.setStatus(
                                    'functionBarAndLinkmanListVisible',
                                    true,
                                )
                            }
                        />
                    </>
                ) : (
                    <IconButton
                        width={40}
                        height={40}
                        icon={functionBarAndLinkmanListVisible ? "close" : "friends"}
                        iconSize={24}
                        onClick={() =>
                            action.setStatus(
                                'functionBarAndLinkmanListVisible',
                                !functionBarAndLinkmanListVisible,
                            )
                        }
                    />
                )}
            </div>
            <h2 className={Style.name}>
                {(type === 'group' || type === 'channel') && avatar && (
                    <Avatar 
                        src={avatar}
                        name={name}
                        type={type === 'channel' ? 'group' : type}
                        size={40}
                        className={Style.headerAvatar}
                    />
                )}
                {name && (
                    <div className={Style.nameContent}>
                        <span className={Style.nameText}>
                            {name}{' '}
                            {isLogin && type === 'group' && onlineMembersCount !== undefined && (
                                <b
                                    className={styles.count}
                                >{`(${onlineMembersCount})`}</b>
                            )}
                            {isLogin && type === 'temporary' && isOnline !== undefined && (
                                <b className={styles.count}>{`(${
                                    isOnline ? 'Online' : 'Offline'
                                })`}</b>
                            )}
                        </span>
                        {isLogin && type === 'channel' && onlineMembersCount !== undefined && (
                            <span className={styles.typing}>
                                {`${onlineMembersCount} subscriber${onlineMembersCount !== 1 ? 's' : ''}`}
                            </span>
                        )}
                        {getTypingText() && (
                            <span className={styles.typing}>
                                {getTypingText()}
                            </span>
                        )}
                    </div>
                )}
                {isMobile && (
                    <span className={Style.status}>
                        <div className={connectStatus ? 'online' : 'offline'} />
                        {connectStatus ? 'Online' : 'Offline'}
                    </span>
                )}
            </h2>
            {isLogin && type ? (
                <div
                    className={`${Style.buttonContainer} ${Style.rightButtonContainer}`}
                    data-float-panel="true"
                >
                    {type === 'group' && !isGroupInCommunity && (
                        <CopyToClipboard
                            text={`${window.location.origin}/invite/group/${id}`}
                        >
                            <IconButton
                                width={40}
                                height={40}
                                icon="share"
                                iconSize={24}
                                onClick={handleShareGroup}
                            />
                        </CopyToClipboard>
                    )}
                    {type === 'channel' && (
                        <CopyToClipboard
                            text={`${window.location.origin}/channel/${id}`}
                        >
                            <IconButton
                                width={40}
                                height={40}
                                icon="share"
                                iconSize={24}
                                onClick={handleShareChannel}
                            />
                        </CopyToClipboard>
                    )}
                    <IconButton
                        width={40}
                        height={40}
                        icon="gongneng"
                        iconSize={24}
                        onClick={onClickFunction}
                    />
                </div>
            ) : (
                <div className={Style.buttonContainer} />
            )}
        </div>
    );
}

export default HeaderBar;
