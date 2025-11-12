import React from 'react';

import AlipayImage from '@fiora/assets/images/alipay.png';
import WxpayImage from '@fiora/assets/images/wxpay.png';
import Dialog from '../../components/Dialog';
import Style from './Reward.less';

interface RewardProps {
    visible: boolean;
    onClose: () => void;
}

function Reward(props: RewardProps) {
    const { visible, onClose } = props;
    return (
        <Dialog
            className={Style.reward}
            visible={visible}
            title="Donate"
            onClose={onClose}
        >
            <div>
                <p className={Style.text}>
                    If you find this chat room code helpful, please consider donating to encourage the author~~
                    <br />
                    The author is mostly online, feel free to ask questions, all questions will be answered
                </p>
                <div className={Style.imageContainer}>
                    <img
                        className={Style.image}
                        src={AlipayImage}
                        alt="Alipay QR Code"
                    />
                    <img
                        className={Style.image}
                        src={WxpayImage}
                        alt="WeChat QR Code"
                    />
                </div>
            </div>
        </Dialog>
    );
}

export default Reward;
