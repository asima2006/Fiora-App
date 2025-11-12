import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import loadable from '@loadable/component';

import { css } from 'linaria';
import xss from '@fiora/utils/xss';
import compressImage from '@fiora/utils/compressImage';
import config from '@fiora/config/client';
import { isMobile } from '@fiora/utils/ua';
import fetch from '../../utils/fetch';
import voice from '../../utils/voice';
import readDiskFile, { ReadFileResult } from '../../utils/readDiskFile';
import uploadFile from '../../utils/uploadFile';
import getRandomHuaji from '../../utils/getRandomHuaji';
import Style from './ChatInput.less';
import useIsLogin from '../../hooks/useIsLogin';
import useAction from '../../hooks/useAction';
import Dropdown from '../../components/Dropdown';
import IconButton from '../../components/IconButton';
import Avatar from '../../components/Avatar';
import Message from '../../components/Message';
import { Menu, MenuItem } from '../../components/Menu';
import { State } from '../../state/reducer';
import { sendMessage, sendTypingIndicator } from '../../service';
import Tooltip from '../../components/Tooltip';
import useAero from '../../hooks/useAero';

const expressionList = css`
    display: flex;
    width: 100%;
    height: 80px;
    position: absolute;
    left: 0;
    top: -80px;
    background-color: inherit;
    overflow-x: auto;
`;
const expressionImageContainer = css`
    min-width: 80px;
    height: 80px;
`;
const expressionImage = css`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const ExpressionAsync = loadable(
    () =>
        // @ts-ignore
        import(/* webpackChunkName: "expression" */ './Expression'),
);
const CodeEditorAsync = loadable(
    // @ts-ignore
    () => import(/* webpackChunkName: "code-editor" */ './CodeEditor'),
);

let searchExpressionTimer: number = 0;

let inputIME = false;

// Typing indicator state
let typingTimer: number = 0;
let isTyping = false;
const TYPING_TIMEOUT = 3000; // Stop typing after 3 seconds of inactivity

function ChatInput() {
    const action = useAction();
    const isLogin = useIsLogin();
    const connect = useSelector((state: State) => state.connect);
    const selfId = useSelector((state: State) => state.user?._id);
    const username = useSelector((state: State) => state.user?.username);
    const avatar = useSelector((state: State) => state.user?.avatar);
    const tag = useSelector((state: State) => state.user?.tag);
    const focus = useSelector((state: State) => state.focus);
    const linkman = useSelector((state: State) => state.linkmans[focus]);
    const channels = useSelector((state: State) => state.channels);
    const selfVoiceSwitch = useSelector(
        (state: State) => state.status.selfVoiceSwitch,
    );
    const enableSearchExpression = useSelector(
        (state: State) => state.status.enableSearchExpression,
    );
    const [expressionDialog, toggleExpressionDialog] = useState(false);
    const [codeEditorDialog, toggleCodeEditorDialog] = useState(false);
    const [inputFocus, toggleInputFocus] = useState(false);
    const [at, setAt] = useState({ enable: false, content: '' });
    const $input = useRef<HTMLInputElement>(null);
    const aero = useAero();
    const [expressions, setExpressions] = useState<
        { image: string; width: number; height: number }[]
    >([]);

    // Check if current focus is a channel and if user is creator
    const isChannelByType = linkman && linkman.type === 'channel';
    const currentChannel = isChannelByType ? channels.find((ch: any) => ch._id === focus) : null;
    const isChannel = !!currentChannel;
    // Use linkman.creator (which is set when channel is added to linkmans)
    const isChannelCreator = isChannel && linkman.creator === selfId;
    const canSendMessage = !isChannel || isChannelCreator;

    /** Global input box focus shortcut key */
    function focusInput(e: KeyboardEvent) {
        const $target: HTMLElement = e.target as HTMLElement;
        if (
            $target.tagName === 'INPUT' ||
            $target.tagName === 'TEXTAREA' ||
            e.key !== 'i'
        ) {
            return;
        }
        e.preventDefault();
        // @ts-ignore
        $input.current.focus(e);
    }
    useEffect(() => {
        window.addEventListener('keydown', focusInput);
        return () => window.removeEventListener('keydown', focusInput);
    }, []);

    useEffect(() => {
        setExpressions([]);
    }, [enableSearchExpression]);

    if (!isLogin) {
        return (
            <div className={Style.chatInput}>
                <p className={Style.guest}>
                    Hello guest friend, please
                    <b
                        className={Style.guestLogin}
                        onClick={() =>
                            action.setStatus('loginRegisterDialogVisible', true)
                        }
                        role="button"
                    >
                        login
                    </b>
                    to participate in chat
                </p>
            </div>
        );
    }

    /**
     * Insert text at cursor position in input box
     * @param value Text to insert
     */
    function insertAtCursor(value: string) {
        const input = $input.current as unknown as HTMLInputElement;
        if (input.selectionStart || input.selectionStart === 0) {
            const startPos = input.selectionStart;
            const endPos = input.selectionEnd;
            const restoreTop = input.scrollTop;
            input.value =
                input.value.substring(0, startPos) +
                value +
                input.value.substring(endPos as number, input.value.length);
            if (restoreTop > 0) {
                input.scrollTop = restoreTop;
            }
            input.focus();
            input.selectionStart = startPos + value.length;
            input.selectionEnd = startPos + value.length;
        } else {
            input.value += value;
            input.focus();
        }
    }

    function handleSelectExpression(expression: string) {
        toggleExpressionDialog(false);
        insertAtCursor(expression);
    }

    function addSelfMessage(type: string, content: string) {
        const _id = focus + Date.now();
        const message = {
            _id,
            type,
            content,
            createTime: Date.now(),
            from: {
                _id: selfId,
                username,
                avatar,
                tag,
            },
            loading: true,
            percent: type === 'image' || type === 'file' ? 0 : 100,
        };
        // @ts-ignore
        action.addLinkmanMessage(focus, message);

        if (selfVoiceSwitch && type === 'text') {
            const text = content
                .replace(
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
                    '',
                )
                .replace(/#/g, '');

            if (text.length > 0 && text.length <= 100) {
                voice.push(text, Math.random().toString());
            }
        }

        return _id;
    }

    // eslint-disable-next-line react/destructuring-assignment
    async function handleSendMessage(
        localId: string,
        type: string,
        content: string,
        linkmanId = focus,
    ) {
        if (linkman.unread > 0) {
            action.setLinkmanProperty(linkman._id, 'unread', 0);
        }
        const [error, message] = await sendMessage(linkmanId, type, content);
        if (error) {
            action.deleteMessage(focus, localId, true);
        } else {
            message.loading = false;
            action.updateMessage(focus, localId, message);
        }
    }

    function sendImageMessage(image: string): void;
    function sendImageMessage(image: ReadFileResult): void;
    function sendImageMessage(image: string | ReadFileResult) {
        if (typeof image === 'string') {
            const id = addSelfMessage('image', image);
            handleSendMessage(id, 'image', image);
            toggleExpressionDialog(false);
            return;
        }

        if (image.length > config.maxImageSize) {
            Message.warning('Image to send is too large', 3);
            return;
        }

        // @ts-ignore
        const ext = image.type.split('/').pop().toLowerCase();
        const url =
            typeof image.result === 'string'
                ? image.result
                : URL.createObjectURL(image.result as Blob);

        const img = new Image();
        img.onload = async () => {
            const id = addSelfMessage(
                'image',
                `${url}?width=${img.width}&height=${img.height}`,
            );
            try {
                const imageUrl = await uploadFile(
                    image.result as Blob,
                    `ImageMessage/${selfId}_${Date.now()}.${ext}`,
                );
                handleSendMessage(
                    id,
                    'image',
                    `${imageUrl}?width=${img.width}&height=${img.height}`,
                    focus,
                );
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(err);
                Message.error('Failed to upload image');
            }
        };
        img.src = url;
    }

    async function sendFileMessage(file: ReadFileResult) {
        if (file.length > config.maxFileSize) {
            Message.warning('File to send is too large', 3);
            return;
        }

        const id = addSelfMessage(
            'file',
            JSON.stringify({
                filename: file.filename,
                size: file.length,
                ext: file.ext,
            }),
        );
        
        try {
            const fileUrl = await uploadFile(
                file.result as Blob,
                `FileMessage/${selfId}_${Date.now()}.${file.ext}`,
            );
            
            handleSendMessage(
                id,
                'file',
                JSON.stringify({
                    fileUrl,
                    filename: file.filename,
                    size: file.length,
                    ext: file.ext,
                }),
                focus,
            );
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            Message.error('Failed to upload file');
        }
    }

    async function handleSendImage() {
        if (!connect) {
            return Message.error('Failed to send message, you are currently offline');
        }
        const image = await readDiskFile(
            'blob',
            'image/png,image/jpeg,image/gif',
        );
        if (!image) {
            return null;
        }
        sendImageMessage(image);
        return null;
    }
    async function sendHuaji() {
        const huaji = getRandomHuaji();
        const id = addSelfMessage('image', huaji);
        handleSendMessage(id, 'image', huaji);
    }
    async function handleSendFile() {
        if (!connect) {
            Message.error('Failed to send message, you are currently offline');
            return;
        }
        
        const file = await readDiskFile('blob');
        if (!file) {
            return;
        }
        
        sendFileMessage(file);
    }

    function handleFeatureMenuClick({
        key,
        domEvent,
    }: {
        key: string;
        domEvent: any;
    }) {
        // Quickly hitting the Enter key causes the button to repeatedly trigger the problem
        if (domEvent.keyCode === 13) {
            return;
        }

        switch (key) {
            case 'image': {
                handleSendImage();
                break;
            }
            case 'huaji': {
                sendHuaji();
                break;
            }
            case 'code': {
                toggleCodeEditorDialog(true);
                break;
            }
            case 'file': {
                handleSendFile();
                break;
            }
            default:
        }
    }

    async function handlePaste(e: any) {
        // eslint-disable-next-line react/destructuring-assignment
        if (!connect) {
            e.preventDefault();
            return Message.error('Failed to send message, you are currently offline');
        }
        const { items, types } =
            e.clipboardData || e.originalEvent.clipboardData;

        // If contains file content
        if (types.indexOf('Files') > -1) {
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = function handleLoad() {
                            const image = new Image();
                            image.onload = async () => {
                                const imageBlob = await compressImage(
                                    image,
                                    file.type,
                                    0.8,
                                );
                                // @ts-ignore
                                sendImageMessage({
                                    filename: file.name,
                                    ext: imageBlob?.type.split('/').pop(),
                                    length: imageBlob?.size,
                                    type: imageBlob?.type,
                                    result: imageBlob,
                                });
                            };
                            // eslint-disable-next-line react/no-this-in-sfc
                            image.src = this.result as string;
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }
            e.preventDefault();
        }
        return null;
    }

    function sendTextMessage() {
        if (!connect) {
            return Message.error('Failed to send message, you are currently offline');
        }

        // @ts-ignore
        const message = $input.current.value.trim();
        if (message.length === 0) {
            return null;
        }

        if (
            message.startsWith(window.location.origin) &&
            message.match(/\/invite\/group\/[\w\d]+/)
        ) {
            const groupId = message.replace(
                `${window.location.origin}/invite/group/`,
                '',
            );
            const id = addSelfMessage(
                'inviteV2',
                JSON.stringify({
                    inviter: selfId,
                    inviterName: username,
                    group: groupId,
                    groupName: '',
                }),
            );
            handleSendMessage(id, 'inviteV2', groupId);
        } else {
            const id = addSelfMessage('text', xss(message));
            handleSendMessage(id, 'text', message);
        }

        // @ts-ignore
        $input.current.value = '';
        setExpressions([]);
        return null;
    }

    async function getExpressionsFromContent() {
        if ($input.current) {
            const content = $input.current.value.trim();
            if (searchExpressionTimer) {
                clearTimeout(searchExpressionTimer);
            }
            // @ts-ignore
            searchExpressionTimer = setTimeout(async () => {
                if (content.length >= 1 && content.length <= 4) {
                    const [err, res] = await fetch(
                        'searchExpression',
                        { keywords: content, limit: 10 },
                        { toast: false },
                    );
                    if (!err && $input.current?.value.trim() === content) {
                        setExpressions(res);
                        return;
                    }
                }
                setExpressions([]);
            }, 500);
        }
    }

    function handleTyping() {
        if (!connect || !focus) {
            return;
        }

        // Send typing start
        if (!isTyping) {
            isTyping = true;
            sendTypingIndicator(focus, true);
        }

        // Reset the timer
        clearTimeout(typingTimer);
        typingTimer = window.setTimeout(() => {
            isTyping = false;
            sendTypingIndicator(focus, false);
        }, TYPING_TIMEOUT);
    }

    async function handleInputKeyDown(e: any) {
        // Trigger typing indicator for most keys (except Enter, Tab, and modifier keys)
        if (
            e.key !== 'Enter' &&
            e.key !== 'Tab' &&
            e.key !== 'Shift' &&
            e.key !== 'Control' &&
            e.key !== 'Alt' &&
            e.key !== 'Meta' &&
            e.key !== 'Escape' &&
            !e.ctrlKey &&
            !e.metaKey
        ) {
            handleTyping();
        }

        if (e.key === 'Tab') {
            e.preventDefault();
        } else if (e.key === 'Enter' && !inputIME) {
            // Stop typing indicator when sending message
            clearTimeout(typingTimer);
            if (isTyping) {
                isTyping = false;
                sendTypingIndicator(focus, false);
            }
            sendTextMessage();
        } else if (e.altKey && (e.key === 's' || e.key === 'ß')) {
            sendHuaji();
            e.preventDefault();
        } else if (e.altKey && (e.key === 'd' || e.key === '∂')) {
            toggleExpressionDialog(true);
            e.preventDefault();
        } else if (e.key === '@') {
            // If @ key is pressed, enter @ calculation mode
            // @ts-ignore
            if (!/@/.test($input.current.value)) {
                setAt({
                    enable: true,
                    content: '',
                });
            }
            // eslint-disable-next-line react/destructuring-assignment
        } else if (at.enable) {
            // If in @ calculation mode
            const { key } = e;
            // Delay to get new value and ime status
            setTimeout(() => {
                // If @ has been deleted, exit @ calculation mode
                // @ts-ignore
                if (!/@/.test($input.current.value)) {
                    setAt({ enable: false, content: '' });
                    return;
                }
                // If inputting Chinese, and not space key, ignore input
                if (inputIME && key !== ' ') {
                    return;
                }
                // If not inputting Chinese, and is space key, then @ calculation mode ends
                if (!inputIME && key === ' ') {
                    setAt({ enable: false, content: '' });
                    return;
                }

                // If currently inputting Chinese, return directly to avoid getting pinyin letters
                if (inputIME) {
                    return;
                }
                // @ts-ignore
                const regexResult = /@([^ ]*)/.exec($input.current.value);
                if (regexResult) {
                    setAt({ enable: true, content: regexResult[1] });
                }
            }, 100);
        } else if (enableSearchExpression) {
            // Set timer to get current input value
            setTimeout(() => {
                if (inputIME) {
                    return;
                }
                if ($input.current?.value) {
                    getExpressionsFromContent();
                } else {
                    clearTimeout(searchExpressionTimer);
                    setExpressions([]);
                }
            });
        }
    }

    function getSuggestion() {
        if (!at.enable || linkman.type !== 'group') {
            return [];
        }
        return linkman.onlineMembers.filter((member) => {
            const regex = new RegExp(`^${at.content}`);
            if (regex.test(member.user.username)) {
                return true;
            }
            return false;
        });
    }

    function replaceAt(targetUsername: string) {
        // @ts-ignore
        $input.current.value = $input.current.value.replace(
            `@${at.content}`,
            `@${targetUsername} `,
        );
        setAt({
            enable: false,
            content: '',
        });
        // @ts-ignore
        $input.current.focus();
    }

    function handleSendCode(language: string, rawCode: string) {
        if (!connect) {
            return Message.error('Failed to send message, you are currently offline');
        }

        if (rawCode === '') {
            return Message.warning('Please enter content');
        }

        const code = `@language=${language}@${rawCode}`;
        const id = addSelfMessage('code', code);
        handleSendMessage(id, 'code', code);
        toggleCodeEditorDialog(false);
        return null;
    }

    function handleClickExpressionImage(
        image: string,
        width: number,
        height: number,
    ) {
        sendImageMessage(`${image}?width=${width}&height=${height}`);
        setExpressions([]);
        if ($input.current) {
            $input.current.value = '';
        }
    }

    return (
        <div className={Style.chatInput} {...aero}>
            {canSendMessage && (
                <>
                    <Dropdown
                        trigger={['click']}
                        visible={expressionDialog}
                        onVisibleChange={toggleExpressionDialog}
                        overlay={
                            <div className={Style.expressionDropdown}>
                                <ExpressionAsync
                                    onSelectText={handleSelectExpression}
                                    onSelectImage={sendImageMessage}
                                />
                            </div>
                        }
                        animation="slide-up"
                        placement="topLeft"
                    >
                        <IconButton
                            className={Style.iconButton}
                            width={44}
                            height={44}
                            icon="expression"
                            iconSize={32}
                        />
                    </Dropdown>
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <div className={Style.featureDropdown}>
                                <Menu onClick={handleFeatureMenuClick}>
                                    <MenuItem key="huaji">Send Sticker</MenuItem>
                                    <MenuItem key="image">Send Image</MenuItem>
                                    {/* <MenuItem key="code">Send Code</MenuItem> */}
                                    <MenuItem key="file">Send File</MenuItem>
                                </Menu>
                            </div>
                        }
                        animation="slide-up"
                        placement="topLeft"
                    >
                        <IconButton
                            className={Style.iconButton}
                            width={44}
                            height={44}
                            icon="feature"
                            iconSize={32}
                        />
                    </Dropdown>
                </>
            )}
            <form
                className={Style.form}
                autoComplete="off"
                onSubmit={(e) => e.preventDefault()}
            >
                <input
                    className={Style.input}
                    type="text"
                    placeholder={
                        isChannel && !isChannelCreator
                            ? "Only channel creator can post announcements"
                            : "Chat about anything, don't spam meaninglessly~~"
                    }
                    maxLength={2048}
                    ref={$input}
                    onKeyDown={handleInputKeyDown}
                    onPaste={handlePaste}
                    onCompositionStart={() => {
                        inputIME = true;
                    }}
                    onCompositionEnd={() => {
                        inputIME = false;
                    }}
                    onFocus={() => toggleInputFocus(true)}
                    onBlur={() => toggleInputFocus(false)}
                    disabled={!canSendMessage}
                />

                {!isMobile && !inputFocus && (
                    <Tooltip
                        placement="top"
                        mouseEnterDelay={0.5}
                        overlay={
                            <span>
                                Support pasting images to send
                                <br />
                                Press i key globally to focus
                            </span>
                        }
                    >
                        <i className={`iconfont icon-about ${Style.tooltip}`} />
                    </Tooltip>
                )}
            </form>
            {canSendMessage && (
                <IconButton
                    className={Style.iconButton}
                    width={44}
                    height={44}
                    icon="send"
                    iconSize={32}
                    onClick={sendTextMessage}
                />
            )}

            <div className={Style.atPanel}>
                {at.enable &&
                    getSuggestion().map((member) => (
                        <div
                            className={Style.atUserList}
                            key={member.user._id}
                            onClick={() => replaceAt(member.user.username)}
                            role="button"
                        >
                            <Avatar size={24} src={member.user.avatar} name={member.user.username} type="user" />
                            <p className={Style.atText}>
                                {member.user.username}
                            </p>
                        </div>
                    ))}
            </div>

            {codeEditorDialog && (
                <CodeEditorAsync
                    visible={codeEditorDialog}
                    onClose={() => toggleCodeEditorDialog(false)}
                    onSend={handleSendCode}
                />
            )}

            {expressions.length > 0 && (
                <div className={expressionList}>
                    {expressions.map(({ image, width, height }) => (
                        <div className={expressionImageContainer}>
                            <img
                                className={expressionImage}
                                src={image}
                                key={image}
                                alt=""
                                aria-label="Insert expression"
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                    handleClickExpressionImage(
                                        image,
                                        width,
                                        height,
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleClickExpressionImage(image, width, height);
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ChatInput;
