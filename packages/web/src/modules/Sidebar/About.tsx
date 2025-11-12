import React from 'react';

import Dialog from '../../components/Dialog';
import Style from './About.less';
import Common from './Common.less';

interface AboutProps {
    visible: boolean;
    onClose: () => void;
}

function About(props: AboutProps) {
    const { visible, onClose } = props;
    return (
        <Dialog
            className={Style.about}
            visible={visible}
            title="About"
            onClose={onClose}
        >
            <div>
                <div className={Common.block}>
                    <p className={Common.title}>Author</p>
                    <a
                        href="https://suisuijiang.com"
                        target="_black"
                        rel="noopener noreferrer"
                    >
                        https://suisuijiang.com
                    </a>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>How to Deploy</p>
                    <a
                        href="https://yinxin630.github.io/fiora/zh-Hans/"
                        target="_black"
                        rel="noopener noreferrer"
                    >
                        https://yinxin630.github.io/fiora/zh-Hans/
                    </a>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Privacy Policy</p>
                    <a
                        href="/PrivacyPolicy.html"
                        target="_black"
                        rel="noopener noreferrer"
                    >
                        {`${window.location.origin}/PrivacyPolicy.html`}
                    </a>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Install fiora to homescreen (PWA)</p>
                    <ul>
                        <li>
                            Click the three dots button at the far right of the address bar (or the button before the bookmark at the end of the address bar)
                        </li>
                        <li>Select &quot;Install fiora&quot;</li>
                    </ul>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Input shortcuts</p>
                    <ul>
                        <li>Alt + S: Send emoji</li>
                        <li>Alt + D: Send expression</li>
                    </ul>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Command messages</p>
                    <ul>
                        <li>-roll [number]: Roll dice</li>
                        <li>-rps: Rock paper scissors</li>
                    </ul>
                </div>
                <div className={Common.block}>
                    <p className={Common.title}>Links</p>
                    <ul>
                        <li>
                            <a
                                href="https://wangyaxing.cn/"
                                target="_black"
                                rel="noopener noreferrer"
                            >
                                Mu Zi Xing Xi
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </Dialog>
    );
}

export default About;
