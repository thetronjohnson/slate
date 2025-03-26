import { serverSupabaseServiceRole } from "#supabase/server"
import { H3Event } from "h3"
import { readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event);
    const { pageId, userId } = body;
  
    const supabase = serverSupabaseServiceRole(event);
    
    const { data, error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('user_id', userId) // Extra safety check
      .single()

    if (error) {
      console.error('Error deleting page:', error);
      return { success: false, message: 'Failed to delete page.' };
    }
  
    return { success: true, data };
}); 