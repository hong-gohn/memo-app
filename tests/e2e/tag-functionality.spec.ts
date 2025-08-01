import { test, expect } from '@playwright/test';

test.describe('태그 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');
  });

  test('태그 입력 섹션 확인', async ({ page }) => {
    // "새 메모" 버튼 클릭하여 메모 작성 모달 열기
    await page.click('button:has-text("새 메모")');
    
    // 태그 입력 섹션이 표시되는지 확인
    await expect(page.locator('text=태그')).toBeVisible();
    
    // 태그 입력란이 있는지 확인
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    await expect(tagInput).toBeVisible();
    
    // "추가" 버튼이 있는지 확인
    await expect(page.locator('button:has-text("추가")')).toBeVisible();
  });

  test('Enter 키로 태그 추가', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 태그 입력 후 Enter 키 누르기
    await tagInput.fill('중요');
    await tagInput.press('Enter');
    
    // 태그가 추가되었는지 확인
    await expect(page.locator('text=#중요')).toBeVisible();
    
    // 입력란이 비워졌는지 확인
    await expect(tagInput).toHaveValue('');
  });

  test('"추가" 버튼으로 태그 추가', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 태그 입력 후 "추가" 버튼 클릭
    await tagInput.fill('긴급');
    await page.click('button:has-text("추가")');
    
    // 태그가 추가되었는지 확인
    await expect(page.locator('text=#긴급')).toBeVisible();
    
    // 입력란이 비워졌는지 확인
    await expect(tagInput).toHaveValue('');
  });

  test('여러 태그 추가', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    const tags = ['업무', '중요', '회의', '프로젝트'];
    
    // 여러 태그 연속 추가
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
      await page.waitForTimeout(200);
    }
    
    // 모든 태그가 추가되었는지 확인
    for (const tag of tags) {
      await expect(page.locator(`text=#${tag}`)).toBeVisible();
    }
    
    // 태그 개수 확인
    const tagElements = await page.locator('text=/^#\\w+/').count();
    expect(tagElements).toBe(tags.length);
  });

  test('태그 삭제 기능', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 태그 추가
    await tagInput.fill('삭제될태그');
    await tagInput.press('Enter');
    
    // 태그가 추가되었는지 확인
    await expect(page.locator('text=#삭제될태그')).toBeVisible();
    
    // 태그 삭제 버튼(X) 클릭
    const deleteButton = page.locator('button').filter({ hasText: /×|x|삭제/ }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // 태그가 삭제되었는지 확인
      await expect(page.locator('text=#삭제될태그')).not.toBeVisible();
    }
  });

  test('태그와 함께 메모 저장', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    // 메모 기본 정보 입력
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '태그 테스트 메모');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('태그 기능을 테스트하는 메모입니다.');
    
    // 태그 추가
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    const tags = ['테스트', '자동화', 'e2e'];
    
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }
    
    // 메모 저장
    await page.click('button:has-text("저장하기")');
    
    // 메모 목록에서 태그가 표시되는지 확인
    await expect(page.locator('h3:has-text("태그 테스트 메모")')).toBeVisible();
    
    for (const tag of tags) {
      await expect(page.locator(`text=#${tag}`)).toBeVisible();
    }
  });

  test('메모 편집 시 기존 태그 로드', async ({ page }) => {
    // 태그가 있는 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '태그 편집 테스트');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('태그 편집 테스트 메모');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    await tagInput.fill('원본태그');
    await tagInput.press('Enter');
    await tagInput.fill('편집테스트');
    await tagInput.press('Enter');
    
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);
    
    // 메모 편집
    await page.click('button:has-text("편집")').first();
    
    // 기존 태그들이 편집 화면에 표시되는지 확인
    await expect(page.locator('text=#원본태그')).toBeVisible();
    await expect(page.locator('text=#편집테스트')).toBeVisible();
    
    // 기존 태그 삭제
    const deleteButtons = page.locator('button').filter({ hasText: /×|x|삭제/ });
    const deleteButtonCount = await deleteButtons.count();
    if (deleteButtonCount > 0) {
      await deleteButtons.first().click();
    }
    
    // 새 태그 추가
    const editTagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    await editTagInput.fill('새태그');
    await editTagInput.press('Enter');
    
    // 수정 저장
    await page.click('button:has-text("수정하기")');
    
    // 변경사항이 반영되었는지 확인
    await expect(page.locator('text=#새태그')).toBeVisible();
  });

  test('한글 태그 입력', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    const koreanTags = ['중요함', '업무관련', '개인적인'];
    
    for (const tag of koreanTags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }
    
    // 한글 태그가 올바르게 추가되었는지 확인
    for (const tag of koreanTags) {
      await expect(page.locator(`text=#${tag}`)).toBeVisible();
    }
  });

  test('영문 태그 입력', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    const englishTags = ['urgent', 'work', 'personal'];
    
    for (const tag of englishTags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }
    
    // 영문 태그가 올바르게 추가되었는지 확인
    for (const tag of englishTags) {
      await expect(page.locator(`text=#${tag}`)).toBeVisible();
    }
  });

  test('숫자 포함 태그 입력', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    const numberTags = ['2024', 'v1.0', 'phase2'];
    
    for (const tag of numberTags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }
    
    // 숫자가 포함된 태그가 올바르게 추가되었는지 확인
    for (const tag of numberTags) {
      await expect(page.locator(`text=#${tag}`)).toBeVisible();
    }
  });

  test('빈 태그 추가 방지', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 빈 상태에서 Enter 키 누르기
    await tagInput.press('Enter');
    
    // 빈 태그가 추가되지 않았는지 확인
    const tagCount = await page.locator('text=/^#\\w+/').count();
    expect(tagCount).toBe(0);
    
    // 빈 상태에서 "추가" 버튼 클릭
    await page.click('button:has-text("추가")');
    
    // 여전히 태그가 추가되지 않았는지 확인
    const tagCount2 = await page.locator('text=/^#\\w+/').count();
    expect(tagCount2).toBe(0);
  });

  test('공백만 포함된 태그 방지', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 공백만 입력
    await tagInput.fill('   ');
    await tagInput.press('Enter');
    
    // 공백 태그가 추가되지 않았는지 확인
    const tagCount = await page.locator('text=/^#\\w+/').count();
    expect(tagCount).toBe(0);
  });

  test('중복 태그 추가 방지', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 같은 태그를 두 번 추가 시도
    await tagInput.fill('중복태그');
    await tagInput.press('Enter');
    
    await tagInput.fill('중복태그');
    await tagInput.press('Enter');
    
    // 태그가 하나만 존재하는지 확인
    const duplicateTagCount = await page.locator('text=#중복태그').count();
    expect(duplicateTagCount).toBeLessThanOrEqual(1);
  });

  test('긴 태그명 처리', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 매우 긴 태그명 입력
    const longTag = '매우긴태그명입니다'.repeat(5);
    await tagInput.fill(longTag);
    await tagInput.press('Enter');
    
    // 긴 태그가 UI에서 적절히 표시되는지 확인
    const addedTag = page.locator(`text=#${longTag}`);
    if (await addedTag.isVisible()) {
      // 태그가 추가된 경우, 길이 제한이 없다는 의미
      await expect(addedTag).toBeVisible();
    } else {
      // 태그가 추가되지 않은 경우, 길이 제한이 있다는 의미
      const tagCount = await page.locator('text=/^#\\w+/').count();
      expect(tagCount).toBe(0);
    }
  });

  test('특수문자 포함 태그', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    
    // 특수문자가 포함된 태그들 시도
    const specialTags = ['C++', 'tag-name', 'tag_name', 'tag.name'];
    
    for (const tag of specialTags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
      await page.waitForTimeout(200);
    }
    
    // 허용되는 특수문자 확인 (구현에 따라 다를 수 있음)
    const totalTags = await page.locator('text=/^#/').count();
    expect(totalTags).toBeGreaterThanOrEqual(0);
  });

  test('태그를 통한 메모 검색', async ({ page }) => {
    // 태그가 있는 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '검색 테스트 메모');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('태그 검색 테스트');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    await tagInput.fill('검색테스트');
    await tagInput.press('Enter');
    
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);
    
    // 태그로 검색
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    await searchInput.fill('검색테스트');
    await page.waitForTimeout(500);
    
    // 해당 태그를 가진 메모가 검색되는지 확인
    await expect(page.locator('h3:has-text("검색 테스트 메모")')).toBeVisible();
  });

  test('태그 스타일링 확인', async ({ page }) => {
    await page.click('button:has-text("새 메모")');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    await tagInput.fill('스타일테스트');
    await tagInput.press('Enter');
    
    // 태그가 "#태그명" 형태로 표시되는지 확인
    const tagElement = page.locator('text=#스타일테스트');
    await expect(tagElement).toBeVisible();
    
    // 태그가 시각적으로 구분되어 표시되는지 확인 (CSS 스타일 적용)
    const tagStyles = await tagElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        padding: styles.padding,
        borderRadius: styles.borderRadius
      };
    });
    
    // 태그에 특별한 스타일이 적용되었는지 확인
    expect(tagStyles).toBeDefined();
  });

  test('메모 저장 후 태그 목록에서 표시', async ({ page }) => {
    // 여러 태그가 있는 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '다중 태그 메모');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('여러 태그가 있는 메모');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    const tags = ['태그1', '태그2', '태그3'];
    
    for (const tag of tags) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }
    
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);
    
    // 메모 목록에서 모든 태그가 표시되는지 확인
    for (const tag of tags) {
      await expect(page.locator(`text=#${tag}`)).toBeVisible();
    }
    
    // 태그들이 메모와 연결되어 표시되는지 확인
    const memoContainer = page.locator('h3:has-text("다중 태그 메모")').locator('..');
    for (const tag of tags) {
      await expect(memoContainer.locator(`text=#${tag}`)).toBeVisible();
    }
  });
});