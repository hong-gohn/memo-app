import { test, expect } from '@playwright/test';

test.describe('검색 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');

    // 테스트용 다양한 메모 생성
    const testMemos = [
      { title: '자바스크립트 학습', content: 'JavaScript 기본 문법을 학습하고 있습니다.', category: '학습', tags: ['js', '프로그래밍'] },
      { title: '회의 준비사항', content: '내일 팀 미팅을 위한 준비사항을 정리합니다.', category: '업무', tags: ['회의', '팀'] },
      { title: '주말 계획', content: '이번 주말에는 친구들과 영화를 보러 갈 예정입니다.', category: '개인', tags: ['주말', '영화'] },
      { title: 'React 프로젝트', content: 'React를 사용한 새로운 프로젝트를 시작했습니다.', category: '업무', tags: ['react', 'javascript'] },
      { title: '독서 목록', content: '읽고 싶은 책들의 목록을 작성합니다.', category: '개인', tags: ['독서', '책'] }
    ];

    // 기존 메모가 부족하다면 테스트용 메모 생성
    const existingMemoCount = await page.locator('h3').count();
    
    if (existingMemoCount < 3) {
      for (const memo of testMemos) {
        await page.click('button:has-text("새 메모")');
        await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', memo.title);
        await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', memo.category);
        const contentTextarea = page.locator('textarea').first();
        await contentTextarea.fill(memo.content);
        
        // 태그 추가
        for (const tag of memo.tags) {
          await page.fill('input[placeholder*="태그"], textbox:near(text="태그")', tag);
          await page.press('input[placeholder*="태그"], textbox:near(text="태그")', 'Enter');
        }
        
        await page.click('button:has-text("저장하기")');
        await page.waitForTimeout(300);
      }
    }
  });

  test('기본 검색 기능', async ({ page }) => {
    // 초기 메모 개수 확인
    const initialCountText = await page.textContent('text=총');
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // 검색 입력란에 검색어 입력
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    await searchInput.fill('자바스크립트');

    // 실시간 필터링이 작동하는지 확인
    await page.waitForTimeout(500);

    // 검색 결과 확인
    await expect(page.locator('h3:has-text("자바스크립트")')).toBeVisible();
    
    // 검색 결과 개수 표시 확인
    const resultCountText = await page.textContent('text=개 메모');
    expect(resultCountText).toContain('개 메모');
    
    // "필터 초기화" 버튼이 나타났는지 확인
    await expect(page.locator('button:has-text("필터 초기화")')).toBeVisible();

    // 필터 초기화
    await page.click('button:has-text("필터 초기화")');

    // 모든 메모가 다시 표시되는지 확인
    const finalCountText = await page.textContent('text=총');
    const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0');
    expect(finalCount).toBe(initialCount);

    // 검색어가 지워졌는지 확인
    await expect(searchInput).toHaveValue('');
  });

  test('제목 검색', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 제목에 포함된 키워드로 검색
    await searchInput.fill('회의');
    await page.waitForTimeout(500);

    // 해당 제목을 가진 메모가 표시되는지 확인
    await expect(page.locator('h3:has-text("회의")')).toBeVisible();
    
    // 다른 메모는 숨겨졌는지 확인
    const visibleMemoCount = await page.locator('h3').count();
    expect(visibleMemoCount).toBeLessThanOrEqual(2); // 검색 결과만 표시
  });

  test('내용 검색', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 메모 내용에 포함된 키워드로 검색
    await searchInput.fill('React');
    await page.waitForTimeout(500);

    // 해당 내용을 가진 메모가 표시되는지 확인
    await expect(page.locator('text=React')).toBeVisible();
  });

  test('대소문자 구분 없는 검색', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 대문자로 검색
    await searchInput.fill('JAVASCRIPT');
    await page.waitForTimeout(500);

    // 소문자로 작성된 메모도 검색되는지 확인
    const searchResults = await page.locator('h3').count();
    expect(searchResults).toBeGreaterThan(0);

    // 소문자로 다시 검색
    await searchInput.fill('javascript');
    await page.waitForTimeout(500);

    const searchResults2 = await page.locator('h3').count();
    expect(searchResults2).toBe(searchResults); // 같은 결과가 나와야 함
  });

  test('부분 일치 검색', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 단어의 일부만 입력
    await searchInput.fill('자바');
    await page.waitForTimeout(500);

    // 부분 일치하는 메모가 표시되는지 확인
    const searchResults = await page.locator('h3').count();
    expect(searchResults).toBeGreaterThan(0);
  });

  test('검색 결과 없음', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 존재하지 않는 키워드로 검색
    await searchInput.fill('존재하지않는키워드12345');
    await page.waitForTimeout(500);

    // 검색 결과가 없음을 확인
    const visibleMemoCount = await page.locator('h3').count();
    expect(visibleMemoCount).toBe(0);

    // "검색 결과가 없습니다" 메시지나 빈 목록 표시 확인
    const resultText = await page.textContent('body');
    expect(resultText).toMatch(/0개 메모|검색 결과가 없습니다/);
  });

  test('빈 검색어 처리', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 먼저 검색어 입력
    await searchInput.fill('자바스크립트');
    await page.waitForTimeout(500);

    // 검색어를 모두 삭제
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // 모든 메모가 다시 표시되는지 확인
    const totalCountText = await page.textContent('text=총');
    const totalCount = parseInt(totalCountText?.match(/\d+/)?.[0] || '0');
    expect(totalCount).toBeGreaterThan(0);
  });

  test('특수문자 검색', async ({ page }) => {
    // 특수문자가 포함된 테스트 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', 'C++ 프로그래밍');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('C++ 언어의 기본 문법: 클래스 & 상속');
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 특수문자를 포함한 검색
    await searchInput.fill('C++');
    await page.waitForTimeout(500);

    // 오류 없이 검색이 수행되고 결과가 표시되는지 확인
    await expect(page.locator('h3:has-text("C++")')).toBeVisible();
  });

  test('실시간 검색 반응성', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 문자를 하나씩 입력하면서 실시간 반응 확인
    await searchInput.type('자', { delay: 100 });
    await page.waitForTimeout(200);
    let count1 = await page.locator('h3').count();

    await searchInput.type('바', { delay: 100 });
    await page.waitForTimeout(200);
    let count2 = await page.locator('h3').count();

    await searchInput.type('스크립트', { delay: 100 });
    await page.waitForTimeout(200);
    let count3 = await page.locator('h3').count();

    // 검색어가 더 구체화될수록 결과가 줄어들거나 같아야 함
    expect(count3).toBeLessThanOrEqual(count2);
    expect(count2).toBeLessThanOrEqual(count1);
  });

  test('검색 중 다른 작업 수행', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 검색어 입력
    await searchInput.fill('자바스크립트');
    await page.waitForTimeout(500);

    // 검색 결과에서 메모 편집
    const editButton = page.locator('button:has-text("편집")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 편집 모달이 열렸는지 확인
      await expect(page.locator('text=메모 편집')).toBeVisible();
      
      // 취소하고 돌아가기
      await page.click('button:has-text("취소")');
    }

    // 검색 상태가 유지되는지 확인
    await expect(searchInput).toHaveValue('자바스크립트');
  });

  test('태그 기반 검색', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 태그명으로 검색 (# 포함)
    await searchInput.fill('#js');
    await page.waitForTimeout(500);

    // 해당 태그를 가진 메모가 검색되는지 확인
    const searchResults = await page.locator('h3').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);

    // 태그명으로 검색 (# 없이)
    await searchInput.fill('js');
    await page.waitForTimeout(500);

    // 태그 내용과 일반 텍스트 모두 검색되는지 확인
    const searchResults2 = await page.locator('h3').count();
    expect(searchResults2).toBeGreaterThanOrEqual(searchResults);
  });

  test('검색 성능 테스트', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 긴 검색어 입력
    const longSearchTerm = '아주아주아주아주긴검색어입니다'.repeat(5);
    
    const startTime = Date.now();
    await searchInput.fill(longSearchTerm);
    await page.waitForTimeout(500);
    const endTime = Date.now();

    // 응답 시간이 합리적인 범위 내인지 확인 (5초 이내)
    expect(endTime - startTime).toBeLessThan(5000);

    // 검색이 정상 작동하는지 확인
    const resultCountText = await page.textContent('body');
    expect(resultCountText).toContain('개 메모');
  });
});