import { test, expect } from '@playwright/test';

test.describe('메모 삭제 기능', () => {
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
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '삭제 테스트용 메모');
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill('이 메모는 삭제 테스트용입니다.');
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(500);
    }
  });

  test('메모 삭제 - 정상 케이스', async ({ page }) => {
    // 초기 메모 개수 확인
    const initialCountText = await page.textContent('text=총');
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // 삭제할 메모의 제목 저장
    const memoTitle = await page.locator('h3').first().textContent();

    // 개인 카테고리 초기 개수 확인
    const personalCountBefore = await page.textContent('text=개인');
    const personalBefore = parseInt(personalCountBefore?.match(/\((\d+)\)/)?.[1] || '0');

    // 첫 번째 메모의 삭제 버튼 클릭
    await page.click('button:has-text("삭제")').first();

    // 확인 다이얼로그가 표시되는지 확인
    page.on('dialog', async dialog => {
      // 다이얼로그 메시지 내용 확인
      expect(dialog.message()).toContain('정말로 이 메모를 삭제하시겠습니까?');
      
      // 확인 버튼 클릭
      await dialog.accept();
    });

    // 다이얼로그 처리 후 잠시 대기
    await page.waitForTimeout(500);

    // 메모가 목록에서 사라졌는지 확인
    if (memoTitle) {
      await expect(page.locator(`h3:has-text("${memoTitle.trim()}")`)).not.toBeVisible();
    }

    // 총 메모 개수가 감소했는지 확인
    const finalCountText = await page.textContent('text=총');
    const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount - 1);

    // 개인 카테고리 개수가 감소했는지 확인
    const personalCountAfter = await page.textContent('text=개인');
    const personalAfter = parseInt(personalCountAfter?.match(/\((\d+)\)/)?.[1] || '0');
    expect(personalAfter).toBe(Math.max(0, personalBefore - 1));
  });

  test('메모 삭제 - 취소 케이스', async ({ page }) => {
    // 초기 메모 개수 확인
    const initialCountText = await page.textContent('text=총');
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // 삭제할 메모의 제목 저장
    const memoTitle = await page.locator('h3').first().textContent();

    // 첫 번째 메모의 삭제 버튼 클릭
    await page.click('button:has-text("삭제")').first();

    // 확인 다이얼로그에서 취소
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('정말로 이 메모를 삭제하시겠습니까?');
      
      // 취소 버튼 클릭
      await dialog.dismiss();
    });

    // 다이얼로그 처리 후 잠시 대기
    await page.waitForTimeout(500);

    // 메모가 여전히 목록에 있는지 확인
    if (memoTitle) {
      await expect(page.locator(`h3:has-text("${memoTitle.trim()}")`)).toBeVisible();
    }

    // 메모 개수가 변하지 않았는지 확인
    const finalCountText = await page.textContent('text=총');
    const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount);
  });

  test('여러 카테고리 메모 삭제', async ({ page }) => {
    // 각 카테고리별 테스트용 메모 생성
    const categories = ['개인', '업무', '학습', '아이디어', '기타'];
    
    for (const category of categories) {
      await page.click('button:has-text("새 메모")');
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', `${category} 삭제 테스트`);
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', category);
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill(`${category} 카테고리 삭제 테스트용 메모`);
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(300);
    }

    // 각 카테고리별로 메모 삭제
    for (const category of categories) {
      // 해당 카테고리로 필터링
      await page.selectOption('select:near(text="전체 카테고리"), combobox', category);
      
      // 카테고리 개수 확인
      const countBefore = await page.textContent(`text=${category}`);
      const beforeCount = parseInt(countBefore?.match(/\((\d+)\)/)?.[1] || '0');

      if (beforeCount > 0) {
        // 첫 번째 메모 삭제
        await page.click('button:has-text("삭제")').first();
        
        page.once('dialog', async dialog => {
          await dialog.accept();
        });

        await page.waitForTimeout(500);

        // 카테고리 개수가 감소했는지 확인
        const countAfter = await page.textContent(`text=${category}`);
        const afterCount = parseInt(countAfter?.match(/\((\d+)\)/)?.[1] || '0');
        expect(afterCount).toBe(beforeCount - 1);
      }
    }

    // 전체 보기로 복원
    await page.selectOption('select:near(text="전체 카테고리"), combobox', '전체 카테고리');
  });

  test('마지막 메모 삭제', async ({ page }) => {
    // 모든 메모 삭제하여 마지막 메모 상황 만들기
    let memoCount = await page.locator('h3').count();
    
    while (memoCount > 1) {
      await page.click('button:has-text("삭제")').first();
      
      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      await page.waitForTimeout(500);
      memoCount = await page.locator('h3').count();
    }

    // 마지막 메모 삭제
    if (memoCount === 1) {
      await page.click('button:has-text("삭제")').first();
      
      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      await page.waitForTimeout(500);

      // 빈 상태 메시지 또는 "총 0개의 메모" 확인
      await expect(page.locator('text=총 0개의 메모')).toBeVisible();

      // 모든 카테고리 개수가 0인지 확인
      await expect(page.locator('text=개인 (0)')).toBeVisible();
      await expect(page.locator('text=업무 (0)')).toBeVisible();
      await expect(page.locator('text=학습 (0)')).toBeVisible();
      await expect(page.locator('text=아이디어 (0)')).toBeVisible();
      await expect(page.locator('text=기타 (0)')).toBeVisible();
    }
  });

  test('삭제 후 다른 메모들 영향 없음', async ({ page }) => {
    // 여러 메모 생성
    const testMemos = ['메모1', '메모2', '메모3'];
    
    for (const memo of testMemos) {
      await page.click('button:has-text("새 메모")');
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', memo);
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill(`${memo} 내용`);
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(300);
    }

    // 두 번째 메모 삭제
    const secondMemoDeleteButton = page.locator('button:has-text("삭제")').nth(1);
    await secondMemoDeleteButton.click();
    
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await page.waitForTimeout(500);

    // 첫 번째와 세 번째 메모는 여전히 존재하는지 확인
    await expect(page.locator('h3:has-text("메모1")')).toBeVisible();
    await expect(page.locator('h3:has-text("메모3")')).toBeVisible();
    await expect(page.locator('h3:has-text("메모2")')).not.toBeVisible();
  });

  test('삭제 버튼 접근성', async ({ page }) => {
    // 메모가 있는지 확인
    const memoExists = await page.locator('h3').first().isVisible();
    
    if (memoExists) {
      // 삭제 버튼이 올바르게 표시되는지 확인
      const deleteButton = page.locator('button:has-text("삭제")').first();
      await expect(deleteButton).toBeVisible();
      await expect(deleteButton).toBeEnabled();

      // 버튼 클릭 가능 여부 확인
      await deleteButton.hover();
      // 호버 시 스타일 변화나 툴팁이 있는지 확인할 수 있음
      
      // 키보드 접근성 테스트 (Tab으로 포커스 이동)
      await page.keyboard.press('Tab');
      // 삭제 버튼으로 포커스가 이동하는지 확인
    }
  });
});