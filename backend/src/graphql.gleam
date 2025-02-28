import gleam/list
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

pub type Edge(node) {
  Edge(node: node, cursor: String)
}

pub type PageInfo {
  PageInfo(end_cursor: String, has_next_page: Bool)
}

pub type WithEdges(node) {
  WithEdges(total: Int, edges: List(Edge(node)), page_info: PageInfo)
}

pub fn create_edges(
  nodes: List(node),
  cursor_builder: fn(node) -> String,
) -> WithEdges(node) {
  WithEdges(
    list.length(nodes),
    list.map(nodes, fn(node) { Edge(node, cursor_builder(node)) }),
    PageInfo("", False),
  )
}
