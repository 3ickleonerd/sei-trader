import { Parser } from "node-sql-parser";
import { getTableColumns } from "./getTableColumns.ts";
const parser = new Parser();

const INTERNAL_MARKER: string = "sei_caret_";
const ALLOWED_QUERY_TYPES = ["create", "insert", "select", "delete"] as const;
type AllowedQueryType = (typeof ALLOWED_QUERY_TYPES)[number];

type AugmentedQueryResult = {
  query: string;
  code: number;
};

interface ColumnRef {
  type: "column_ref";
  table: string | null;
  column: string;
}

interface ColumnDefinition {
  column: ColumnRef;
  definition: {
    dataType: string;
  };
  resource: "column";
}

async function getAugmentedQuery(query: string): Promise<AugmentedQueryResult> {
  if (query.includes(INTERNAL_MARKER)) {
    throw new Error("Do not pass in internal queries");
  }

  const astRaw = parser.astify(query);
  const ast = Array.isArray(astRaw) ? astRaw[0] : astRaw;

  if (!ALLOWED_QUERY_TYPES.includes(ast.type as AllowedQueryType)) {
    throw new Error("Unsupported query type: ${ast.type}");
  }

  if (ast.type === "create") {
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

    return { query: cleanedSQL, code: 0 };
  }

  if (ast.type === "insert" && "values" in ast && Array.isArray(ast.values)) {
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

    return { query: cleanedSQL, code: 0 };
  }

  if (ast.type === "select") {
    const isSelectAll =
      ast.columns.length === 1 &&
      ast.columns[0].expr.type === "column_ref" &&
      ast.columns[0].expr.column === "*";

    if (isSelectAll) {
      const table = ast.from?.[0]?.table;
      if (!table) throw new Error("Missing table in SELECT");

      const visibleColumns = await getTableColumns(table);
      // there will a function that fetches the columns from the database and returns with the removed indexer column

      ast.columns = visibleColumns.map((col) => ({
        expr: { type: "column_ref", table: null, column: col },
        as: null,
      }));
    }

    const sql = parser.sqlify(ast, { database: "sqlite" });
    return { query: sql.replace(/"([^"]+)"/g, "$1"), code: 0 };
  }

  if (ast.type === "delete") {
    return { query, code: 0 };
  }

  if (ast.type === "update") {
    return { query, code: 0 };
  }

  return { query, code: 1 };
}

const q =
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);";
console.log(getAugmentedQuery(q));
