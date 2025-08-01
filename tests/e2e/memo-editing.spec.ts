import { test, expect } from '@playwright/test';

test.describe('메모 편집 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');

    // 테스트용 메모가 없다면 생성
    const memoExists = await page.locator('h3').first().isVisible().catch(() => false);
    if (!memoExists) {
      // 테스트용 메모 생성
      await page.click('button:has-text("새 메모")');
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '편집 테스트용 메모');
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill('원본 내용입니다.');
      await page.fill('input[placeholder*="태그"], textbox:near(text="태그")', '원본');
      await page.press('input[placeholder*="태그"], textbox:near(text="태그")', 'Enter');
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(500);
    }
  });

  test('메모 편집 - 정상 케이스', async ({ page }) => {
    // 첫 번째 메모의 편집 버튼 클릭
    await page.click('button:has-text("편집")').first();
    
    // 메모 편집 모달이 열렸는지 확인
    await expect(page.locator('text=메모 편집')).toBeVisible();

    // 기존 데이터가 로드되었는지 확인
    const titleInput = page.locator('input[placeholder*="제목"], textbox:near(text="제목")');
    await expect(titleInput).not.toHaveValue('');

    // 제목 수정
    await titleInput.fill('수정된 제목');

    // 카테고리 변경
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '업무');

    // 내용 수정
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill(`수정된 내용입니다.

## 추가된 섹션
- 새로운 항목 1
- 새로운 항목 2

**강조된 텍스트**`);

    // 기존 태그 삭제 (X 버튼 클릭)
    const existingTagDeleteButton = page.locator('button').filter({ hasText: '×' }).first();
    if (await existingTagDeleteButton.isVisible()) {
      await existingTagDeleteButton.click();
    }

    // 새 태그 추가
    await page.fill('input[placeholder*="태그"], textbox:near(text="태그")', '수정됨');
    await page.press('input[placeholder*="태그"], textbox:near(text="태그")', 'Enter');
    
    await page.fill('input[placeholder*="태그"], textbox:near(text="태그")', '업데이트');
    await page.click('button:has-text("추가")');

    // 수정하기 버튼 클릭
    await page.click('button:has-text("수정하기")');

    // 모달이 닫히고 변경사항이 반영되었는지 확인
    await expect(page.locator('text=메모 편집')).not.toBeVisible();
    await expect(page.locator('h3:has-text("수정된 제목")')).toBeVisible();

    // 카테고리가 변경되었는지 확인
    await expect(page.locator('text=업무').first()).toBeVisible();

    // 새 태그가 표시되는지 확인
    await expect(page.locator('text=#수정됨')).toBeVisible();
    await expect(page.locator('text=#업데이트')).toBeVisible();

    // 수정 시간이 업데이트되었는지 확인 (현재 시간 근처)
    const timeElement = page.locator('text=/\d{4}년 \d{1,2}월 \d{1,2}일/').first();
    await expect(timeElement).toBeVisible();
  });

  test('메모 편집 - 필수 필드 삭제', async ({ page }) => {
    // 첫 번째 메모의 편집 버튼 클릭
    await page.click('button:has-text("편집")').first();
    
    // 제목을 모두 삭제
    const titleInput = page.locator('input[placeholder*="제목"], textbox:near(text="제목")');
    await titleInput.fill('');

    // 수정하기 버튼 클릭
    await page.click('button:has-text("수정하기")');

    // 유효성 검사로 인해 모달이 닫히지 않았는지 확인
    await expect(page.locator('text=메모 편집')).toBeVisible();
  });

  test('메모 편집 - 내용 필드 삭제', async ({ page }) => {
    // 첫 번째 메모의 편집 버튼 클릭
    await page.click('button:has-text("편집")').first();
    
    // 내용을 모두 삭제
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('');

    // 수정하기 버튼 클릭
    await page.click('button:has-text("수정하기")');

    // 유효성 검사로 인해 모달이 닫히지 않았는지 확인
    await expect(page.locator('text=메모 편집')).toBeVisible();
  });

  test('메모 편집 - 취소 기능', async ({ page }) => {
    // 편집 전 제목 저장
    const originalTitle = await page.locator('h3').first().textContent();

    // 첫 번째 메모의 편집 버튼 클릭
    await page.click('button:has-text("편집")').first();
    
    // 모든 필드 수정
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '취소될 수정');
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '기타');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('이 변경사항은 저장되지 않습니다.');

    // 취소 버튼 클릭
    await page.click('button:has-text("취소")');

    // 모달이 닫히고 변경사항이 적용되지 않았는지 확인
    await expect(page.locator('text=메모 편집')).not.toBeVisible();
    await expect(page.locator('h3:has-text("취소될 수정")')).not.toBeVisible();
    
    // 원래 제목이 유지되었는지 확인
    if (originalTitle) {
      await expect(page.locator(`h3:has-text("${originalTitle.trim()}")`)).toBeVisible();
    }
  });

  test('카테고리 변경으로 인한 개수 업데이트', async ({ page }) => {
    // 개인 카테고리 개수 확인
    const personalCountBefore = await page.textContent('text=개인');
    const personalBefore = parseInt(personalCountBefore?.match(/\((\d+)\)/)?.[1] || '0');

    // 업무 카테고리 개수 확인
    const workCountBefore = await page.textContent('text=업무');
    const workBefore = parseInt(workCountBefore?.match(/\((\d+)\)/)?.[1] || '0');

    // 개인 카테고리 메모를 업무로 변경
    // 먼저 개인 카테고리 메모가 있는지 확인하고, 없으면 생성
    await page.selectOption('select:near(text="전체 카테고리"), combobox', '개인');
    const personalMemoExists = await page.locator('h3').first().isVisible().catch(() => false);
    
    if (!personalMemoExists) {
      // 개인 카테고리 메모 생성
      await page.selectOption('select:near(text="개인"), combobox', '전체 카테고리');
      await page.click('button:has-text("새 메모")');
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '카테고리 변경 테스트');
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill('카테고리 변경 테스트용 메모');
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(500);
      
      // 개인 카테고리로 필터링
      await page.selectOption('select:near(text="전체 카테고리"), combobox', '개인');
    }

    // 개인 카테고리의 첫 번째 메모 편집
    await page.click('button:has-text("편집")').first();
    
    // 카테고리를 업무로 변경
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '업무');
    await page.click('button:has-text("수정하기")');

    // 필터 초기화하여 전체 메모 보기
    await page.selectOption('select:near(text="개인"), combobox', '전체 카테고리');

    // 카테고리별 개수 변화 확인
    await page.waitForTimeout(1000); // 카운트 업데이트 대기

    const personalCountAfter = await page.textContent('text=개인');
    const personalAfter = parseInt(personalCountAfter?.match(/\((\d+)\)/)?.[1] || '0');

    const workCountAfter = await page.textContent('text=업무');
    const workAfter = parseInt(workCountAfter?.match(/\((\d+)\)/)?.[1] || '0');

    // 개인 카테고리는 1 감소, 업무 카테고리는 1 증가해야 함
    expect(personalAfter).toBe(Math.max(0, personalBefore - 1));
    expect(workAfter).toBe(workBefore + 1);
  });

  test('마크다운 내용 편집 및 미리보기', async ({ page }) => {
    // 첫 번째 메모의 편집 버튼 클릭
    await page.click('button:has-text("편집")').first();
    
    // 마크다운 내용 입력
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill(`# 제목 1

## 제목 2

**굵은 글씨**와 *기울임 글씨*

- 순서 없는 목록 1
- 순서 없는 목록 2

1. 순서 있는 목록 1
2. 순서 있는 목록 2

\`인라인 코드\`

\`\`\`javascript
console.log('Hello World');
\`\`\`

> 인용문입니다.

---

[링크 예시](https://example.com)`);

    // 미리보기에서 마크다운이 렌더링되는지 확인
    await expect(page.locator('h1:has-text("제목 1")')).toBeVisible();
    await expect(page.locator('h2:has-text("제목 2")')).toBeVisible();
    await expect(page.locator('strong:has-text("굵은 글씨")')).toBeVisible();
    await expect(page.locator('em:has-text("기울임 글씨")')).toBeVisible();
    await expect(page.locator('code:has-text("인라인 코드")')).toBeVisible();

    // 저장
    await page.click('button:has-text("수정하기")');

    // 모달이 닫혔는지 확인
    await expect(page.locator('text=메모 편집')).not.toBeVisible();
  });
});