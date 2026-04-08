import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string;
    onChangeValue: (value: string) => void;
    suggestions: string[];
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, onChangeValue, suggestions, className, ...props }) => {
    const [matches, setMatches] = useState<string[]>([]);
    const [suggestion, setSuggestion] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!value) {
            setMatches([]);
            setSuggestion('');
            return;
        }

        const exactMatch = suggestions.find(s => s.toLowerCase() === value.toLowerCase());
        if (exactMatch) {
            setSuggestion('');
            return;
        }

        const filtered = suggestions.filter(s => s.toLowerCase().startsWith(value.toLowerCase()));
        setMatches(filtered);

        if (filtered.length > 0) {
            // Suggestion is the rest of the word
            // e.g. value="Rena", match="Renault" -> suggestion="ult"
            // We need to display it correctly. Usually we show the full word with the unmatched part in a different color.
            // But simpler: just show the full word behind the input, which has transparent background? 
            // Or overlay?
            // Let's rely on the "value" + "ghost" logic.
            // If user typed "Ren" (length 3), and match is "Renault", we want ghost to be "ault" positioned after "Ren".
            // However, input fonts are not monospaced, so positioning is hard.
            // Better approach:
            // Input text color: normal.
            // Ghost div behind input: "Ren" (transparent) + "ault" (light gray).

            setSuggestion(filtered[0]);
        } else {
            setSuggestion('');
        }
    }, [value, suggestions]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            onChangeValue(suggestion);
            setSuggestion('');
        }
        if (props.onKeyDown) props.onKeyDown(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChangeValue(e.target.value);
    };

    return (
        <div className="relative w-full">
            {/* Ghost Text Layer */}
            {suggestion && isFocused && (
                <div
                    className={`absolute inset-0 pointer-events-none flex items-center ${props.className?.includes('p-4') ? 'px-4' : 'px-3'}`}
                    aria-hidden="true"
                >
                    {/* Invisible text to push the ghost text to the right position */}
                    <span className="invisible whitespace-pre">{value}</span>
                    <span className="text-slate-300 opacity-70">
                        {suggestion.slice(value.length)}
                    </span>
                </div>
            )}

            <input
                {...props}
                ref={inputRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={(e) => { setIsFocused(true); if (props.onFocus) props.onFocus(e); }}
                onBlur={(e) => { setIsFocused(false); if (props.onBlur) props.onBlur(e); }}
                className={`${className} bg-transparent relative z-10`} // Make input background transparent to see ghost
            // Removing background color from input here might break design if the parent doesn't provide it.
            // But the parent passes bg-slate-50 usually.
            // We need the input to be transparent, so the ghost (which is behind) can be seen?
            // No, if the ghost is BEHIND, the input background will cover it.
            // If the ghost is IN FRONT (z-index higher), it will cover the text.
            // Trick: Ghost is BEHIND. Input has NO background color (bg-transparent).
            // The CONTAINER has the background color.
            />
            {/* 
               Actually, the ghost needs to be perfectly aligned. 
               The input style passed in usually includes `bg-slate-50`.
               If I make input `bg-transparent`, I need to apply `bg-slate-50` to the wrapper.
               BUT `className` is passed to Input usually.
               
               Let's try: Input is Z-10. Ghost is Z-0.
               Wrapper has the background.
               I need to extract background classes from `className` and put them on wrapper?
               Or just assume the user passes specific styles.
               
               Alternative: Ghost is Overlay (Z-20) with `pointer-events-none`.
               Input text is normal.
               Ghost text starts with `value` (invisible) + `suggestion remainder` (visible color).
               This works regardless of background.
            */}
        </div>
    );
};

export default AutocompleteInput;
