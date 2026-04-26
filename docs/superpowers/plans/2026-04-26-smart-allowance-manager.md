# Smart Allowance Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5-6학년 학생이 용돈 사용 내역을 입력하고, 이번 주 카테고리별 소비 비율을 원그래프로 확인하며 자신의 소비를 평가하는 금융 교육 웹앱을 만든다.

**Architecture:** 빈 작업 폴더에서 Vite + React + TypeScript 단일 페이지 앱을 구성한다. 돈 기록, 주간 집계, localStorage 직렬화는 순수 함수와 작은 저장소 모듈로 분리하고, UI는 입력 폼, 영수증 목록, 원그래프, 주간 성찰 패널로 나눈다.

**Tech Stack:** Vite, React, TypeScript, Chart.js, react-chartjs-2, Vitest, Testing Library, localStorage, CSS modules or plain CSS.

---

## File Structure

- Create: `package.json` - scripts, dependencies, devDependencies.
- Create: `index.html` - Vite entry document with Korean title.
- Create: `vite.config.ts` - React plugin and Vitest/jsdom config.
- Create: `tsconfig.json`, `tsconfig.node.json` - TypeScript config using bundler resolution.
- Create: `src/main.tsx` - React bootstrap.
- Create: `src/App.tsx` - main app composition and state orchestration.
- Create: `src/App.css` - responsive classroom app layout and component styling.
- Create: `src/setupTests.ts` - Testing Library setup and Chart.js canvas guard.
- Create: `src/vite-env.d.ts` - Vite type declarations.
- Create: `src/lib/allowance.ts` - entry model, validation, weekly filtering, category summaries, reflection messages.
- Create: `src/lib/allowance.test.ts` - unit tests for money and chart data logic.
- Create: `src/lib/storage.ts` - safe localStorage load/save/clear helpers.
- Create: `src/lib/storage.test.ts` - localStorage persistence tests.
- Create: `src/data/categories.ts` - Korean category metadata and chart colors.
- Create: `src/components/EntryForm.tsx` - amount, item, category, date input form.
- Create: `src/components/ReceiptList.tsx` - receipt-style history with delete buttons.
- Create: `src/components/SpendingPieChart.tsx` - Chart.js pie chart plus accessible text summary.
- Create: `src/components/WeeklyInsight.tsx` - total, top category, math/economy reflection prompts.
- Create: `src/App.test.tsx` - user-flow tests for add, persist, delete, weekly chart summary, validation, live feedback.
- Create: `.gitignore` - ignore `node_modules`, `dist`, coverage, local env files.

---

### Task 1: Scaffold the Frontend Baseline

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `src/setupTests.ts`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git if needed**

Run:

```bash
git status || git init
```

Expected: existing git status is shown, or a new repository is initialized.

- [ ] **Step 2: Create the Vite React TypeScript baseline**

Write these script and dependency choices into `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "chart.js": "latest",
    "react": "latest",
    "react-chartjs-2": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@testing-library/user-event": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

Use the app title `우리 반 꼬마 CEO: 스마트 용돈 기입장` in `index.html`.

- [ ] **Step 3: Add a smoke-testable temporary app**

Set `src/App.tsx` to render the Korean app shell:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>우리 반 꼬마 CEO: 스마트 용돈 기입장</h1>
      <p>이번 주 용돈 사용을 입력하고 소비 비율을 살펴봅니다.</p>
    </main>
  );
}
```

- [ ] **Step 4: Install and verify the baseline**

Run:

```bash
npm install
npm test
npm run build
```

Expected: dependencies install, Vitest passes the smoke test, Vite produces `dist/`.

- [ ] **Step 5: Commit**

Run:

```bash
git add .
git commit -m "chore: scaffold smart allowance manager"
```

Expected: scaffold commit is created.

---

### Task 2: Implement Allowance Domain Logic

**Files:**
- Create: `src/data/categories.ts`
- Create: `src/lib/allowance.ts`
- Create: `src/lib/allowance.test.ts`

- [ ] **Step 1: Write failing unit tests**

Cover these cases in `src/lib/allowance.test.ts`:

```ts
import {
  createAllowanceEntry,
  filterEntriesForWeek,
  summarizeByCategory,
  getWeeklyInsight,
} from "./allowance";

test("normalizes entry amount to a positive integer won value", () => {
  const entry = createAllowanceEntry({
    item: "떡볶이",
    amount: "2500.9",
    categoryId: "snack",
    date: "2026-04-26",
  });

  expect(entry.amount).toBe(2500);
  expect(entry.item).toBe("떡볶이");
});

test("summarizes only the selected school week by category", () => {
  const entries = [
    createAllowanceEntry({ item: "떡볶이", amount: 3000, categoryId: "snack", date: "2026-04-20" }),
    createAllowanceEntry({ item: "연필", amount: 1000, categoryId: "school", date: "2026-04-21" }),
    createAllowanceEntry({ item: "지난주 간식", amount: 9000, categoryId: "snack", date: "2026-04-12" }),
  ];

  const weekEntries = filterEntriesForWeek(entries, new Date("2026-04-26T12:00:00+09:00"));
  const summary = summarizeByCategory(weekEntries);

  expect(summary).toEqual([
    expect.objectContaining({ categoryId: "snack", amount: 3000, percent: 75 }),
    expect.objectContaining({ categoryId: "school", amount: 1000, percent: 25 }),
  ]);
});

test("returns a reflection message for a dominant category", () => {
  const insight = getWeeklyInsight([
    createAllowanceEntry({ item: "간식1", amount: 6000, categoryId: "snack", date: "2026-04-21" }),
    createAllowanceEntry({ item: "저금", amount: 4000, categoryId: "saving", date: "2026-04-22" }),
  ]);

  expect(insight.topCategoryLabel).toBe("간식");
  expect(insight.message).toContain("60%");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/lib/allowance.test.ts
```

