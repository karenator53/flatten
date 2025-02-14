declare module 'mermaid-react' {
  import { FC } from 'react';

  interface MermaidConfig {
    theme?: 'default' | 'dark' | 'neutral' | 'forest';
    flowchart?: {
      curve?: 'basis' | 'linear' | 'cardinal' | 'monotoneX';
      padding?: number;
      rankSpacing?: number;
      nodeSpacing?: number;
      htmlLabels?: boolean;
    };
  }

  interface MermaidProps {
    key?: string;
    config?: MermaidConfig;
    children: string;
  }

  const Mermaid: FC<MermaidProps>;
  export default Mermaid;
} 