import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { gql } from "https://deno.land/x/graphql_tag@0.0.1/mod.ts";
import * as glen from "../glen/glen.mjs";
import * as app from "./maillage.mjs";
import { GraphQLScalarType } from "https://deno.land/x/graphql_deno@v15.0.0/mod.ts";
import { Error as ResultError, Ok, List } from "../prelude.mjs";
import {
  deleteCookie,
  setCookie,
  getCookies,
} from "https://deno.land/std/http/cookie.ts";

const runGleamGQLGen = async () => {
  const cmd = new Deno.Command("./gleamgqlgen", { args: ["--input", "./src"] });
  const { code, stdout, stderr } = await cmd.output();

  return new TextDecoder().decode(stdout);
};

const dictToObject = (dict) => {
  const items = {};

  for (let i = 0; i < dict.length; i++) {
    items[dict[i].k] = dict[i].v;
  }
  return items;
};

const handleResolverResponse = (resolver) => async (one, two, ctx) => {
  const result = await resolver(one, two, {
    request: glen.convert_request(ctx.request),
  });

  if (result instanceof ResultError) {
    return new Error(result[0]);
  } else if (result instanceof Ok) {
    return snakeToCamelCase(objectListsToArray(result[0]));
  }
  return snakeToCamelCase(objectListsToArray(result));
};

const objectListsToArray = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  for (const key in obj) {
    if (obj[key] instanceof List) {
      obj[key] = obj[key].toArray();
    } else {
      obj[key] = objectListsToArray(obj[key]);
    }
  }
  return obj;
};

const snakeToCamelCase = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelCase);
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/([-_][a-z])/gi, ($1) => {
        return $1.toUpperCase().replace("-", "").replace("_", "");
      });
      newObj[camelKey] = snakeToCamelCase(obj[key]);
    }
  }
  return newObj;
};
export const getHandler = (
  typeString,
  queryResolvers,
  mutationResolvers,
  otherResolvers
) => {
  let typeDefs;
  try {
    typeDefs = gql`
      ${typeString}
    `;
  } catch (error) {
    console.log("Def: ", typeString);
    throw error;
  }

  const processedOtherResolvers = Object.fromEntries(
    Object.entries(dictToObject(otherResolvers.root.array)).map(
      ([key, type]) => [
        key,
        new GraphQLScalarType({
          name: key,
          serialize(value) {
            console.log("serialize", value);

            return fn(value);
          },
          parseValue(value) {
            const out = type.value(value);
            if (out instanceof Ok) {
              return out["0"];
            }

            return out;
          },
          parseLiteral(ast) {
            const out = type.value(ast.value);
            if (out instanceof Ok) {
              return out["0"];
            }
            return out;
          },
        }),
      ]
    )
  );

  const processedQueryResolvers = Object.fromEntries(
    Object.entries(dictToObject(queryResolvers.root.array)).map(
      ([key, type]) => [key, handleResolverResponse(type.value)]
    )
  );

  const processedMutationResolvers = Object.fromEntries(
    Object.entries(dictToObject(mutationResolvers.root.array)).map(
      ([key, type]) => [key, handleResolverResponse(type.value)]
    )
  );
  const resolvers = {
    Query: processedQueryResolvers,
    Mutation: processedMutationResolvers,
    ...processedOtherResolvers,
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  return (request) =>
    GraphQLHTTP({
      schema,
      headers: { test: "test" },
      graphiql: true,
    })(request);
};

const isDev = () => Deno.env.get("NODE_ENV") === "development";

const applyCORSHeaders = (headers, origin) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": isDev() ? origin : "TBD",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Set-Cookie, Priority",
    "Access-Control-Expose-Headers": "Set-Cookie",
  };
  for (const i in corsHeaders) {
    headers.set(i, corsHeaders[i]);
  }
};

export const generateSessionToken = (length = 32) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

export const serve = async (
  queryResolvers,
  mutationResolvers,
  otherResolvers
) => {
  const types = await runGleamGQLGen();

  const handler = getHandler(
    types,
    queryResolvers,
    mutationResolvers,
    otherResolvers
  );

  Deno.serve(
    {
      port: 8000,
    },
    async (request) => {
      const { pathname } = new URL(request.url);
      const clone = request.clone();

      let body;
      try {
        body = await clone.json();

        if (isDev() && body.operationName !== "IntrospectionQuery") {
          console.log("Incoming request", body.operationName);
          console.log(request);
        }
      } catch (error) {}

      if (pathname === "/graphql") {
        // Preflight case
        if (request.method === "OPTIONS") {
          const response = new Response(null);

          applyCORSHeaders(response.headers, "http://localhost:8080");

          return response;
        }
        const response = await handler(request);

        const clone = response.clone();

        try {
          const result = await clone.json();
          if (isDev() && body?.operationName !== "IntrospectionQuery") {
            console.log("Outgoing response", result.data);
          }

          applyCORSHeaders(response.headers, "http://localhost:8080");
        } catch (_error) {}

        return response;
      } else {
        const req = glen.convert_request(request);
        const response = await app.handle_req(req);
        const res = glen.convert_response(response);
        return res;
      }
    }
  );
};
