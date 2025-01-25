import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { gql } from "https://deno.land/x/graphql_tag@0.0.1/mod.ts";
import * as glen from "../glen/glen.mjs";
import * as app from "./maillage.mjs";
import { GraphQLScalarType } from "https://deno.land/x/graphql_deno@v15.0.0/mod.ts";
import { Error as ResultError, Ok } from "../prelude.mjs";

const dictToObject = (dict) => {
  const items = {};

  for (let i = 0; i < dict.length; i++) {
    items[dict[i].k] = dict[i].v;
  }
  return items;
};

const handleResolverResponse = (resolver) => async (one, two, three) => {
  const result = await resolver(one, two, three);
  if (result instanceof ResultError) {
    return new Error(result[0]);
  } else if (result instanceof Ok) {
    return result[0];
  }
  return result;
};

export const getHandler = (
  typeString,
  queryResolvers,
  mutationResolvers,
  otherResolvers
) => {
  const typeDefs = gql`
    ${typeString}
  `;

  const processedOtherResolvers = Object.fromEntries(
    Object.entries(dictToObject(otherResolvers.root.array)).map(
      ([key, type]) => [
        key,
        new GraphQLScalarType({
          name: key,
          serialize(value) {
            console.log("serialize");
            return fn(value);
          },
          parseValue(value) {
            console.log("parseValue");

            return fn(value);
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
      ([key, resolver]) => [key, handleResolverResponse(resolver)]
    )
  );

  const processedMutationResolvers = Object.fromEntries(
    Object.entries(dictToObject(mutationResolvers.root.array)).map(
      ([key, resolver]) => [key, handleResolverResponse(resolver)]
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
      graphiql: true,
    })(request);
};

const isDev = () => Deno.env.get("NODE_ENV") === "development";

const applyCORSHeaders = (headers) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": isDev() ? "*" : "TBD",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  for (const i in corsHeaders) {
    headers.set(i, corsHeaders[i]);
  }
};

export const serve = (
  typeString,
  queryResolvers,
  mutationResolvers,
  otherResolvers
) => {
  const handler = getHandler(
    typeString,
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
        }
      } catch (error) {}

      // request.bodyUsed = false;
      if (pathname === "/graphql") {
        // Preflight case
        if (request.method === "OPTIONS") {
          const response = new Response(null);
          applyCORSHeaders(response.headers);

          return response;
        }
        const response = await handler(request);

        const clone = response.clone();

        if (isDev() && body?.operationName !== "IntrospectionQuery") {
          const result = await clone.text();
          console.log("Outgoing response", result);
        }

        applyCORSHeaders(response.headers);
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
