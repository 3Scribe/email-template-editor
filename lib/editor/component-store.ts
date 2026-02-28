import type { ComponentDefinition } from "./models";

const COMPONENTS: ComponentDefinition[] = [
  {
    id: "text",
    name: "Text",
    description: "A text block with configurable content and style.",
    html: "<p style=\"color: {{color}}; font-size: {{fontSize}}px; text-align: {{align}};\">{{text}}</p>",
    defaults: {
      text: "Sample text",
      align: "left",
      color: "#111111",
      fontSize: 16
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
      },
      { key: "color", label: "Text Color", type: "color", defaultValue: "#111111" },
      { key: "fontSize", label: "Font Size", type: "number", defaultValue: 16 }
    ],
    type: "text",
    displayName: "Text",
    defaultProps: {
      text: "Sample text",
      align: "left",
      color: "#111111",
      fontSize: 16
    }
  },
  {
    id: "button",
    name: "Button",
    description: "A call-to-action button linking to a URL.",
    html: "<p><a href=\"{{url}}\" style=\"display:inline-block;background: {{backgroundColor}};color: {{textColor}};padding: 12px 20px;border-radius: 4px;text-decoration: none;\">{{label}}</a></p>",
    defaults: {
      label: "Click me",
      url: "https://example.com",
      backgroundColor: "#2563eb",
      textColor: "#ffffff",
      openInNewTab: false
    },
    settings: [
      { key: "label", label: "Label", type: "text", defaultValue: "Click me" },
      { key: "url", label: "URL", type: "url", defaultValue: "https://example.com" },
      {
        key: "backgroundColor",
        label: "Background",
        type: "color",
        defaultValue: "#2563eb"
      },
      { key: "textColor", label: "Text Color", type: "color", defaultValue: "#ffffff" },
      {
        key: "openInNewTab",
        label: "Open In New Tab",
        type: "boolean",
        defaultValue: false
      }
    ]
  },
  {
    id: "divider",
    name: "Divider",
    description: "A horizontal line used to separate sections.",
    html: "<hr style=\"border:0;border-top: {{thickness}}px solid {{color}};\"/>",
    defaults: {
      thickness: 1,
      color: "#e5e7eb"
    },
    settings: [
      { key: "thickness", label: "Thickness", type: "number", defaultValue: 1 },
      { key: "color", label: "Color", type: "color", defaultValue: "#e5e7eb" }
    ],
    type: "divider",
    displayName: "Divider",
    defaultProps: { thickness: 1, color: "#e5e7eb" }
  },
  {
    id: "image",
    name: "Image",
    description: "An image block with URL and alt text.",
    html: "<img src=\"{{url}}\" alt=\"{{alt}}\" style=\"max-width:100%;display:block;\"/>",
    defaults: {
      url: "https://via.placeholder.com/600x200",
      alt: "Image"
    },
    settings: [
      {
        key: "url",
        label: "Image URL",
        type: "url",
        defaultValue: "https://via.placeholder.com/600x200"
      },
      { key: "alt", label: "Alt text", type: "text", defaultValue: "Image" }
    ],
    type: "image",
    displayName: "Image",
    defaultProps: {
      url: "https://via.placeholder.com/600x200",
      alt: "Image"
    }
  }
];

export const ComponentStore = {
  list(): ComponentDefinition[] {
    return COMPONENTS;
  },
  get(componentId: string): ComponentDefinition | undefined {
    return COMPONENTS.find((component) => component.id === componentId);
  }
};

export function getComponentDefinitions(): ComponentDefinition[] {
  return COMPONENTS;
}

export function getComponentDefinition(
  componentId: string
): ComponentDefinition | undefined {
  return ComponentStore.get(componentId);
}
