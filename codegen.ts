import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../be/src/main/resources/graphql/schema.graphqls",
  documents: ["src/**/*.{ts,tsx,graphql}", "!src/gql/**/*"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
      config: {
        scalars: {
          DateTime: "string",
        },
      },
    },
  },
};

export default config;
