# Testing the Groups Feature - Step by Step

## ✅ Database Setup Complete!

The following tables have been created:
- `groups_table` - Stores group information
- `group_members` - Tracks membership and roles
- `group_messages` - Stores group messages

## Next Steps to Test

### 1. Start the Server
```bash
cd server
npm start
```

### 2. Start the Client
```bash
cd client
npm run dev
```

### 3. Test Group Creation

**Steps:**
1. Open your browser to `http://localhost:5173`
2. Login to your account
3. Click **"Groups"** in the sidebar (new icon with people)
4. Click **"➕ Create Group"** button
5. Fill in the form:
   - **Group Name**: "CS101 Study Group"
   - **Description**: "Study group for Computer Science"
   - **Group Picture**: (optional) Upload an image
6. Click **"Create Group"**

**Expected Result:**
- ✅ Modal closes
- ✅ New group appears in the list
- ✅ You see "Admin" badge next to your group
- ✅ Member count shows "1 members"

### 4. Test Adding Members

**Steps:**
1. Click on your newly created group
2. In the group chat, click the **➕** button in the members sidebar
3. Search for a classmate by name
4. Click **"Add"** next to their name

**Expected Result:**
- ✅ User appears in the members list
- ✅ Member count increases
- ✅ They can now see and send messages

### 5. Test Group Messaging

**Steps:**
1. Type a message in the text box at the bottom
2. Press **Enter** or click **"Send"**
3. Your message should appear in the chat

**Expected Result:**
- ✅ Message appears immediately
- ✅ Shows your name and avatar
- ✅ Timestamp is displayed
- ✅ Message is blue (your messages)

### 6. Test Admin Controls

**Steps:**
1. Find a member in the sidebar
2. Click **"Make Admin"** button
3. Verify they now have an "Admin" badge

**To Remove a Member:**
1. Click **"Remove"** button next to a member
2. Confirm the action

**Expected Result:**
- ✅ Role changes immediately
- ✅ Admin badge appears/disappears
- ✅ Removed members disappear from list

### 7. Test Leave Group

**Steps:**
1. Click **"Leave"** button in the top right
2. Confirm you want to leave

**Expected Result:**
- ✅ You're redirected to `/groups`
- ✅ Group no longer appears in your list

## Common Issues & Solutions

### Issue: "Groups" link not showing in sidebar
**Solution:** Clear browser cache and refresh

### Issue: Cannot create group
**Solution:** Check browser console for errors, ensure server is running

### Issue: Cannot add members
**Solution:** Make sure you're an admin and the user exists

### Issue: Messages not appearing
**Solution:** Check that you're a member of the group

## API Endpoints to Test Manually

You can also test with curl/Postman:

### Create Group
```bash
curl -X POST http://localhost:4000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Group" \
  -F "description=Testing"
```

### Get My Groups
```bash
curl http://localhost:4000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Message
```bash
curl -X POST http://localhost:4000/api/groups/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello group!"}'
```

## Success Criteria

✅ All features working:
- [x] Database tables created
- [ ] Can create groups
- [ ] Can add members
- [ ] Can send messages
- [ ] Can promote to admin
- [ ] Can remove members
- [ ] Can leave group
- [ ] Admin controls work
- [ ] Non-admins cannot manage group

## Screenshots to Take

1. Groups list page
2. Create group modal
3. Group chat with messages
4. Members sidebar with admin badges
5. Add member search modal

Enjoy testing your new Groups feature! 🎓👥
