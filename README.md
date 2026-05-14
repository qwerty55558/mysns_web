# 🐦 mySns / fe

> mySns 모노레포의 **프론트엔드 워크스페이스**. Spring Boot GraphQL 백엔드(`../be`)와 통신하는 Next.js 클라이언트입니다.

> 💡 **TL;DR**
> `pnpm install` → `pnpm codegen` → `pnpm dev` 하면 http://localhost:3000 에서 바로 확인할 수 있어요.

---

## 🧩 기술 스택

```
┌────────────────────┬──────────────────────────────────────────────────────┐
│ 영역               │ 사용 기술                                            │
├────────────────────┼──────────────────────────────────────────────────────┤
│ 프레임워크         │ Next.js 16.2 (App Router, Turbopack)                 │
│ UI / 스타일        │ React 19.2, Tailwind CSS 4                           │
│ 언어 / 타입        │ TypeScript 5                                         │
│ GraphQL 클라이언트 │ @apollo/client 4 + @apollo/client-integration-nextjs │
│ 코드 생성          │ @graphql-codegen/cli + client-preset                 │
│ 패키지 매니저      │ pnpm                                                 │
└────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 🗂 디렉토리 구조

```
fe/
├─ 📁 src/
│  ├─ 📁 app/                   # App Router 엔트리 (layout.tsx, page.tsx)
│  ├─ 📁 features/feed/         # Feed 도메인 컴포넌트 (useQuery 샘플)
│  ├─ 📁 lib/
│  │  ├─ apollo-client.ts       # makeClient (HttpLink + InMemoryCache)
│  │  └─ apollo-provider.tsx    # ApolloNextAppProvider 래퍼
│  └─ 📁 gql/                   # codegen 산출물 (gitignored)
├─ ⚙️  codegen.ts                # graphql-codegen 설정
├─ 🔐 .env.local                # GraphQL 엔드포인트 환경변수
└─ 📦 package.json
```

---

## 🚀 시작하기

### ✅ 사전 준비

- [ ] Node.js **20+**
- [ ] pnpm **9+**
- [ ] 백엔드(`../be`) 기동 — Spring Boot GraphQL, 기본 포트 **8080**

### 🔧 환경변수

`.env.local`

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
```

> 📌 백엔드 포트가 다르면 이 값을 함께 변경하세요. (예: `http://localhost:8081/graphql`)

### 📥 설치 & 코드 생성

```bash
pnpm install
pnpm codegen
```

### 🟢 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 → 👉 [http://localhost:3000](http://localhost:3000)

---

## 🧪 스크립트

```
┌────────────────────┬────────────────────────────────────────────────┐
│ 명령               │ 설명                                           │
├────────────────────┼────────────────────────────────────────────────┤
│ pnpm dev           │ 개발 서버 (Turbopack)                          │
│ pnpm build         │ 프로덕션 빌드                                  │
│ pnpm start         │ 프로덕션 서버 실행                             │
│ pnpm lint          │ ESLint 실행                                    │
│ pnpm codegen       │ GraphQL 타입 / 훅 1회 생성                     │
│ pnpm codegen:watch │ 스키마·쿼리 변경 감지하며 자동 재생성          │
└────────────────────┴────────────────────────────────────────────────┘
```

---

## ⚡ GraphQL 워크플로

> 🧠 **핵심 아이디어**
> 백엔드 스키마 파일을 codegen의 **단일 진실 공급원**으로 두기 때문에, 백엔드 미기동 상태에서도 타입 생성이 가능합니다.

### 1️⃣ 쿼리 작성

컴포넌트 안에서 `graphql()` 헬퍼로 작성:

```ts
import { graphql } from "@/gql";

const FeedQuery = graphql(`
  query Feed($limit: Int!, $offset: Int!) {
    feed(limit: $limit, offset: $offset) {
      id
      content
      author { username }
    }
  }
`);
```

### 2️⃣ 코드 생성

```bash
pnpm codegen        # 1회
pnpm codegen:watch  # 변경 감지
```

→ `src/gql/`에 타입과 `TypedDocumentNode` 자동 생성 ✨

### 3️⃣ 훅 사용

```ts
const { data, loading, error } = useQuery(FeedQuery, {
  variables: { limit: 10, offset: 0 },
});
```

`data`, `variables` 모두 **타입 안전하게 추론**됩니다 🎯

<details>
<summary>🎨 <b>스칼라 매핑</b></summary>

```
┌─────────────┬──────────┐
│ GraphQL     │ TS 타입  │
├─────────────┼──────────┤
│ DateTime    │ string   │
└─────────────┴──────────┘
```

추가/변경은 `codegen.ts`의 `config.scalars` 에서 합니다.
</details>

---

## 🛰 Apollo Provider 구조

```
┌─────────────────────────────┬───────────────────────────────────────────────────┐
│ 파일                        │ 역할                                              │
├─────────────────────────────┼───────────────────────────────────────────────────┤
│ src/lib/apollo-client.ts    │ makeClient — HttpLink + InMemoryCache (streaming) │
│ src/lib/apollo-provider.tsx │ "use client" 경계의 ApolloNextAppProvider 래퍼    │
│ src/app/layout.tsx          │ <body> 안에서 <ApolloProvider> 로 children 감쌈   │
└─────────────────────────────┴───────────────────────────────────────────────────┘
```

> ⚠️ `InMemoryCache`와 `ApolloClient`는 **`@apollo/client-integration-nextjs`** 의 streaming 래핑판을 사용해야 합니다. 일반 `@apollo/client`에서 import 하면 타입이 충돌해요.

---

## 🔌 백엔드 연동 메모

```
┌────────────────┬──────────────────────────────────────────────────┐
│ 항목           │ 값                                               │
├────────────────┼──────────────────────────────────────────────────┤
│ GraphQL POST   │ http://localhost:8080/graphql                    │
│ GraphiQL UI    │ http://localhost:8080/graphiql                   │
│ 스키마 파일    │ ../be/src/main/resources/graphql/schema.graphqls │
│ 인증           │ SecurityConfig 에서 /graphql permitAll           │
└────────────────┴──────────────────────────────────────────────────┘
```

> 🆘 **트러블슈팅**
> 브라우저에서 `Error: Load failed` / `Failed to fetch` 가 보이면 거의 항상 아래 중 하나입니다.
> 1. 백엔드 미기동
> 2. CORS 차단
> 3. 포트 불일치 (다른 프로세스가 8080 점유)
>
> 8080이 점유되어 있다면 백엔드를 다른 포트로 띄우고 `.env.local` 도 함께 바꿔주세요.
> ```bash
> SERVER_PORT=8081 ./gradlew bootRun
> ```
