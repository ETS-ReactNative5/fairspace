import {useCallback, useRef} from "react";

/**
 * Custom hook to handle single and double click events.
 * It prevents the default React behaviour - double-click event triggers 2 single click events first.
 * This hook delays the single-click events long enough to detect whether it is not a part of a double-click.
 *
 * To be used only if both single and double clicks should be handled for a specific component.
 *
 * @param onSingleClick     Single-click handler.
 * @param onDoubleClick     Double-click handler.
 *
 * @returns Single and double click handler wrappers, parameters have to be passes as an array.
 */
const useClicksWithPrevention = (onSingleClick, onDoubleClick) => {
    const timer = useRef;

    const cancelPendingClick = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, [timer]);

    const handleSingleClick = useCallback((params: any[]) => {
        cancelPendingClick();
        timer.current = setTimeout(() => {
            timer.current = null;
            onSingleClick(...params);
        }, 300);
    }, [timer, cancelPendingClick, onSingleClick]);

    const handleDoubleClick = useCallback((params: any[]) => {
        cancelPendingClick();
        onDoubleClick(...params);
    }, [cancelPendingClick, onDoubleClick]);

    return {
        handleSingleClick,
        handleDoubleClick
    };
};

export default useClicksWithPrevention;
