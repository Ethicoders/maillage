import gleamql

pub fn get_url() {
  "http://localhost:8000"
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

pub fn get_client() {
  gleamql.new()
  |> gleamql.set_uri(get_url() <> "/graphql")
  |> gleamql.set_header("Content-Type", "application/json")
}
