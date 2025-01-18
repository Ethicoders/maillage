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

export const serve = (queryResolvers) => {
  console.log("serve");

  const handler = getHandler(queryResolvers);

  Deno.serve(
    {
      port: 8000,
    },
    async (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/graphql") {
        return handler(request);
      } else {
        const req = glen.convert_request(request);
        const response = await app.handle_req(req);
        const res = glen.convert_response(response);

        return res;
      }
    }
  );
};
