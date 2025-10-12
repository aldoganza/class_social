# Video Upload Setup Instructions

## Database Migration Required

Run this SQL command on your MySQL database to add video support:

```sql
ALTER TABLE posts ADD COLUMN video_url VARCHAR(255);
```

Or run the migration file:
```bash
mysql -u your_username -p your_database < sql/alter_add_video_url.sql
```

## What Changed

### Server (`server/src/routes/posts.js`)
- Updated multer to accept both `image` and `video` fields
- Changed from `upload.single('image')` to `upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }])`
- Added `video_url` handling in the POST route
- Updated INSERT query to include `video_url` column

### Client (`client/src/pages/Profile.jsx`)
- Added video file upload button
- Sends video file via FormData

### Client (`client/src/components/PostCard.jsx`)
- Added video player to display `post.video_url`
- Shows video with native controls

## Testing

1. Run the database migration
2. Restart the server: `npm start`
3. Go to your profile
4. Click "🎥 Video" button
5. Select a video file
6. Add caption (optional)
7. Click "Post"

Video should upload and display with playback controls!
