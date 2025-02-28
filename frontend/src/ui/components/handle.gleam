import lustre/attribute
import lustre/element/html

pub fn view(handle: String) {
  html.span(
    [attribute.class("text-caption text-xs font-caption text-subtext-color")],
    [html.text(handle)],
  )
}
