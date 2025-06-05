'use client'
import { useState } from 'react';

export function useToast() {
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000); // Auto-hide after 3 seconds
    };

    const hideToast = () => setToast(null);

    return { toast, showToast, hideToast };
} 