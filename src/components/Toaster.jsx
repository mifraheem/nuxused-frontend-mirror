import React, { useState, useEffect } from 'react';

const Toaster = ({ message, type = 'success', duration = 3000, onClose, showOnLoad = false, allowNoDataErrors = false, onConfirm, onCancel }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Common "no data" error messages to filter out
    const noDataErrorMessages = [
        'no teacher or student found for the role',
        'no groups found',
        'no users found',
        'no groups available',
        'no users available',
        'not found',
        'no data',
        'failed to fetch promotion records',
        'no promotion records added yet',
        'failed to fetch class options',
        'failed to load dropdown data',
        'subjects endpoint not found',
        'no students with valid uuids found',
        'failed to fetch students',
        'failed to load students for selected class',
        'class student endpoint not found',
        'no valid students found',
        'no attendance records found for selected criteria',
        'fetch failed',
        'failed to fetch teachers',
        'failed to fetch schools',
        'no schools available',
        'no valid teachers found',
        'no unmarked staff found',
        'failed to prepare attendance list',
        'no attendance records found',
        'failed to fetch results',
        'unexpected api response format',
        'failed to fetch dropdown data',
        'no students with valid uuids found',
        'failed to fetch final results',
        'failed to fetch classes',
        'failed to fetch exams',
        'failed to fetch subjects',
        'failed to fetch rooms',
        'failed to fetch invigilators',
        'unexpected exam response format',
        'failed to fetch user profile',
        'no valid school id found in schools api',
        'no schools found for this user',
        'failed to fetch school information',
        'authentication token not found',
        'failed to fetch fee structures',
        'failed to fetch fee types',
        'no students found. using default data',
        'student endpoint not found. using default data',
        'unauthorized. please log in again',
        'no fees found for selected student. using default data',
        'student fee endpoint not found. using default data',
        'failed to fetch selected student\'s fee types',
        'payment records endpoint not found',
        'failed to fetch payment records',
        'no classes available to select',
        'failed to load classes',
        'no authentication token found. please log in again',
        'failed to fetch student fees',
        'failed to load students',
        'could not fetch student fee records'
    ];

    useEffect(() => {
        // Validate message and check if it's a "no data" error
        const isNoDataError = message && typeof message === 'string' && 
            noDataErrorMessages.some(noDataMsg => 
                message.toLowerCase().includes(noDataMsg.toLowerCase())
            );

        // Only show if:
        // - showOnLoad is true, OR
        // - Message is valid, non-empty, and either not a "no data" error or allowNoDataErrors is true
        const isValidMessage = message && 
            typeof message === 'string' && 
            message.trim() !== '' && 
            (!isNoDataError || allowNoDataErrors);

        if ((showOnLoad || isValidMessage) && message && typeof message === 'string' && message.trim() !== '') {
            setIsVisible(true);
            setTimeout(() => setIsAnimating(true), 10);
            
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setTimeout(() => {
                    setIsVisible(false);
                    if (onClose) onClose();
                }, 300);
            }, duration);

            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
            setIsAnimating(false);
        }
    }, [message, duration, onClose, showOnLoad, allowNoDataErrors]);

    // Return null if no valid message, not visible, or it's a "no data" error (unless allowed)
    if (!isVisible || 
        !message || 
        typeof message !== 'string' || 
        message.trim() === '' || 
        (!allowNoDataErrors && noDataErrorMessages.some(noDataMsg => 
            message.toLowerCase().includes(noDataMsg.toLowerCase())
        ))) {
        return null;
    }

    const typeStyles = {
        success: {
            cardBg: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
            toastBg: 'bg-white/90',
            border: 'border-emerald-300',
            toastBorder: 'border-emerald-200',
            text: 'text-emerald-800',
            icon: 'text-emerald-600',
            iconBg: 'bg-emerald-100',
            shadow: 'shadow-emerald-200/30',
            glow: 'shadow-emerald-500/20'
        },
        error: {
            cardBg: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
            toastBg: 'bg-white/90',
            border: 'border-red-300',
            toastBorder: 'border-red-200',
            text: 'text-red-800',
            icon: 'text-red-600',
            iconBg: 'bg-red-100',
            shadow: 'shadow-red-200/30',
            glow: 'shadow-red-500/20'
        },
        confirmation: {
            cardBg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
            toastBg: 'bg-white/90',
            border: 'border-blue-300',
            toastBorder: 'border-blue-200',
            text: 'text-blue-800',
            icon: 'text-blue-600',
            iconBg: 'bg-blue-100',
            shadow: 'shadow-blue-200/30',
            glow: 'shadow-blue-500/20'
        },
    };

    const currentStyle = typeStyles[type] || typeStyles.success;

    const typeIcons = {
        success: (
            <div className={`w-16 h-16 rounded-full ${currentStyle.iconBg} flex items-center justify-center ${currentStyle.icon} ring-4 ring-white/50`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
        ),
        error: (
            <div className={`w-16 h-16 rounded-full ${currentStyle.iconBg} flex items-center justify-center ${currentStyle.icon} ring-4 ring-white/50`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </div>
        ),
        confirmation: (
            <div className={`w-16 h-16 rounded-full ${currentStyle.iconBg} flex items-center justify-center ${currentStyle.icon} ring-4 ring-white/50`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"></path>
                </svg>
            </div>
        ),
    };

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 300);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
            {/* Backdrop */}
            <div className={`absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${
                isAnimating ? 'opacity-100' : 'opacity-0'
            }`}></div>
            
            {/* Main Card Container */}
            <div
                className={`
                    pointer-events-auto
                    w-full max-w-xl mx-auto
                    ${currentStyle.cardBg}
                    ${currentStyle.border}
                    border-2
                    rounded-3xl
                    ${currentStyle.shadow}
                    shadow-2xl
                    backdrop-blur-lg
                    transform transition-all duration-500 ease-out
                    ${isAnimating 
                        ? 'translate-y-0 opacity-100 scale-100 rotate-0' 
                        : 'translate-y-12 opacity-0 scale-95 -rotate-1'
                    }
                    relative
                    overflow-hidden
                    p-8
                `}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 blur-lg"></div>
                
                {/* Header Section */}
                <div className="relative z-10 flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {typeIcons[type] || typeIcons.success}
                        <div>
                            <h3 className={`text-xl font-bold ${currentStyle.text} mb-1`}>
                                {type === 'success' && 'Success'}
                                {type === 'error' && 'Error'}
                                {type === 'confirmation' && 'Confirmation'}
                                {!(type in typeStyles) && 'Success'}
                            </h3>
                            <div className={`w-12 h-1 ${currentStyle.iconBg} rounded-full`}></div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleClose}
                        className={`
                            w-10 h-10 rounded-full
                            flex items-center justify-center
                            transition-all duration-200 ease-out
                            hover:bg-white/50 hover:backdrop-blur-sm
                            focus:outline-none focus:ring-2 focus:ring-white/50
                            text-gray-400 hover:text-gray-600
                            group
                        `}
                    >
                        <svg 
                            className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Toast Message Card */}
                <div 
                    className={`
                        relative z-10
                        ${currentStyle.toastBg}
                        ${currentStyle.toastBorder}
                        border-2
                        rounded-2xl
                        p-6
                        backdrop-blur-sm
                        ${currentStyle.glow}
                        shadow-lg
                        transform transition-all duration-300 delay-100
                        ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                    `}
                >
                    {/* Message Content */}
                    <div className={`${currentStyle.text}`}>
                        <p className="text-lg font-medium leading-relaxed tracking-wide">
                            {message}
                        </p>
                    </div>
                    
                    {/* Confirmation Buttons */}
                    {type === 'confirmation' && (
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    handleClose();
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => {
                                    if (onCancel) onCancel();
                                    handleClose();
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    
                    {/* Decorative corner accent */}
                    <div className={`absolute top-0 right-0 w-16 h-16 ${currentStyle.iconBg} opacity-20 rounded-bl-2xl`}></div>
                    <div className={`absolute top-2 right-2 w-3 h-3 ${currentStyle.iconBg} rounded-full`}></div>
                    <div className={`absolute top-5 right-8 w-2 h-2 ${currentStyle.iconBg} rounded-full opacity-60`}></div>
                </div>

                {/* Progress Bar */}
                <div className="relative z-10 mt-4 w-full h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${currentStyle.iconBg} rounded-full transition-all duration-300 ease-linear`}
                        style={{
                            animation: isAnimating ? `shrink ${duration}ms linear forwards` : 'none',
                        }}
                    ></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

export default Toaster;