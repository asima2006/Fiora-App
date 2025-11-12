import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import Style from './PWAInstallPrompt.less';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user has dismissed the prompt before
        const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissedAt) {
            const daysSinceDismissed =
                (Date.now() - parseInt(dismissedAt, 10)) /
                (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) {
                return; // Don't show prompt for 7 days after dismissal
            }
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            
            // Show prompt after 30 seconds
            setTimeout(() => {
                setShowPrompt(true);
            }, 30000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if app was installed
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    if (isInstalled || !showPrompt || !deferredPrompt) {
        return null;
    }

    return (
        <div className={Style.pwaPrompt}>
            <div className={Style.container}>
                <button
                    className={Style.closeButton}
                    onClick={handleDismiss}
                    aria-label="Close"
                >
                    ×
                </button>
                <div className={Style.content}>
                    <div className={Style.icon}>
                        <i className="iconfont icon-app" />
                    </div>
                    <div className={Style.text}>
                        <h3>Install Fiora</h3>
                        <p>
                            Install the app for a better experience with offline
                            support and quick access
                        </p>
                    </div>
                </div>
                <div className={Style.actions}>
                    <button className={Style.dismissBtn} onClick={handleDismiss}>
                        Not now
                    </button>
                    <button className={Style.installBtn} onClick={handleInstall}>
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PWAInstallPrompt;
