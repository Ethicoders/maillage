import lustre/attribute
import lustre/element/html

pub fn view(name: String) {
  html.span([attribute.class("font-body font-bold text-sm")], [html.text(name)])
}
