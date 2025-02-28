import lustre/attribute
import lustre/element/html

pub fn card(children) {
  html.div(
    [
      attribute.class(
        "flex flex-col block rounded-xl border border-neutral-border p-4 gap-4",
      ),
    ],
    children,
  )
}
