declare module "sql.js" {
  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export class Database {
    constructor(data?: Uint8Array);
    run(sql: string, params?: unknown[]): void;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    export(): Uint8Array;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export default function initSqlJs(): Promise<SqlJsStatic>;
}
