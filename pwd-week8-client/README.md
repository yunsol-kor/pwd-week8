# 8주차 클라이언트 실습 — Ajou Campus Foodmap

## 과제 제출용 실행 순서

1. 서버의 `supabase/schema.sql`을 Supabase에 적용하고 서버를 실행합니다. 서버와 클라이언트는 같은 Supabase 프로젝트를 사용합니다.
2. `.env.example`을 참고해 `.env.local`에 API 주소, Supabase URL, 공개 키를 설정합니다. `npm ci` 후 `npm run dev`를 실행합니다.
3. 로그인 없이 맛집 목록을 엽니다. 이메일·Google·네이버로 각각 로그인해 **맛집 등록·관리**를 확인합니다. 회원은 자신이 등록한 맛집을, 관리자는 전체 맛집을 관리할 수 있습니다. 기존의 **맛집 제보**는 승인 절차를 거치는 별도 기능입니다.
4. Vercel 프로젝트에도 같은 세 가지 `VITE_*` 환경 변수를 등록합니다. `VITE_API_BASE_URL`에는 배포한 서버 주소를 넣습니다. 서버 CORS에 Vercel origin을 등록하고 Supabase의 Site URL 및 Redirect URLs에 배포 주소와 `/auth/callback`을 설정합니다.

React와 TypeScript로 아주대학교 주변 맛집을 조회하고 제보하는 웹 서비스를 구현합니다. 이메일·Google·네이버 로그인, 사용자 정보 관리, 관리자 맛집 관리와 제보 승인 기능을 구현하고 Vercel에 배포합니다.

## 프로젝트 소개와 완료 목표

| 기능 | 구현 결과 |
| --- | --- |
| 공개 맛집 화면 | 목록·카테고리 필터·상세·인기 맛집 조회 |
| 좋아요 | 브라우저에 선택과 개수를 저장하고 새로고침 후 복원 |
| 로그인 | 이메일 회원가입·로그인, Google·네이버 로그인 |
| 로그인 상태 | 새로고침 복원, 보호 화면, 로그아웃·계정 전환 |
| 내 정보 | 표시 이름·이미지·비밀번호 변경, 계정 비활성화 |
| 관리자 | 맛집 생성·수정·삭제, 사용자 역할 변경 |
| 제보 | 로그인 사용자 제보, 관리자 승인·거절·삭제 |
| 배포 | 본인의 GitHub 저장소와 Vercel 서비스 |

인증과 업무 요청은 다음과 같이 나뉩니다.

| 구성 요소 | 담당 |
| --- | --- |
| React 화면 | 입력·결과 표시, 로그인한 사용자에 맞는 메뉴 표시 |
| 브라우저의 Supabase SDK | Auth에 가입·로그인 요청, 토큰 보관·갱신 |
| Express API | 요청의 토큰 검증, 사용자 역할 확인, 맛집·제보 처리 |
| Supabase Auth | 인증 계정·비밀번호 검증, 로그인 세션·토큰 발급 |
| PostgreSQL | 앱 프로필·역할, 맛집, 제보 저장 |

**로그인 흐름:** 로그인 버튼 → Supabase Auth → SDK가 토큰 보관 → `/api/auth/me` 요청에 토큰 첨부 → Express가 검증하고 프로필 조회 → React 화면 갱신.

## 사전 준비

- Node.js 24.x와 npm, Git, VS Code, Chrome을 준비합니다.
- 본인의 GitHub·Supabase·Vercel 계정, Google·네이버 로그인 설정용 계정을 준비합니다.
- [서버 실습서](https://github.com/ajou-hyunseok-oh/pwd-week8-server/blob/main/README.md)의 Foodmap 서버를 별도로 실행합니다. 서버는 `http://localhost:3000`, 클라이언트는 `http://127.0.0.1:5173`을 사용합니다.
- 서버와 클라이언트는 같은 Supabase 프로젝트를 사용합니다. 서버에는 인증 계정 생성 시 같은 UUID의 `profiles` 행을 만드는 설정, 사용자 역할·맛집·제보 API가 준비되어 있어야 합니다.

상위 작업 폴더에서 버전을 확인합니다.

```bash
node --version
npm --version
git --version
```

Node 출력이 `v24.`로 시작해야 합니다. 서버가 실행 중인지 브라우저에서 `http://localhost:3000/health`를 열어 `{"status":"ok"}`로 확인합니다. 공개 목록 `http://localhost:3000/api/restaurants`는 `{ "data": [...] }`를 반환해야 합니다. 서버의 `CLIENT_URL`에는 `http://127.0.0.1:5173`을 등록합니다.

명령은 VS Code의 **터미널 → 새 터미널**에서 실행합니다. 아래 실습에서는 Windows Git Bash 또는 macOS·Linux 터미널을 사용합니다. 서버 터미널은 실행한 채로 두고 클라이언트용 터미널을 따로 엽니다. 파일 경로는 1절에서 만들 프로젝트 폴더를 기준으로 합니다.

| 필요한 서버 기능 | 요청·권한 |
| --- | --- |
| 공개 맛집 | `GET /api/restaurants`, `/popular`, `/:id` |
| 현재 사용자 | `GET /api/auth/me` — 로그인 |
| 맛집 관리 | `POST /api/restaurants`, `PUT·DELETE /:id` — 관리자 |
| 계정 관리 | `PUT /api/users/profile`, `DELETE /api/users/account` — 본인 |
| 사용자 역할 | `GET /api/users/all`, `PUT /api/users/:id/type` — 관리자 |
| 제보 작성 | `POST /api/submissions` — 로그인 |
| 제보 관리 | `GET /api/submissions`, `PUT·DELETE /:id`, `POST /:id/approve` — 관리자 |
| 소셜 설정 상태 | `GET /api/auth/providers` — 공개 |

서버 인증 계정은 `auth.users`, 앱의 이름·역할·활성 상태는 `public.profiles`에 저장됩니다. 두 행의 UUID가 같아야 합니다. 계정의 이메일·이름은 표시 정보이며 요청한 사용자를 구분하는 기준은 UUID입니다.

## 1. 프로젝트 생성

### 1-1. 프로젝트 폴더 만들기

**목적:** 클라이언트 코드와 패키지를 저장할 독립된 프로젝트를 만듭니다. **작업 위치:** 프로젝트를 생성할 상위 폴더입니다. 같은 이름의 폴더가 이미 있으면 새 폴더 이름을 사용합니다.

```bash
mkdir pwd-week8-client
cd pwd-week8-client
npm init -y
```

`mkdir`은 폴더 생성, `cd`는 작업 위치 이동, `npm init -y`는 기본 `package.json` 생성입니다. VS Code의 **파일 → 폴더 열기**로 이 폴더를 엽니다.

**정상 결과:** 탐색기 루트에 `package.json`이 보입니다. 이후 명령은 모두 이 폴더에서 실행합니다.

### 1-2. 폴더 준비

```bash
mkdir -p src/components src/pages src/styles src/types src/services
mkdir -p src/config src/contexts src/utils tests
```

| 폴더 | 작성할 내용 |
| --- | --- |
| `src/components`, `src/pages` | 재사용 화면 요소와 주소별 화면 |
| `src/types` | 서버 응답·입력값의 TypeScript 타입 |
| `src/services`, `src/config` | HTTP 요청, 인증 SDK와 환경 설정 |
| `src/contexts` | 여러 화면이 공유할 로그인 정보 |
| `src/styles`, `src/utils` | 공통 스타일과 처리 함수 |
| `tests` | 인증 복귀 처리의 자동 검사 |

## 2. 개발 환경 설정

**목적:** React·TypeScript·Vite 실행 환경과 검사 명령을 설정합니다. 아래 설정 파일을 순서대로 저장합니다. 화면 진입 파일은 3절에서 작성합니다.


### 2-1. 패키지와 실행 명령 설정

React는 화면, Vite는 개발 서버와 빌드, TypeScript는 타입 검사를 담당합니다. Axios는 HTTP 요청, React Query는 조회 결과 관리, Supabase SDK는 인증 요청을 담당합니다. 버전을 고정하여 같은 패키지 구성을 설치합니다.

**파일:** `package.json` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path="package.json" -->
```json
{
  "name": "pwd-week8-client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "tsx --test tests/*.test.ts"
  },
  "dependencies": {
    "@emotion/react": "11.14.0",
    "@emotion/styled": "11.14.1",
    "@tanstack/react-query": "5.87.4",
    "axios": "1.12.2",
    "react": "19.1.1",
    "react-dom": "19.1.1",
    "react-hook-form": "7.62.0",
    "react-icons": "5.5.0",
    "react-router-dom": "7.9.1",
    "react-spinners": "0.17.0",
    "react-toastify": "11.0.5",
    "@supabase/supabase-js": "2.118.0"
  },
  "devDependencies": {
    "@eslint/js": "9.35.0",
    "@types/node": "24.19.2",
    "@types/react": "19.1.13",
    "@types/react-dom": "19.1.9",
    "@vitejs/plugin-react-swc": "4.0.1",
    "eslint": "9.35.0",
    "eslint-plugin-react-hooks": "5.2.0",
    "eslint-plugin-react-refresh": "0.4.20",
    "globals": "16.4.0",
    "jiti": "2.7.0",
    "typescript": "5.9.3",
    "typescript-eslint": "8.71.1",
    "vite": "7.1.5",
    "tsx": "4.23.0"
  },
  "engines": {
    "node": "24.x"
  }
}
```


파일을 저장한 뒤 의존성을 설치합니다.

```bash
npm install
npm ls --depth=0
```

**정상 결과:** 설치가 끝나고 목록에 react·vite·typescript·@supabase/supabase-js가 표시됩니다. npm이 만든 package-lock.json을 함께 보관합니다. 이후 같은 프로젝트를 다시 설치할 때는 `npm ci --include=dev`를 사용합니다.


### 2-2. TypeScript 검사 대상 연결

화면 코드와 개발 설정을 각각 검사할 하위 설정 파일을 연결합니다.

**파일:** `tsconfig.json` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path="tsconfig.json" -->
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```


### 2-3. 화면 코드 타입 검사 설정

src의 TypeScript·TSX를 엄격하게 검사합니다. 사용하지 않는 변수와 안전하지 않은 접근을 확인합니다.

**파일:** `tsconfig.app.json` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path="tsconfig.app.json" -->
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["vite/client"],
    "jsx": "react-jsx",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```


### 2-4. 개발 설정 타입 검사

Vite와 ESLint 설정 파일을 Node 환경 기준으로 검사합니다.

**파일:** `tsconfig.node.json` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path="tsconfig.node.json" -->
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "eslint.config.ts"]
}
```


### 2-5. Vite 개발 서버 설정

React 플러그인으로 TSX를 처리합니다. 저장한 화면 파일의 변경 결과를 개발 서버에서 확인합니다.

**파일:** `vite.config.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path="vite.config.ts" -->
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
```


### 2-6. 코드 검사 규칙 설정

TypeScript·React Hook 사용 규칙과 테스트의 Node 전역을 설정합니다.

**파일:** `eslint.config.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path="eslint.config.ts" -->
```ts
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  { files: ['tests/**/*.ts'], languageOptions: { globals: globals.node } },
])
```


### 2-7. 저장소 제외 파일 설정

패키지 폴더·빌드 결과·실제 환경변수 파일을 Git 추적에서 제외합니다.

**파일:** `.gitignore` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path=".gitignore" -->
```gitignore
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local
.env
.env.*
!.env.example
.vercel

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```


### 2-8. 환경변수 예시 작성

공유할 변수 이름과 예시 값을 기록합니다. 실제 실행 값은 .env.local에 따로 작성합니다.

**파일:** `.env.example` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="2" path=".env.example" -->
```dotenv
# 이 파일은 공유 가능한 예시입니다. 실제 개발 값은 .env.local에서 설정합니다.
# API 주소에는 /api를 붙이지 않습니다.
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_your_key
```


**설정 확인:** 탐색기에 위 파일과 node_modules·package-lock.json이 보이는지 확인합니다. 아직 화면 파일을 만들지 않았으므로 개발 서버·빌드는 3절까지 작성한 뒤 실행합니다.

## 3. 기본 화면 구성

**목적:** 브라우저가 React를 시작하는 진입점, 공통 스타일, 홈 화면과 주소 이동을 만듭니다.

**실행 순서:** index.html → src/main.tsx → App.tsx → 헤더·페이지. `/#/`에서 # 뒤의 주소는 HashRouter가 화면을 선택하는 데 사용합니다.


### 3-1. 브라우저 진입 HTML 작성

root 요소에 React 화면이 들어갑니다. module script가 main.tsx를 불러옵니다.

**파일:** `index.html` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="index.html" -->
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="캠퍼스 주변 맛집을 찾아보세요!" />
    <title>Ajou Campus Foodmap - 우리 학교 맛집 지도</title>
  </head>
  <body>
    <noscript>이 앱을 실행하려면 JavaScript를 활성화해야 합니다.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```


### 3-2. React 실행 진입점 작성

createRoot로 App을 root 요소에 표시합니다. StrictMode는 개발 중 부수 효과의 정리 문제를 확인하도록 돕습니다.

**파일:** `src/main.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/main.tsx" -->
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('앱을 표시할 root 요소를 찾을 수 없습니다.')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```


### 3-3. 기본 CSS 작성

브라우저의 기본 여백과 폰트 등 기본 표시를 설정합니다.

**파일:** `src/index.css` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/index.css" -->
```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```


### 3-4. 페이지 배치 CSS 작성

전체 앱·본문·하단 영역의 공통 배치를 설정합니다.

**파일:** `src/App.css` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/App.css" -->
```css
/* 기본 스타일 초기화 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f5f5f5;
  color: #333;
}

/* 레이아웃 */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
}

@media (max-width: 600px) {
  .main-content {
    padding: 1rem;
  }
}

