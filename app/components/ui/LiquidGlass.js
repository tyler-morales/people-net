'use client'
import { forwardRef, useEffect, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const LiquidGlass = forwardRef(function LiquidGlass({
    children,
    as = 'div', // Element type to render
    variant = 'regular', // 'regular' | 'clear'
    size = 'medium', // 'small' | 'medium' | 'large'
    interactive = false,
    tinted = false,
    tintColor = 'blue',
    floating = false,
    morphIn = false,
    className = '',
    onClick,
    ...props
}, ref) {
    const { isDark } = useTheme();
    const elementRef = useRef(null);
    const [isOverContent, setIsOverContent] = useState(false);
    const [glowing, setGlowing] = useState(false);

    // Adaptive shadow detection
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Detect if element is over content by checking background
                    const rect = entry.boundingClientRect;
                    const elementBelow = document.elementFromPoint(
                        rect.left + rect.width / 2,
                        rect.top + rect.height + 1
                    );

                    if (elementBelow && elementBelow !== element &&
                        !element.contains(elementBelow)) {
                        setIsOverContent(true);
                    } else {
                        setIsOverContent(false);
                    }
                });
            },
            { threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    // Handle interaction glow
    const handleInteraction = (e) => {
        if (interactive) {
            setGlowing(true);
            setTimeout(() => setGlowing(false), 1000);

            // Create ripple effect
            const rect = elementRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.style.width = '4px';
            ripple.style.height = '4px';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(59, 130, 246, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out forwards';
            ripple.style.pointerEvents = 'none';
            ripple.style.zIndex = '1000';

            elementRef.current.appendChild(ripple);

            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        }

        if (onClick) onClick(e);
    };

    // Build class names
    const baseClasses = [
        variant === 'clear' ? 'liquid-glass-clear' : 'liquid-glass-regular',
        interactive && 'liquid-interactive liquid-lens',
        floating && 'liquid-float',
        morphIn && 'liquid-morph-in',
        tinted && 'liquid-tinted',
        glowing && 'liquid-glow',
        className
    ].filter(Boolean).join(' ');

    // Size variants
    const sizeClasses = {
        small: 'text-sm px-3 py-2',
        medium: 'text-base px-4 py-3',
        large: 'text-lg px-6 py-4'
    };

    // Tint colors
    const tintColors = {
        blue: '--retro-blue',
        purple: '--retro-purple',
        green: '--retro-green',
        orange: '--retro-orange',
        red: '--retro-red',
        pink: '--retro-pink'
    };

    const style = {
        ...(tinted && {
            '--glass-tint': `var(${tintColors[tintColor] || tintColors.blue})`,
        }),
        ...(isOverContent && {
            '--glass-shadow': isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)'
        })
    };

    // Create the element dynamically based on 'as' prop
    const Element = as;

    return (
        <Element
            ref={(node) => {
                elementRef.current = node;
                if (ref) {
                    if (typeof ref === 'function') ref(node);
                    else ref.current = node;
                }
            }}
            className={`${baseClasses} ${sizeClasses[size]} adaptive-shadow`}
            style={style}
            data-over-content={isOverContent}
            onClick={handleInteraction}
            {...props}
        >
            {children}

            {/* Ripple animation styles */}
            <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(20);
            opacity: 0;
          }
        }
      `}</style>
        </Element>
    );
});

// Specialized components
export const LiquidButton = forwardRef(function LiquidButton({
    children,
    variant = 'primary', // 'primary' | 'secondary'
    size = 'medium',
    className = '',
    ...props
}, ref) {
    const variantClasses = {
        primary: 'liquid-button-primary',
        secondary: 'liquid-button-secondary'
    };

    return (
        <LiquidGlass
            ref={ref}
            as="button"
            interactive
            tinted={variant === 'primary'}
            size={size}
            className={`liquid-button ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </LiquidGlass>
    );
});

export const LiquidCard = forwardRef(function LiquidCard({
    children,
    floating = false,
    morphIn = false,
    className = '',
    ...props
}, ref) {
    return (
        <LiquidGlass
            ref={ref}
            floating={floating}
            morphIn={morphIn}
            className={`liquid-card ${className}`}
            {...props}
        >
            {children}
        </LiquidGlass>
    );
});

export const LiquidNav = forwardRef(function LiquidNav({
    children,
    className = '',
    ...props
}, ref) {
    return (
        <LiquidGlass
            ref={ref}
            variant="regular"
            className={`liquid-nav ${className}`}
            {...props}
        >
            {children}
        </LiquidGlass>
    );
});

export const LiquidInput = forwardRef(function LiquidInput({
    className = '',
    onFocus,
    onBlur,
    ...props
}, ref) {
    const [focused, setFocused] = useState(false);

    const handleFocus = (e) => {
        setFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <input
            ref={ref}
            className={`liquid-glow ${focused ? 'scale-102' : ''} ${className}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
        />
    );
});

export default LiquidGlass; 