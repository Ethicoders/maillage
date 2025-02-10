import lustre/attribute
import lustre/element/html
import lustre/event

pub fn view(href: String, text: String, on_click: msg) {
  html.a(
    [
      attribute.class("text-brand-700 font-body"),
      attribute.href(href),
      event.on_click(on_click),
    ],
    [html.text(text)],
  )
}
