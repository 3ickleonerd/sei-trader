import { Parser } from "node-sql-parser";
import { getTableColumns } from "./utils";
const parser = new Parser();

const INTERNAL_MARKER: string = "sei_caret_";
const ALLOWED_QUERY_TYPES = ["create", "insert", "select", "delete"] as const;
export type AllowedQueryType = (typeof ALLOWED_QUERY_TYPES)[number];

export interface ColumnRef {
  type: "column_ref";
  table: string | null;
  column: string;
}

export interface ColumnDefinition {
  column: ColumnRef;
  definition: {
    dataType: string;
  };
  resource: "column";
}

export function getAugmentedQuery(query: string) {
  if (query.includes(INTERNAL_MARKER)) {
    throw new Error("Do not pass in internal queries");
  }

  const astRaw = parser.astify(query);
  const ast = Array.isArray(astRaw) ? astRaw[0] : astRaw;

  const type = ast.type;
  let result: string = query;

  if (!ALLOWED_QUERY_TYPES.includes(type as AllowedQueryType)) {
    throw new Error(`Unsupported query type: ${type}`);
  }

  if (type === "create") {
    if (!ast.create_definitions) {
      throw new Error("No column definitions found");
    }

    const newColumnDef: ColumnDefinition = {
      column: {
        type: "column_ref",
        table: null,
        column: INTERNAL_MARKER + "onchain_index",
      },
      definition: {
        dataType: "INTEGER",
      },
      resource: "column",
    };

    ast.create_definitions.push(newColumnDef);

    const newSQL = parser.sqlify(ast, { database: "sqlite" });
    const cleanedSQL = newSQL.replace(/"([^"]+)"/g, "$1");

    if (!cleanedSQL.trim().endsWith(";")) {
      result = cleanedSQL + ";";
    } else {
      result = cleanedSQL;
    }
  }

  if (type === "insert" && "values" in ast && Array.isArray(ast.values)) {
    const newColumn = INTERNAL_MARKER + "onchain_index";
    if (!ast.columns) {
      throw new Error("Insert query must have columns specified.");
    }

    ast.columns.push(newColumn);

    ast.values?.forEach((exprList: any) => {
      if (exprList.type === "expr_list" && Array.isArray(exprList.value)) {
        exprList.value.push({
          type: "number",
          value: 42,
        });
      }
    });

    const newSQL = parser.sqlify(ast, { database: "sqlite" });

    let cleanedSQL = newSQL.replace(/"([^"]+)"/g, "$1");

    if (!cleanedSQL.trim().endsWith(";")) {
      cleanedSQL += ";";
    }

    result = cleanedSQL;
  }

  if (type === "select") {
    const isSelectAll =
      ast.columns.length === 1 &&
      ast.columns[0].expr.type === "column_ref" &&
      ast.columns[0].expr.column === "*";

    if (isSelectAll) {
      const table = ast.from?.[0]?.table;
      if (!table) throw new Error("Missing table in SELECT");

      const visibleColumns = []; //await getTableColumns(table);

      ast.columns = visibleColumns.map((col) => ({
        expr: { type: "column_ref", table: null, column: col },
        as: null,
      }));
    }

    const sql = parser.sqlify(ast, { database: "sqlite" });

    result = sql.replace(/"([^"]+)"/g, "$1");
  }

  if (type === "delete") {
    result = parser
      .sqlify(ast, { database: "sqlite" })
      .replace(/"([^"]+)"/g, "$1");
  }

  if (type === "update") {
    result = parser
      .sqlify(ast, { database: "sqlite" })
      .replace(/"([^"]+)"/g, "$1");
  }

  throw new Error(`Unsupported query type: ${type}`);
}
