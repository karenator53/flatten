declare module 'react-syntax-highlighter' {
  import * as React from 'react';

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: React.ReactNode;
    wrapLines?: boolean;
    customStyle?: React.CSSProperties;
  }

  export const Prism: React.ComponentType<SyntaxHighlighterProps>;

  const SyntaxHighlighter: React.ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const darcula: any;
} 