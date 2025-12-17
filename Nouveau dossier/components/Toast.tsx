
import React, { useState, useEffect } from 'react';
import { useNotification } from '../providers/NotificationProvider';
import { Notification } from '../types';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const TOAST_DURATION = 5000; // 5 seconds
const ANIMATION_DURATION = 300; // 0.3 seconds

const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
};

const progressColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
};

const ToastItem: React.FC<{ notification: Notification; onDismiss: (id: number) => void; }> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (isExiting) return;

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - (100 / (TOAST_DURATION / 100));
            });
        }, 100);

        const timer = setTimeout(() => {
            handleExit();
        }, TOAST_DURATION);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExiting]);

    const handleExit = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(notification.id);
        }, ANIMATION_DURATION);
    };

    return (
        <div
            className={`max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 dark:ring-gray-700 overflow-hidden ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
            role="alert"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {icons[notification.type]}
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleExit}
                            className="inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
                <div
                    className={`h-1 ${progressColors[notification.type]}`}
                    style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
                />
            </div>
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[200] space-y-3 flex flex-col items-center w-full max-w-sm pointer-events-none">
            {notifications.map(notification => (
                <ToastItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={removeNotification}
                />
            ))}
        </div>
    );
};

export default ToastContainer;
