import app.{type Model}
import lustre/attribute
import lustre/element
import lustre/element/html

const root_style = "flex flex-col min-h-screen w-full"

pub fn layout(model: Model, children: List(element.Element(app.Msg))) {
  html.div([attribute.class(root_style)], [
    navbar(model),
    html.main([attribute.class("mt-12 grow")], children),
    footer(),
  ])
}

pub fn navbar(_model: Model) {
  html.nav(
    [
      attribute.class(
        "flex flex-cols justify-between mx-auto max-w-6xl bg-green-100 w-full p-4",
      ),
    ],
    [
      html.h1([attribute.class("text-2xl")], [html.text("Maillage")]),
      html.li([attribute.class("flex gap-x-8 w-max bg-red-200 text-xl")], [
        html.ul([attribute.class("bg-red-200")], [html.text("Menu 1")]),
        html.ul([attribute.class("bg-red-200")], [html.text("Menu 2")]),
        html.ul([attribute.class("bg-red-200")], [html.text("Menu 3")]),
      ]),
      html.text("Compte"),
    ],
  )
}

pub fn footer() {
  html.p([attribute.class("p-4")], [html.text("Footer placeholder")])
}