Expected: tests fail because the module does not exist.

- [ ] **Step 3: Implement category metadata and pure logic**

Create `src/data/categories.ts` with stable Korean categories:

```ts
export const CATEGORIES = [
  { id: "snack", label: "간식", color: "#f97316" },
  { id: "school", label: "학용품", color: "#2563eb" },
  { id: "transport", label: "교통", color: "#14b8a6" },
  { id: "hobby", label: "취미", color: "#a855f7" },
  { id: "gift", label: "선물", color: "#ec4899" },
  { id: "saving", label: "저금", color: "#22c55e" },
  { id: "other", label: "기타", color: "#64748b" }
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
```

Implement `src/lib/allowance.ts` with exported functions named in the tests. Use Monday through Sunday as the school-week range, floor decimal amounts, reject non-finite or non-positive amounts with `0`, and compute category percentages rounded to whole numbers.

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npm test -- src/lib/allowance.test.ts
git add src/data/categories.ts src/lib/allowance.ts src/lib/allowance.test.ts
git commit -m "feat: add allowance calculation logic"
```

Expected: allowance unit tests pass and the domain commit is created.

---

### Task 3: Add Safe Local Storage Persistence

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/storage.test.ts`

- [ ] **Step 1: Write failing storage tests**

Cover save, reload, malformed JSON, and incompatible records:

```ts
import { loadEntries, saveEntries, clearEntries } from "./storage";
import { createAllowanceEntry } from "./allowance";

beforeEach(() => localStorage.clear());

test("saves and loads allowance entries", () => {
  const entry = createAllowanceEntry({ item: "공책", amount: 1500, categoryId: "school", date: "2026-04-26" });
  saveEntries([entry]);

  expect(loadEntries()).toEqual([entry]);
});

test("falls back to empty list for malformed localStorage data", () => {
  localStorage.setItem("smart-allowance-manager.entries", "{broken");

  expect(loadEntries()).toEqual([]);
});

test("clears entries", () => {
  saveEntries([createAllowanceEntry({ item: "저금", amount: 2000, categoryId: "saving", date: "2026-04-26" })]);
  clearEntries();

  expect(loadEntries()).toEqual([]);
});
```

- [ ] **Step 2: Implement storage helpers**

Create `src/lib/storage.ts` with these exports:

```ts
export const STORAGE_KEY = "smart-allowance-manager.entries";
export function loadEntries(): AllowanceEntry[];
export function saveEntries(entries: AllowanceEntry[]): void;
export function clearEntries(): void;
```

Validate parsed records by checking `id`, `item`, `amount`, `categoryId`, `date`, and `createdAt`. Drop invalid records instead of throwing.

- [ ] **Step 3: Verify and commit**

Run:

```bash
npm test -- src/lib/storage.test.ts
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: persist allowance entries locally"
```

Expected: storage tests pass and local persistence is committed.

---

### Task 4: Build the Interactive Classroom UI

**Files:**
- Create: `src/components/EntryForm.tsx`
- Create: `src/components/ReceiptList.tsx`
- Create: `src/components/SpendingPieChart.tsx`
- Create: `src/components/WeeklyInsight.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing user-flow tests**

In `src/App.test.tsx`, simulate this exact flow:

```ts
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => localStorage.clear());

test("adds a receipt and updates the weekly category summary", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText("쓴 내용"), "떡볶이");
  await user.type(screen.getByLabelText("금액"), "3000");
  await user.selectOptions(screen.getByLabelText("분류"), "snack");
  await user.click(screen.getByRole("button", { name: "기록하기" }));

  expect(screen.getByText("떡볶이")).toBeInTheDocument();
  expect(screen.getByText("3,000원")).toBeInTheDocument();
  expect(screen.getByText("간식 100%")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("떡볶이 3,000원을 기록했습니다");
});

