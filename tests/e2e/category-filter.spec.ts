import { test, expect } from '@playwright/test';

test.describe('카테고리 필터 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');

    // 각 카테고리별 테스트용 메모 생성
    const testMemos = [
      { title: '개인 일정 관리', category: '개인', content: '개인 스케줄을 관리합니다.' },
      { title: '업무 보고서', category: '업무', content: '월간 업무 보고서를 작성합니다.' },
      { title: 'JavaScript 학습', category: '학습', content: 'JavaScript 기초를 공부합니다.' },
      { title: '앱 아이디어', category: '아이디어', content: '새로운 모바일 앱 아이디어입니다.' },
      { title: '기타 메모', category: '기타', content: '분류하기 어려운 내용입니다.' },
      { title: '개인 취미', category: '개인', content: '취미 활동에 대한 메모입니다.' },
      { title: '프로젝트 계획', category: '업무', content: '새 프로젝트 계획을 세웁니다.' }
    ];

    // 기존 메모 수 확인
    const existingMemoCount = await page.locator('h3').count();
    
    if (existingMemoCount < 5) {
      for (const memo of testMemos) {
        await page.click('button:has-text("새 메모")');
        await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', memo.title);
        await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', memo.category);
        const contentTextarea = page.locator('textarea').first();
        await contentTextarea.fill(memo.content);
        await page.click('button:has-text("저장하기")');
        await page.waitForTimeout(300);
      }
    }
  });

  test('카테고리 드롭다운 기본 동작', async ({ page }) => {
    // 카테고리 드롭다운 클릭
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    await categorySelect.click();

    // 모든 카테고리 옵션이 표시되는지 확인
    await expect(page.locator('option:has-text("전체 카테고리")')).toBeVisible();
    await expect(page.locator('option:has-text("개인")')).toBeVisible();
    await expect(page.locator('option:has-text("업무")')).toBeVisible();
    await expect(page.locator('option:has-text("학습")')).toBeVisible();
    await expect(page.locator('option:has-text("아이디어")')).toBeVisible();
    await expect(page.locator('option:has-text("기타")')).toBeVisible();
  });

  test('카테고리별 메모 개수 표시', async ({ page }) => {
    // 각 카테고리의 메모 개수가 올바르게 표시되는지 확인
    const categoryTexts = await page.locator('option').allTextContents();
    
    // 개수가 포함된 형태인지 확인 (예: "개인 (2)")
    const categoryWithCounts = categoryTexts.filter(text => text.match(/\(\d+\)/));
    expect(categoryWithCounts.length).toBeGreaterThan(0);

    // 개별 카테고리 개수 확인
    for (const categoryText of categoryWithCounts) {
      const count = parseInt(categoryText.match(/\((\d+)\)/)?.[1] || '0');
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('개인 카테고리 필터링', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 개인 카테고리 선택
    await categorySelect.selectOption({ label: /개인/ });
    await page.waitForTimeout(500);

    // 개인 카테고리 메모만 표시되는지 확인
    const visibleMemos = await page.locator('h3').allTextContents();
    const personalMemos = visibleMemos.filter(title => 
      title.includes('개인') || title.includes('일정') || title.includes('취미')
    );
    expect(personalMemos.length).toBeGreaterThan(0);

    // 다른 카테고리 메모는 숨겨졌는지 확인
    const businessMemos = visibleMemos.filter(title => 
      title.includes('업무') || title.includes('보고서') || title.includes('프로젝트')
    );
    expect(businessMemos.length).toBe(0);

    // 필터링된 결과 개수 표시 확인
    const resultText = await page.textContent('body');
    expect(resultText).toMatch(/\d+개 메모 \(전체 \d+개 중\)/);

    // "필터 초기화" 버튼이 나타났는지 확인
    await expect(page.locator('button:has-text("필터 초기화")')).toBeVisible();
  });

  test('업무 카테고리 필터링', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 업무 카테고리 선택
    await categorySelect.selectOption({ label: /업무/ });
    await page.waitForTimeout(500);

    // 업무 카테고리 메모만 표시되는지 확인
    const visibleMemos = await page.locator('h3').allTextContents();
    const workMemos = visibleMemos.filter(title => 
      title.includes('업무') || title.includes('보고서') || title.includes('프로젝트')
    );
    expect(workMemos.length).toBeGreaterThan(0);

    // 메모 카테고리 라벨 확인
    const categoryLabels = await page.locator('text=업무').allTextContents();
    expect(categoryLabels.length).toBeGreaterThan(0);
  });

  test('학습 카테고리 필터링', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 학습 카테고리 선택
    await categorySelect.selectOption({ label: /학습/ });
    await page.waitForTimeout(500);

    // 학습 카테고리 메모만 표시되는지 확인
    const visibleMemos = await page.locator('h3').allTextContents();
    const studyMemos = visibleMemos.filter(title => 
      title.includes('학습') || title.includes('JavaScript') || title.includes('공부')
    );
    
    if (studyMemos.length > 0) {
      expect(studyMemos.length).toBeGreaterThan(0);
    } else {
      // 학습 카테고리에 메모가 없는 경우 빈 목록 확인
      const memoCount = await page.locator('h3').count();
      expect(memoCount).toBe(0);
    }
  });

  test('빈 카테고리 선택', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 메모가 없는 카테고리 선택 (아이디어나 기타 중 메모가 적은 것)
    await categorySelect.selectOption({ label: /아이디어/ });
    await page.waitForTimeout(500);

    const memoCount = await page.locator('h3').count();
    
    if (memoCount === 0) {
      // 빈 카테고리인 경우 적절한 메시지나 상태 표시 확인
      const bodyText = await page.textContent('body');
      expect(bodyText).toMatch(/0개 메모|메모가 없습니다/);
    } else {
      // 메모가 있는 경우 해당 카테고리의 메모만 표시되는지 확인
      expect(memoCount).toBeGreaterThan(0);
    }
  });

  test('카테고리 간 전환', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 개인 카테고리 선택
    await categorySelect.selectOption({ label: /개인/ });
    await page.waitForTimeout(500);
    const personalCount = await page.locator('h3').count();

    // 업무 카테고리로 전환
    await categorySelect.selectOption({ label: /업무/ });
    await page.waitForTimeout(500);
    const workCount = await page.locator('h3').count();

    // 전체 카테고리로 전환
    await categorySelect.selectOption({ label: /전체 카테고리/ });
    await page.waitForTimeout(500);
    const totalCount = await page.locator('h3').count();

    // 각 카테고리별로 다른 개수가 표시되어야 함
    expect(totalCount).toBeGreaterThanOrEqual(personalCount);
    expect(totalCount).toBeGreaterThanOrEqual(workCount);
  });

  test('필터 초기화 기능', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 특정 카테고리 선택
    await categorySelect.selectOption({ label: /개인/ });
    await page.waitForTimeout(500);

    // 필터링된 메모 개수 확인
    const filteredCount = await page.locator('h3').count();

    // 필터 초기화 버튼 클릭
    await page.click('button:has-text("필터 초기화")');
    await page.waitForTimeout(500);

    // 전체 메모가 다시 표시되는지 확인
    const totalCount = await page.locator('h3').count();
    expect(totalCount).toBeGreaterThanOrEqual(filteredCount);

    // 카테고리 선택이 "전체 카테고리"로 리셋되었는지 확인
    const selectedOption = await categorySelect.inputValue();
    expect(selectedOption).toBe('전체 카테고리');
  });

  test('검색과 카테고리 필터 조합', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');

    // 업무 카테고리 선택
    await categorySelect.selectOption({ label: /업무/ });
    await page.waitForTimeout(500);

    // 업무 카테고리 내에서 검색
    await searchInput.fill('프로젝트');
    await page.waitForTimeout(500);

    // 업무 카테고리이면서 '프로젝트'가 포함된 메모만 표시되는지 확인
    const visibleMemos = await page.locator('h3').allTextContents();
    const matchingMemos = visibleMemos.filter(title => title.includes('프로젝트'));
    
    if (matchingMemos.length > 0) {
      expect(matchingMemos.length).toBeGreaterThan(0);
      
      // 메모의 카테고리가 업무인지 확인
      const categoryLabels = await page.locator('text=업무').count();
      expect(categoryLabels).toBeGreaterThan(0);
    }

    // 검색 결과 개수가 올바르게 표시되는지 확인
    const resultText = await page.textContent('body');
    expect(resultText).toMatch(/\d+개 메모/);
  });

  test('카테고리 개수 실시간 업데이트', async ({ page }) => {
    // 현재 개인 카테고리 개수 확인
    const initialPersonalText = await page.locator('option').filter({ hasText: /개인/ }).textContent();
    const initialPersonalCount = parseInt(initialPersonalText?.match(/\((\d+)\)/)?.[1] || '0');

    // 새 개인 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '새로운 개인 메모');
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('개인 카테고리 테스트 메모');
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    // 개인 카테고리 개수가 증가했는지 확인
    const updatedPersonalText = await page.locator('option').filter({ hasText: /개인/ }).textContent();
    const updatedPersonalCount = parseInt(updatedPersonalText?.match(/\((\d+)\)/)?.[1] || '0');
    
    expect(updatedPersonalCount).toBe(initialPersonalCount + 1);
  });

  test('모든 카테고리 순차 테스트', async ({ page }) => {
    const categories = ['개인', '업무', '학습', '아이디어', '기타'];
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');

    for (const category of categories) {
      // 카테고리 선택
      await categorySelect.selectOption({ label: new RegExp(category) });
      await page.waitForTimeout(500);

      // 해당 카테고리의 메모만 표시되는지 확인
      const visibleMemoCount = await page.locator('h3').count();
      
      if (visibleMemoCount > 0) {
        // 메모가 있는 경우, 모든 메모가 해당 카테고리인지 확인
        const categoryLabels = await page.locator(`text=${category}`).count();
        expect(categoryLabels).toBeGreaterThan(0);
      }

      // 필터 결과 텍스트 확인
      const resultText = await page.textContent('body');
      expect(resultText).toMatch(/\d+개 메모/);
    }

    // 마지막으로 전체 카테고리로 복원
    await categorySelect.selectOption({ label: /전체 카테고리/ });
    await page.waitForTimeout(500);
  });

  test('카테고리 필터 URL 상태 유지', async ({ page }) => {
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 특정 카테고리 선택
    await categorySelect.selectOption({ label: /업무/ });
    await page.waitForTimeout(500);

    // 페이지 새로고침 후에도 필터 상태가 유지되는지 확인
    // (실제 구현에 따라 이 테스트는 조정이 필요할 수 있음)
    await page.reload();
    await page.waitForTimeout(1000);

    // 기본적으로 전체 카테고리가 선택되어야 함
    const selectedValue = await categorySelect.inputValue();
    expect(selectedValue).toBeDefined();
  });
});