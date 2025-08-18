import { Parser } from "node-sql-parser";
import { isAddress } from "viem";
const parser = new Parser();

const INTERNAL_MARKER: string = "sei_caret_";
const ALLOWED_QUERY_TYPES = ["create", "insert", "select", "delete"] as const;
export type AllowedQueryType = (typeof ALLOWED_QUERY_TYPES)[number];

const CUSTOM_TYPE_MAPPINGS = {
  ADDRESS: "TEXT",
  BOOL: "INTEGER",
  FLOAT: "NUMERIC",
} as const;

type CustomType = keyof typeof CUSTOM_TYPE_MAPPINGS;
type SQLiteType = (typeof CUSTOM_TYPE_MAPPINGS)[CustomType];

interface TypeMapping {
  original: CustomType;
  sqlite: SQLiteType;
  position: number;
}

export interface ColumnRef {
  type: "column_ref";
  table: string | null;
  column: string;
}

export interface ColumnDefinition {
  column: ColumnRef;
  definition: {
    dataType: string;
    originalDataType?: string;
  };
  resource: "column";
}

function transformCustomTypes(query: string): {
  transformedQuery: string;
  typeMappings: TypeMapping[];
} {
  let transformedQuery = query;
  const typeMappings: TypeMapping[] = [];

  for (const [customType, sqliteType] of Object.entries(CUSTOM_TYPE_MAPPINGS)) {
    const regex = new RegExp(`\\b${customType}\\b`, "gi");

    transformedQuery = transformedQuery.replace(regex, (match, offset) => {
      typeMappings.push({
        original: customType as CustomType,
        sqlite: sqliteType,
        position: offset,
      });

      return sqliteType;
    });
  }

  typeMappings.sort((a, b) => a.position - b.position);

  return { transformedQuery, typeMappings };
}

function restoreCustomTypesInAST(ast: any, typeMappings: TypeMapping[]): any {
  if (!ast.create_definitions || typeMappings.length === 0) {
    return ast;
  }

  const sqliteToOriginal = typeMappings.reduce((acc, mapping) => {
    acc[mapping.sqlite] = mapping.original;
    return acc;
  }, {} as Record<string, string>);

  let mappingIndex = 0;

  ast.create_definitions.forEach((def: any) => {
    if (
      def.definition &&
      def.definition.dataType &&
      mappingIndex < typeMappings.length
    ) {
      const sqliteType = def.definition.dataType;
      const mapping = typeMappings[mappingIndex];

      if (mapping && mapping.sqlite === sqliteType) {
        def.definition.originalDataType = def.definition.dataType;
        def.definition.dataType = mapping.original;
        mappingIndex++;
      }
    }
  });

  return ast;
}

function validateAndTransformValueTypes(ast: any): any {
  // Only process INSERT statements that have values
  if (ast.type !== "insert" || !ast.values || !Array.isArray(ast.values)) {
    return ast;
  }

  // Transform each value list
  ast.values.forEach((exprList: any) => {
    if (exprList.type === "expr_list" && Array.isArray(exprList.value)) {
      exprList.value.forEach((valueNode: any) => {
        // Check if it's a double_quote_string that might be an address
        if (
          valueNode.type === "double_quote_string" &&
          typeof valueNode.value === "string"
        ) {
          const value = valueNode.value;

          // Check if it looks like an address (0x prefix + 40 hex chars) and validate with viem
          if (
            value.startsWith("0x") &&
            value.length === 42 &&
            isAddress(value)
          ) {
            // Add metadata but keep original type for SQL generation
            valueNode.validatedType = "address";
          }
          // Check for boolean strings
          else if (
            value.toLowerCase() === "true" ||
            value.toLowerCase() === "false"
          ) {
            valueNode.validatedType = "bool";
          }
        }
        // Check numeric strings that might be floats
        else if (
          valueNode.type === "double_quote_string" &&
          typeof valueNode.value === "string"
        ) {
          const value = valueNode.value;
          // Check if it's a valid float string
          if (/^\d+\.\d+$/.test(value)) {
            valueNode.validatedType = "float";
          }
        }
      });
    }
  });

  return ast;
}

function createTypedViewOfAST(ast: any): any {
  // Create a deep copy for the typed view
  const typedAST = JSON.parse(JSON.stringify(ast));

  // Only process INSERT statements that have values
  if (
    typedAST.type !== "insert" ||
    !typedAST.values ||
    !Array.isArray(typedAST.values)
  ) {
    return typedAST;
  }

  // Transform each value list in the typed view
  typedAST.values.forEach((exprList: any) => {
    if (exprList.type === "expr_list" && Array.isArray(exprList.value)) {
      exprList.value.forEach((valueNode: any) => {
        // Transform based on validation metadata
        if (valueNode.validatedType === "address") {
          valueNode.type = "address";
        } else if (valueNode.validatedType === "bool") {
          valueNode.type = "bool";
          valueNode.value = valueNode.value.toLowerCase() === "true";
        } else if (valueNode.validatedType === "float") {
          valueNode.type = "float";
          valueNode.value = parseFloat(valueNode.value);
        }

        // Clean up metadata
        delete valueNode.validatedType;
      });
    }
  });

  return typedAST;
}

