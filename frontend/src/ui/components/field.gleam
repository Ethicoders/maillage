import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html

pub fn form_field(label: String, field: Element(a)) {
  html.div(
    [
      // html.attr("data-selectable-node-ids", "9fb93c54-68ef-5edd-82e7-45eb1d6a2d83 6a2f48cf-31dc-4134-bc2d-56fef17494a7"),
      // html.attr("data-sub-instance-selections", "{\"instanceId\":\"9fb93c54-68ef-5edd-82e7-45eb1d6a2d83\",\"parentComponentId\":\"417afe6e-efa9-4b89-a921-34cc9f6316f3\"}"),
      // html.attr("draggable", "true"),
      attribute.class("w-full"),
      // html.attr("data-node-id", "6a2f48cf-31dc-4134-bc2d-56fef17494a7"),
    ],
    [
      html.span(
        [
          attribute.class("text-default-font"),
          // attribute.class(["sc-cEzcPc", "bRANNl", "_reset_2qoun_1"]),
        // text.attr("data-node-id", "ade53b9d-270d-4511-b5ee-c4fe3147f875"),
        ],
        [html.text(label)],
      ),
      html.div(
        [
          attribute.class(
            "rounded-md border border-solid border-neutral-border",
          ),
          // container.attr("data-node-id", "53d316a4-1183-4dc7-b8d3-d1fff9cf7fa7"),
        ],
        [
          html.div(
            [
              // attribute.class(["sc-keTIit", "byYRKT", "_reset_2qoun_1"]),
            // container.attr("data-node-id", "467f4a01-15f6-46c7-af53-3434de7ee6d9"),
            ],
            [
              // attribute.class(["sc-blHHSb", "gvPyeM", "_root_1b3sg_16", "sc-ovuCP", "emmkCq", "_reset_2qoun_1"]),
              // input.attr("data-node-id", "8ce193e5-c490-46b6-bff9-8553b0a5843e"),
              // input.attr("draggable", "false"),
              // input.attr("type", "text"),
              // input.attr("readonly", ""),
              field,
              //   html.input([attribute.placeholder(placeholder)]),
            ],
          ),
        ],
      ),
    ],
  )
}