/* 기본 버튼 스타일 */
button {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

button:hover {
  background: #f0f0f0;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 기본 폼 스타일 */
input, select, textarea {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

/* 푸터 */
.footer {
  background: #333;
  color: white;
  text-align: center;
  padding: 1rem;
  margin-top: auto;
}

/* 로딩 */
.loading {
  text-align: center;
  padding: 2rem;
}

/* 에러 */
.error {
  color: red;
  padding: 1rem;
  text-align: center;
}
```


### 3-5. 전역 스타일 작성

Emotion의 Global로 모든 화면에 적용할 공통 스타일을 선언합니다.

**파일:** `src/styles/GlobalStyles.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/styles/GlobalStyles.tsx" -->
```tsx
/** @jsxImportSource @emotion/react */
import { Global, css } from '@emotion/react';

const GlobalStyles = () => (
  <Global
    styles={css`
      /* Emotion으로 관리할 글로벌 스타일 */
      a {
        color: inherit;
        text-decoration: none;
      }

      ul {
        list-style: none;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
    `}
  />
);

export default GlobalStyles;
```


### 3-6. 홈 메뉴 작성

공통 헤더와 홈 주소로 이동할 링크를 만듭니다.

**파일:** `src/components/Header.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/components/Header.tsx" -->
```tsx
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
const Banner = styled.header`
  padding: 1.5rem; color: white; background: linear-gradient(135deg,#667eea,#764ba2);
  h1 { text-align: center; }
  nav { display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; }
  a { color: white; text-decoration: none; }
`;
export default function Header() {
  return <Banner><h1>Ajou Campus Foodmap</h1><nav><Link to="/">Home</Link></nav></Banner>;
}
```


### 3-7. 홈 화면 작성

서비스의 첫 화면을 만듭니다.

**파일:** `src/pages/HomePage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/pages/HomePage.tsx" -->
```tsx
export default function HomePage() {
  return <section><h2>캠퍼스 주변 맛집 찾기</h2>
    <p>맛집을 찾아보고 좋아요를 표시하거나 새로운 맛집을 제보하세요.</p>
  </section>;
}
```


### 3-8. 없는 주소 안내 작성

등록되지 않은 주소로 접속했을 때 홈으로 돌아갈 수 있게 합니다.

**파일:** `src/components/NotFound.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/components/NotFound.tsx" -->
```tsx
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaExclamationTriangle } from 'react-icons/fa';

const Container = styled.div`
  text-align: center;
  padding: 4rem 1rem;
`;

const Icon = styled(FaExclamationTriangle)`
  font-size: 4rem;
  color: #ff6b6b;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const HomeLink = styled(Link)`
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border-radius: 8px;
  transition: background 0.3s;

  &:hover {
    background: #5a67d8;
  }
`;

function NotFound() {
  return (
    <Container>
      <Icon />
      <Title>404 - 페이지를 찾을 수 없습니다</Title>
      <Message>요청하신 페이지가 존재하지 않습니다.</Message>
      <HomeLink to="/">홈으로 돌아가기</HomeLink>
    </Container>
  );
}

export default NotFound;
```


### 3-9. 주소와 화면 연결

HashRouter와 Routes로 홈·없는 주소 화면을 연결합니다.

**파일:** `src/App.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="3" path="src/App.tsx" -->
```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import NotFound from './components/NotFound';
import HomePage from './pages/HomePage';
import GlobalStyles from './styles/GlobalStyles';
import './App.css';

export default function App() {
  return <HashRouter><GlobalStyles /><div className="app">
    <Header /><main className="main-content"><Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes></main>
    <footer className="footer">© 2026 Ajou Campus Foodmap</footer>
  </div></HashRouter>;
}
```


### 3-10. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

브라우저에서 `http://127.0.0.1:5173`을 열어 제목과 홈 설명을 확인합니다. `/#/unknown`에서는 없는 주소 안내가 보여야 합니다. 여기서는 서버 데이터 요청 전 화면 실행을 확인합니다.

**이해 확인:** root에 어떤 파일이 React를 실행하고, App에서 어떤 코드가 URL에 맞는 화면을 선택하는지 찾아봅니다.

## 4. 맛집 조회와 좋아요

**목적:** 서버에서 목록·상세·인기 맛집을 가져오고, 좋아요 선택을 브라우저에 저장합니다.

프로젝트 루트에 .env.local을 만들고 본인 서버 기본 주소를 작성합니다. /api를 붙이지 않습니다.

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

요청 순서는 페이지 → api.ts → http.ts → Express입니다. React Query의 useQuery는 요청 결과·로딩·오류를 관리합니다. queryKey는 서로 다른 조회 결과를 구분하는 이름입니다.


### 4-1. 맛집 데이터 타입 작성

서버의 camelCase 필드와 입력 폼 타입을 선언합니다. TypeScript 타입은 개발 중 검사이며 실제 서버 응답을 자동 검증하는 기능은 아닙니다.

**파일:** `src/types/index.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/types/index.ts" -->
```ts
// API의 식별자는 URL에 담을 수 있는 숫자 또는 문자열입니다.
export type EntityId = number | string;

export interface Restaurant {
  id: EntityId;
  name: string;
  category: string;
  location: string;
  priceRange?: string;
  rating: number;
  description?: string;
  recommendedMenu: string[];
  likes: number;
  image?: string;
}

export type CreateRestaurantInput = Omit<Restaurant, 'id' | 'likes' | 'rating' | 'recommendedMenu'> & {
  rating?: number;
  recommendedMenu?: string[];
};
export type UpdateRestaurantInput = Partial<CreateRestaurantInput>;
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

// 서버 응답의 JSON 본문은 data 안에 실제 결과를 담습니다.
export interface ApiResponse<T> {
  data: T;
}

// 메뉴 입력 문자열을 전송 전에 문자열 배열로 변환합니다.
export interface RestaurantFormValues {
  name: string;
  category: string;
  location: string;
  priceRange: string;
  rating: string | number;
  description: string;
  recommendedMenu: string;
  image: string;
}
```


### 4-2. 공개 HTTP 요청 준비

서버 주소와 대기 시간을 한곳에 설정합니다. 인터셉터는 요청 전 공통 처리를 실행하는 함수이며 여기서는 주소 누락을 확인합니다.

**파일:** `src/services/http.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/services/http.ts" -->
```ts
import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
export const publicApi = axios.create({ baseURL, timeout: 60000, withCredentials: false });
publicApi.interceptors.request.use((config) => {
  if (!baseURL) throw new Error('VITE_API_BASE_URL을 확인하고 Vite를 다시 시작하세요.');
  return config;
});
```


### 4-3. 맛집 조회 함수 작성

서버 응답 본문은 { data: ... } 형식입니다. Axios 응답의 .data로 본문을 꺼내 반환하고 페이지가 본문의 data에서 맛집을 읽습니다.

**파일:** `src/services/api.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/services/api.ts" -->
```ts
import { publicApi } from './http';
import type { ApiResponse, EntityId, Restaurant } from '../types';

export const restaurantAPI = {
  getRestaurants: async (): Promise<ApiResponse<Restaurant[]>> =>
    (await publicApi.get('/api/restaurants')).data,
  getRestaurantById: async (id: EntityId): Promise<ApiResponse<Restaurant>> =>
    (await publicApi.get(`/api/restaurants/${id}`)).data,
  getPopularRestaurants: async (): Promise<ApiResponse<Restaurant[]>> =>
    (await publicApi.get('/api/restaurants/popular')).data,
};
export default restaurantAPI;
```


### 4-4. 좋아요 저장 함수 작성

좋아요는 이 브라우저의 LocalStorage에 저장합니다. ID별 선택·개수를 읽고 잘못된 값과 저장 실패를 처리합니다. 서버의 공동 집계와는 별도의 브라우저 기능입니다.

**파일:** `src/services/likes.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/services/likes.ts" -->
```ts
import type { EntityId } from '../types';

const LIKED_IDS_KEY = 'likedRestaurants';
const LIKE_COUNTS_KEY = 'restaurantLikes';

export interface LikeState {
  liked: boolean;
  likes: number;
}

function readJson(key: string, fallback: unknown): unknown {
  const saved = localStorage.getItem(key);
  return saved === null ? fallback : JSON.parse(saved);
}

function readLikes() {
  const ids = readJson(LIKED_IDS_KEY, []);
  const counts = readJson(LIKE_COUNTS_KEY, {});
  const validId = (value: unknown): value is EntityId =>
    typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
  if (!Array.isArray(ids) || !ids.every(validId)) {
    throw new Error('저장된 좋아요 목록의 형식을 확인하세요.');
  }
  if (typeof counts !== 'object' || counts === null || Array.isArray(counts)
    || !Object.values(counts).every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
    throw new Error('저장된 좋아요 수의 형식을 확인하세요.');
  }
  return { ids: ids as EntityId[], counts: counts as Record<string, number> };
}

export function readLikeState(id: EntityId, fallbackLikes: number): LikeState {
  const { ids, counts } = readLikes();
  return {
    liked: ids.some((savedId) => String(savedId) === String(id)),
    likes: counts[String(id)] ?? fallbackLikes,
  };
}

export function toggleRestaurantLike(id: EntityId, liked: boolean, likes: number): LikeState {
  const stored = readLikes();
  const next = { liked: !liked, likes: liked ? Math.max(0, likes - 1) : likes + 1 };
  const ids = stored.ids.filter((savedId) => String(savedId) !== String(id));
  if (next.liked) ids.push(id);
  const counts = { ...stored.counts, [String(id)]: next.likes };
  const previousIds = localStorage.getItem(LIKED_IDS_KEY);

  // 두 번째 저장이 실패하면 첫 번째 저장도 복원해 두 값의 불일치를 막습니다.
  localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(ids));
  try {
    localStorage.setItem(LIKE_COUNTS_KEY, JSON.stringify(counts));
  } catch (error) {
    if (previousIds === null) localStorage.removeItem(LIKED_IDS_KEY);
    else localStorage.setItem(LIKED_IDS_KEY, previousIds);
    throw error;
  }
  // 화면은 저장이 끝난 경우에만 이 결과로 갱신합니다.
  return next;
}
```


### 4-5. 맛집 카드 작성

맛집 한 건과 좋아요 버튼을 표시합니다. 클릭하면 저장 함수를 호출하고 화면 개수를 갱신합니다.

**파일:** `src/components/RestaurantCard.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/components/RestaurantCard.tsx" -->
```tsx
import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaStar, FaHeart, FaMapMarkerAlt, FaWonSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import type { Restaurant } from '../types';
import { readLikeState, toggleRestaurantLike } from '../services/likes';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const Card = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

const ImagePlaceholder = styled.div`
  height: 200px;
  display: grid;
  place-items: center;
  background: #e9ecf7;
  color: #596080;
`;

const CardContent = styled.div`
  padding: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  color: #333;
`;

const CategoryBadge = styled.span`
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
`;

const LikeButton = styled.button<{ $liked: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid ${props => props.$liked ? '#ff4757' : '#ddd'};
  background: ${props => props.$liked ? '#ff4757' : 'white'};
  color: ${props => props.$liked ? 'white' : '#666'};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #ff4757;
    background: #ff4757;
    color: white;
  }
`;

const DetailLink = styled(Link)`
  color: #667eea;
  font-weight: 600;

  &:hover {
    text-decoration: underline;
  }
`;

function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(restaurant.likes || 0);

  useEffect(() => {
    try {
      const saved = readLikeState(restaurant.id, restaurant.likes || 0);
      setLiked(saved.liked);
      setLikes(saved.likes);
    } catch (error) {
      console.error('좋아요 복원 오류:', error);
    }
  }, [restaurant.id, restaurant.likes]);

  const handleLike = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const next = toggleRestaurantLike(restaurant.id, liked, likes);
      setLiked(next.liked);
      setLikes(next.likes);
      if (next.liked) toast.success(`${restaurant.name}을(를) 좋아요했습니다! ❤️`);
      else toast.info('좋아요를 취소했습니다.');
    } catch (error) {
      console.error('좋아요 저장 오류:', error);
      toast.error('좋아요를 저장하지 못했습니다. 브라우저 저장소를 확인하세요.');
    }
  };

  return (
    <Card>
      {restaurant.image ? <CardImage src={restaurant.image} alt={restaurant.name} />
        : <ImagePlaceholder>이미지 없음</ImagePlaceholder>}
      <CardContent>
        <CardHeader>
          <CardTitle>{restaurant.name}</CardTitle>
          <CategoryBadge>{restaurant.category}</CategoryBadge>
        </CardHeader>

        <InfoRow>
          <FaMapMarkerAlt /> {restaurant.location}
        </InfoRow>
        <InfoRow>
          <FaWonSign /> {restaurant.priceRange}
        </InfoRow>
        <InfoRow>
          <FaStar color="gold" /> {restaurant.rating}/5.0
        </InfoRow>

        <p style={{ margin: '1rem 0', color: '#666' }}>
          {restaurant.description}
        </p>

        <ActionRow>
          <LikeButton
            $liked={liked}
            aria-label={`${restaurant.name} 좋아요`}
            aria-pressed={liked}
            onClick={handleLike}
            type="button"
          >
            <FaHeart /> {likes}
          </LikeButton>
          <DetailLink to={`/restaurant/${restaurant.id}`}>
            자세히 보기 →
          </DetailLink>
        </ActionRow>
      </CardContent>
    </Card>
  );
}

export default RestaurantCard;
```


### 4-6. 목록과 카테고리 필터 작성

서버 목록을 조회하고 선택한 카테고리의 카드만 표시합니다.

**파일:** `src/components/RestaurantList.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/components/RestaurantList.tsx" -->
```tsx
import styled from '@emotion/styled';
import RestaurantCard from './RestaurantCard';
import type { Restaurant } from '../types';

interface RestaurantListProps {
  restaurants: Restaurant[];
}

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 2rem;
`;

const NoResults = styled.p`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

function RestaurantList({ restaurants }: RestaurantListProps) {
  if (restaurants.length === 0) {
    return <NoResults>해당 카테고리에 맛집이 없습니다.</NoResults>;
  }

  return (
    <ListContainer>
      {restaurants.map(restaurant => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </ListContainer>
  );
}

export default RestaurantList;
```


### 4-7. 인기 맛집 목록 작성

인기 API 결과를 표시합니다. 목록 순서는 서버가 정합니다.

**파일:** `src/components/PopularRestaurants.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/components/PopularRestaurants.tsx" -->
```tsx
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaTrophy, FaStar } from 'react-icons/fa';
import type { Restaurant } from '../types';

interface PopularRestaurantsProps {
  restaurants: Restaurant[];
}

const Container = styled.div`
  padding: 2rem 0;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #333;
`;

const RankingList = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
`;

const RankingItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.3s;

  &:hover {
    background: #f9f9f9;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const RankBadge = styled.div`
  font-size: 1.5rem;
  width: 50px;
  text-align: center;

  svg {
    font-size: 1.5rem;
  }
`;

const RestaurantInfo = styled.div`
  flex: 1;
  margin-left: 1rem;

  h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }

  p {
    color: #666;
    font-size: 0.9rem;
  }
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
`;

function PopularRestaurants({ restaurants }: PopularRestaurantsProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 0) return <FaTrophy color="gold" />;
    if (rank === 1) return <FaTrophy color="silver" />;
    if (rank === 2) return <FaTrophy color="#CD7F32" />;
    return rank + 1;
  };

  return (
    <Container>
      <Title>🔥 이번 주 인기 TOP 5</Title>

      <RankingList>
        {restaurants.map((restaurant, index) => (
          <RankingItem key={restaurant.id} to={`/restaurant/${restaurant.id}`}>
            <RankBadge>{getRankIcon(index)}</RankBadge>
            <RestaurantInfo>
              <h3>{restaurant.name}</h3>
              <p>{restaurant.category} • {restaurant.location}</p>
            </RestaurantInfo>
            <Rating>
              <FaStar color="gold" />
              {restaurant.rating}
            </Rating>
          </RankingItem>
        ))}
      </RankingList>
    </Container>
  );
}

export default PopularRestaurants;
```


### 4-8. 목록 페이지 작성

목록 컴포넌트를 주소에 대응하는 페이지로 감쌉니다.

**파일:** `src/pages/ListPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/pages/ListPage.tsx" -->
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import RestaurantList from '../components/RestaurantList';
import { restaurantAPI } from '../services/api';
import { ClipLoader } from 'react-spinners';

const PageContainer = styled.div`
  padding: 2rem 0;
`;

const FilterContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: 2px solid #667eea;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#667eea'};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #667eea;
    color: white;
  }
`;

function ListPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const categories = ['전체', '한식', '중식', '일식', '양식', '아시안', '분식', '카페'];

  // 서버에서 받은 목록을 React Query 캐시에 보관합니다.
  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: restaurantAPI.getRestaurants,
  });

  if (isLoading) {
    return (
      <div className="loading">
        <ClipLoader color="#667eea" size={50} />
        <p>맛집 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">에러가 발생했습니다: {error.message}</div>;
  }

  const filteredData = selectedCategory === '전체'
    ? data?.data
    : data?.data.filter(r => r.category === selectedCategory);

  return (
    <PageContainer>
      <h2>맛집 목록</h2>

      <FilterContainer>
        {categories.map(category => (
          <FilterButton
            key={category}
            $active={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </FilterButton>
        ))}
      </FilterContainer>

      <RestaurantList restaurants={filteredData || []} />
    </PageContainer>
  );
}

export default ListPage;
```


### 4-9. 상세 페이지 작성

주소의 id로 한 식당을 조회하고 상세 정보를 표시합니다.

**파일:** `src/pages/DetailPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/pages/DetailPage.tsx" -->
```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import styled from '@emotion/styled';
import { restaurantAPI } from '../services/api';
import { FaStar, FaMapMarkerAlt, FaDollarSign, FaArrowLeft } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';

const DetailContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  padding: 0.5rem 1rem;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const RestaurantImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 2rem;
`;

const InfoSection = styled.div`
  margin: 2rem 0;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;

  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f5f5f5;
  }
`;

function DetailPage() {
  const { id } = useParams<'id'>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => {
      if (id === undefined) throw new Error('맛집 ID가 없습니다.');
      return restaurantAPI.getRestaurantById(id);
    },
    enabled: id !== undefined,
  });

  if (isLoading) {
    return (
      <div className="loading">
        <ClipLoader color="#667eea" size={50} />
      </div>
    );
  }

  if (error || !data?.data) {
    return <div className="error">맛집을 찾을 수 없습니다.</div>;
  }

  const restaurant = data.data;

  return (
    <DetailContainer>
      <BackButton onClick={() => navigate(-1)}>
        <FaArrowLeft /> 뒤로 가기
      </BackButton>

      <h1>{restaurant.name}</h1>

      {restaurant.image && (
        <RestaurantImage src={restaurant.image} alt={restaurant.name} />
      )}

      <InfoSection>
        <h3>기본 정보</h3>
        <p><FaMapMarkerAlt /> {restaurant.location}</p>
        <p><FaDollarSign /> {restaurant.priceRange}</p>
        <p><FaStar color="gold" /> {restaurant.rating}/5.0</p>
      </InfoSection>

      <InfoSection>
        <h3>소개</h3>
        <p>{restaurant.description}</p>
      </InfoSection>

      <InfoSection>
        <h3>추천 메뉴</h3>
        <MenuList>
          {restaurant.recommendedMenu.map((menu, index) => (
            <li key={index}>{menu}</li>
          ))}
        </MenuList>
      </InfoSection>
    </DetailContainer>
  );
}

export default DetailPage;
```


### 4-10. 인기 페이지 작성

인기 목록을 별도 페이지에 표시합니다.

**파일:** `src/pages/PopularPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/pages/PopularPage.tsx" -->
```tsx
import { useQuery } from '@tanstack/react-query';
import PopularRestaurants from '../components/PopularRestaurants';
import { restaurantAPI } from '../services/api';
import { ClipLoader } from 'react-spinners';

function PopularPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['popular-restaurants'],
    queryFn: restaurantAPI.getPopularRestaurants,
  });

  if (isLoading) {
    return (
      <div className="loading">
        <ClipLoader color="#667eea" size={50} />
        <p>인기 맛집을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">에러가 발생했습니다: {error.message}</div>;
  }

  return <PopularRestaurants restaurants={data?.data || []} />;
}

export default PopularPage;
```


### 4-11. 홈에서 맛집 탐색 연결

앞에서 만든 홈 파일에 탐색 링크와 인기 맛집을 추가합니다.

**파일:** `src/pages/HomePage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/pages/HomePage.tsx" -->
```tsx
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaMapMarkedAlt, FaStar } from 'react-icons/fa';

const HomeContainer = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const Card = styled(Link)`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
  }

  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #667eea;
  }

  h3 {
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
  }
`;

function HomePage() {
  return (
    <HomeContainer>
      <Title>우리 학교 맛집을 찾아보세요!</Title>
      <Subtitle>캠퍼스 주변 숨은 맛집들을 한눈에</Subtitle>

      <CardGrid>
        <Card to="/list">
          <FaMapMarkedAlt />
          <h3>맛집 둘러보기</h3>
          <p>카테고리별로 맛집을 찾아보세요</p>
        </Card>
        <Card to="/popular">
          <FaStar />
          <h3>인기 맛집 TOP</h3>
          <p>이번 주 가장 인기있는 맛집</p>
        </Card>

      </CardGrid>
    </HomeContainer>
  );
}

export default HomePage;
```


### 4-12. 공개 화면 메뉴 연결

목록·인기 화면 링크를 추가합니다.

**파일:** `src/components/Header.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/components/Header.tsx" -->
```tsx
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
const Banner = styled.header`
  padding: 1.5rem; color: white; background: linear-gradient(135deg,#667eea,#764ba2);
  h1 { text-align: center; }
  nav { display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; }
  a { color: white; text-decoration: none; }
`;
export default function Header() {
  return <Banner><h1>Ajou Campus Foodmap</h1><nav><Link to="/">Home</Link><Link to="/list">List</Link><Link to="/popular">Popular</Link></nav></Banner>;
}
```


### 4-13. 공개 화면 주소 연결

QueryClientProvider로 조회 캐시를 사용하고 목록·상세·인기 주소를 등록합니다.

**파일:** `src/App.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="4" path="src/App.tsx" -->
```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Header from './components/Header';
import NotFound from './components/NotFound';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import PopularPage from './pages/PopularPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});
export default function App() {

  return <QueryClientProvider client={queryClient}>
    <HashRouter><GlobalStyles /><div className="app">
      <Header /><main className="main-content"><Routes>
        <Route path="/" element={<HomePage />} />
<Route path="/list" element={<ListPage />} />
<Route path="/restaurant/:id" element={<DetailPage />} />
<Route path="/popular" element={<PopularPage />} />
<Route path="*" element={<NotFound />} />
      </Routes></main>
      <footer className="footer">© 2026 Ajou Campus Foodmap</footer>
    </div><ToastContainer position="bottom-right" autoClose={3000} /></HashRouter>
  </QueryClientProvider>;
}
```


### 4-14. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

1. `/#/list`에서 목록·필터·상세 이동을 확인합니다. `/#/restaurant/1` 직접 접근도 확인합니다. 1번이 없으면 실제 ID를 사용합니다.
2. `/#/popular`에서 인기 목록을 확인합니다.
3. 좋아요를 누르고 새로고침하여 선택·개수가 복원되는지 확인합니다. 다른 브라우저의 좋아요는 별개입니다.
4. Chrome F12 → Network를 열고 새로고침합니다. restaurants 요청을 선택해 Headers의 Request URL·Status Code, Response의 data 배열을 확인합니다. 조회는 200입니다.

오류가 나면 서버 /health, .env.local의 기본 주소, 서버 CLIENT_URL을 확인하고 Vite를 재시작합니다.

**이해 확인:** 식당 조회와 브라우저 좋아요 저장은 각각 어느 파일에서 처리되는지 찾아봅니다.

## 5. 회원가입과 로그인

**목적:** 이메일 계정을 만들고 로그인하여 서버가 확인한 사용자를 화면에 표시합니다.

### 인증 서비스 준비

Supabase의 Connect 또는 Settings → API Keys에서 Project URL·Publishable key를 확인하고 .env.local을 완성합니다. 본인 값으로 바꾸며 서버 Secret key는 넣지 않습니다.

```dotenv
VITE_API_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_with_your_key
```

Authentication에서 Email·신규 가입을 활성화합니다. 개인 실습 프로젝트는 Confirm email을 끄고 가입 즉시 session을 받는 방식으로 진행합니다. 메일 확인을 켜는 경우는 6절의 콜백 작성 후 진행하고 Custom SMTP 또는 허용된 수신 주소를 먼저 준비합니다. [Supabase SMTP 안내](https://supabase.com/docs/guides/auth/auth-smtp)

Authentication → URL Configuration에서 Site URL을 http://127.0.0.1:5173, Redirect URLs를 http://127.0.0.1:5173/auth/callback으로 등록합니다. 시작과 복귀에 같은 origin을 사용합니다.

| 정보 | 용도 |
| --- | --- |
| SDK session | 액세스·갱신 토큰 등 로그인 자격 보관 |
| /api/auth/me 결과 | 토큰 검증을 거친 앱 사용자·역할·활성 상태 |
| Context user | 헤더·내 정보 등 여러 화면이 공유하는 표시 상태 |

Context는 여러 화면에 로그인 정보를 공유합니다. Provider가 값을 제공하고 useAuth가 읽습니다. 이번 절은 로그인·로그아웃을 연결하고, 다음 절에서 새로고침 복원과 보호 화면을 추가합니다.


### 5-1. 사용자와 인증 입력 타입 작성

앱 프로필·입력·결과 타입을 선언합니다. 이메일 미제공은 빈 문자열 또는 null로 받을 수 있습니다.

**파일:** `src/types/auth.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/types/auth.ts" -->
```ts
export type UserType = 'user' | 'admin';
export interface AppUser {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  provider: string;
  userType: UserType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Credentials { email: string; password: string }
export interface SignUpInput extends Credentials { name: string }
export interface AuthResult {
  success: boolean;
  message: string;
  needsConfirmation?: boolean;
}
```


### 5-2. 브라우저 인증 SDK 설정

Publishable key로 SDK를 만듭니다. persistSession은 보관, autoRefreshToken은 새 토큰 발급 요청입니다. PKCE는 코드 교환을 시작한 로그인 시도에 묶는 방식이며 SDK가 검증값을 관리합니다. 복귀 화면은 6절에서 작성합니다.

**파일:** `src/config/supabase.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/config/supabase.ts" -->
```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
export const authConfigured = Boolean(
  url && key && !url.includes('your-project') && !key.includes('replace_with'),
);
export const supabase = authConfigured ? createClient(url, key, {
  auth: {
    // [이론: 세션·보관] SDK session은 토큰·사용자 정보의 묶음이며 세션 ID 문자열과 다릅니다.
    // 새로고침 뒤 복원을 위해 브라우저 저장소에 보관합니다.
    persistSession: true,
    // [이론: 갱신] 새 토큰을 요청합니다. 기존 JWT의 만료 시각을 늘리는 처리가 아닙니다.
    autoRefreshToken: true,
    // /auth/callback에서는 뒤에서 작성할 콜백 처리기가 코드를 한 번만 교환합니다.
    detectSessionInUrl: window.location.pathname !== '/auth/callback',
    flowType: 'pkce',
  },
}) : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase 환경변수를 확인하고 Vite를 다시 시작하세요.');
  return supabase;
}
```


### 5-3. 인증 HTTP 요청 추가

authApi 인터셉터가 요청마다 access_token을 Bearer 헤더에 넣습니다. getSession으로 읽은 값의 최종 유효성은 Express가 확인합니다.

**파일:** `src/services/http.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/services/http.ts" -->
```ts
import axios from 'axios';
import { supabase } from '../config/supabase';

const baseURL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
// 공개 조회에는 로그인이 필요하지 않습니다.
export const publicApi = axios.create({ baseURL, timeout: 60000, withCredentials: false });
export const authApi = axios.create({ baseURL, timeout: 60000, withCredentials: false });

for (const client of [publicApi, authApi]) {
  client.interceptors.request.use((config) => {
    if (!baseURL) throw new Error('VITE_API_BASE_URL을 확인하고 Vite를 다시 시작하세요.');
    return config;
  });
}
// 인터셉터는 실제 요청을 보내기 직전에 실행되는 공통 처리입니다.
// 각 화면이 토큰 첨부 코드를 반복하지 않고 인증용 HTTP 인스턴스를 사용하게 합니다.
authApi.interceptors.request.use(async (config) => {
  // [이론: HTTP 무상태성] 새 요청마다 자격 증표를 제시합니다.
  // getSession은 브라우저 상태를 읽는 동작이며 최종 검증은 서버가 수행합니다.
  const { data, error } = await supabase?.auth.getSession()
    ?? { data: { session: null }, error: null };
  if (error) throw error;
  if (data.session) config.headers.Authorization = `Bearer ${data.session.access_token}`;
  return config;
});
```


### 5-4. 오류 메시지 처리 함수 작성

unknown 오류가 Axios 응답인지 확인해 서버 메시지를 꺼냅니다.

**파일:** `src/utils/errorMessage.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/utils/errorMessage.ts" -->
```ts
import axios from 'axios';

export function messageOf(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; error?: { message?: string } }>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error?.message
      ?? error.message;
  }
  return error instanceof Error ? error.message : '요청에 실패했습니다. 다시 시도하세요.';
}
```


### 5-5. 가입·로그인·현재 사용자 요청 작성

가입·로그인·로그아웃은 Supabase Auth로, /me는 Express로 요청합니다. 서버가 토큰과 현재 앱 역할을 확인하므로 SDK 로그인 성공 뒤 /me를 확인합니다.

**파일:** `src/services/authApi.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/services/authApi.ts" -->
```ts
import { authApi } from './http';
import { requireSupabase } from '../config/supabase';
import type { ApiResponse } from '../types';
import type { AppUser, Credentials, SignUpInput } from '../types/auth';

export const authAPIService = {
  register: async ({ email, password, name }: SignUpInput) => {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  },
  login: async ({ email, password }: Credentials) => {
    // [이론: 계정·인증] 이메일은 계정 지정, 비밀번호는 제시하는 증거입니다.
    // 해시·솔트 저장과 대조는 Supabase Auth가 담당합니다.
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return data;
  },
  logout: async () => {
    // [이론: 로그아웃·철회] 현재 세션의 갱신 자격 철회와 브라우저 보관 상태 정리를 요청합니다.
    // 이미 발급된 액세스 토큰은 만료 전까지 유효할 수 있습니다.
    const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
  // Axios 응답의 .data는 서버 응답 본문입니다. 본문의 data.user는 호출한 쪽에서 읽습니다.
  getCurrentUser: async () => (await authApi.get<ApiResponse<{ user: AppUser }>>('/api/auth/me')).data,
};
```


/me의 본문 구조는 다음과 같습니다. getCurrentUser는 Axios의 data로 본문을 꺼내므로 Context는 반환값의 data.user를 읽습니다.

```json
{ "success": true, "data": { "user": { "id": "계정의 UUID", "name": "김학생", "userType": "user", "isActive": true } } }
```

실제 user에는 email·avatar·provider·createdAt·updatedAt도 포함됩니다.


### 5-6. 로그인 정보 공유

/me에서 받은 user를 공유합니다. 로그아웃 시 user와 조회 캐시를 비웁니다. 이 버전은 화면이 열린 동안의 로그인 동작을 연결합니다.

**파일:** `src/contexts/AuthContext.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/contexts/AuthContext.tsx" -->
```tsx
/* eslint-disable react-refresh/only-export-components -- Provider와 useAuth를 함께 제공합니다. */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authAPIService } from '../services/authApi';
import { messageOf } from '../utils/errorMessage';
import type { AppUser, AuthResult, Credentials, SignUpInput } from '../types/auth';

interface AuthValue {
  user: AppUser | null; loading: boolean; authError: string;
  isAuthenticated: boolean; isAdmin: () => boolean;
  login: (input: Credentials) => Promise<AuthResult>;
  register: (input: SignUpInput) => Promise<AuthResult>;
  logout: () => Promise<void>; checkAuthStatus: () => Promise<AppUser>;
}
const AuthContext = createContext<AuthValue | undefined>(undefined);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider가 필요합니다.');
  return context;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const queryClient = useQueryClient();
  const checkAuthStatus = async () => {
    const response = await authAPIService.getCurrentUser();
    setUser(response.data.user);
    return response.data.user;
  };
  const login = async (input: Credentials): Promise<AuthResult> => {
    try { await authAPIService.login(input); }
    catch (error) { return { success: false, message: messageOf(error) }; }
    try {
      await checkAuthStatus();
      return { success: true, message: '로그인되었습니다.' };
    } catch (error) {
      await authAPIService.logout().catch(() => undefined);
      return { success: false, message: messageOf(error) };
    }
  };
  const register = async (input: SignUpInput): Promise<AuthResult> => {
    try {
      const result = await authAPIService.register(input);
      if (result.session) await checkAuthStatus();
      return { success: true, needsConfirmation: !result.session,
        message: result.session ? '회원가입이 완료되었습니다.' : '가입 확인 메일을 확인하세요.' };
    } catch (error) { return { success: false, message: messageOf(error) }; }
  };
  const logout = async () => { await authAPIService.logout(); setUser(null); queryClient.clear(); };
  return <AuthContext.Provider value={{ user, loading: false, authError: '',
    isAuthenticated: Boolean(user), isAdmin: () => user?.userType === 'admin',
    login, register, logout, checkAuthStatus,
  }}>{children}</AuthContext.Provider>;
}
```


### 5-7. 인증 화면의 공통 배치

로그인·가입·내 정보의 폼과 버튼 배치를 재사용합니다.

**파일:** `src/components/AccountPanel.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/components/AccountPanel.tsx" -->
```tsx
import styled from '@emotion/styled';

const AccountPanel = styled.section`
  max-width: 650px; margin: 2rem auto; padding: 2rem;
  background: white; border-radius: 12px; box-shadow: 0 4px 20px #0001;
  h2, h3 { margin: 1rem 0; }
  p { margin: .75rem 0; }
  form { display: grid; gap: .75rem; margin: 1rem 0; }
  label { display: grid; gap: .3rem; font-weight: 600; }
  input, button { padding: .75rem; border: 1px solid #ddd; border-radius: 8px; }
  button { cursor: pointer; background: #667eea; color: white; }
  button:disabled { opacity: .55; cursor: not-allowed; }
  nav { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1rem 0; }
  [role=alert] { color: #b22222; }
`;
export default AccountPanel;
```


### 5-8. 이메일 로그인 화면 작성

이메일·비밀번호를 Context의 login에 전달합니다. 실패 안내·중복 제출 방지·비밀번호 보기 버튼을 포함합니다.

**파일:** `src/pages/LoginPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/pages/LoginPage.tsx" -->
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authConfigured } from '../config/supabase';
import AccountPanel from '../components/AccountPanel';
import type { Credentials } from '../types/auth';

export default function LoginPage() {
  const { login, loading, isAuthenticated, authError } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Credentials>();
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const callbackError = search.get('error');
  if (loading) return <p>로그인 상태 확인 중...</p>;
  // 취소·실패가 있으면 남아 있는 이전 세션보다 이번 콜백의 오류를 우선 표시합니다.
  if (isAuthenticated && !callbackError) return <Navigate to="/dashboard" replace />;
  return <AccountPanel>
    <h2>로그인</h2>
    {!authConfigured && <p role="alert">Supabase 환경변수를 설정한 뒤 다시 실행하세요.</p>}
    {(message || callbackError || authError) && <p role="alert">{message || callbackError || authError}</p>}
    <form noValidate onSubmit={handleSubmit(async (input) => {
      setMessage('');
      const result = await login(input);
      if (result.success) navigate('/dashboard', { replace: true });
      else setMessage(result.message);
    })}>
      <label>이메일<input type="email" autoComplete="email" {...register('email', {
        required: '이메일을 입력해주세요.',
        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: '올바른 이메일 형식이 아닙니다.' },
      })} /></label>
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <label>비밀번호<input type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password', {
        required: '비밀번호를 입력해주세요.', minLength: { value: 6, message: '비밀번호는 최소 6자입니다.' },
      })} /></label>
      <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</button>
      {errors.password && <p role="alert">{errors.password.message}</p>}
      <button disabled={!authConfigured || isSubmitting}>{isSubmitting ? '확인 중...' : '로그인'}</button>
    </form>
    <p><Link to="/register">이메일로 회원가입</Link></p>
  </AccountPanel>;
}
```


### 5-9. 이메일 회원가입 화면 작성

이름·이메일·비밀번호 확인을 검증하고 결과를 표시합니다.

**파일:** `src/pages/RegisterPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/pages/RegisterPage.tsx" -->
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authConfigured } from '../config/supabase';
import AccountPanel from '../components/AccountPanel';
import type { SignUpInput } from '../types/auth';

