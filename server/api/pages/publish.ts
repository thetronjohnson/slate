import { serverSupabaseServiceRole } from "#supabase/server"
import { H3Event } from "h3"
import { readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
    const body = await readBody(event);
    const { name, content, userId } = body;
  
    const supabase = serverSupabaseServiceRole(event);
    
    const { data, error } = await supabase
      .from('pages')
      .insert({ 
        name,
        content,
        user_id: userId 
      })
      .select()
      .single()

    if (error) {
      console.error('Error publishing page:', error);
      return { success: false, message: 'Failed to publish page.' };
    }
  
    return { success: true, data };
}); 