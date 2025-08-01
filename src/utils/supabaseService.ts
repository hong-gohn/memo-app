import { supabase } from '@/lib/supabase'
import { Memo } from '@/types/memo'

export const supabaseService = {
  // 모든 메모 가져오기
  getMemos: async (): Promise<Memo[]> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memos:', error)
        return []
      }

      return data?.map(memo => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        category: memo.category,
        tags: memo.tags || [],
        createdAt: memo.created_at || new Date().toISOString(),
        updatedAt: memo.updated_at || new Date().toISOString(),
      })) || []
    } catch (error) {
      console.error('Error fetching memos:', error)
      return []
    }
  },

  // 메모 추가
  addMemo: async (memo: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memo | null> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .insert({
          title: memo.title,
          content: memo.content,
          category: memo.category,
          tags: memo.tags,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding memo:', error)
        return null
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error adding memo:', error)
      return null
    }
  },

  // 메모 업데이트
  updateMemo: async (id: string, updates: Partial<Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Memo | null> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .update({
          ...(updates.title && { title: updates.title }),
          ...(updates.content && { content: updates.content }),
          ...(updates.category && { category: updates.category }),
          ...(updates.tags && { tags: updates.tags }),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating memo:', error)
        return null
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error updating memo:', error)
      return null
    }
  },

  // 메모 삭제
  deleteMemo: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting memo:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting memo:', error)
      return false
    }
  },

  // 특정 메모 가져오기
  getMemoById: async (id: string): Promise<Memo | null> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching memo:', error)
        return null
      }

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags || [],
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Error fetching memo:', error)
      return null
    }
  },

  // 메모 검색
  searchMemos: async (query: string): Promise<Memo[]> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching memos:', error)
        return []
      }

      return data?.map(memo => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        category: memo.category,
        tags: memo.tags || [],
        createdAt: memo.created_at || new Date().toISOString(),
        updatedAt: memo.updated_at || new Date().toISOString(),
      })) || []
    } catch (error) {
      console.error('Error searching memos:', error)
      return []
    }
  },

  // 카테고리별 메모 필터링
  getMemosByCategory: async (category: string): Promise<Memo[]> => {
    try {
      if (category === 'all') {
        return await supabaseService.getMemos()
      }

      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memos by category:', error)
        return []
      }

      return data?.map(memo => ({
        id: memo.id,
        title: memo.title,
        content: memo.content,
        category: memo.category,
        tags: memo.tags || [],
        createdAt: memo.created_at || new Date().toISOString(),
        updatedAt: memo.updated_at || new Date().toISOString(),
      })) || []
    } catch (error) {
      console.error('Error fetching memos by category:', error)
      return []
    }
  },

  // 모든 메모 삭제
  clearAllMemos: async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .neq('id', '')

      if (error) {
        console.error('Error clearing all memos:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error clearing all memos:', error)
      return false
    }
  },
}