interface RegisterForm extends SignUpInput { passwordConfirm: string }
export default function RegisterPage() {
  const { register: signUp, isAuthenticated, loading } = useAuth();
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<RegisterForm>();
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();
  if (loading) return <p>로그인 상태 확인 중...</p>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AccountPanel>
    <h2>이메일 회원가입</h2>
    {!authConfigured && <p role="alert">Supabase 환경변수를 설정한 뒤 다시 실행하세요.</p>}
    {message && <p role="status">{message}</p>}
    <form noValidate onSubmit={handleSubmit(async ({ passwordConfirm, ...input }) => {
      if (input.password !== passwordConfirm) { setMessage('비밀번호 확인이 일치하지 않습니다.'); return; }
      const result = await signUp(input);
      setMessage(result.message);
      if (result.success && !result.needsConfirmation) navigate('/dashboard', { replace: true });
    })}>
      <label>이름<input maxLength={80} autoComplete="name" {...register('name', {
        required: '이름을 입력해주세요.', validate: (value) => value.trim().length >= 2 || '이름은 최소 2자입니다.',
      })} /></label>
      {errors.name && <p role="alert">{errors.name.message}</p>}
      <label>이메일<input type="email" autoComplete="email" {...register('email', {
        required: '이메일을 입력해주세요.',
        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: '올바른 이메일 형식이 아닙니다.' },
      })} /></label>
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <label>비밀번호<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password', {
        required: '비밀번호를 입력해주세요.', minLength: { value: 6, message: '비밀번호는 최소 6자입니다.' },
      })} /></label>
      <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</button>
      {errors.password && <p role="alert">{errors.password.message}</p>}
      <label>비밀번호 확인<input type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" {...register('passwordConfirm', {
        required: '비밀번호 확인을 입력해주세요.', validate: (value) => value === getValues('password') || '비밀번호 확인이 일치하지 않습니다.',
      })} /></label>
      <button type="button" aria-pressed={showConfirmation} onClick={() => setShowConfirmation(!showConfirmation)}>{showConfirmation ? '확인 비밀번호 숨기기' : '확인 비밀번호 보기'}</button>
      {errors.passwordConfirm && <p role="alert">{errors.passwordConfirm.message}</p>}
      <button disabled={!authConfigured || isSubmitting}>{isSubmitting ? '가입 중...' : '회원가입'}</button>
    </form>
    <p><Link to="/login">로그인 화면으로</Link></p>
  </AccountPanel>;
}
```


### 5-10. 내 정보와 로그아웃 표시

이름·이메일·역할과 로그아웃을 표시합니다.

**파일:** `src/pages/DashboardPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/pages/DashboardPage.tsx" -->
```tsx
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AccountPanel from '../components/AccountPanel';
import { messageOf } from '../utils/errorMessage';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  if (!user) return <p>로그인이 필요합니다. <Link to="/login">로그인</Link></p>;
  return <AccountPanel><h2>환영합니다, {user.name}님!</h2>
    <p>이메일: {user.email || '미제공'}</p><p>역할: {user.userType}</p>
    <button onClick={() => { void logout().then(() => navigate('/')).catch((error: unknown) => setMessage(messageOf(error))); }}>로그아웃</button>
    {message && <p role="alert">{message}</p>}
  </AccountPanel>;
}
```


