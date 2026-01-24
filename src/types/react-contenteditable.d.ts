declare module 'react-contenteditable' {
    import * as React from 'react';

    export interface ContentEditableEvent {
        target: {
            value: string;
        };
    }

    export interface Props extends React.HTMLAttributes<HTMLElement> {
        disabled?: boolean;
        tagName?: string;
        className?: string;
        style?: React.CSSProperties;
        innerRef?: React.Ref<HTMLElement | null> | React.RefObject<HTMLElement | null> | ((element: HTMLElement | null) => void);
        html: string;
        onChange?: (event: ContentEditableEvent) => void;
        onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
        onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
        placeholder?: string;
    }

    export default class ContentEditable extends React.Component<Props> { }
}