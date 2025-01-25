import postgres from "https://deno.land/x/postgresjs/mod.js";
import { is_some, unwrap } from "../gleam_stdlib/gleam/option.mjs";
import { Error as ResultError, Ok } from "../prelude.mjs";
import { List } from "../prelude.mjs";
import { TransactionRolledBack } from "./pog.mjs";

const defaultSslOptions = async (host, ssl) => {
  switch (ssl.constructor.name) {
    case "SslDisabled":
      return [false, []];
    case "SslUnverified":
      return [true, [{ verify: "none" }]];
    case "SslVerified":
      return [
        true,
        [
          { verify: "required" },
          {
            ca: await fetch("https://www.example.com/cacerts").then((res) =>
              res.arrayBuffer()
            ),
          },
          { serverName: host },
          { customizeHostnameCheck: [{ matchFun: "https" }] },
        ],
      ];
  }
};

export const connect = async (config) => {
  const {
    host,
    port,
    database,
    user,
    password,
    ssl,
    connectionParameters,
    poolSize,
    queueTarget,
    queueInterval,
    idleInterval,
    trace,
    ipVersion,
    rowsAsMap,
    defaultTimeout,
  } = config;

  const [sslActivated, sslOptions] = await defaultSslOptions(host, ssl);
  const options = {
    host,
    port,
    database,
    user,
    password: is_some(password) ? unwrap(password) : undefined,
    ssl: sslActivated,
    sslOptions,
    connectionParameters,
    poolSize,
    queueTarget,
    queueInterval,
    idleInterval,
    trace,
    decodeOpts: [{ returnRowsAsMaps: rowsAsMap }],
    socketOptions: ipVersion === "ipv6" ? [inet6] : [],
  };
  const client = postgres(options);
  return { name: "pog_pool", client, defaultTimeout };
};

export const disconnect = async (pool) => {
  await pool.client.end();
};

export const coerceNull = () => {
  // TO DO: implement null function
};

const coerceBool = (boolValue) => {
  // TO DO: implement coerce bool function
};

const coerceInt = (intValue) => {
  // TO DO: implement coerce int function
};

const coerceFloat = (floatValue) => {
  // TO DO: implement coerce float function
};

const coerceText = (textValue) => {
  return `'${textValue}'`;
};

const coerceBytea = (byteaValue) => {
  // TO DO: implement coerce bytea function
};

const coerceValue = (anyValue) => {
  // TO DO: implement coerce value function
};

export const coerce = (value) => {
  return value;
  if (typeof value === "boolean") {
    return coerceBool(value);
  } else if (typeof value === "number") {
    return value % 1 === 0 ? coerceInt(value) : coerceFloat(value);
  } else if (typeof value === "string") {
    return coerceText(value);
  } else if (value instanceof Uint8Array) {
    return coerceBytea(value);
  } else if (!value) {
    return coerceNull();
  } else {
    return coerceValue(value);
  }
};

const getClient = async (pool) => {
  const { client } = await pool;
  return client;
};

export const transaction = async (pool, callback) => {
  const client = await getClient(pool);

  try {
    return await client.begin(async (transationalClient) => {
      const res = await callback({ client: transationalClient });
      if (res instanceof Ok) {
        return res;
      } else if (res instanceof ResultError) {
        throw new Error("Rollback requested");
      }
    });
  } catch (error) {
    return new ResultError(new TransactionRolledBack(
      `Transaction rolled back: ${error.message}`
    ));
  }
};

export const query = async (pool, queryString, args, timeout) => {
  const client = await getClient(pool);
  const timeoutValue = timeout !== undefined ? timeout : pool.defaultTimeout;

  const params = args.toArray();
  try {
    const result = await client.unsafe(queryString, params);
    return new Ok([result.length, List.fromArray(result)]);
  } catch (error) {
    console.error(error);
    return new Error("Query error: " + error.message);
  }
};