### 5-11. 로그인 메뉴 연결

로그인 상태로 로그인·회원가입 또는 내 정보 메뉴를 표시합니다.

**파일:** `src/components/Header.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/components/Header.tsx" -->
```tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import { FaHome, FaList, FaFire } from 'react-icons/fa';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 0.5rem;
  max-width: 1100px;
  margin: 0 auto;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(255, 255, 255, 0.3);
  }
`;

function Header() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <HeaderContainer>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Ajou Campus Foodmap
      </h1>
      <Nav>
        <NavLink to="/" className={isActive('/')}>
          <FaHome /> Home
        </NavLink>
        <NavLink to="/list" className={isActive('/list')}>
          <FaList /> List
        </NavLink>
        <NavLink to="/popular" className={isActive('/popular')}>
          <FaFire /> Popular
        </NavLink>
        {isAuthenticated ? <NavLink to="/dashboard">내 정보</NavLink> : <>
          <NavLink to="/login">로그인</NavLink><NavLink to="/register">회원가입</NavLink>
        </>}
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
```


### 5-12. 인증 화면 조립

AuthProvider가 조회 캐시를 쓰므로 QueryClientProvider 안에 둡니다. Header와 페이지는 AuthProvider 아래에서 useAuth를 사용합니다.

**파일:** `src/App.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="5" path="src/App.tsx" -->
```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Header from './components/Header';
import NotFound from './components/NotFound';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import PopularPage from './pages/PopularPage';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});
export default function App() {

  return <QueryClientProvider client={queryClient}><AuthProvider>
    <HashRouter><GlobalStyles /><div className="app">
      <Header /><main className="main-content"><Routes>
        <Route path="/" element={<HomePage />} />
<Route path="/list" element={<ListPage />} />
<Route path="/restaurant/:id" element={<DetailPage />} />
<Route path="/popular" element={<PopularPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/dashboard" element={<DashboardPage />} />
<Route path="*" element={<NotFound />} />
      </Routes></main>
      <footer className="footer">© 2026 Ajou Campus Foodmap</footer>
    </div><ToastContainer position="bottom-right" autoClose={3000} /></HashRouter>
  </AuthProvider></QueryClientProvider>;
}
```


### 5-13. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

1. /#/register에서 본인이 관리하는 이메일 A·표시 이름·8자 이상 비밀번호로 가입합니다. 기본 설정은 가입 즉시 내 정보로 이동합니다.
2. Network의 /api/auth/me → Response에서 data.user.id를 확인합니다. Supabase Authentication → Users의 User UID, Table Editor → profiles의 id와 같고 user_type은 user여야 합니다. 토큰·비밀번호는 출력하거나 캡처하지 않습니다.
3. 로그아웃 후 잘못된 비밀번호의 실패, 올바른 값의 성공을 확인합니다.
4. A에서 로그아웃합니다. Chrome 프로필 메뉴의 다른 프로필 또는 게스트 창에서 별도 이메일 B로 가입합니다. 두 UUID는 다르고 A·B 모두 user여야 합니다. 두 계정은 관리자·제보 실습에 사용합니다.
5. 현재 내 정보 화면을 새로고침하면 React의 user 상태가 초기화되어 로그인 안내가 보입니다. SDK 보관과 화면 복원은 별도이므로 다음 절에서 복원합니다.

401은 같은 Supabase 프로젝트·Bearer 전달, 403은 해당 UUID의 profiles 존재·is_active를 확인합니다. 가입 오류는 서버 프로필 트리거·Email 설정도 확인합니다.

**이해 확인:** 비밀번호 대조 서비스와 /me 서버의 역할을 설명합니다.

## 6. 로그인 상태와 화면 접근 관리

**목적:** 새로고침 후 사용자 정보를 복원하고 로그인·관리자 여부에 맞는 화면으로 안내합니다.

| 상황 | 화면 처리 |
| --- | --- |
| 복원 중 | loading 표시, 로그인 화면으로 성급하게 이동하지 않음 |
| session 없음 | 공개 사용자 상태 |
| session 있음 | /me로 검증한 프로필을 user에 설정 |
| /me 실패 | 실패 안내와 공개 사용자 상태 |
| 계정 전환 | 이전 조회 캐시 정리·늦은 응답 무시 |

화면 보호는 사용자를 안내하며 실제 데이터 권한은 매 요청에서 Express가 검사합니다.


### 6-1. 새로고침과 계정 전환 복원

정상 흐름 getSession → applySession → /me → setUser를 먼저 읽고 안정성 처리를 확인합니다.

**파일:** `src/contexts/AuthContext.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.

- loading은 사용자 확인 전 화면 전환을 기다리게 합니다.
- generation·ticket은 A의 느린 응답이 B 로그인 화면을 덮지 않게 최신 요청만 적용합니다.
- queryClient.clear()는 이전 조회 결과를 지우며 서버 DB 삭제가 아닙니다.
- setTimeout은 SDK 콜백 종료 후 사용자 조회를 시작합니다.
- 구독 해제·alive는 화면이 사라진 뒤 응답으로 상태를 바꾸지 않게 합니다.

<!-- lab:file step="6" path="src/contexts/AuthContext.tsx" -->
```tsx
/* eslint-disable react-refresh/only-export-components -- useAuth와 Provider를 함께 제공합니다. */
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authAPIService } from "../services/authApi";
import { supabase } from "../config/supabase";
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppUser, AuthResult, Credentials, SignUpInput } from '../types/auth';
import { messageOf } from '../utils/errorMessage';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  authError: string;
  isAuthenticated: boolean;
  login: (input: Credentials) => Promise<AuthResult>;
  register: (input: SignUpInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<AppUser>;
  isAdmin: () => boolean;
}
// 로그인 정보와 동작을 여러 화면에서 함께 쓰기 위한 공유 공간입니다.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider가 필요합니다.");
  return context;
};
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // user는 서버가 확인한 앱 프로필입니다. SDK의 session 객체와 구분합니다.
  const [user, setUser] = useState<AppUser | null>(null);
  // 저장한 세션을 확인하는 중에는 보호 화면이 성급하게 로그인 페이지로 이동하지 않게 합니다.
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const queryClient = useQueryClient();
  const checkAuthStatus = useCallback(async () => {
    // 서비스 함수가 Axios 응답의 data를 반환하므로 response는 서버 응답 본문입니다.
    const response = await authAPIService.getCurrentUser();
    setUser(response.data.user);
    setAuthError("");
    return response.data.user;
  }, []);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let alive = true;
    let generation = 0;
    let previousUserId: string | undefined;
    const applySession = async (session: Session | null) => {
      if (!alive) return;
      // 나중에 시작한 요청이 있으면 먼저 시작한 느린 응답은 화면에 반영하지 않습니다.
      const ticket = ++generation;
      if (session?.user.id !== previousUserId) {
        // A에서 B로 계정이 바뀔 때 A의 조회 결과가 B의 화면에 남지 않게 합니다.
        queryClient.clear();
        previousUserId = session?.user.id;
      }
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // [이론: 인증 결과] 브라우저에 세션이 남아 있어도 그 값만으로 앱 사용자를 확정하지 않습니다.
        // /me가 토큰을 검증해 확인한 사용자에 연결된 프로필을 화면의 사용자 상태로 사용합니다.
        const response = await authAPIService.getCurrentUser();
        if (alive && ticket === generation) {
          setUser(response.data.user);
          setAuthError("");
        }
      } catch (error) {
        if (alive && ticket === generation) {
          setUser(null);
          setAuthError(messageOf(error));
        }
      } finally {
        if (alive && ticket === generation) setLoading(false);
      }
    };
    // Auth 콜백의 SDK 잠금 밖에서 프로필을 읽습니다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      void applySession(data.session);
    });
    return () => {
      // 이 Provider가 사라진 뒤 도착한 응답과 이벤트가 상태를 바꾸지 않게 정리합니다.
      alive = false;
      generation++;
      subscription.unsubscribe();
    };
  }, [queryClient]);
  const login = async (credentials: Credentials): Promise<AuthResult> => {
    try {
      await authAPIService.login(credentials);
    } catch (error) {
      // 가입 확인 대기 중에는 이메일 링크에 사용할 PKCE 검증값을 유지합니다.
      return { success: false, message: messageOf(error) };
    }
    try {
      await checkAuthStatus();
      return { success: true, message: "로그인되었습니다." };
    } catch (error) {
      await supabase?.auth.signOut({ scope: "local" });
      return { success: false, message: messageOf(error) };
    }
  };
  const register = async (data: SignUpInput): Promise<AuthResult> => {
    try {
      const result = await authAPIService.register(data);
      if (result.session) await checkAuthStatus();
      return {
        success: true,
        needsConfirmation: !result.session,
        message: result.session
          ? "회원가입이 완료되었습니다."
          : "가입 확인 메일을 확인한 뒤 로그인하세요.",
      };
    } catch (error) {
      return { success: false, message: messageOf(error) };
    }
  };
  const logout = async () => {
    await authAPIService.logout();
    setUser(null);
    setAuthError("");
    // [이론: 상태 정리] 캐시 삭제는 이전 사용자의 화면 데이터를 정리하는 처리입니다.
    // 토큰의 갱신 자격 철회는 위에서 호출한 인증 서비스가 담당합니다.
    queryClient.clear();
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        checkAuthStatus,
        isAdmin: () => user?.userType === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```


### 6-2. 로그인 화면 접근 검사

loading 동안 기다리고 비로그인 사용자를 로그인 화면으로 보냅니다.

**파일:** `src/components/ProtectedRoute.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="6" path="src/components/ProtectedRoute.tsx" -->
```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <p role="status">로그인 상태를 확인하고 있습니다...</p>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // 화면 이동을 제어할 뿐입니다. 실제 권한은 각 API가 다시 검사합니다.
  return children;
}
```


### 6-3. 관리자 화면 접근 검사

로그인 확인 뒤 서버 프로필 userType이 admin일 때만 자식 화면을 표시합니다.

**파일:** `src/components/AdminRoute.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="6" path="src/components/AdminRoute.tsx" -->
```tsx
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return <ProtectedRoute>{isAdmin() ? children :
    <section><h2>관리자 권한이 필요합니다.</h2><Link to="/dashboard">내 정보로 돌아가기</Link></section>
  }</ProtectedRoute>;
}
```


### 인증 복귀 처리의 역할

이메일 확인·소셜 로그인 후 앱 복귀 주소에 일회용 code가 전달됩니다. SDK가 code와 보관한 PKCE 검증값으로 session을 얻습니다. 앱은 교환 성공 뒤 대시보드로 이동하며 같은 code는 한 번만 교환해야 합니다.

| 주소 | 역할 |
| --- | --- |
| https://본인-ref.supabase.co/auth/v1/callback | 공급자 → Supabase. 공급자 콘솔에 등록 |
| http://127.0.0.1:5173/auth/callback | Supabase → React. Redirect URLs에 등록 |
| http://127.0.0.1:5173/#/login | React 내부 로그인 화면 |

SDK가 PKCE 검증값을 관리하고 아래 코드는 URL의 code·실패를 읽어 교환을 요청합니다. StrictMode에서 effect가 다시 실행돼도 같은 Promise를 공유하여 중복 교환을 막습니다.


### 6-4. 인증 복귀 결과 해석

이번 교환의 성공과 취소·실패를 구분합니다. 이전 session만으로 성공 처리하지 않습니다.

**파일:** `src/utils/oauthCallback.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="6" path="src/utils/oauthCallback.ts" -->
```ts
// 코드를 URL에서 읽는 함수는 React 없이 검사할 수 있도록 분리합니다.
export function oauthCallbackError(search = '', hash = ''): string | null {
  for (const value of [search, hash]) {
    const params = new URLSearchParams(value.replace(/^[?#]/, ''));
    const error = params.get('error') ?? params.get('error_code');
    if (error === 'access_denied' || error === 'user_cancelled') {
      return '로그인이 취소되었습니다. 다시 시도하세요.';
    }
    if (error || params.has('error_description')) return '소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.';
  }
  return null;
}
export interface CodeExchanger {
  exchangeCodeForSession: (code: string) => Promise<{
    data: { session: unknown | null }; error: unknown;
  }>;
}
export async function completeAuthCallback(url: URL, auth?: CodeExchanger | null): Promise<string> {
  const providerError = oauthCallbackError(url.search, url.hash);
  if (providerError) return `/login?error=${encodeURIComponent(providerError)}`;
  const code = url.searchParams.get('code');
  if (code && auth) {
    try {
      const { data, error } = await auth.exchangeCodeForSession(code);
      // 이전 세션의 존재가 아니라 이번 일회용 코드 교환의 성공으로 판단합니다.
      if (!error && data.session) return '/dashboard';
    } catch { /* 네트워크 실패도 로그인 화면에서 다시 시작합니다. */ }
  }
  return `/login?error=${encodeURIComponent('인증 정보를 확인하지 못했습니다. 다시 로그인하세요.')}`;
}
```


### 6-5. 인증 복귀 화면 작성

복귀 URL을 처리하고 code가 없는 내부 화면 주소로 이동합니다.

**파일:** `src/components/AuthCallbackHandler.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="6" path="src/components/AuthCallbackHandler.tsx" -->
```tsx
import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { completeAuthCallback } from '../utils/oauthCallback';

export default function AuthCallbackHandler() {
  const exchange = useRef<Promise<string> | null>(null);
  useEffect(() => {
    let active = true;
    // StrictMode가 effect를 다시 실행해도 같은 일회용 코드를 두 번 교환하지 않습니다.
    exchange.current ??= completeAuthCallback(new URL(window.location.href), supabase?.auth);
    void exchange.current.then((route) => {
      if (active) window.location.replace(`/#${route}`);
    });
    return () => { active = false; };
  }, []);
  return <p role="status">로그인 결과를 확인하고 있습니다...</p>;
}
```


### 6-6. 보호 화면과 복귀 주소 연결

/auth/callback은 # 밖의 경로이므로 HashRouter보다 먼저 처리합니다. dashboard·admin에 접근 검사를 연결합니다.

**파일:** `src/App.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="6" path="src/App.tsx" -->
```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Header from './components/Header';
import NotFound from './components/NotFound';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import PopularPage from './pages/PopularPage';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AuthCallbackHandler from './components/AuthCallbackHandler';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});
export default function App() {
  if (window.location.pathname === '/auth/callback') return <AuthCallbackHandler />;
  return <QueryClientProvider client={queryClient}><AuthProvider>
    <HashRouter><GlobalStyles /><div className="app">
      <Header /><main className="main-content"><Routes>
        <Route path="/" element={<HomePage />} />
<Route path="/list" element={<ListPage />} />
<Route path="/restaurant/:id" element={<DetailPage />} />
<Route path="/popular" element={<PopularPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
<Route path="/admin" element={<AdminRoute><p>관리자 계정으로 접속했습니다.</p></AdminRoute>} />
<Route path="*" element={<NotFound />} />
      </Routes></main>
      <footer className="footer">© 2026 Ajou Campus Foodmap</footer>
    </div><ToastContainer position="bottom-right" autoClose={3000} /></HashRouter>
  </AuthProvider></QueryClientProvider>;
}
```


