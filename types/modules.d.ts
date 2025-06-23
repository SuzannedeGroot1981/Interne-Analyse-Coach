declare module 'pdf-parse' {
  interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }

  function pdfParse(buffer: Buffer, options?: any): Promise<PDFParseResult>;
  export = pdfParse;
}

declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  interface ConvertToHtmlResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: { buffer?: Buffer; arrayBuffer?: ArrayBuffer; path?: string }): Promise<ExtractRawTextResult>;
  export function convertToHtml(options: { buffer?: Buffer; arrayBuffer?: ArrayBuffer; path?: string }): Promise<ConvertToHtmlResult>;
}

declare module 'papaparse' {
  interface ParseResult<T = any> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }

  interface ParseError {
    type: string;
    code: string;
    message: string;
    row: number;
  }

  interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
    fields?: string[];
  }

  interface ParseConfig {
    delimiter?: string;
    newline?: string;
    quoteChar?: string;
    escapeChar?: string;
    header?: boolean;
    transformHeader?: (header: string) => string;
    dynamicTyping?: boolean;
    preview?: number;
    encoding?: string;
    worker?: boolean;
    comments?: boolean | string;
    step?: (results: ParseResult, parser: any) => void;
    complete?: (results: ParseResult) => void;
    error?: (error: ParseError) => void;
    download?: boolean;
    downloadRequestHeaders?: { [key: string]: string };
    downloadRequestBody?: any;
    skipEmptyLines?: boolean | 'greedy';
    chunk?: (results: ParseResult, parser: any) => void;
    fastMode?: boolean;
    beforeFirstChunk?: (chunk: string) => string;
    withCredentials?: boolean;
    transform?: (value: string, field: string | number) => any;
    delimitersToGuess?: string[];
  }

  export function parse<T = any>(input: string | File, config?: ParseConfig): ParseResult<T>;
  
  export default {
    parse: parse
  };
}