//// Query a GraphQL server with `gleamql`.
////
//// ```gleam
//// gleamql.new()
//// |> gleamql.set_query(country_query)
//// |> gleamql.set_variable("code", json.string("GB"))
//// |> gleamql.set_host("countries.trevorblades.com")
//// |> gleamql.set_path("/graphql")
//// |> gleamql.set_header("Content-Type", "application/json")
//// |> gleamql.set_decoder(dynamic.decode1(
////   Data,
////   field("country", of: dynamic.decode1(Country, field("name", of: string))),
//// ))
//// |> gleamql.send(hackney.send)
//// ```
////

import gleam/dynamic.{type Decoder, type Dynamic, field}
import gleam/fetch
import gleam/http.{Post}
import gleam/http/request
import gleam/http/response
import gleam/javascript/promise
import gleam/json.{type Json, object}
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam/uri
import lustre_http.{type HttpError}

/// GleamQL Request
///
pub type Request(t) {
  Request(
    http_request: request.Request(String),
    query: Option(String),
    variables: Option(List(#(String, Json))),
    decoder: Option(Decoder(t)),
    operation_name: Option(String),
  )
}

/// GleamQL Error
///
pub type GraphQLError {
  ErrorMessage(message: String)
  UnexpectedStatus(status: Int)
  UnrecognisedResponse(response: String)
  UnknownError(inner: Dynamic)
}

type GqlSuccess(t) {
  SuccessResponse(data: t)
}

type GqlErrors {
  ErrorResponse(errors: List(GqlError))
}

type GqlError {
  GqlError(message: String)
}

/// Construct a GleamQL Request
///
/// Use with set functions to customise.
///
pub fn new() -> Request(t) {
  Request(
    http_request: request.new()
      |> request.set_method(Post),
    query: None,
    variables: None,
    decoder: None,
    operation_name: None,
  )
}

/// Set the query of the request
///
pub fn set_query(req: Request(t), query: String) -> Request(t) {
  Request(..req, query: Some(query))
}

/// Set the query of the request
///
pub fn set_operation_name(req: Request(t), operation_name: String) -> Request(t) {
  Request(..req, operation_name: Some(operation_name))
}

/// Set a variable that is needed in the request query
///
/// ```gleam
/// gleamql.set_variable("code", json.string("GB"))
/// ```
///
pub fn set_variable(req: Request(t), key: String, value: Json) -> Request(t) {
  let variables = [
    #(key, value),
    ..req.variables
    |> option.unwrap(list.new())
  ]

  Request(..req, variables: Some(variables))
}

pub fn send(req: Request(String), expect: lustre_http.Expect(a)) {
  let http_request =
    req.http_request
    |> request.set_body(
      json.to_string(
        object([
          #(
            "query",
            req.query
              |> option.unwrap("")
              |> json.string,
          ),
          #(
            "variables",
            object(
              req.variables
              |> option.unwrap(list.new()),
            ),
          ),
          #(
            "operationName",
            req.operation_name |> option.unwrap("") |> json.string,
          ),
        ]),
      ),
    )

  // lustre_http.get(url, lustre_http.expect_json(decoder, ApiUpdatedQuote))
  lustre_http.send(http_request, expect)
}

/// Set the host of the request.
///
/// ```gleam
/// gleamql.set_host("countries.trevorblades.com")
/// ```
///
pub fn set_host(req: Request(t), host: String) -> Request(t) {
  Request(
    ..req,
    http_request: req.http_request
      |> request.set_host(host),
  )
}

pub fn set_uri(req: Request(t), string_uri: String) -> Request(t) {
  let b = uri.parse(string_uri)
  // use parsed <- result.try(b) 
  let parsed = case b {
    Ok(c) -> c
    Error(_) -> todo
  }
  let http_request =
    case request.from_uri(parsed) {
      Ok(c) -> c
      Error(_) -> todo
    }
    |> request.set_method(http.Post)
  Request(..req, http_request:)
}

/// Set the path of the request.
///
/// ```gleam
/// gleamql.set_path("/graphql")
/// ```
///
pub fn set_path(req: Request(t), path: String) -> Request(t) {
  Request(
    ..req,
    http_request: req.http_request
      |> request.set_path(path),
  )
}

/// Set the header with the given value under the given header key.
///
/// If already present, it is replaced.
///
/// ```gleam
/// gleamql.set_header("Content-Type", "application/json")
/// ```
///
pub fn set_header(req: Request(t), key: String, value: String) -> Request(t) {
  Request(
    ..req,
    http_request: req.http_request
      |> request.set_header(key, value),
  )
}

fn status_is_ok(status: Int) -> Bool {
  status == 200
}

/// Set the decoder that will be used to deserialize the graphql response.
///
/// If not given, the response will not be deserialized.
///
/// ```gleam
/// gleamql.set_decoder(dynamic.decode1(
///   Data,
///   field("country", of: dynamic.decode1(Country, field("name", of: string))),
/// ))
/// ```
///
pub fn set_decoder(req: Request(t), decoder: dynamic.Decoder(t)) -> Request(t) {
  Request(..req, decoder: Some(decoder))
}
