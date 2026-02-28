import type { ComponentDefinition } from "./models";

const COMPONENTS: ComponentDefinition[] = [
  {
    type: "text",
    displayName: "Text",
    defaultProps: {
      text: "Sample text",
      align: "left"
    },
    settings: [
      { key: "text", label: "Text", type: "text", defaultValue: "Sample text" },
      {
        key: "align",
        label: "Alignment",
        type: "select",
        defaultValue: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" }
        ]
      }
    ]
  },
  {
    type: "button",
    displayName: "Button",
    defaultProps: {
      label: "Click me",
      href: "https://example.com"
    },
    settings: [
      { key: "label", label: "Label", type: "text", defaultValue: "Click me" },
      {
        key: "href",
        label: "Link URL",
        type: "text",
        defaultValue: "https://example.com"
      }
    ]
  },
  {
    type: "divider",
    displayName: "Divider",
    defaultProps: {
      thickness: 1
    },
    settings: [
      {
        key: "thickness",
        label: "Thickness",
        type: "number",
        defaultValue: 1
      }
    ]
  },
  {
    type: "image",
    displayName: "Image",
    defaultProps: {
      src: "https://via.placeholder.com/600x200",
      alt: "Image"
    },
    settings: [
      {
        key: "src",
        label: "Image URL",
        type: "image",
        defaultValue: "https://via.placeholder.com/600x200"
      },
      { key: "alt", label: "Alt text", type: "text", defaultValue: "Image" }
    ]
  }
];

export function getComponentDefinitions(): ComponentDefinition[] {
  return COMPONENTS;
}

export function getComponentDefinition(
  type: string
): ComponentDefinition | undefined {
  return COMPONENTS.find((component) => component.type === type);
}
