import lustre/attribute
import lustre/element
import lustre/element/html
import lustre/event
import ui/color.{type Color}

pub opaque type Button(outline, color, msg) {
  Button(label: String, outline: Outline, color: Color, msg: msg)
}

pub type Outline {
  None
  Outlined
}

pub type Unset

pub fn new(label: String, msg) -> Button(Unset, Unset, msg) {
  Button(label, None, color.None, msg)
}

pub fn with_outline(
  button: Button(a, b, c),
  outline: Outline,
) -> Button(outline, b, c) {
  Button(..button, outline: outline)
}

pub fn with_color(button: Button(a, b, c), color: Color) -> Button(a, color, c) {
  Button(..button, color: color)
}

// @TODO: Output the correct classes
pub fn render(button: Button(Outline, Color, a)) -> element.Element(a) {
  let bg = case button.color {
    color.Primary -> "bg-brand-700"
    color.Secondary -> ""
    _ -> ""
  }
  let fg = case button.color {
    color.Primary -> "color-default-background"
    color.Secondary -> ""
    _ -> ""
  }

  html.button(
    [
      attribute.class(bg <> " " <> fg <> " rounded-md h-10 w-full flex-none"),
      event.on_click(button.msg),
    ],
    [html.text(button.label)],
  )
}

pub fn primary(label: String, msg) -> Button(Outline, Color, msg) {
  new(label, msg) |> with_outline(None) |> with_color(color.Primary)
}

pub fn secondary(label: String, msg) -> Button(Outline, Color, msg) {
  new(label, msg) |> with_outline(None) |> with_color(color.Secondary)
}
