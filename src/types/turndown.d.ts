declare module "turndown" {
  interface TurndownServiceOptions {
    headingStyle?: "setext" | "atx";
    bulletListMarker?: "-" | "*" | "+";
    codeBlockStyle?: "indented" | "fenced";
    fence?: string;
    emDelimiter?: "_" | "*";
    strongDelimiter?: "**" | "__";
    linkStyle?: "inlined" | "referenced";
    linkReferenceStyle?: "full" | "shortcut" | "collapsed";
  }

  class TurndownService {
    constructor(options?: TurndownServiceOptions);
    turndown(input: string): string;
    addRule(key: string, rule: any): void;
    keep(filter: any): void;
    removeRule(key: string): void;
    escape(string: string): string;
    // Add more typings if needed
  }

  export default TurndownService;
}
