import { parse } from "@joe-re/sql-parser";
import { tryCatchSync } from "./utils/tryCatch";
import { z } from "zod";

const INTERNAL_MARKER = "sei_caret_";
const ALLOWED_QUERY_TYPES = ["create_table", "insert"] as const;
type AllowedQueryType = (typeof ALLOWED_QUERY_TYPES)[number];

function getAugmentedQuery(query: string) {
  const ast = tryCatchSync(() => parse(query));
  if (ast.error) {
    throw new Error(`Failed to parse query: ${ast.error.message}`);
  }

  if (!ALLOWED_QUERY_TYPES.includes(ast.data.type as AllowedQueryType)) {
    throw new Error(`Unsupported query type: ${ast.data.type}`);
  }
  const type = ast.data.type as AllowedQueryType;

  if (query.includes(INTERNAL_MARKER)) {
    throw new Error("Do not pass in internal queries");
  }

  if (type == "create_table") {
    const { column_definitions: columns } = z
      .object({
        column_definitions: z.array(
          z.object({
            location: z.object({
              start: z.object({
                offset: z.number(),
              }),
              end: z.object({
                offset: z.number(),
              }),
            }),
          })
        ),
      })
      .parse(ast.data);

    const totalColumns = columns.length;
    const offset = columns[totalColumns - 1].location.end.offset;

    const queryA = query.slice(0, offset);
    const insertion = ", " + INTERNAL_MARKER + "onchain_index INTEGER";
    const queryB = query.slice(offset);

    const response = queryA + insertion + queryB;

    const { error } = tryCatchSync(() => parse(response));

    if (error) {
      throw new Error("Failed to transpile the given query");
    }

    return { query: response, code: 0 };
  }

  return { query, code: 1 };
}

const q =
  "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);";
console.log(getAugmentedQuery(q));
