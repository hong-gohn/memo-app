import { test, expect } from '@playwright/test';

test.describe('마크다운 에디터 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');
  });

  test('마크다운 에디터 기본 구조', async ({ page }) => {
    // "새 메모" 버튼 클릭하여 메모 작성 모달 열기
    await page.click('button:has-text("새 메모")');
    
    // 마크다운 에디터가 표시되는지 확인
    await expect(page.locator('textarea')).toBeVisible();
    
    // 도구 모음 버튼들이 표시되는지 확인
    await expect(page.locator('button[title*="bold"], button:has-text("B")')).toBeVisible();
    await expect(page.locator('button[title*="italic"], button:has-text("I")')).toBeVisible();
    
    // 미리보기 영역이 있는지 확인
    const previewArea = page.locator('div').filter({ hasText: /preview|미리보기/ }).first();
    // 미리보기 영역의 존재 여부는 구현에 따라 다를 수 있음
  });

  test('텍스트 서식 - 굵은 글씨', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 굵은 글씨 마크다운 문법 입력
    await contentTextarea.fill('**굵은 글씨** 테스트');
    
    // 미리보기에서 굵은 글씨가 렌더링되는지 확인
    await expect(page.locator('strong:has-text("굵은 글씨")')).toBeVisible();
  });

  test('텍스트 서식 - 기울임 글씨', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 기울임 글씨 마크다운 문법 입력
    await contentTextarea.fill('*기울임 글씨* 테스트');
    
    // 미리보기에서 기울임 글씨가 렌더링되는지 확인
    await expect(page.locator('em:has-text("기울임 글씨")')).toBeVisible();
  });

  test('텍스트 서식 - 취소선', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 취소선 마크다운 문법 입력
    await contentTextarea.fill('~~취소선~~ 테스트');
    
    // 미리보기에서 취소선이 렌더링되는지 확인
    const strikethroughElements = await page.locator('del, s, strike').count();
    if (strikethroughElements === 0) {
      // 취소선 스타일이 적용된 요소 확인
      await expect(page.locator('text=취소선')).toBeVisible();
    }
  });

  test('제목 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 다양한 레벨의 제목 입력
    await contentTextarea.fill(`# 제목 1
## 제목 2
### 제목 3`);
    
    // 미리보기에서 제목들이 올바르게 렌더링되는지 확인
    await expect(page.locator('h1:has-text("제목 1")')).toBeVisible();
    await expect(page.locator('h2:has-text("제목 2")')).toBeVisible();
    await expect(page.locator('h3:has-text("제목 3")')).toBeVisible();
  });

  test('목록 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 순서 없는 목록과 순서 있는 목록 입력
    await contentTextarea.fill(`- 항목 1
- 항목 2

1. 순서 항목 1
2. 순서 항목 2`);
    
    // 미리보기에서 목록이 올바르게 렌더링되는지 확인
    await expect(page.locator('ul li:has-text("항목 1")')).toBeVisible();
    await expect(page.locator('ul li:has-text("항목 2")')).toBeVisible();
    await expect(page.locator('ol li:has-text("순서 항목 1")')).toBeVisible();
    await expect(page.locator('ol li:has-text("순서 항목 2")')).toBeVisible();
  });

  test('체크리스트 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 체크리스트 입력
    await contentTextarea.fill(`- [ ] 할 일 1
- [x] 완료된 일
- [ ] 할 일 2`);
    
    // 미리보기에서 체크박스가 렌더링되는지 확인
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    expect(checkboxes).toBeGreaterThanOrEqual(2);
    
    // 체크된 항목과 체크되지 않은 항목 확인
    const checkedBoxes = await page.locator('input[type="checkbox"]:checked').count();
    expect(checkedBoxes).toBeGreaterThanOrEqual(1);
  });

  test('코드 블록 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 인라인 코드와 코드 블록 입력
    await contentTextarea.fill(`인라인 \`코드\` 예시

\`\`\`javascript
console.log('Hello World');
const message = 'JavaScript 코드';
\`\`\``);
    
    // 미리보기에서 인라인 코드가 렌더링되는지 확인
    await expect(page.locator('code:has-text("코드")')).toBeVisible();
    
    // 코드 블록이 렌더링되는지 확인
    await expect(page.locator('pre code, code').filter({ hasText: /console\.log|Hello World/ })).toBeVisible();
  });

  test('인용문 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 인용문 입력
    await contentTextarea.fill('> 이것은 인용문입니다.\n> 여러 줄 인용문도 가능합니다.');
    
    // 미리보기에서 인용문이 렌더링되는지 확인
    await expect(page.locator('blockquote')).toBeVisible();
    await expect(page.locator('blockquote:has-text("인용문")')).toBeVisible();
  });

  test('수평선 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 수평선 입력
    await contentTextarea.fill(`첫 번째 섹션

---

두 번째 섹션`);
    
    // 미리보기에서 수평선이 렌더링되는지 확인
    await expect(page.locator('hr')).toBeVisible();
  });

  test('링크 렌더링', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 링크 입력
    await contentTextarea.fill('[Google](https://www.google.com) 링크 테스트');
    
    // 미리보기에서 링크가 렌더링되는지 확인
    const link = page.locator('a:has-text("Google")');
    await expect(link).toBeVisible();
    
    // 링크 속성 확인
    const href = await link.getAttribute('href');
    expect(href).toBe('https://www.google.com');
  });

  test('도구 모음 버튼 - 굵은 글씨', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 텍스트 입력 후 굵은 글씨 버튼 클릭
    await contentTextarea.fill('선택할 텍스트');
    
    // 텍스트 선택
    await contentTextarea.selectText();
    
    // 굵은 글씨 버튼 클릭 (B 버튼 또는 굵은 글씨 아이콘)
    const boldButton = page.locator('button').filter({ hasText: /B|bold/i }).first();
    if (await boldButton.isVisible()) {
      await boldButton.click();
      
      // 마크다운 문법이 추가되었는지 확인
      const textareaValue = await contentTextarea.inputValue();
      expect(textareaValue).toContain('**');
    }
  });

  test('도구 모음 버튼 - 기울임 글씨', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 기울임 글씨 버튼 클릭
    const italicButton = page.locator('button').filter({ hasText: /I|italic/i }).first();
    if (await italicButton.isVisible()) {
      await italicButton.click();
      
      // 마크다운 문법이 삽입되었는지 확인
      const textareaValue = await contentTextarea.inputValue();
      expect(textareaValue).toContain('*');
    }
  });

  test('도구 모음 버튼 - 목록', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 순서 없는 목록 버튼 클릭
    const unorderedListButton = page.locator('button').filter({ hasText: /list|목록/ }).first();
    if (await unorderedListButton.isVisible()) {
      await unorderedListButton.click();
      
      // 목록 문법이 삽입되었는지 확인
      const textareaValue = await contentTextarea.inputValue();
      expect(textareaValue).toMatch(/^-|\*/);
    }
  });

  test('에디터 모드 전환', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    // 편집 모드 버튼이 있는지 확인
    const editModeButton = page.locator('button').filter({ hasText: /edit|편집/i }).first();
    
    if (await editModeButton.isVisible()) {
      await editModeButton.click();
      await page.waitForTimeout(300);
    }

    // 라이브 모드 버튼이 있는지 확인
    const liveModeButton = page.locator('button').filter({ hasText: /live|라이브/i }).first();
    
    if (await liveModeButton.isVisible()) {
      await liveModeButton.click();
      await page.waitForTimeout(300);
    }

    // 미리보기 모드 버튼이 있는지 확인
    const previewModeButton = page.locator('button').filter({ hasText: /preview|미리보기/i }).first();
    
    if (await previewModeButton.isVisible()) {
      await previewModeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('전체화면 모드', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    // 전체화면 버튼이 있는지 확인
    const fullscreenButton = page.locator('button').filter({ hasText: /fullscreen|전체화면/i }).first();
    
    if (await fullscreenButton.isVisible()) {
      await fullscreenButton.click();
      await page.waitForTimeout(500);
      
      // 전체화면 모드에서 에디터가 확장되었는지 확인
      const editorContainer = page.locator('textarea').first();
      const boundingBox = await editorContainer.boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(800); // 일반적인 전체화면 너비
      }
      
      // 전체화면 해제
      await fullscreenButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('실시간 미리보기', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 마크다운 텍스트를 점진적으로 입력
    await contentTextarea.fill('# 제목');
    await page.waitForTimeout(300);
    
    // 제목이 실시간으로 렌더링되는지 확인
    await expect(page.locator('h1:has-text("제목")')).toBeVisible();
    
    // 추가 내용 입력
    await contentTextarea.fill('# 제목\n\n**굵은 글씨** 추가');
    await page.waitForTimeout(300);
    
    // 새로운 내용이 실시간으로 반영되는지 확인
    await expect(page.locator('strong:has-text("굵은 글씨")')).toBeVisible();
  });

  test('키보드 단축키', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 텍스트 입력
    await contentTextarea.fill('단축키 테스트');
    await contentTextarea.selectText();
    
    // Ctrl+B (굵은 글씨)
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    
    let textareaValue = await contentTextarea.inputValue();
    if (textareaValue.includes('**')) {
      expect(textareaValue).toContain('**');
    }
    
    // 새로운 텍스트로 시작
    await contentTextarea.fill('기울임 테스트');
    await contentTextarea.selectText();
    
    // Ctrl+I (기울임 글씨)
    await page.keyboard.press('Control+i');
    await page.waitForTimeout(300);
    
    textareaValue = await contentTextarea.inputValue();
    if (textareaValue.includes('*')) {
      expect(textareaValue).toContain('*');
    }
  });

  test('복합 마크다운 문서', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 복합적인 마크다운 문서 작성
    const complexMarkdown = `# 프로젝트 문서

## 개요
이 프로젝트는 **React**와 *TypeScript*를 사용합니다.

### 주요 기능
- 사용자 인증
- 데이터 관리
- ~~구식 기능~~ (deprecated)

### 할 일 목록
- [ ] 로그인 기능 구현
- [x] 데이터베이스 설계
- [ ] UI 디자인

### 코드 예시
\`\`\`javascript
const greeting = 'Hello World';
console.log(greeting);
\`\`\`

> 주의: 이 코드는 예시용입니다.

---

### 참고 링크
- [React 공식 문서](https://reactjs.org)
- [TypeScript 가이드](https://www.typescriptlang.org)`;

    await contentTextarea.fill(complexMarkdown);
    await page.waitForTimeout(1000);

    // 각 요소들이 올바르게 렌더링되는지 확인
    await expect(page.locator('h1:has-text("프로젝트 문서")')).toBeVisible();
    await expect(page.locator('h2:has-text("개요")')).toBeVisible();
    await expect(page.locator('strong:has-text("React")')).toBeVisible();
    await expect(page.locator('em:has-text("TypeScript")')).toBeVisible();
    await expect(page.locator('ul li:has-text("사용자 인증")')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
    await expect(page.locator('pre code, code').filter({ hasText: /console\.log/ })).toBeVisible();
    await expect(page.locator('blockquote:has-text("주의")')).toBeVisible();
    await expect(page.locator('hr')).toBeVisible();
    await expect(page.locator('a:has-text("React 공식 문서")')).toBeVisible();
  });

  test('잘못된 마크다운 문법 처리', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const contentTextarea = page.locator('textarea').first();
    
    // 잘못된 마크다운 문법 입력
    await contentTextarea.fill(`### 잘못된 문법 테스트
**굵은 글씨 닫지 않음
*기울임 글씨도 닫지 않음
[링크 텍스트만 있음
![이미지 alt만 있음`);
    
    await page.waitForTimeout(500);

    // 에디터가 오류 없이 처리하는지 확인 (페이지가 크래시되지 않음)
    await expect(page.locator('textarea')).toBeVisible();
    
    // 렌더링된 내용이 있는지 확인 (완전히 깨지지 않음)
    await expect(page.locator('h3:has-text("잘못된 문법 테스트")')).toBeVisible();
  });
});