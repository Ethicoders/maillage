import lustre/attribute
import lustre/element
import lustre/element/html

pub opaque type Input(input_type, validation, msg) {
  Input(
    placeholder: String,
    value: String,
    input_type: Type,
    validation: Validation,
    on_input: msg,
  )
}

pub type Type {
  Text
  Password
  Email
  Number
}

pub type Validation {
  Valid
  Invalid
  Unset
}

pub type Unset

pub fn new(placeholder: String, on_input: msg) -> Input(Unset, Unset, msg) {
  Input(
    placeholder: placeholder,
    value: "",
    input_type: Text,
    validation: Unset,
    on_input: on_input,
  )
}

pub fn with_type(input: Input(a, b, c), input_type: Type) -> Input(Type, b, c) {
  Input(..input, input_type: input_type)
}

pub fn with_validation(
  input: Input(a, b, c),
  validation: Validation,
) -> Input(a, Validation, c) {
  Input(..input, validation: validation)
}

pub fn render(input: Input(Type, Validation, a)) -> element.Element(a) {
  let type_attr = case input.input_type {
    Text -> "text"
    Password -> "password"
    Email -> "email"
    Number -> "number"
  }

  html.input([
    attribute.class("bg-transparent w-full h-full text-default-font"),
    attribute.type_(type_attr),
    attribute.placeholder(input.placeholder),
    attribute.value(input.value),
  ])
}

pub fn email_input(
  placeholder: String,
  on_input: msg,
) -> Input(Type, Validation, msg) {
  new(placeholder, on_input)
  |> with_type(Email)
  |> with_validation(Unset)
}

pub fn password_input(
  placeholder: String,
  on_input: msg,
) -> Input(Type, Validation, msg) {
  new(placeholder, on_input)
  |> with_type(Password)
  |> with_validation(Unset)
}
