declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'node:http' {
  export interface IncomingMessage {
    method?: string;
    url?: string;
    headers: Record<string, string | undefined>;
  }

  export interface ServerResponse {
    setHeader(name: string, value: string): void;
    writeHead(statusCode: number, headers?: Record<string, string>): void;
    end(body?: string): void;
  }

  export function createServer(
    listener: (request: IncomingMessage, response: ServerResponse) => void,
  ): {
    listen(port: number, callback?: () => void): void;
  };
}