test("loads saved records after rerender", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<App />);

  await user.type(screen.getByLabelText("쓴 내용"), "연필");
  await user.type(screen.getByLabelText("금액"), "1000");
  await user.selectOptions(screen.getByLabelText("분류"), "school");
  await user.click(screen.getByRole("button", { name: "기록하기" }));
  unmount();

  render(<App />);
  expect(screen.getByText("연필")).toBeInTheDocument();
});
```

- [ ] **Step 2: Implement the form**

`EntryForm.tsx` should include labeled fields `쓴 내용`, `금액`, `분류`, `날짜`, a primary button `기록하기`, and inline validation text `금액은 1원 이상 입력하세요.` when the amount is invalid.

- [ ] **Step 3: Implement receipt and chart panels**

`ReceiptList.tsx` should render newest entries first in a receipt-style list with date, item, category label, amount, and `삭제` buttons. `SpendingPieChart.tsx` should render a Chart.js pie chart when there are entries and a quiet empty state `이번 주 기록이 아직 없습니다.` when there are none. Always render text summary rows such as `간식 60%` for accessibility and tests.

- [ ] **Step 4: Implement weekly insight**

`WeeklyInsight.tsx` should show:

```text
이번 주 사용한 돈: 4,000원
가장 큰 비율: 간식 75%
생각해 보기: 간식 비율이 높아요. 다음 주에는 저금이나 필요한 물건 계획을 먼저 세워 볼까요?
```

Use the actual computed total, top category, and percentage.

- [ ] **Step 5: Compose app state and persistence**

`App.tsx` should load entries on first render, save to localStorage after add/delete/clear, expose a hidden `role="status"` live region, and keep the first screen as the real app surface rather than a landing page.

- [ ] **Step 6: Verify UI tests and commit**

Run:

```bash
npm test -- src/App.test.tsx
git add src/App.tsx src/App.css src/App.test.tsx src/components
git commit -m "feat: build smart allowance app interface"
```

Expected: add, persistence, receipt, summary, and live-status tests pass.

---

### Task 5: Polish Responsive Design and Accessibility

**Files:**
- Modify: `src/App.css`
- Modify: `src/App.test.tsx`
- Modify: `src/components/SpendingPieChart.tsx`

- [ ] **Step 1: Add accessibility regression tests**

Extend `src/App.test.tsx` to assert that the chart region has an accessible name:

```ts
expect(screen.getByRole("region", { name: "이번 주 소비 비율 원그래프" })).toBeInTheDocument();
```

Add a validation test that an empty item name shows `내용을 입력하세요.` and does not create a receipt.

- [ ] **Step 2: Style the app for classroom use**

Use a calm but not one-note palette: warm paper background, dark ink text, blue action color, green saving accent, orange snack accent. Desktop layout should be two columns: left input and receipt, right chart and insight. Mobile layout should be one column in this order: form, chart, insight, receipt.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests and production build pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/App.css src/App.test.tsx src/components/SpendingPieChart.tsx
git commit -m "polish: improve allowance app accessibility and layout"
```

Expected: polish commit is created.

---

### Task 6: Browser Verification

**Files:**
- No source files unless defects are found during browser testing.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite serves the app on a local URL.

- [ ] **Step 2: Verify desktop workflow in the browser**

Use Browser plugin or Playwright fallback to check:

```text
1. Add "떡볶이 / 3000원 / 간식".
2. Add "연필 / 1000원 / 학용품".
3. Confirm receipt list contains both records.
4. Confirm text summary shows "간식 75%" and "학용품 25%".
5. Reload the page and confirm both records remain.
6. Delete "연필" and confirm the chart summary returns to "간식 100%".
```

- [ ] **Step 3: Verify mobile layout**

Use a 390px-wide viewport and confirm form, chart, insight, and receipt do not overlap and remain readable.

- [ ] **Step 4: Fix and commit browser-found defects**

If a defect is found, write a targeted test first, fix it, rerun `npm test && npm run build`, and commit with:

```bash
git add .
git commit -m "fix: address browser verification findings"
```

Expected: no uncommitted source changes remain except intentionally skipped local artifacts.

---

### Task 7: Optional GitHub Pages Release

**Files:**
- Modify: `vite.config.ts`
- Create: `.github/workflows/deploy-pages.yml`

- [ ] **Step 1: Configure Vite base**

Set Vite `base` to:

```ts
base: "/smart-allowance-manager/"
```

- [ ] **Step 2: Add Pages workflow**

Create a GitHub Actions workflow that runs `npm ci`, `npm test`, `npm run build`, uploads `dist`, and deploys to GitHub Pages.

- [ ] **Step 3: Verify deployment**

After pushing to `main`, confirm the public URL loads:

```text
https://wbmaker2.github.io/smart-allowance-manager/
```

Expected: the deployed app loads and localStorage works on the production origin.

---

## Self-Review

- Spec coverage: amount/category input, receipt-style history, localStorage persistence, Chart.js pie chart, weekly category ratio, Korean classroom framing, and achievement-standard reflection are covered by Tasks 2-6.
- Testing coverage: pure math, storage safety, main user flow, persistence after reload, validation, live feedback, and chart text summary are covered.
- Accessibility coverage: labels, validation messages, `role="status"`, chart region name, and text summary fallback are covered.
- Browser coverage: desktop workflow, reload persistence, deletion, and 390px mobile layout are covered.
- Deferred intentionally: account login, backend sync, CSV export, teacher dashboard, and multi-student aggregation are outside the first app scope.
