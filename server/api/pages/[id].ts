import { serverSupabaseServiceRole } from "#supabase/server"
import { H3Event } from "h3"

export default defineEventHandler(async (event: H3Event) => {
    const id = event.context.params?.id
    
    if (!id) {
      return { 
        success: false, 
        message: 'Page ID is required' 
      }
    }
  
    const supabase = serverSupabaseServiceRole(event)
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching page:', error)
      return { 
        success: false, 
        message: 'Failed to fetch page' 
      }
    }
  
    if (!data) {
      return { 
        success: false, 
        message: 'Page not found' 
      }
    }
  
    return { success: true, data }
}) 