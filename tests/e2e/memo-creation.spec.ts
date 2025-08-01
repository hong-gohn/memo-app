import { test, expect } from '@playwright/test';

// 테스트 전 초기 설정
test.describe('메모 생성 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');
  });

  test('새 메모 생성 - 정상 케이스', async ({ page }) => {
    // 초기 메모 개수 확인
    const initialCountText = await page.textContent('text=총');
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // "새 메모" 버튼 클릭
    await page.click('button:has-text("새 메모")');
    
    // 메모 작성 모달이 열렸는지 확인
    await expect(page.locator('text=새 메모 작성')).toBeVisible();

    // 제목 입력
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '테스트 메모');

    // 카테고리 선택 (업무)
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '업무');

    // 내용 입력
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill(`이것은 테스트 메모입니다.

## 테스트 항목
- 메모 생성 기능
- **중요한** 내용
- \`코드 예시\``);

    // 태그 추가
    await page.fill('input[placeholder*="태그"], textbox:near(text="태그")', '테스트');
    await page.press('input[placeholder*="태그"], textbox:near(text="태그")', 'Enter');
    
    // 태그가 추가되었는지 확인
    await expect(page.locator('text=#테스트')).toBeVisible();

    // 추가 태그
    await page.fill('input[placeholder*="태그"], textbox:near(text="태그")', '자동화');
    await page.click('button:has-text("추가")');
    
    // 저장하기 버튼 클릭
    await page.click('button:has-text("저장하기")');

    // 모달이 닫히고 새 메모가 목록에 추가되었는지 확인
    await expect(page.locator('text=새 메모 작성')).not.toBeVisible();
    await expect(page.locator('h3:has-text("테스트 메모")')).toBeVisible();

    // 메모 개수가 증가했는지 확인
    const newCountText = await page.textContent('text=총');
    const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0');
    expect(newCount).toBe(initialCount + 1);

    // 업무 카테고리 개수 증가 확인
    await expect(page.locator('text=업무').first()).toBeVisible();
    
    // 태그가 메모에 표시되는지 확인
    await expect(page.locator('text=#테스트')).toBeVisible();
    await expect(page.locator('text=#자동화')).toBeVisible();
  });

  test('필수 필드 누락 - 제목 없음', async ({ page }) => {
    // "새 메모" 버튼 클릭
    await page.click('button:has-text("새 메모")');
    
    // 내용만 입력 (제목은 비워둠)
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('내용만 있는 메모');

    // 저장하기 버튼 클릭
    await page.click('button:has-text("저장하기")');

    // 유효성 검사 메시지 또는 모달이 닫히지 않음을 확인
    // (실제 앱의 동작에 따라 조정 필요)
    await expect(page.locator('text=새 메모 작성')).toBeVisible();
  });

  test('필수 필드 누락 - 내용 없음', async ({ page }) => {
    // "새 메모" 버튼 클릭
    await page.click('button:has-text("새 메모")');
    
    // 제목만 입력 (내용은 비워둠)
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '제목만 있는 메모');

    // 저장하기 버튼 클릭
    await page.click('button:has-text("저장하기")');

    // 유효성 검사 메시지 또는 모달이 닫히지 않음을 확인
    await expect(page.locator('text=새 메모 작성')).toBeVisible();
  });

  test('취소 기능', async ({ page }) => {
    // 초기 메모 개수 확인
    const initialCountText = await page.textContent('text=총');
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // "새 메모" 버튼 클릭
    await page.click('button:has-text("새 메모")');
    
    // 모든 필드에 데이터 입력
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '취소될 메모');
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('이 메모는 저장되지 않습니다.');

    // 취소 버튼 클릭
    await page.click('button:has-text("취소")');

    // 모달이 닫히고 데이터가 저장되지 않았는지 확인
    await expect(page.locator('text=새 메모 작성')).not.toBeVisible();
    await expect(page.locator('h3:has-text("취소될 메모")')).not.toBeVisible();

    // 메모 개수가 변하지 않았는지 확인
    const finalCountText = await page.textContent('text=총');
    const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount);
  });

  test('다양한 카테고리로 메모 생성', async ({ page }) => {
    const categories = ['개인', '업무', '학습', '아이디어', '기타'];
    
    for (const category of categories) {
      // "새 메모" 버튼 클릭
      await page.click('button:has-text("새 메모")');
      
      // 각 카테고리로 메모 생성
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', `${category} 테스트 메모`);
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', category);
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill(`${category} 카테고리 테스트 내용`);
      
      // 저장
      await page.click('button:has-text("저장하기")');
      
      // 메모가 생성되었는지 확인
      await expect(page.locator(`h3:has-text("${category} 테스트 메모")`)).toBeVisible();
      
      // 잠시 대기 (다음 테스트를 위해)
      await page.waitForTimeout(500);
    }
  });
});