export function getAugmentedQuery(query: string) {
  if (query.includes(INTERNAL_MARKER)) {
    throw new Error("Do not pass in internal queries");
  }

  const { transformedQuery, typeMappings } = transformCustomTypes(query);

  const astRaw = parser.astify(transformedQuery);
  const ast = Array.isArray(astRaw) ? astRaw[0] : astRaw;

  const augmentedAST = restoreCustomTypesInAST(ast, typeMappings);

  // Validate and transform value types (addresses, booleans, floats)
  const typedAST = validateAndTransformValueTypes(augmentedAST);

  const type = typedAST.type;
  let result: string = transformedQuery;

  if (!ALLOWED_QUERY_TYPES.includes(type as AllowedQueryType)) {
    throw new Error(`Unsupported query type: ${type}`);
  }

  if (type === "create") {
    if (!typedAST.create_definitions) {
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

    typedAST.create_definitions.push(newColumnDef);

    const sqlAST = JSON.parse(JSON.stringify(typedAST));

    if (sqlAST.create_definitions) {
      sqlAST.create_definitions.forEach((def: any) => {
        if (def.definition && def.definition.originalDataType) {
          def.definition.dataType = def.definition.originalDataType;
        }
      });
    }

    const newSQL = parser.sqlify(sqlAST, { database: "sqlite" });
    // Only remove quotes from identifiers, not from string values
    // Avoid removing quotes from values that start with 0x (hex addresses)
    const cleanedSQL = newSQL.replace(/"([^"]+)"/g, (match, content) => {
      // Keep quotes for values that look like hex addresses or contain special characters
      if (
        content.startsWith("0x") ||
        content.includes(" ") ||
        content.includes("-") ||
        content.includes(".")
      ) {
        return match; // Keep the quotes
      }
      return content; // Remove quotes for simple identifiers
    });

    if (!cleanedSQL.trim().endsWith(";")) {
      result = cleanedSQL + ";";
    } else {
      result = cleanedSQL;
    }
  }

  if (
    type === "insert" &&
    "values" in typedAST &&
    Array.isArray(typedAST.values)
  ) {
    const newColumn = INTERNAL_MARKER + "onchain_index";
    if (!typedAST.columns) {
      throw new Error("Insert query must have columns specified.");
    }

    typedAST.columns.push(newColumn);

    typedAST.values?.forEach((exprList: any) => {
      if (exprList.type === "expr_list" && Array.isArray(exprList.value)) {
        exprList.value.push({
          type: "number",
          value: 42,
        });
      }
    });

    const newSQL = parser.sqlify(typedAST, { database: "sqlite" });

    // Only remove quotes from identifiers, not from string values
    // Avoid removing quotes from values that start with 0x (hex addresses)
    let cleanedSQL = newSQL.replace(/"([^"]+)"/g, (match, content) => {
      // Keep quotes for values that look like hex addresses or contain special characters
      if (
        content.startsWith("0x") ||
        content.includes(" ") ||
        content.includes("-") ||
        content.includes(".")
      ) {
        return match; // Keep the quotes
      }
      return content; // Remove quotes for simple identifiers
    });

    if (cleanedSQL.trim().endsWith(";")) {
      cleanedSQL = cleanedSQL.trim().slice(0, -1) + " RETURNING *;";
    } else {
      cleanedSQL += " RETURNING *";
    }

    result = cleanedSQL;
  }

  if (type === "select") {
    const isSelectAll =
      typedAST.columns.length === 1 &&
      typedAST.columns[0].expr.type === "column_ref" &&
      typedAST.columns[0].expr.column === "*";

    if (isSelectAll) {
      const table = typedAST.from?.[0]?.table;
      if (!table) throw new Error("Missing table in SELECT");

      const visibleColumns = [];

      typedAST.columns = visibleColumns.map((col) => ({
        expr: { type: "column_ref", table: null, column: col },
        as: null,
      }));
    }

    const sql = parser.sqlify(typedAST, { database: "sqlite" });

    // Only remove quotes from identifiers, not from string values
    // Avoid removing quotes from values that start with 0x (hex addresses)
    result = sql.replace(/"([^"]+)"/g, (match, content) => {
      // Keep quotes for values that look like hex addresses or contain special characters
      if (
        content.startsWith("0x") ||
        content.includes(" ") ||
        content.includes("-") ||
        content.includes(".")
      ) {
        return match; // Keep the quotes
      }
      return content; // Remove quotes for simple identifiers
    });
  }

  if (type === "delete") {
    // Only remove quotes from identifiers, not from string values
    // Avoid removing quotes from values that start with 0x (hex addresses)
    let cleanedSQL = parser
      .sqlify(typedAST, { database: "sqlite" })
      .replace(/"([^"]+)"/g, (match, content) => {
        // Keep quotes for values that look like hex addresses or contain special characters
        if (
          content.startsWith("0x") ||
          content.includes(" ") ||
          content.includes("-") ||
          content.includes(".")
        ) {
          return match; // Keep the quotes
        }
        return content; // Remove quotes for simple identifiers
      });

    if (cleanedSQL.trim().endsWith(";")) {
      cleanedSQL = cleanedSQL.trim().slice(0, -1) + " RETURNING *;";
    } else {
      cleanedSQL += " RETURNING *";
    }

    result = cleanedSQL;
  }

  if (type === "update") {
    // Only remove quotes from identifiers, not from string values
    // Avoid removing quotes from values that start with 0x (hex addresses)
    let cleanedSQL = parser
      .sqlify(typedAST, { database: "sqlite" })
      .replace(/"([^"]+)"/g, (match, content) => {
        // Keep quotes for values that look like hex addresses or contain special characters
        if (
          content.startsWith("0x") ||
          content.includes(" ") ||
          content.includes("-") ||
          content.includes(".")
        ) {
          return match; // Keep the quotes
        }
        return content; // Remove quotes for simple identifiers
      });

    if (cleanedSQL.trim().endsWith(";")) {
      cleanedSQL = cleanedSQL.trim().slice(0, -1) + " RETURNING *;";
    } else {
      cleanedSQL += " RETURNING *";
    }

    result = cleanedSQL;
  }

  return {
    query: result,
    ast: typedAST,
    typedAst: createTypedViewOfAST(typedAST),
  } as const;
}
