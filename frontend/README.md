# Maillage - front-end

## Run dev

`gleam run -m lustre/dev start --port=8080`

## Known Issues

### Lustre/dev server is not reachable via browser when running in Docker:

Because the server runs on 127.0.0.1 and not on 0.0.0.0.

In /app/build/packages/mist/src/mist.gleam

Change
```gleam
pub fn new(handler: fn(Request(in)) -> Response(out)) -> Builder(in, out) {
  Builder(
    port: 4000,
    handler: handler,
    interface: "localhost",
    ipv6_support: False,
    after_start: fn(port, scheme, interface) {
      let address = case interface {
        IpV6(..) -> "[" <> ip_address_to_string(interface) <> "]"
        _ -> ip_address_to_string(interface)
      }
      let message =
        "Listening on "
        <> gleam_http.scheme_to_string(scheme)
        <> "://"
        <> address
        <> ":"
        <> int.to_string(port)
      io.println(message)
    },
  )
}
```

For
```gleam
pub fn new(handler: fn(Request(in)) -> Response(out)) -> Builder(in, out) {
  Builder(
    port: 4000,
    handler: handler,
    interface: "0.0.0.0",
    ipv6_support: False,
    after_start: fn(port, scheme, interface) {
      let address = case interface {
        IpV6(..) -> "[" <> ip_address_to_string(interface) <> "]"
        _ -> ip_address_to_string(interface)
      }
      let message =
        "Listening on "
        <> gleam_http.scheme_to_string(scheme)
        <> "://"
        <> address
        <> ":"
        <> int.to_string(port)
      io.println(message)
    },
  )
}
```
Login does not work as cookie not being written:

In priv/static/maillage.mjs

Change
```js
function to_fetch_request(request) {
  let url = to_string2(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  if (method !== "GET" && method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
```

for
```js
function to_fetch_request(request) {
  let url = to_string2(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    credentials: "include", // ici
    method
  };
  if (method !== "GET" && method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
```