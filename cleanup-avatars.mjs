import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupAvatars() {
  try {
    console.log('Checking all profiles...')
    
    // Get ALL profiles first to see what we have
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError)
      process.exit(1)
    }

    console.log(`Found ${allProfiles?.length || 0} total profiles`)
    
    if (allProfiles && allProfiles.length > 0) {
      allProfiles.forEach(profile => {
        console.log(`Profile ${profile.id}:`)
        console.log(`  - avatar_url: ${profile.avatar_url ? (profile.avatar_url.substring(0, 50) + '... (length: ' + profile.avatar_url.length + ')') : 'null'}`)
      })
    }

    // Clear ALL avatar URLs to be safe
    console.log('\nClearing all avatar URLs...')
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .not('avatar_url', 'is', null)
      .select()

    if (updateError) {
      console.error('Error updating:', updateError)
    } else {
      console.log(`✅ Successfully cleared ${updated?.length || 0} avatar(s)`)
    }

    console.log('\nYou can now refresh your browser!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

cleanupAvatars()
