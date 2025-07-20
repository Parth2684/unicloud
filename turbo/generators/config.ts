import { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("react-component", {
    description:
      "Generate a ui component in packages/ui",
    prompts: [
      {
        type: "input",
        name: "file",
        message: "Component name",
        validate: (input: string) => {
          if (input.includes(".")) {
            return "file name cannot include an extension";
          }
          if (input.includes(" ")) {
            return "file name cannot include spaces";
          }
          if (!input) {
            return "file name is required";
          }
          return true;
        },
      }
    ],
    actions: [
      {
        type: "add",
        path: "packages/ui/src/{{pascalCase name}}.tsx",
        templateFile: "templates/react-component.hbs",
      },
    ],
  });
}
