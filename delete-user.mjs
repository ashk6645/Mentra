import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import readline from 'readline'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL in .env')
  process.exit(1)
}

// Try service role key first, fallback to anon key
const supabaseKey = supabaseServiceKey || supabaseAnonKey

if (!supabaseKey) {
  console.error('Error: Missing Supabase keys in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function listUsers() {
  try {
    console.log('\n=== Listing All Users ===\n')
    
    // Try to get users from auth (requires service role key)
    if (supabaseServiceKey) {
      const { data: { users }, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        console.error('Error fetching users from auth:', error.message)
      } else if (users && users.length > 0) {
        console.log('Users from Auth:')
        users.forEach((user, index) => {
          console.log(`${index + 1}. ID: ${user.id}`)
          console.log(`   Email: ${user.email}`)
          console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
          console.log('')
        })
        return users
      }
    }
    
    // Fallback: get from profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError.message)
      return []
    }
    
    if (profiles && profiles.length > 0) {
      console.log('Users from Profiles table:')
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ID: ${profile.id}`)
        console.log(`   Display Name: ${profile.display_name || 'N/A'}`)
        console.log(`   XP: ${profile.xp || 0}`)
        console.log('')
      })
      return profiles
    }
    
    console.log('No users found.')
    return []
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

async function deleteUser(userId) {
  try {
    console.log(`\nDeleting user ${userId}...`)
    
    // Delete from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) {
      console.error('Error deleting from profiles:', profileError.message)
    } else {
      console.log('✅ Deleted from profiles table')
    }
    
    // Delete from auth (requires service role key)
    if (supabaseServiceKey) {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Error deleting from auth:', authError.message)
      } else {
        console.log('✅ Deleted from auth')
      }
    } else {
      console.log('⚠️  Service role key not found - cannot delete from auth.users')
      console.log('   User can still log in. Delete manually from Supabase dashboard.')
    }
    
    console.log('\n✅ User deletion complete!')
  } catch (error) {
    console.error('Error:', error)
  }
}

async function main() {
  const users = await listUsers()
  
  if (users.length === 0) {
    console.log('No users to delete.')
    rl.close()
    process.exit(0)
  }
  
  console.log('\nEnter the user ID to delete (or "cancel" to exit):')
  const userId = await question('User ID: ')
  
  if (userId.toLowerCase() === 'cancel' || !userId) {
    console.log('Cancelled.')
    rl.close()
    process.exit(0)
  }
  
  const confirm = await question(`\n⚠️  Are you sure you want to delete user ${userId}? (yes/no): `)
  
  if (confirm.toLowerCase() === 'yes') {
    await deleteUser(userId)
  } else {
    console.log('Cancelled.')
  }
  
  rl.close()
  process.exit(0)
}

main()
