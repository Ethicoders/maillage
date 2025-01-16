import { GraphQLHTTP } from "https://deno.land/x/gql@1.1.2/mod.ts";
import { makeExecutableSchema } from "https://deno.land/x/graphql_tools@0.0.2/mod.ts";
import { gql } from "https://deno.land/x/graphql_tag@0.0.1/mod.ts";

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => `Hello, World!`,
  },
};

export const serve = async () => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  Deno.serve(
    {
      port: 8000,
    },
    async (req) => {
      const { pathname } = new URL(req.url);
      return pathname === "/graphql"
        ? await GraphQLHTTP({
            schema,
            graphiql: true,
          })(req)
        : new Response("Not Found", { status: 404 });
    }
  );
};
