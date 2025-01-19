import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { gql } from "https://deno.land/x/graphql_tag@0.0.1/mod.ts";
import * as glen from "../glen/glen.mjs";
import * as app from "./maillage.mjs";

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const dictToObject = (dict) => {
  const items = {};

  for (let i = 0; i < dict.length; i++) {
    items[dict[i].k] = dict[i].v;
  }
  return items;
};

export const getHandler = (queryResolvers) => {
  const items = dictToObject(queryResolvers.root.array);

  const resolvers = {
    Query: { ...items },
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
  for (let i in corsHeaders) {
    headers.set(i, corsHeaders[i]);
  }
};

export const serve = (queryResolvers) => {
  const handler = getHandler(queryResolvers);

  Deno.serve(
    {
      port: 8000,
    },
    async (request) => {
      const { pathname } = new URL(request.url);
      const clone = request.clone();

      try {
        const body = await clone.json();

        if (isDev() && body.operationName !== "IntrospectionQuery") {
          console.log("Incoming request", request, body.operationName);
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
