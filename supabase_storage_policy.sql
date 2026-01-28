-- Create the avatars bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Drop existing policies to avoid conflicts if you run this multiple times
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;
drop policy if exists "Users can delete their own avatars" on storage.objects;

-- Allow public access to view avatars
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload new avatars
create policy "Authenticated users can upload avatars"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars' );

-- Allow users to update their own avatars
create policy "Users can update their own avatars"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Allow users to delete their own avatars
create policy "Users can delete their own avatars"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars' and auth.uid() = owner );
