import { existsSync } from "node:fs";
import type { CodegenConfig } from "@graphql-codegen/cli";

// 개발: 옆 BE 레포의 라이브 스키마를 직접 읽는다.
// Docker/CI: BE 레포가 없으므로 레포에 vendoring된 ./schema.graphqls로 폴백.
// (BE 스키마 변경 시 `cp ../be/src/main/resources/graphql/schema.graphqls ./schema.graphqls`로 갱신)
const LIVE_SCHEMA = "../be/src/main/resources/graphql/schema.graphqls";
const schemaPath = existsSync(LIVE_SCHEMA) ? LIVE_SCHEMA : "./schema.graphqls";

const config: CodegenConfig = {
  schema: schemaPath,
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
