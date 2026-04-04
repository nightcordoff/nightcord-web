declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }

  interface Element {}
  interface ElementClass {}
  interface ElementAttributesProperty {
    props: {};
  }

  interface ElementChildrenAttribute {
    children: {};
  }
}

declare module 'react' {
  export const StrictMode: any;
  export const Fragment: any;
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export const jsx: any;
  export const jsxs: any;
}

declare module 'react-dom/client' {
  export interface Root {
    render(children: any): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module '*.css' {
  const stylesheet: string;
  export default stylesheet;
}