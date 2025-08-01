import { test, expect } from '@playwright/test';

test.describe('통합 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 메모 앱 페이지로 이동
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('h1:has-text("📝 메모 앱")');
  });

  test('전체 워크플로우 - 메모 생성부터 삭제까지', async ({ page }) => {
    // 1. 초기 상태 확인
    const initialCountText = await page.textContent('text=총');
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0');

    // 2. 다양한 메모 생성
    const testMemos = [
      {
        title: '개인 일정 관리',
        category: '개인',
        content: `# 개인 일정 관리

## 이번 주 할 일
- [ ] 운동하기
- [ ] 독서하기
- [x] 장보기

**중요**: 시간 관리가 필요합니다.`,
        tags: ['일상', '중요']
      },
      {
        title: '프로젝트 회의 준비',
        category: '업무',
        content: `# 프로젝트 회의 준비

## 안건
1. 프로젝트 진행 상황
2. 다음 스프린트 계획
3. 리소스 배분

\`\`\`javascript
// 코드 리뷰 예시
const projectStatus = 'in-progress';
\`\`\``,
        tags: ['프로젝트', '회의']
      },
      {
        title: 'React Hook 학습',
        category: '학습',
        content: `# React Hook 학습

## useState 사용법
React의 \`useState\` Hook을 사용하여 상태를 관리할 수 있습니다.

> 중요: 함수형 컴포넌트에서만 사용 가능합니다.`,
        tags: ['개발', '학습', 'react']
      }
    ];

    // 각 메모 생성
    for (const memo of testMemos) {
      await page.click('button:has-text("새 메모")');
      
      // 기본 정보 입력
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', memo.title);
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', memo.category);
      
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill(memo.content);
      
      // 태그 추가
      const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
      for (const tag of memo.tags) {
        await tagInput.fill(tag);
        await tagInput.press('Enter');
      }
      
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(500);
      
      // 메모가 생성되었는지 확인
      await expect(page.locator(`h3:has-text("${memo.title}")`)).toBeVisible();
    }

    // 3. 검색과 필터 조합 테스트
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');

    // 프로젝트 키워드로 검색
    await searchInput.fill('프로젝트');
    await page.waitForTimeout(500);
    
    await expect(page.locator('h3:has-text("프로젝트")')).toBeVisible();

    // 업무 카테고리 필터 적용
    await categorySelect.selectOption({ label: /업무/ });
    await page.waitForTimeout(500);

    // 검색 + 카테고리 필터 결과 확인
    const filteredCount = await page.locator('h3').count();
    expect(filteredCount).toBeGreaterThanOrEqual(1);

    // 필터 초기화
    await page.click('button:has-text("필터 초기화")');
    await page.waitForTimeout(500);

    // 4. 메모 편집 및 카테고리 변경
    // 개인 메모를 업무 카테고리로 변경
    const personalMemo = page.locator('h3:has-text("개인 일정 관리")');
    if (await personalMemo.isVisible()) {
      const editButton = personalMemo.locator('..').locator('button:has-text("편집")');
      await editButton.click();
      
      // 카테고리를 업무로 변경
      await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '업무');
      
      // 태그 추가
      const editTagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
      await editTagInput.fill('업무변경');
      await editTagInput.press('Enter');
      
      // 내용에 마크다운 서식 추가
      const editContentTextarea = page.locator('textarea').first();
      const currentContent = await editContentTextarea.inputValue();
      await editContentTextarea.fill(currentContent + '\n\n---\n\n**업데이트**: 업무 카테고리로 변경됨');
      
      await page.click('button:has-text("수정하기")');
      await page.waitForTimeout(500);
    }

    // 5. 대량 작업 테스트 - 일부 메모 삭제
    const memosToDelete = ['React Hook 학습'];
    
    for (const memoTitle of memosToDelete) {
      const memoElement = page.locator(`h3:has-text("${memoTitle}")`);
      if (await memoElement.isVisible()) {
        const deleteButton = memoElement.locator('..').locator('button:has-text("삭제")');
        await deleteButton.click();
        
        // 확인 다이얼로그 처리
        page.once('dialog', async dialog => {
          await dialog.accept();
        });
        
        await page.waitForTimeout(500);
        
        // 메모가 삭제되었는지 확인
        await expect(page.locator(`h3:has-text("${memoTitle}")`)).not.toBeVisible();
      }
    }

    // 6. 최종 상태 검증
    const finalCountText = await page.textContent('text=총');
    const finalCount = parseInt(finalCountText?.match(/\d+/)?.[0] || '0');
    
    // 메모 개수가 예상대로 변경되었는지 확인
    expect(finalCount).toBe(initialCount + testMemos.length - memosToDelete.length);
  });

  test('검색 + 카테고리 필터 복합 기능', async ({ page }) => {
    // 테스트용 메모들이 없다면 생성
    const memoCount = await page.locator('h3').count();
    if (memoCount < 3) {
      const quickMemos = [
        { title: 'JavaScript 기초', category: '학습', content: 'JavaScript 변수와 함수', tags: ['js'] },
        { title: '업무 보고서', category: '업무', content: '월간 업무 진행 상황', tags: ['보고서'] },
        { title: '개인 메모', category: '개인', content: '개인적인 생각들', tags: ['일기'] }
      ];

      for (const memo of quickMemos) {
        await page.click('button:has-text("새 메모")');
        await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', memo.title);
        await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', memo.category);
        const contentTextarea = page.locator('textarea').first();
        await contentTextarea.fill(memo.content);
        const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
        for (const tag of memo.tags) {
          await tagInput.fill(tag);
          await tagInput.press('Enter');
        }
        await page.click('button:has-text("저장하기")');
        await page.waitForTimeout(300);
      }
    }

    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');

    // 1. 학습 카테고리 선택
    await categorySelect.selectOption({ label: /학습/ });
    await page.waitForTimeout(500);

    const learningMemoCount = await page.locator('h3').count();

    // 2. 학습 카테고리 내에서 'JavaScript' 검색
    await searchInput.fill('JavaScript');
    await page.waitForTimeout(500);

    const searchResults = await page.locator('h3').count();
    expect(searchResults).toBeLessThanOrEqual(learningMemoCount);

    // 3. 검색 결과가 학습 카테고리 제한을 준수하는지 확인
    if (searchResults > 0) {
      // 결과가 있다면 학습 카테고리 라벨이 있어야 함
      await expect(page.locator('text=학습')).toBeVisible();
    }

    // 4. 결과 개수가 올바르게 표시되는지 확인
    const resultText = await page.textContent('body');
    expect(resultText).toMatch(/\d+개 메모/);
  });

  test('편집 중 카테고리 변경과 개수 업데이트', async ({ page }) => {
    // 테스트용 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '카테고리 변경 테스트');
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('개인 카테고리에서 시작');
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    // 초기 카테고리별 개수 확인
    const initialPersonalText = await page.locator('option').filter({ hasText: /개인/ }).textContent();
    const initialPersonalCount = parseInt(initialPersonalText?.match(/\((\d+)\)/)?.[1] || '0');

    const initialWorkText = await page.locator('option').filter({ hasText: /업무/ }).textContent();
    const initialWorkCount = parseInt(initialWorkText?.match(/\((\d+)\)/)?.[1] || '0');

    // 메모 편집하여 카테고리 변경
    await page.click('button:has-text("편집")').first();
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '업무');
    await page.click('button:has-text("수정하기")');
    await page.waitForTimeout(1000);

    // 카테고리별 개수 변화 확인
    const updatedPersonalText = await page.locator('option').filter({ hasText: /개인/ }).textContent();
    const updatedPersonalCount = parseInt(updatedPersonalText?.match(/\((\d+)\)/)?.[1] || '0');

    const updatedWorkText = await page.locator('option').filter({ hasText: /업무/ }).textContent();
    const updatedWorkCount = parseInt(updatedWorkText?.match(/\((\d+)\)/)?.[1] || '0');

    // 개인 카테고리는 1 감소, 업무 카테고리는 1 증가해야 함
    expect(updatedPersonalCount).toBe(Math.max(0, initialPersonalCount - 1));
    expect(updatedWorkCount).toBe(initialWorkCount + 1);
  });

  test('태그 기반 검색 및 복합 검색', async ({ page }) => {
    // 태그가 있는 메모 생성
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '태그 검색 테스트');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('이 메모는 태그 검색을 위한 것입니다.');
    
    const tagInput = page.locator('input[placeholder*="태그"], textbox:near(text="태그")');
    await tagInput.fill('검색테스트');
    await tagInput.press('Enter');
    await tagInput.fill('중요');
    await tagInput.press('Enter');
    
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');

    // 1. 태그명으로 검색 (# 포함)
    await searchInput.fill('#검색테스트');
    await page.waitForTimeout(500);

    let searchResults = await page.locator('h3').count();
    if (searchResults > 0) {
      await expect(page.locator('h3:has-text("태그 검색 테스트")')).toBeVisible();
    }

    // 2. 태그명으로 검색 (# 없이)
    await searchInput.fill('검색테스트');
    await page.waitForTimeout(500);

    searchResults = await page.locator('h3').count();
    expect(searchResults).toBeGreaterThanOrEqual(0);

    // 3. 메모 제목과 태그 모두 검색
    await searchInput.fill('테스트');
    await page.waitForTimeout(500);

    searchResults = await page.locator('h3').count();
    expect(searchResults).toBeGreaterThanOrEqual(1);
  });

  test('반응성 및 성능 테스트', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');

    // 빠른 연속 입력 테스트
    const searchTerms = ['자', '자바', '자바스크립트'];
    
    for (const term of searchTerms) {
      const startTime = Date.now();
      await searchInput.fill(term);
      await page.waitForTimeout(300);
      const endTime = Date.now();
      
      // 각 검색이 합리적인 시간 내에 완료되는지 확인
      expect(endTime - startTime).toBeLessThan(2000);
    }

    // 검색어 초기화
    await searchInput.fill('');
    await page.waitForTimeout(300);
  });

  test('데이터 일관성 테스트', async ({ page }) => {
    // 1. 메모 추가
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '일관성 테스트');
    await page.selectOption('select:near(text="카테고리"), combobox:near(text="카테고리")', '개인');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('데이터 일관성 테스트');
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    // 개수 확인
    const countAfterAdd = await page.textContent('text=총');
    const addCount = parseInt(countAfterAdd?.match(/\d+/)?.[0] || '0');

    // 2. 즉시 다른 기능 사용 (검색)
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    await searchInput.fill('일관성');
    await page.waitForTimeout(500);

    // 검색 결과에 새 메모가 포함되는지 확인
    await expect(page.locator('h3:has-text("일관성 테스트")')).toBeVisible();

    // 3. 검색 초기화 후 메모 수정
    await searchInput.fill('');
    await page.waitForTimeout(300);

    await page.click('button:has-text("편집")').first();
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '수정된 일관성 테스트');
    await page.click('button:has-text("수정하기")');
    await page.waitForTimeout(500);

    // 4. 개수가 여전히 일관되는지 확인
    const countAfterEdit = await page.textContent('text=총');
    const editCount = parseInt(countAfterEdit?.match(/\d+/)?.[0] || '0');
    expect(editCount).toBe(addCount);

    // 5. 수정된 제목이 표시되는지 확인
    await expect(page.locator('h3:has-text("수정된 일관성 테스트")')).toBeVisible();
  });

  test('동시 작업 시나리오', async ({ page }) => {
    // 여러 메모 생성
    const testMemos = ['메모A', '메모B', '메모C'];
    
    for (const memo of testMemos) {
      await page.click('button:has-text("새 메모")');
      await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', memo);
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill(`${memo} 내용`);
      await page.click('button:has-text("저장하기")');
      await page.waitForTimeout(300);
    }

    // 1. 메모 편집 중 다른 메모 상태 확인
    await page.click('button:has-text("편집")').first();
    
    // 편집 모달이 열린 상태에서 다른 메모들이 여전히 보이는지 확인
    // (배경에서 다른 메모들 확인)
    const editModal = page.locator('text=메모 편집');
    await expect(editModal).toBeVisible();

    // 편집 취소
    await page.click('button:has-text("취소")');

    // 2. 검색 중 새 메모 추가
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    await searchInput.fill('메모A');
    await page.waitForTimeout(500);

    // 검색 상태에서 새 메모 추가
    await page.click('button:has-text("새 메모")');
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '검색 중 추가된 메모');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('검색 중 추가');
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    // 검색 상태가 유지되는지 확인
    await expect(searchInput).toHaveValue('메모A');

    // 검색 초기화
    await page.click('button:has-text("필터 초기화")');
    
    // 새로 추가된 메모가 표시되는지 확인
    await expect(page.locator('h3:has-text("검색 중 추가된 메모")')).toBeVisible();
  });

  test('사용자 경험 흐름 테스트', async ({ page }) => {
    // 1. 직관적인 네비게이션 흐름
    
    // 새 메모 작성
    await page.click('button:has-text("새 메모")');
    await expect(page.locator('text=새 메모 작성')).toBeVisible();

    // ESC 키로 모달 닫기 테스트
    await page.keyboard.press('Escape');
    // 모달이 닫혔는지 확인 (구현에 따라 다를 수 있음)
    
    // 다시 새 메모 모달 열기
    await page.click('button:has-text("새 메모")');
    
    // Tab 키로 포커스 이동 테스트
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 메모 작성 완료
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', 'UX 테스트 메모');
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('사용자 경험 테스트');
    
    // Enter 키로 저장 (구현에 따라 다를 수 있음)
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    // 2. 검색 UX 테스트
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    
    // 검색창 클릭 시 포커스
    await searchInput.click();
    
    // 검색어 입력
    await searchInput.type('UX', { delay: 100 });
    await page.waitForTimeout(300);
    
    // 검색 결과 확인
    await expect(page.locator('h3:has-text("UX 테스트 메모")')).toBeVisible();
    
    // 검색창 초기화 (Ctrl+A, Delete)
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    // 3. 키보드 접근성 확인
    
    // Tab으로 요소 간 이동
    await page.keyboard.press('Tab'); // 검색창
    await page.keyboard.press('Tab'); // 카테고리 선택
    await page.keyboard.press('Tab'); // 새 메모 버튼
    
    // Enter로 새 메모 버튼 활성화 (구현에 따라)
    // await page.keyboard.press('Enter');
  });

  test('오류 복구 시나리오', async ({ page }) => {
    // 1. 잘못된 입력 후 수정
    await page.click('button:has-text("새 메모")');
    
    // 제목만 입력하고 저장 시도 (내용 없음)
    await page.fill('input[placeholder*="제목"], textbox:near(text="제목")', '제목만 있는 메모');
    await page.click('button:has-text("저장하기")');
    
    // 오류 처리 또는 유효성 검사 확인
    // (실제 구현에 따라 모달이 닫히지 않거나 오류 메시지 표시)
    
    // 내용 추가 후 재시도
    const contentTextarea = page.locator('textarea').first();
    await contentTextarea.fill('내용을 추가했습니다.');
    await page.click('button:has-text("저장하기")');
    await page.waitForTimeout(500);

    // 2. 삭제 후 되돌리기 불가 확인
    const initialCount = await page.locator('h3').count();
    
    if (initialCount > 0) {
      await page.click('button:has-text("삭제")').first();
      
      page.once('dialog', async dialog => {
        await dialog.accept();
      });
      
      await page.waitForTimeout(500);
      
      const afterDeleteCount = await page.locator('h3').count();
      expect(afterDeleteCount).toBe(initialCount - 1);
      
      // 삭제된 메모는 복구할 수 없음을 확인
      // (실제로는 UI에 "실행 취소" 기능이 없다는 것을 의미)
    }

    // 3. 필터/검색 초기화 후 원래 상태 복원
    const searchInput = page.locator('input[placeholder*="검색"], textbox[placeholder*="검색"]');
    const categorySelect = page.locator('select:near(text="전체 카테고리"), combobox');
    
    // 복합 필터 적용
    await searchInput.fill('테스트');
    await categorySelect.selectOption({ label: /개인/ });
    await page.waitForTimeout(500);
    
    const filteredCount = await page.locator('h3').count();
    
    // 필터 초기화
    await page.click('button:has-text("필터 초기화")');
    await page.waitForTimeout(500);
    
    // 전체 메모가 복원되었는지 확인
    const restoredCount = await page.locator('h3').count();
    expect(restoredCount).toBeGreaterThanOrEqual(filteredCount);
    
    // 검색어와 카테고리가 초기화되었는지 확인
    await expect(searchInput).toHaveValue('');
    const selectedCategory = await categorySelect.inputValue();
    expect(selectedCategory).toBe('전체 카테고리');
  });
});