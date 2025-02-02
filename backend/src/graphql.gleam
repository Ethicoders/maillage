import glen.{type Request as GlenRequest}

pub type Context {
  Context(request: GlenRequest)
}

pub type Request(variables) {
  Request(request: variables)
}

pub type Variables(variables) {
  Variables(request: variables)
}