### 6-7. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

1. A 로그인 후 새로고침하면 사용자 확인 후 내 정보가 복원돼야 합니다.
2. 로그아웃 후 /#/dashboard 직접 접근은 로그인 화면으로 이동해야 합니다.
3. 일반 B의 /#/admin 접근은 관리자 권한 안내여야 합니다.
4. http://127.0.0.1:5173/auth/callback을 code 없이 열고 ?code=invalid-classroom-example으로도 엽니다. 실패 안내가 나오며 주소의 code가 사라져야 합니다.
5. A 로그아웃 → B 로그인을 반복해 A의 정보가 B 화면에 남지 않는지 확인합니다.

메일 확인 실습은 이 절 작성 후 가입을 진행하고 같은 브라우저 프로필·origin에서 메일을 엽니다. 메일이 오지 않으면 SMTP 수신 대상·발송 조건을 확인합니다. [공식 SMTP 조건](https://supabase.com/docs/guides/auth/auth-smtp)

**이해 확인:** user 삭제, 조회 캐시 정리, 인증 로그아웃이 각각 정리하는 대상을 설명합니다.

## 7. 내 정보와 관리자 기능

**목적:** 본인 표시 정보를 관리하고 관리자만 맛집과 사용자 역할을 변경하게 합니다.

### 첫 관리자 지정

A·B가 모두 일반 사용자임을 확인합니다. 서버 프로젝트 터미널에서 A의 실제 가입 이메일로 실행합니다. 서버 키를 가진 개발자의 초기 설정입니다.

```bash
npm run change-user-type -- student-a@example.com admin
```

성공 후 A로 새로고침·재로그인합니다. A는 관리자, B는 일반 사용자여야 합니다.

| 작업 | 처리 대상 |
| --- | --- |
| 이름·이미지 | Express의 profiles |
| 비밀번호 | Supabase Auth 인증 정보 |
| 비활성화 | profiles.is_active=false |
| 역할 변경 | 관리자 API로 profiles.user_type 변경 |

마지막 관리자를 해제·비활성화하면 운영 계정이 없어지므로 서버가 409로 거절합니다. 서버는 매 요청의 현재 프로필을 읽어 역할 변경을 반영합니다.


### 7-1. 사용자 관리 요청 추가

프로필·목록·역할·비활성화는 Express, 비밀번호는 Supabase Auth로 보냅니다.

**파일:** `src/services/authApi.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/services/authApi.ts" -->
```ts
import { authApi } from './http';
import { requireSupabase } from '../config/supabase';
import type { ApiResponse } from '../types';
import type { AppUser, Credentials, SignUpInput, UserType } from '../types/auth';

export const authAPIService = {
  register: async ({ email, password, name }: SignUpInput) => {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  },
  login: async ({ email, password }: Credentials) => {
    // [이론: 계정·인증] 이메일은 계정 지정, 비밀번호는 제시하는 증거입니다.
    // 해시·솔트 저장과 대조는 Supabase Auth가 담당합니다.
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return data;
  },
  logout: async () => {
    // [이론: 로그아웃·철회] 현재 세션의 갱신 자격 철회와 브라우저 보관 상태 정리를 요청합니다.
    // 이미 발급된 액세스 토큰은 만료 전까지 유효할 수 있습니다.
    const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
  // Axios 응답의 .data는 서버 응답 본문입니다. 본문의 data.user는 호출한 쪽에서 읽습니다.
  getCurrentUser: async () => (await authApi.get<ApiResponse<{ user: AppUser }>>('/api/auth/me')).data,
  getAllUsers: async () => (await authApi.get<ApiResponse<{ users: AppUser[] }>>('/api/users/all')).data,
  changeUserType: async (id: string, userType: UserType) =>
    (await authApi.put<ApiResponse<{ user: AppUser }>>(`/api/users/${id}/type`, { userType })).data,
  updateProfile: async (payload: { name: string; avatar?: string }) =>
    (await authApi.put<ApiResponse<{ user: AppUser }>>('/api/users/profile', payload)).data,
  deactivateAccount: async () => (await authApi.delete('/api/users/account')).data as unknown,
  changePassword: async (currentPassword: string, password: string) => {
    const { error } = await requireSupabase().auth.updateUser({ current_password: currentPassword, password });
    if (error) throw error;
  },
};
```


### 7-2. 관리자 맛집 요청 추가

생성·수정·삭제는 Bearer가 있는 authApi로 보냅니다. 204 삭제 응답에는 JSON이 없습니다.

**파일:** `src/services/api.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/services/api.ts" -->
```ts
import { authApi, publicApi } from './http';
import type { ApiResponse, CreateRestaurantInput, EntityId, Restaurant, UpdateRestaurantInput } from '../types';

// 맛집은 서버 API로 조회·관리합니다.
export const restaurantAPI = {
  getRestaurants: async (): Promise<ApiResponse<Restaurant[]>> =>
    (await publicApi.get('/api/restaurants')).data,
  getRestaurantById: async (id: EntityId): Promise<ApiResponse<Restaurant>> =>
    (await publicApi.get(`/api/restaurants/${id}`)).data,
  getPopularRestaurants: async (): Promise<ApiResponse<Restaurant[]>> =>
    (await publicApi.get('/api/restaurants/popular')).data,
  createRestaurant: async (payload: CreateRestaurantInput): Promise<ApiResponse<Restaurant>> =>
    (await authApi.post('/api/restaurants', payload)).data,
  updateRestaurant: async (id: EntityId, payload: UpdateRestaurantInput): Promise<ApiResponse<Restaurant>> =>
    (await authApi.put(`/api/restaurants/${id}`, payload)).data,
  // 204 응답에는 JSON 본문이 없습니다. HTTP 상태만 반환합니다.
  deleteRestaurant: async (id: EntityId): Promise<number> =>
    (await authApi.delete(`/api/restaurants/${id}`)).status,
};
export default restaurantAPI;
```


### 7-3. 프로필·비밀번호·비활성화 폼 작성

본인의 이름·이미지만 프로필 API로 보내며 비활성화는 별도 확인창을 거칩니다.

**파일:** `src/components/ProfileForm.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/components/ProfileForm.tsx" -->
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPIService } from '../services/authApi';
import { messageOf } from '../utils/errorMessage';

interface ProfileInput { name: string; avatar: string }
interface PasswordInput { currentPassword: string; password: string; confirmation: string }
export default function ProfileForm() {
  const { user, checkAuthStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const profile = useForm<ProfileInput>({ defaultValues: { name: user?.name ?? '', avatar: user?.avatar ?? '' } });
  const password = useForm<PasswordInput>();
  const busy = profile.formState.isSubmitting || password.formState.isSubmitting || deactivating;
  return <section>
    <h3>프로필 수정</h3>
    <form onSubmit={profile.handleSubmit(async (input) => {
      try {
        setMessage('');
        await authAPIService.updateProfile({ name: input.name.trim(), avatar: input.avatar.trim() });
        const updated = await checkAuthStatus();
        profile.reset({ name: updated.name, avatar: updated.avatar ?? '' });
        setMessage('프로필을 저장했습니다.');
      } catch (error) { setMessage(messageOf(error)); }
    })}>
      <label>이름<input required maxLength={80} {...profile.register('name')} /></label>
      <label>프로필 이미지 URL<input type="url" placeholder="https://... (선택)" {...profile.register('avatar')} /></label>
      <button disabled={busy}>프로필 저장</button>
    </form>
    {(user?.provider === 'email' || user?.provider === 'local') && <>
      <h3>이메일 계정 비밀번호 변경</h3>
      <form onSubmit={password.handleSubmit(async (input) => {
        if (input.password !== input.confirmation) { setMessage('새 비밀번호 확인이 일치하지 않습니다.'); return; }
        try {
          await authAPIService.changePassword(input.currentPassword, input.password);
          password.reset();
          setMessage('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
        } catch (error) { setMessage(messageOf(error)); }
      })}>
        <label>현재 비밀번호<input type="password" required autoComplete="current-password" {...password.register('currentPassword')} /></label>
        <label>새 비밀번호<input type="password" required minLength={8} autoComplete="new-password" {...password.register('password')} /></label>
        <label>새 비밀번호 확인<input type="password" required minLength={8} autoComplete="new-password" {...password.register('confirmation')} /></label>
        <button disabled={busy}>비밀번호 변경</button>
      </form>
    </>}
    <h3>계정 비활성화</h3>
    <p>서비스 접근이 차단됩니다. Supabase Auth 계정 자체를 삭제하는 작업과 구분합니다.</p>
    <button disabled={busy} onClick={() => {
      if (!window.confirm('이 서비스의 계정을 비활성화할까요? 이후 보호 API를 사용할 수 없습니다.')) return;
      setDeactivating(true);
      void (async () => {
        try {
          await authAPIService.deactivateAccount();
          await logout();
          navigate('/login', { replace: true });
        } catch (error) { setMessage(messageOf(error)); }
        finally { setDeactivating(false); }
      })();
    }}>계정 비활성화</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
```


### 7-4. 내 정보 화면에 편집 연결

서버 프로필과 편집 폼·관리자 메뉴를 표시합니다.

**파일:** `src/pages/DashboardPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/pages/DashboardPage.tsx" -->
```tsx
import ProfileForm from '../components/ProfileForm';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageOf } from '../utils/errorMessage';
import AccountPanel from '../components/AccountPanel';

export default function DashboardPage() {
  const { user, logout, isAdmin } = useAuth();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  if (!user) return <p>프로필 확인 중...</p>;
  return <AccountPanel>
    <h2>환영합니다, {user.name || '사용자'}님!</h2>
    {user.avatar && <img src={user.avatar} alt="프로필" width={80} height={80} />}
    <p>이메일: {user.email || '미제공'}</p>
    <p>로그인 방식: {user.provider}</p>
    <p>역할: {isAdmin() ? '관리자' : '일반 사용자'}</p>
    <p>가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}</p>
    <ProfileForm key={user.id} />
    <nav><Link to="/list">맛집 목록</Link><Link to="/submit">맛집 제보</Link>
      {isAdmin() && <><Link to="/admin">맛집·사용자 관리</Link><Link to="/submissions">제보 관리</Link></>}
    </nav>
    {message && <p role="alert">{message}</p>}
    <button onClick={() => { void logout().then(() => navigate('/', { replace: true })).catch((error: unknown) => setMessage(messageOf(error))); }}>로그아웃</button>
  </AccountPanel>;
}
```


### 7-5. 관리자 사용자 목록 작성

UUID·역할을 표시하고 관리자 API로 변경합니다. 본인 역할 변경 후 공유 상태도 다시 확인합니다.

**파일:** `src/components/AdminUsersPanel.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/components/AdminUsersPanel.tsx" -->
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { authAPIService } from '../services/authApi';
import { useAuth } from '../contexts/AuthContext';
import { messageOf } from '../utils/errorMessage';
import type { UserType } from '../types/auth';

export default function AdminUsersPanel() {
  const client = useQueryClient();
  const { checkAuthStatus } = useAuth();
  const users = useQuery({ queryKey: ['users'], queryFn: authAPIService.getAllUsers });
  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserType }) => authAPIService.changeUserType(id, role),
    onSuccess: async () => {
      toast.success('사용자 역할을 변경했습니다.');
      await client.invalidateQueries({ queryKey: ['users'] });
      // 본인 권한을 바꾼 경우 메뉴·보호 화면도 서버의 최신 역할로 바뀝니다.
      await checkAuthStatus();
    },
    onError: (error) => toast.error(messageOf(error)),
  });
  if (users.isPending) return <p>사용자 목록 조회 중...</p>;
  if (users.isError) return <p role="alert">{messageOf(users.error)} <button onClick={() => void users.refetch()}>다시 조회</button></p>;
  return <section style={{ marginTop: '2rem', overflowX: 'auto' }}>
    <h2>사용자 역할 관리</h2>
    <p>대상 UUID를 확인하세요. 마지막 관리자의 권한 해제는 서버가 409로 거절합니다.</p>
    <table style={{ width: '100%', textAlign: 'left' }}>
      <thead><tr><th>사용자·UUID</th><th>이메일</th><th>방식·상태</th><th>역할</th><th>변경</th></tr></thead>
      {/* 첫 data는 React Query의 결과, 두 번째 data는 서버 응답 본문의 필드입니다. */}
      <tbody>{users.data.data.users.map((user) => <tr key={user.id}>
        <td>{user.name}<br /><small>{user.id}</small></td>
        <td>{user.email || '미제공'}</td>
        <td>{user.provider} · {user.isActive ? '활성' : '비활성'}</td>
        <td>{user.userType}</td>
        <td><button disabled={changeRole.isPending || !user.isActive} onClick={() => {
          const role = user.userType === 'admin' ? 'user' : 'admin';
          if (window.confirm(`${user.name} (${user.id})의 역할을 ${role}(으)로 변경할까요?`)) {
            changeRole.mutate({ id: user.id, role });
          }
        }}>{user.userType === 'admin' ? '일반 사용자로' : '관리자로'}</button></td>
      </tr>)}</tbody>
    </table>
  </section>;
}
```


### 7-6. 관리자 맛집 화면 작성

조회 표·생성·수정·삭제를 연결하고 처리 중 중복 동작을 막습니다. 저장 후 목록·상세·인기 캐시를 다시 읽습니다.

**파일:** `src/pages/AdminPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.

createMutation은 생성, updateMutation은 선택한 ID 수정, deleteMutation은 확인 후 삭제입니다. onEdit은 값을 폼에 채웁니다. invalidateQueries는 DB 수정이 아니라 최신 결과를 다시 조회하게 합니다. 빈 값을 보내는 것과 필드 생략은 다른 요청입니다.

<!-- lab:file step="7" path="src/pages/AdminPage.tsx" -->
```tsx
import AdminUsersPanel from '../components/AdminUsersPanel';
import { messageOf } from '../utils/errorMessage';
import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import type { CreateRestaurantInput, Restaurant, RestaurantFormValues, UpdateRestaurantInput } from '../types';

const Container = styled.div`
  padding: 2rem 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
  gap: 2rem;
`;

const Panel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  th, td { border-bottom: 1px solid #eee; padding: 0.5rem; text-align: left; }
  th { background: #fafafa; }
  tr:hover { background: #fafafa; }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
`;

const Danger = styled(Button)`
  color: #ff4757;
  border-color: #ffb3ba;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-height: 80px;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
`;

function AdminPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: restaurantAPI.getRestaurants,
  });

  const restaurants = data?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<RestaurantFormValues>();

  const createMutation = useMutation({
    mutationFn: restaurantAPI.createRestaurant,
    onSuccess: () => {
      toast.success('생성 완료');
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      void queryClient.invalidateQueries({ queryKey: ['popular-restaurants'] });
      reset();
    },
    onError: (error) => toast.error(messageOf(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: Restaurant['id']; payload: UpdateRestaurantInput }) =>
      restaurantAPI.updateRestaurant(id, payload),
    onSuccess: () => {
      toast.success('수정 완료');
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      void queryClient.invalidateQueries({ queryKey: ['popular-restaurants'] });
    },
    onError: (error) => toast.error(messageOf(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: restaurantAPI.deleteRestaurant,
    onSuccess: () => {
      toast.info('삭제 완료');
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      void queryClient.invalidateQueries({ queryKey: ['popular-restaurants'] });
      if (selected?.id) { setSelected(null); reset(); }
    },
    onError: (error) => toast.error(messageOf(error)),
  });

  const onEdit = (row: Restaurant) => {
    setSelected(row);
    setValue('name', row.name);
    setValue('category', row.category);
    setValue('location', row.location);
    setValue('priceRange', row.priceRange || '');
    setValue('rating', row.rating ?? 0);
    setValue('description', row.description || '');
    setValue('recommendedMenu', (row.recommendedMenu || []).join(', '));
    setValue('image', row.image || '');
  };

  const onResetForm = () => {
    setSelected(null);
    reset();
  };

  const onSubmit = async (form: RestaurantFormValues) => {
    const recommendedMenu = typeof form.recommendedMenu === 'string'
      ? form.recommendedMenu.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
      : [];

    const payload: CreateRestaurantInput = {
      name: form.name?.trim(),
      category: form.category,
      location: form.location?.trim(),
      priceRange: form.priceRange?.trim() || '',
      rating: form.rating !== '' && form.rating !== undefined ? Number(form.rating) : 0,
      description: form.description?.trim() || '',
      recommendedMenu,
      image: form.image?.trim() || '',
    };

    try {
    if (selected?.id) {
      await updateMutation.mutateAsync({ id: selected.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    } catch { /* 위 mutation의 onError가 오류를 안내합니다. */ }
  };

  const onDelete = async (row: Restaurant) => {
    if (!confirm(`[삭제] ${row.name}을(를) 삭제할까요?`)) return;
    deleteMutation.mutate(row.id);
  };

  const categories = useMemo(() => ['한식','중식','일식','양식','아시안','분식','카페','기타'], []);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;

  return (
    <Container>
      <Title>관리자 - 레스토랑 관리</Title>
      <Grid>
        <Panel>
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>카테고리</th>
                <th>평점</th>
                <th>위치</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.category}</td>
                  <td>{r.rating}</td>
                  <td>{r.location}</td>
                  <td>
                    <Actions>
                      <Button disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending} onClick={() => onEdit(r)}>수정</Button>
                      <Danger disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending} onClick={() => onDelete(r)}>삭제</Danger>
                    </Actions>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <Panel>
          <h3>{selected ? `수정: ${selected.name}` : '새 레스토랑 추가'}</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormRow>
              <label htmlFor="name">이름 *</label>
              <Input id="name" {...register('name', { required: '이름은 필수입니다' })} />
            </FormRow>
            <FormRow>
              <label htmlFor="category">카테고리 *</label>
              <Select id="category" {...register('category', { required: '카테고리는 필수입니다' })}>
                <option value="">선택</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </FormRow>
            <FormRow>
              <label htmlFor="location">위치 *</label>
              <Input id="location" {...register('location', { required: '위치는 필수입니다' })} />
            </FormRow>
            <FormRow>
              <label htmlFor="priceRange">가격대</label>
              <Input id="priceRange" {...register('priceRange')} />
            </FormRow>
            <FormRow>
              <label htmlFor="rating">평점</label>
              <Input id="rating" type="number" step="0.01" min="0" max="5" {...register('rating')} />
            </FormRow>
            <FormRow>
              <label htmlFor="recommendedMenu">추천 메뉴</label>
              <Textarea id="recommendedMenu" {...register('recommendedMenu')} placeholder="쉼표 또는 줄바꿈으로 구분" />
            </FormRow>
            <FormRow>
              <label htmlFor="image">이미지 URL</label>
              <Input id="image" {...register('image')} />
            </FormRow>
            <FormRow>
              <label htmlFor="description">설명</label>
              <Textarea id="description" {...register('description')} />
            </FormRow>
            <Actions>
              <Button type="submit" disabled={isSubmitting || deleteMutation.isPending}>{selected ? '수정' : '생성'}</Button>
              <Button type="button" onClick={onResetForm}>초기화</Button>
            </Actions>
          </form>
        </Panel>
      </Grid>
      <AdminUsersPanel />
    </Container>
  );
}

export default AdminPage;
```


### 7-7. 관리자 메뉴 연결

서버가 확인한 관리자에게만 관리 메뉴를 표시합니다.

**파일:** `src/components/Header.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/components/Header.tsx" -->
```tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import { FaHome, FaList, FaFire } from 'react-icons/fa';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 0.5rem;
  max-width: 1100px;
  margin: 0 auto;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(255, 255, 255, 0.3);
  }
`;

function Header() {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <HeaderContainer>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Ajou Campus Foodmap
      </h1>
      <Nav>
        <NavLink to="/" className={isActive('/')}>
          <FaHome /> Home
        </NavLink>
        <NavLink to="/list" className={isActive('/list')}>
          <FaList /> List
        </NavLink>
        <NavLink to="/popular" className={isActive('/popular')}>
          <FaFire /> Popular
        </NavLink>
        {isAuthenticated ? <NavLink to="/dashboard">내 정보</NavLink> : <>
          <NavLink to="/login">로그인</NavLink><NavLink to="/register">회원가입</NavLink>
        </>}
        {isAdmin() && <><NavLink to="/admin">관리자</NavLink></>}
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
```


### 7-8. 관리자 화면 주소 연결

admin에 실제 관리 화면을 연결합니다.

**파일:** `src/App.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="7" path="src/App.tsx" -->
```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Header from './components/Header';
import NotFound from './components/NotFound';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import PopularPage from './pages/PopularPage';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AuthCallbackHandler from './components/AuthCallbackHandler';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});
export default function App() {
  if (window.location.pathname === '/auth/callback') return <AuthCallbackHandler />;
  return <QueryClientProvider client={queryClient}><AuthProvider>
    <HashRouter><GlobalStyles /><div className="app">
      <Header /><main className="main-content"><Routes>
        <Route path="/" element={<HomePage />} />
<Route path="/list" element={<ListPage />} />
<Route path="/restaurant/:id" element={<DetailPage />} />
<Route path="/popular" element={<PopularPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
<Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
<Route path="*" element={<NotFound />} />
      </Routes></main>
      <footer className="footer">© 2026 Ajou Campus Foodmap</footer>
    </div><ToastContainer position="bottom-right" autoClose={3000} /></HashRouter>
  </AuthProvider></QueryClientProvider>;
}
```


### 7-9. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

1. A의 /#/admin에서 테스트 맛집을 생성합니다. POST는 201입니다. 이름 수정 후 메뉴·설명 보존도 확인합니다. PUT은 200, 삭제는 204입니다. 새 테스트 행으로 시험합니다.
2. B의 /#/admin은 권한 안내여야 합니다. B 브라우저 Console에서 다음 진단으로 서버의 거절도 확인합니다. 토큰은 출력하지 않습니다.

```js
const { authAPIService } = await import('/src/services/authApi.ts');
await authAPIService.getAllUsers().catch(error => console.log(error.response?.status));
```

일반 B는 403, A가 B를 admin으로 바꾸면 사용자 목록이 반환됩니다. B를 user로 되돌립니다. A 외 관리자가 없을 때 A의 관리자 해제는 409입니다.

3. B의 /#/dashboard에서 이름·이미지를 저장하고 새로고침합니다. UUID는 그대로입니다.
4. 이메일 계정 비밀번호를 변경하고 로그아웃 후 새 비밀번호로 로그인합니다.
5. 비활성화 확인용 일반 C를 별도 가입해 취소·승인을 시험합니다. 비활성화 후 보호 API는 403입니다. A·B는 이후 제보를 위해 남깁니다. 앱에는 비활성 계정 복원 화면이 없습니다.

**이해 확인:** 프로필 요청에 userType을 넣어도 관리자 권한을 얻지 못하는 이유와 서버 검사의 필요성을 설명합니다.

## 8. 맛집 제보와 승인

**목적:** 로그인 사용자의 제보를 서버에 저장하고 관리자가 검토합니다. 폼은 맛집 내용만 보내며 서버가 검증한 UUID·이름·이메일을 제보자 정보로 기록합니다.

맛집 생성과 제보 상태를 별도 요청으로 바꾸면 생성만 성공하고 대기 상태가 남을 수 있습니다. 승인 한 요청에서 서버 DB 함수가 둘을 함께 처리합니다. 실패는 함께 롤백하고 재승인은 같은 맛집을 반환합니다. 동시 처리에서는 행 잠금과 유일성 제약으로 중복을 막습니다.


### 8-1. 제보 입력·응답 타입 작성

사용자가 보내는 맛집 내용과 서버가 정하는 제보자·검토자·상태를 구분합니다.

**파일:** `src/types/submission.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/types/submission.ts" -->
```ts
import type { EntityId, SubmissionStatus } from './index';
export interface CreateServerSubmissionInput {
  restaurantName: string;
  category: string;
  location: string;
  priceRange?: string;
  recommendedMenu?: string[];
  review?: string;
}
// 제보자 UUID·표시 정보와 검토 정보는 클라이언트가 보내지 않고 서버가 결정합니다.
export interface ServerSubmission extends CreateServerSubmissionInput {
  id: EntityId;
  status: SubmissionStatus;
  submitterId: string;
  submitterName: string;
  submitterEmail: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ServerSubmissionForm {
  restaurantName: string;
  category: string;
  location: string;
  priceRange: string;
  recommendedMenu: string;
  review: string;
}
```


### 8-2. 제보 API 요청 작성

로그인 사용자는 생성, 관리자는 조회·거절·승인·삭제를 요청합니다. 승인 응답은 연결된 restaurant입니다.

**파일:** `src/services/submissionApi.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/services/submissionApi.ts" -->
```ts
import { authApi } from './http';
import type { ApiResponse, EntityId, Restaurant, SubmissionStatus } from '../types';
import type { CreateServerSubmissionInput, ServerSubmission } from '../types/submission';

export const submissionAPI = {
  createSubmission: async (payload: CreateServerSubmissionInput): Promise<ApiResponse<ServerSubmission>> =>
    (await authApi.post('/api/submissions', payload)).data,
  listSubmissions: async (status?: SubmissionStatus): Promise<ApiResponse<ServerSubmission[]>> =>
    (await authApi.get('/api/submissions', { params: { status } })).data,
  updateSubmission: async (id: EntityId, payload: { status: 'rejected' }): Promise<ApiResponse<ServerSubmission>> =>
    (await authApi.put(`/api/submissions/${id}`, payload)).data,
  approveSubmission: async (id: EntityId): Promise<ApiResponse<Restaurant>> =>
    (await authApi.post(`/api/submissions/${id}/approve`)).data,
  deleteSubmission: async (id: EntityId): Promise<number> =>
    (await authApi.delete(`/api/submissions/${id}`)).status,
};
```


### 8-3. 화면에서 사용할 API 연결

submissionAPI를 재수출하여 폼과 관리 화면이 같은 진입점을 사용합니다.

**파일:** `src/services/api.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/services/api.ts" -->
```ts
import { authApi, publicApi } from './http';
import type { ApiResponse, CreateRestaurantInput, EntityId, Restaurant, UpdateRestaurantInput } from '../types';

// 맛집과 제보는 서버 API로 저장하고, 좋아요는 브라우저에서 관리합니다.
export { submissionAPI } from './submissionApi';
export const restaurantAPI = {
  getRestaurants: async (): Promise<ApiResponse<Restaurant[]>> =>
    (await publicApi.get('/api/restaurants')).data,
  getRestaurantById: async (id: EntityId): Promise<ApiResponse<Restaurant>> =>
    (await publicApi.get(`/api/restaurants/${id}`)).data,
  getPopularRestaurants: async (): Promise<ApiResponse<Restaurant[]>> =>
    (await publicApi.get('/api/restaurants/popular')).data,
  createRestaurant: async (payload: CreateRestaurantInput): Promise<ApiResponse<Restaurant>> =>
    (await authApi.post('/api/restaurants', payload)).data,
  updateRestaurant: async (id: EntityId, payload: UpdateRestaurantInput): Promise<ApiResponse<Restaurant>> =>
    (await authApi.put(`/api/restaurants/${id}`, payload)).data,
  // 204 응답에는 JSON 본문이 없습니다. HTTP 상태만 반환합니다.
  deleteRestaurant: async (id: EntityId): Promise<number> =>
    (await authApi.delete(`/api/restaurants/${id}`)).status,
};
export default restaurantAPI;
```


### 8-4. 제보 입력 폼 작성

맛집 정보와 성공 화면을 작성합니다. 제보자 ID·이름·이메일 입력란은 만들지 않습니다.

**파일:** `src/components/SubmitRestaurant.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/components/SubmitRestaurant.tsx" -->
```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from '@emotion/styled';
import { toast } from 'react-toastify';
import { submissionAPI } from '../services/api';
import { FaCheckCircle } from 'react-icons/fa';
import type { CreateServerSubmissionInput, ServerSubmissionForm } from '../types/submission';
import { useAuth } from '../contexts/AuthContext';
import { messageOf } from '../utils/errorMessage';

const FormContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 600px;
  margin: 0 auto;
`;

const FormTitle = styled.h2`
  margin-bottom: 2rem;
  color: #333;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ErrorMessage = styled.span`
  color: #ff4757;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.02);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: 3rem;

  svg {
    font-size: 4rem;
    color: #4caf50;
    margin-bottom: 1rem;
  }

  h3 {
    color: #4caf50;
    margin-bottom: 1rem;
  }
`;

function SubmitRestaurant() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ServerSubmissionForm>();

  const onSubmit = async (data: ServerSubmissionForm) => {
    try {
      const recommendedMenuArray = typeof data.recommendedMenu === 'string'
        ? data.recommendedMenu
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

      const payload: CreateServerSubmissionInput = {
        restaurantName: data.restaurantName?.trim(),
        category: data.category,
        location: data.location?.trim(),
        priceRange: data.priceRange?.trim() || undefined,
        recommendedMenu: recommendedMenuArray.length ? recommendedMenuArray : undefined,
        review: data.review?.trim() || undefined,
      };

      await submissionAPI.createSubmission(payload);
      setSubmitted(true);
      toast.success('맛집이 성공적으로 제보되었습니다! 🎉');
      reset();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      toast.error(messageOf(error));
    }
  };

  if (submitted) {
    return (
      <FormContainer>
        <SuccessMessage>
          <FaCheckCircle />
          <h3>제보 감사합니다!</h3>
          <p>여러분의 제보로 캠퍼스 푸드맵이 더욱 풍성해집니다.</p>
          <button onClick={() => setSubmitted(false)}>
            다른 맛집 제보하기
          </button>
        </SuccessMessage>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormTitle>🍽️ 새로운 맛집 제보하기</FormTitle>
      <p>제보는 로그인 계정({user?.name || '사용자'})과 연결되어 서버에 저장됩니다.</p>

      <form onSubmit={handleSubmit(onSubmit)}>

        <FormGroup>
          <Label htmlFor="restaurantName">맛집 이름 *</Label>
          <Input
            id="restaurantName"
            {...register("restaurantName", {
              required: "맛집 이름은 필수입니다"
            })}
            placeholder="예: OO식당"
          />
          {errors.restaurantName && (
            <ErrorMessage>{errors.restaurantName.message}</ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="category">카테고리 *</Label>
          <Select
            id="category"
            {...register("category", {
              required: "카테고리를 선택해주세요"
            })}
          >
            <option value="">선택하세요</option>
            <option value="한식">한식</option>
            <option value="중식">중식</option>
            <option value="일식">일식</option>
            <option value="양식">양식</option>
            <option value="아시안">아시안</option>
            <option value="분식">분식</option>
            <option value="카페">카페</option>
            <option value="기타">기타</option>
          </Select>
          {errors.category && (
            <ErrorMessage>{errors.category.message}</ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="location">위치 *</Label>
          <Input
            id="location"
            {...register("location", {
              required: "위치는 필수입니다"
            })}
            placeholder="예: 아주대학교 정문 도보 5분"
          />
          {errors.location && (
            <ErrorMessage>{errors.location.message}</ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="priceRange">가격대</Label>
          <Input
            id="priceRange"
            {...register("priceRange")}
            placeholder="예: 8,000-12,000원"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="recommendedMenu">추천 메뉴</Label>
          <Textarea
            id="recommendedMenu"
            {...register("recommendedMenu")}
            placeholder="예: 치즈닭갈비, 막국수, 볶음밥"
          />
        </FormGroup>


        <FormGroup>
          <Label htmlFor="review">한줄평</Label>
          <Textarea
            id="review"
            {...register("review")}
            placeholder="이 맛집만의 특별한 점을 알려주세요"
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? '제출 중...' : '맛집 제보하기'}
        </SubmitButton>
      </form>
    </FormContainer>
  );
}

export default SubmitRestaurant;
```


### 8-5. 제보 페이지 작성

제보 폼을 주소에 연결할 페이지로 감쌉니다.

**파일:** `src/pages/SubmitPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/pages/SubmitPage.tsx" -->
```tsx
import SubmitRestaurant from '../components/SubmitRestaurant';

function SubmitPage() {
  return <SubmitRestaurant />;
}

export default SubmitPage;
```


### 8-6. 홈에서 제보 화면 연결

공개 탐색 카드에 로그인 사용자의 맛집 제보로 이동하는 카드를 추가합니다.

**파일:** `src/pages/HomePage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/pages/HomePage.tsx" -->
```tsx
import { Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { FaMapMarkedAlt, FaUtensils, FaStar } from 'react-icons/fa';

const HomeContainer = styled.div`
  text-align: center;
  padding: 3rem 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const Card = styled(Link)`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-5px);
  }

  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #667eea;
  }

  h3 {
    margin-bottom: 0.5rem;
  }

  p {
    color: #666;
  }
`;

function HomePage() {
  return (
    <HomeContainer>
      <Title>우리 학교 맛집을 찾아보세요!</Title>
      <Subtitle>캠퍼스 주변 숨은 맛집들을 한눈에</Subtitle>

      <CardGrid>
        <Card to="/list">
          <FaMapMarkedAlt />
          <h3>맛집 둘러보기</h3>
          <p>카테고리별로 맛집을 찾아보세요</p>
        </Card>

        <Card to="/submit">
          <FaUtensils />
          <h3>맛집 제보하기</h3>
          <p>새로운 맛집을 알려주세요</p>
        </Card>
        <Card to="/popular">
          <FaStar />
          <h3>인기 맛집 TOP</h3>
          <p>이번 주 가장 인기있는 맛집</p>
        </Card>

      </CardGrid>
    </HomeContainer>
  );
}

export default HomePage;
```


### 8-7. 관리자 제보 목록 작성

필터·승인·거절·삭제를 연결합니다. 승인 한 요청 뒤 결과를 다시 조회하고 처리된 상태의 버튼을 비활성화합니다.

**파일:** `src/pages/SubmissionsPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/pages/SubmissionsPage.tsx" -->
```tsx
import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submissionAPI } from '../services/api';
import { toast } from 'react-toastify';
import type { SubmissionStatus } from '../types';
import type { ServerSubmission as Submission } from '../types/submission';
import { messageOf } from '../utils/errorMessage';

type StatusFilter = SubmissionStatus | 'all';

const Container = styled.div`
  padding: 2rem 0;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: ${props => (props.$active ? '#667eea' : 'white')};
  color: ${props => (props.$active ? 'white' : '#333')};
  cursor: pointer;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  th, td { border-bottom: 1px solid #eee; padding: 0.5rem; text-align: left; vertical-align: top; }
  th { background: #fafafa; }
  tr:hover { background: #fafafa; }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.4rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
`;

const Danger = styled(Button)`
  color: #ff4757;
  border-color: #ffb3ba;
`;

function SubmissionsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('pending');

  const { data, isLoading, error } = useQuery({
    queryKey: ['submissions', status],
    queryFn: () => submissionAPI.listSubmissions(status === 'all' ? undefined : status),
  });

  const items = data?.data || [];

  const onMutationError = (error: unknown) => {
    toast.error(messageOf(error));
    // 409는 다른 관리자가 이미 처리했을 수 있으므로 최신 목록을 다시 읽습니다.
    void queryClient.invalidateQueries({ queryKey: ['submissions'] });
  };

  const approveMutation = useMutation({
    // 맛집 생성과 제보 승인 상태 변경은 서버의 한 트랜잭션에서 처리합니다.
    mutationFn: (submission: Submission) => submissionAPI.approveSubmission(submission.id),
    onSuccess: () => {
      toast.success('승인하여 레스토랑에 등록했습니다.');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['popular-restaurants'] });
    },
    onError: onMutationError,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id }: Pick<Submission, 'id'>) => submissionAPI.updateSubmission(id, { status: 'rejected' }),
    onSuccess: () => {
      toast.info('제보를 거절했습니다.');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: onMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: submissionAPI.deleteSubmission,
    onSuccess: () => {
      toast.info('제보를 삭제했습니다.');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: onMutationError,
  });

  const busy = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

  const statuses = useMemo<{ key: StatusFilter; label: string }[]>(() => [
    { key: 'pending', label: '대기' },
    { key: 'approved', label: '승인' },
    { key: 'rejected', label: '거절' },
    { key: 'all', label: '전체' },
  ], []);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;

  return (
    <Container>
      <Title>제보 관리</Title>
      <Controls>
        {statuses.map(s => (
          <FilterButton key={s.key} $active={status === s.key} onClick={() => setStatus(s.key)}>
            {s.label}
          </FilterButton>
        ))}
      </Controls>

      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>제보 내용</th>
            <th>제보자</th>
            <th>상태/액션</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.id}</td>
              <td>
                <div><strong>{it.restaurantName}</strong> ({it.category})</div>
                <div>{it.location}</div>
                {it.priceRange && <div>가격대: {it.priceRange}</div>}
                {Array.isArray(it.recommendedMenu) && it.recommendedMenu.length > 0 && (
                  <div>메뉴: {it.recommendedMenu.join(', ')}</div>
                )}
                {it.review && <div>한줄평: {it.review}</div>}
              </td>
              <td>
                <div>{it.submitterName || '-'}</div>
                <div>{it.submitterEmail || '-'}</div>
              </td>
              <td>
                <div style={{ marginBottom: '0.5rem' }}>상태: {it.status}</div>
                <Actions>
                  <Button onClick={() => approveMutation.mutate(it)} disabled={busy || it.status !== 'pending'}>승인</Button>
                  <Button onClick={() => rejectMutation.mutate({ id: it.id })} disabled={busy || it.status !== 'pending'}>거절</Button>
                  <Danger disabled={busy} onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMutation.mutate(it.id); }}>삭제</Danger>
                </Actions>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default SubmissionsPage;
```


### 8-8. 제보 메뉴 연결

제보 작성과 관리자 제보 관리 메뉴를 추가합니다.

**파일:** `src/components/Header.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/components/Header.tsx" -->
```tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import { FaHome, FaList, FaFire, FaPlus } from 'react-icons/fa';

const HeaderContainer = styled.header`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
`;

const Nav = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  gap: 0.5rem;
  max-width: 1100px;
  margin: 0 auto;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: background 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: rgba(255, 255, 255, 0.3);
  }
`;

function Header() {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <HeaderContainer>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Ajou Campus Foodmap
      </h1>
      <Nav>
        <NavLink to="/" className={isActive('/')}>
          <FaHome /> Home
        </NavLink>
        <NavLink to="/list" className={isActive('/list')}>
          <FaList /> List
        </NavLink>
        <NavLink to="/popular" className={isActive('/popular')}>
          <FaFire /> Popular
        </NavLink>
        <NavLink to="/submit" className={isActive('/submit')}>
          <FaPlus /> Submit New restaurant
        </NavLink>
        {isAuthenticated ? <NavLink to="/dashboard">내 정보</NavLink> : <>
          <NavLink to="/login">로그인</NavLink><NavLink to="/register">회원가입</NavLink>
        </>}
        {isAdmin() && <><NavLink to="/admin">관리자</NavLink><NavLink to="/submissions">제보 관리</NavLink></>}
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
```


### 8-9. 제보 화면 보호 연결

제보 작성은 로그인 검사, 관리는 관리자 검사로 감쌉니다.

**파일:** `src/App.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="8" path="src/App.tsx" -->
```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AuthCallbackHandler from './components/AuthCallbackHandler';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
// Pages
import HomePage from './pages/HomePage';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';
import PopularPage from './pages/PopularPage';
import AdminPage from './pages/AdminPage';
import SubmissionsPage from './pages/SubmissionsPage';
import SubmitPage from './pages/SubmitPage';

// Components
import Header from './components/Header';
import NotFound from './components/NotFound';

// Styles
import GlobalStyles from './styles/GlobalStyles';

// React Query Client 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

function App() {
  // 외부 인증은 해시 없는 /auth/callback으로 복귀하므로 HashRouter를 만들기 전에 처리합니다.
  if (window.location.pathname === '/auth/callback') return <AuthCallbackHandler />;
  return (
    // AuthProvider가 조회 캐시를 사용하므로 QueryClientProvider 안에 배치합니다.
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <HashRouter>
        <GlobalStyles />
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/list" element={<ListPage />} />
              <Route path="/restaurant/:id" element={<DetailPage />} />
              <Route path="/popular" element={<PopularPage />} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path="/submissions" element={<AdminRoute><SubmissionsPage /></AdminRoute>} />
              <Route path="/submit" element={<ProtectedRoute><SubmitPage /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="footer">
            <p>© 2026 Ajou Campus Foodmap | Made with React</p>
          </footer>
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```


### 8-10. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

1. B의 /#/submit에서 새 제보를 작성합니다. POST는 201이며 본문에 제보자 UUID·이름·이메일이 없어야 합니다.
2. 다른 브라우저 프로필의 A로 /#/submissions를 열어 같은 제보와 제보자 정보를 확인합니다.
3. 승인 클릭 시 POST /api/submissions/:id/approve 한 요청만 발생하고 공개 목록에 맛집 한 건이 생깁니다. 재승인에도 서버는 200과 같은 ID를 반환합니다.
4. 새 제보로 거절·삭제·필터를 확인합니다. 다른 관리자 처리와 충돌해 409가 나면 안내 후 최신 목록을 읽어야 합니다.
5. 새로고침·서버 재시작 후에도 제보가 유지되는지 확인합니다. 좋아요의 브라우저 저장과 제보의 서버 저장 차이를 설명합니다.

**이해 확인:** 입력 이름으로 제보자를 판별하지 않는 이유와 승인을 한 요청으로 처리하는 이유를 설명합니다.

## 9. Google·네이버 로그인

**목적:** 외부 계정으로 로그인하고 이메일 방식과 같은 내부 사용자·권한 API를 사용합니다. 이메일·Google·네이버 세 방식을 모두 구현합니다.

**흐름:** 공급자 인증 → Supabase의 외부 결과 검증·내부 계정 연결 → 앱 콜백의 code → SDK의 session 교환 → /me → 대시보드.

| 항목 | 뜻과 사용 위치 |
| --- | --- |
| Client ID·Secret | 등록한 앱의 식별값·비밀값. Secret은 브라우저에 넣지 않음 |
| OIDC issuer | 신원 발급자 주소. 네이버는 https://nid.naver.com |
| scope openid | OIDC 인증 요청의 범위 |
| PKCE | code 교환을 시작한 로그인 시도에 연결. SDK·Auth가 처리 |
| code | 복귀 URL의 일회용 교환값. 업무 Bearer로 보내지 않음 |
| 외부 ID 토큰 | 외부 신원 정보. Supabase Auth가 검증 |
| Supabase 액세스 토큰 | Express 요청의 Bearer로 보내는 앱 자격 |
| email_optional | 이메일 미제공 계정 생성 허용 |

### Google 앱 등록

1. [Google Cloud Console](https://console.cloud.google.com/) 프로젝트를 선택·생성하고 Google Auth Platform Branding에 이름·지원 이메일·연락처를 입력합니다.
2. Audience는 개인 실습용 External·Testing, 로그인할 계정은 테스터로 등록합니다.
3. Data Access에서 `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/userinfo.profile` 범위를 확인합니다.
4. Clients → Create client → Web application에서 JavaScript origin은 http://127.0.0.1:5173, Redirect URI는 Supabase Google 설정의 공급자 콜백을 입력합니다.
5. 같은 앱의 Client ID·Secret을 Supabase Authentication → Providers → Google에 입력하고 활성화합니다. [공식 안내](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

### 네이버 앱 등록

1. [네이버 개발자센터](https://developers.naver.com/) → Application → 애플리케이션 등록에서 네이버 로그인·PC 웹 환경을 선택합니다.
2. 서비스 URL은 http://127.0.0.1:5173, Callback URL은 Supabase 공급자 콜백을 등록합니다. 일반 형식은 https://본인-ref.supabase.co/auth/v1/callback이며 실제 값을 사용합니다.
3. OIDC로 식별하므로 추가 이름·이메일 프로필의 필수·추가 항목은 선택하지 않습니다. 본인 앱의 ID·Secret을 확인합니다.
4. 멤버 관리에서 실제 테스터 ID를 등록합니다. [설정 안내](https://developers.naver.com/docs/common/openapiguide/appconf.md)
5. 서버 프로젝트 .env에 NAVER_CLIENT_ID·NAVER_CLIENT_SECRET을 설정하고 서버 터미널에서 실행합니다.

```bash
npm run auth:setup-naver
npm run auth:check
```

서버 명령이 custom:naver·OIDC·issuer·openid·PKCE·email_optional을 등록합니다. 명령 코드는 서버 실습서에서 작성합니다. 설정 후 서버를 재시작합니다. [Custom OIDC](https://supabase.com/docs/guides/auth/custom-oauth-providers), [네이버 규격](https://developers.naver.com/docs/login/devguide/devguide.md)

http://localhost:3000/api/auth/providers의 data.google.enabled·data.naver.enabled가 true인지 확인합니다. 설정 조회와 실제 로그인은 별도 확인입니다. 캐시가 남으면 최대 60초 기다리거나 서버를 재시작합니다.


### 9-1. 소셜 공급자 타입 추가

소셜 방식과 공급자 상태 타입을 추가합니다.

**파일:** `src/types/auth.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="9" path="src/types/auth.ts" -->
```ts
export type UserType = 'user' | 'admin';
export type SocialProvider = 'google' | 'custom:naver';
export interface AppUser {
  id: string;
  email: string | null;
  name: string;
  avatar: string | null;
  provider: string;
  userType: UserType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Credentials { email: string; password: string }
export interface SignUpInput extends Credentials { name: string }
export interface AuthResult {
  success: boolean;
  message: string;
  needsConfirmation?: boolean;
}
export interface ProviderState {
  email: { provider: 'email'; enabled: boolean };
  google: { provider: 'google'; enabled: boolean };
  naver: { provider: 'custom:naver'; enabled: boolean };
}
```


### 9-2. 소셜 로그인 요청 추가

상태 API와 signInWithOAuth를 추가합니다. redirectTo는 앱 복귀 주소입니다.

**파일:** `src/services/authApi.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="9" path="src/services/authApi.ts" -->
```ts
import { authApi, publicApi } from './http';
import { requireSupabase } from '../config/supabase';
import type { ApiResponse } from '../types';
import type { AppUser, Credentials, ProviderState, SignUpInput, SocialProvider, UserType } from '../types/auth';

export const authAPIService = {
  register: async ({ email, password, name }: SignUpInput) => {
    const { data, error } = await requireSupabase().auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  },
  login: async ({ email, password }: Credentials) => {
    // [이론: 계정·인증] 이메일은 계정 지정, 비밀번호는 제시하는 증거입니다.
    // 해시·솔트 저장과 대조는 Supabase Auth가 담당합니다.
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return data;
  },
  logout: async () => {
    // [이론: 로그아웃·철회] 현재 세션의 갱신 자격 철회와 브라우저 보관 상태 정리를 요청합니다.
    // 이미 발급된 액세스 토큰은 만료 전까지 유효할 수 있습니다.
    const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
  // Axios 응답의 .data는 서버 응답 본문입니다. 본문의 data.user는 호출한 쪽에서 읽습니다.
  getCurrentUser: async () => (await authApi.get<ApiResponse<{ user: AppUser }>>('/api/auth/me')).data,
  getAllUsers: async () => (await authApi.get<ApiResponse<{ users: AppUser[] }>>('/api/users/all')).data,
  changeUserType: async (id: string, userType: UserType) =>
    (await authApi.put<ApiResponse<{ user: AppUser }>>(`/api/users/${id}/type`, { userType })).data,
  updateProfile: async (payload: { name: string; avatar?: string }) =>
    (await authApi.put<ApiResponse<{ user: AppUser }>>('/api/users/profile', payload)).data,
  deactivateAccount: async () => (await authApi.delete('/api/users/account')).data as unknown,
  changePassword: async (currentPassword: string, password: string) => {
    const { error } = await requireSupabase().auth.updateUser({ current_password: currentPassword, password });
    if (error) throw error;
  },
  getProviders: async () => (await publicApi.get<ApiResponse<ProviderState>>('/api/auth/providers')).data,
  socialLogin: async (provider: SocialProvider) => {
    const { error } = await requireSupabase().auth.signInWithOAuth({
      provider, options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  },
};
```


### 9-3. 소셜 로그인 버튼 작성

설정된 버튼만 활성화하고 상태 조회 실패는 재시도로 안내합니다.

**파일:** `src/components/SocialLoginButtons.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="9" path="src/components/SocialLoginButtons.tsx" -->
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authAPIService } from '../services/authApi';
import { authConfigured } from '../config/supabase';
import { messageOf } from '../utils/errorMessage';
import type { SocialProvider } from '../types/auth';

export default function SocialLoginButtons() {
  const [redirecting, setRedirecting] = useState<SocialProvider | null>(null);
  const [message, setMessage] = useState('');
  const providers = useQuery({
    queryKey: ['auth-providers'], queryFn: authAPIService.getProviders,
    staleTime: 60000, retry: false,
  });
  if (providers.isPending) return <p>소셜 로그인 설정 조회 중...</p>;
  if (providers.isError) return <div role="alert">
    <p>소셜 로그인 설정을 확인하지 못했습니다. 이메일 로그인은 계속 사용할 수 있습니다.</p>
    <button type="button" onClick={() => void providers.refetch()}>설정 다시 조회</button>
  </div>;
  const buttons = [
    { key: 'google', provider: 'google', label: 'Google로 계속하기', color: '#4052a2' },
    { key: 'naver', provider: 'custom:naver', label: '네이버로 계속하기', color: '#03a852' },
  ] as const;
  return <section aria-label="소셜 로그인">
    <h3>소셜 계정으로 계속하기</h3>
    <div style={{ display: 'grid', gap: '.75rem' }}>{buttons.map((item) => {
      const enabled = authConfigured && providers.data.data[item.key].enabled;
      return <button key={item.key} type="button" style={{ background: item.color }}
        disabled={!enabled || redirecting !== null} onClick={() => {
          setMessage(''); setRedirecting(item.provider);
          void authAPIService.socialLogin(item.provider).catch((error: unknown) => {
            setMessage(messageOf(error)); setRedirecting(null);
          });
        }}>
        {redirecting === item.provider ? '로그인 페이지로 이동 중...' : item.label}
        {!enabled && ' (설정되지 않음)'}
      </button>;
    })}</div>
    {message && <p role="alert">{message}</p>}
  </section>;
}
```


### 9-4. 로그인 화면에 소셜 버튼 연결

이메일 폼 아래 소셜 버튼을 연결합니다.

**파일:** `src/pages/LoginPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="9" path="src/pages/LoginPage.tsx" -->
```tsx
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authConfigured } from '../config/supabase';
import AccountPanel from '../components/AccountPanel';
import type { Credentials } from '../types/auth';

export default function LoginPage() {
  const { login, loading, isAuthenticated, authError } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Credentials>();
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const callbackError = search.get('error');
  if (loading) return <p>로그인 상태 확인 중...</p>;
  // 취소·실패가 있으면 남아 있는 이전 세션보다 이번 콜백의 오류를 우선 표시합니다.
  if (isAuthenticated && !callbackError) return <Navigate to="/dashboard" replace />;
  return <AccountPanel>
    <h2>로그인</h2>
    {!authConfigured && <p role="alert">Supabase 환경변수를 설정한 뒤 다시 실행하세요.</p>}
    {(message || callbackError || authError) && <p role="alert">{message || callbackError || authError}</p>}
    <form noValidate onSubmit={handleSubmit(async (input) => {
      setMessage('');
      const result = await login(input);
      if (result.success) navigate('/dashboard', { replace: true });
      else setMessage(result.message);
    })}>
      <label>이메일<input type="email" autoComplete="email" {...register('email', {
        required: '이메일을 입력해주세요.',
        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: '올바른 이메일 형식이 아닙니다.' },
      })} /></label>
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <label>비밀번호<input type={showPassword ? 'text' : 'password'} autoComplete="current-password" {...register('password', {
        required: '비밀번호를 입력해주세요.', minLength: { value: 6, message: '비밀번호는 최소 6자입니다.' },
      })} /></label>
      <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</button>
      {errors.password && <p role="alert">{errors.password.message}</p>}
      <button disabled={!authConfigured || isSubmitting}>{isSubmitting ? '확인 중...' : '로그인'}</button>
    </form>
    <p><Link to="/register">이메일로 회원가입</Link></p>
    <SocialLoginButtons />
  </AccountPanel>;
}
```


### 9-5. 가입 화면에 소셜 버튼 연결

같은 소셜 버튼과 내부 사용자 확인 흐름을 사용합니다.

**파일:** `src/pages/RegisterPage.tsx` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="9" path="src/pages/RegisterPage.tsx" -->
```tsx
import SocialLoginButtons from '../components/SocialLoginButtons';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authConfigured } from '../config/supabase';
import AccountPanel from '../components/AccountPanel';
import type { SignUpInput } from '../types/auth';

interface RegisterForm extends SignUpInput { passwordConfirm: string }
export default function RegisterPage() {
  const { register: signUp, isAuthenticated, loading } = useAuth();
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<RegisterForm>();
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();
  if (loading) return <p>로그인 상태 확인 중...</p>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <AccountPanel>
    <h2>이메일 회원가입</h2>
    {!authConfigured && <p role="alert">Supabase 환경변수를 설정한 뒤 다시 실행하세요.</p>}
    {message && <p role="status">{message}</p>}
    <form noValidate onSubmit={handleSubmit(async ({ passwordConfirm, ...input }) => {
      if (input.password !== passwordConfirm) { setMessage('비밀번호 확인이 일치하지 않습니다.'); return; }
      const result = await signUp(input);
      setMessage(result.message);
      if (result.success && !result.needsConfirmation) navigate('/dashboard', { replace: true });
    })}>
      <label>이름<input maxLength={80} autoComplete="name" {...register('name', {
        required: '이름을 입력해주세요.', validate: (value) => value.trim().length >= 2 || '이름은 최소 2자입니다.',
      })} /></label>
      {errors.name && <p role="alert">{errors.name.message}</p>}
      <label>이메일<input type="email" autoComplete="email" {...register('email', {
        required: '이메일을 입력해주세요.',
        pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: '올바른 이메일 형식이 아닙니다.' },
      })} /></label>
      {errors.email && <p role="alert">{errors.email.message}</p>}
      <label>비밀번호<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password', {
        required: '비밀번호를 입력해주세요.', minLength: { value: 6, message: '비밀번호는 최소 6자입니다.' },
      })} /></label>
      <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</button>
      {errors.password && <p role="alert">{errors.password.message}</p>}
      <label>비밀번호 확인<input type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" {...register('passwordConfirm', {
        required: '비밀번호 확인을 입력해주세요.', validate: (value) => value === getValues('password') || '비밀번호 확인이 일치하지 않습니다.',
      })} /></label>
      <button type="button" aria-pressed={showConfirmation} onClick={() => setShowConfirmation(!showConfirmation)}>{showConfirmation ? '확인 비밀번호 숨기기' : '확인 비밀번호 보기'}</button>
      {errors.passwordConfirm && <p role="alert">{errors.passwordConfirm.message}</p>}
      <button disabled={!authConfigured || isSubmitting}>{isSubmitting ? '가입 중...' : '회원가입'}</button>
    </form>
    <p><Link to="/login">로그인 화면으로</Link></p>
    <SocialLoginButtons />
  </AccountPanel>;
}
```


### 9-6. 실행하고 확인하기

프로젝트 루트의 터미널에서 실행합니다.

```bash
npm run typecheck
npm run lint
npm run build
```

**정상 결과:** 타입·린트 오류가 없고 빌드가 완료되어 `dist` 폴더가 생깁니다. 실행 중인 Vite가 없다면 `npm run dev -- --host 127.0.0.1 --strictPort`로 실행합니다. 설정·환경변수를 바꿨다면 기존 Vite 터미널에서 `Ctrl+C`로 종료한 뒤 다시 실행합니다.

1. Google·네이버 버튼 활성화와 조회 실패 시 재시도를 확인합니다.
2. Google 계정 동의 → /auth/callback → /#/dashboard 복귀와 /me 200을 확인합니다. 주소에서 code가 사라져야 합니다.
3. 네이버 테스터도 로그인·새로고침·로그아웃·재로그인을 확인합니다. 이메일·이름 미제공은 기본 이름과 미제공 표시로 로그인하고 프로필에서 이름을 보완합니다.
4. 두 공급자의 로그인 취소·실패 안내를 확인합니다. 이전 session이 남아도 이번 취소를 성공 처리하지 않아야 합니다.
5. 소셜 일반 계정도 제보 201, 관리자 요청 403이어야 합니다. 같은 이메일이 연결됐다면 Auth identities·UUID·실제 역할을 확인합니다. 앱에서 이메일만 비교해 합치지 않습니다.

redirect_uri_mismatch는 공급자 콜백, invalid_client는 같은 앱의 ID·Secret, 특정 네이버 계정 거절은 테스터 등록을 확인합니다. 교환 실패는 브라우저 프로필·origin과 중복 교환 여부를 확인합니다.

**이해 확인:** 외부 신원 정보와 업무 Bearer 토큰의 발급·검증 담당을 구분합니다.

## 10. 검사와 배포

**목적:** 인증 복귀 분기를 자동 검사하고 실제 배포 주소에서도 모든 기능을 확인합니다.


### 10-1. 인증 복귀 자동 검사 작성

검증용 코드입니다. 성공·취소·코드 없음·실패·이전 session 오인·잘못된 인코딩·원문 오류 노출을 포함한 8개 동작을 확인합니다. 실제 공급자 로그인도 별도 시험합니다.

**파일:** `tests/oauthCallback.test.ts` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="10" path="tests/oauthCallback.test.ts" -->
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { completeAuthCallback, oauthCallbackError } from "../src/utils/oauthCallback.ts";

test("정상 PKCE 복귀 코드를 로그인 오류로 처리하지 않는다", () => {
  assert.equal(oauthCallbackError("?code=single-use-code", ""), null);
});

test("공급자의 로그인 취소를 query와 hash 모두에서 인식한다", () => {
  assert.equal(
    oauthCallbackError("?error=access_denied", ""),
    "로그인이 취소되었습니다. 다시 시도하세요.",
  );
  assert.equal(
    oauthCallbackError("", "#error_code=user_cancelled"),
    "로그인이 취소되었습니다. 다시 시도하세요.",
  );
});

test("공급자의 원문 설명이나 토큰을 앱 복귀 URL에 옮기지 않는다", () => {
  const message = oauthCallbackError(
    "?error=server_error&error_description=refresh_token%3Dprivate-value",
    "#access_token=private-access",
  );
  assert.equal(message, "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.");
  assert.ok(!message?.includes("private"));
});

test("잘못된 percent 인코딩이 포함되어도 로그인 화면을 깨뜨리지 않는다", () => {
  assert.equal(
    oauthCallbackError("?error=%E0%A4%A&error_description=100%", ""),
    "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.",
  );
});

test("오류 설명만 있는 복귀도 성공으로 간주하지 않는다", () => {
  assert.equal(
    oauthCallbackError("?error_description=failed", ""),
    "소셜 로그인을 완료하지 못했습니다. 다시 시도하세요.",
  );
});

const callback = (query: string) => new URL(`https://app.example/auth/callback${query}`);

test("이번 PKCE 코드로 새 세션을 발급한 경우에만 대시보드로 이동한다", async () => {
  const auth = {
    async exchangeCodeForSession(code: string) {
      assert.equal(code, "current-code");
      return { data: { session: { user: { id: "new-user" } } }, error: null };
    },
  };
  assert.equal(await completeAuthCallback(callback("?code=current-code"), auth), "/dashboard");
});

test("기존 세션이 있어도 만료·누락된 코드나 실패한 교환은 로그인 오류로 안내한다", async () => {
  const auth = {
    getSession: async () => ({ data: { session: { user: { id: "old-user" } } } }),
    exchangeCodeForSession: async () => ({
      data: { session: null },
      error: new Error("expired: private-code"),
    }),
  };
  for (const query of ["?code=expired", ""]) {
    const route = await completeAuthCallback(callback(query), auth);
    assert.match(route, /^\/login\?error=/);
    assert.doesNotMatch(route, /private-code/);
  }
});

test("공급자가 로그인을 취소하면 코드를 교환하지 않는다", async () => {
  let exchangeCalls = 0;
  const auth = {
    async exchangeCodeForSession() {
      exchangeCalls++;
      return { data: { session: null }, error: null };
    },
  };
  const route = await completeAuthCallback(callback("?code=unused#error=access_denied"), auth);
  assert.match(decodeURIComponent(route), /로그인이 취소/);
  assert.equal(exchangeCalls, 0);
});
```


### 10-2. 배포 주소의 직접 접근 설정

/auth/callback 같은 직접 접근을 index.html에 연결합니다.

**파일:** `vercel.json` — 프로젝트 루트를 기준으로 작성합니다. 파일이 없으면 상위 폴더와 파일을 만들고, 이미 작성한 파일이면 아래 전체 내용으로 교체합니다.



<!-- lab:file step="10" path="vercel.json" -->
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```


### 10-3. 전체 검사

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

**정상 결과:** 타입·린트·빌드 성공, 콜백 8개 통과입니다. 실제 공급자 로그인·원격 DB는 화면 확인 결과도 기록합니다.

| 상태 | 새로고침·로그아웃의 동작 |
| --- | --- |
| SDK session | 새로고침 후 복원, 로그아웃은 현재 세션 갱신 자격 철회·보관 정리 요청 |
| Context user | 메모리 값이므로 새로고침 뒤 /me로 다시 확인 |
| React Query 캐시 | 계정 전환·로그아웃 시 이전 조회 결과 정리 |
| 서버 DB | 맛집·제보·프로필 보존 |
| 좋아요 LocalStorage | 해당 브라우저에서 보존 |

이미 발급한 액세스 토큰은 로그아웃 직후에도 만료 전까지 유효할 수 있습니다. 캐시 삭제는 서버 행이나 토큰 삭제와 다릅니다.

### 10-4. GitHub 저장소 반영

GitHub에 본인 소유의 빈 pwd-week8-client 저장소를 만듭니다. 생성 폼의 README·라이선스·gitignore는 추가하지 않습니다. YOUR_GITHUB_ID를 본인 아이디로 바꿉니다. 이미 연결했다면 remote 추가 대신 git remote -v로 확인합니다.

```bash
git init
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_ID/pwd-week8-client.git
git status
```

.env.local·node_modules·dist가 추적되지 않는지 확인합니다. 소스·설정·테스트·.env.example·README·package-lock.json을 반영합니다.

```bash
git add .
git commit -m "Complete Foodmap client"
git push -u origin main
```

### 10-5. Vercel 배포

1. Vercel Add New → Project에서 본인 GitHub 저장소를 Import합니다.
2. Framework Vite, Root Directory는 package.json이 있는 루트, Install npm ci --include=dev, Build npm run build, Output dist, Node 24.x로 설정합니다.
3. 환경변수 VITE_API_BASE_URL은 본인 Render의 HTTPS 기본 주소입니다. /api를 붙이지 않습니다. Supabase 두 변수도 같은 프로젝트 값으로 등록합니다.
4. Deploy 후 Ready·빌드 로그를 확인합니다. 환경변수 변경 후 Redeploy해야 새 빌드에 반영됩니다.
5. 서버 CLIENT_URL에 Vercel origin을 등록합니다. Supabase Site URL은 배포 origin, Redirect URLs에는 배포 origin/auth/callback을 추가합니다. Google origin·네이버 서비스 URL도 배포 주소로 갱신하고 공급자 콜백은 Supabase 주소를 사용합니다.
6. 배포에서 공개 조회·세 방식 로그인·프로필·일반 제보·관리자 CRUD와 승인·새로고침·로그아웃·계정 전환을 확인합니다. Network API 대상이 본인 Render인지 확인합니다.

### 10-6. 개발 서버 종료

본인이 실행한 클라이언트·서버 터미널에서 각각 Ctrl+C로 종료합니다. 다른 사람의 프로세스는 종료하지 않습니다. Windows PowerShell에서 본인 검사 포트의 Listen 행이 없어야 합니다.

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173,3000 -ErrorAction SilentlyContinue
```

macOS·Linux는 lsof -iTCP:5173 -sTCP:LISTEN과 3000번을 확인합니다.

## 문제 해결

| 증상 | 확인 위치·조치 |
| --- | --- |
| package.json 없음 | 터미널이 프로젝트 루트인지 확인 |
| import 파일 없음 | 해당 절의 전체 파일·확장자·대소문자·경로 |
| 패키지 없음 | package 저장 후 npm install·lock 동기화 |
| API 주소 오류 | .env.local 기본 주소·Vite 재시작 |
| CORS | 서버 CLIENT_URL·Authorization 허용 |
| 가입 Database error | profiles 생성 트리거·필수 값·권한 |
| /me 401 | 같은 Supabase 프로젝트·session·Bearer |
| /me 403 | 같은 UUID의 profiles·is_active |
| 관리자 403 | user_type·활성 상태 |
| 수정 후 예전 값 | 저장 성공·queryKey·invalidateQueries |
| 사용자 목록 비어 있음 | data.users와 서비스 반환값 |
| 무한 로딩 | /me 완료·Context finally·구독·예약 처리 |
| 이전 계정 정보 남음 | 캐시 정리·generation 검사 |
| 소셜 비활성 | 실제 설정·/api/auth/providers |
| 설정 조회 실패 | 서버·상태 API·재시도 |
| 배포 콜백 404 | rewrite·배포 커밋·Redirect URLs |
| 확인 메일 오류 | Email 설정·SMTP 수신/발송 조건 |

실행한 명령·URL, 예상 결과, 실제 오류 문구와 확인한 파일을 함께 기록합니다.

## 제출

- 클라이언트·서버 GitHub URL과 구현 커밋
- Vercel URL·Render API URL
