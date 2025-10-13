# Groups Feature - Quick Start Guide

## ✅ Setup Complete!

Your groups/conference feature is ready to use!

## What You Got

### 🎯 Core Features
- **Create Groups** - For classes, study sessions, or projects
- **Admin System** - Promote trusted members to help manage
- **Group Chat** - Real-time messaging with all members
- **Member Management** - Add/remove members easily
- **Role-Based Access** - Admins have special permissions

### 🔒 Security
- Only admins can add/remove members
- Only admins can promote other admins
- Group creator cannot be removed
- Members can leave anytime

## How to Use

### For Students:
1. **Click "Groups" in sidebar**
2. **Create a study group** for your class
3. **Add classmates** by searching their names
4. **Share notes and discuss** in the group chat
5. **Make trusted friends admins** to help manage

### For Teachers/TAs:
1. **Create a class group** for announcements
2. **Add all students** to the group
3. **Make TAs admins** so they can help
4. **Share resources** and answer questions

## Quick Commands

### Start Everything:
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client  
cd client
npm run dev
```

### Access the App:
Open browser to: `http://localhost:5173`

## File Structure

```
server/
├── sql/alter_add_groups.sql          # Database schema
├── src/routes/groups.js               # API endpoints
└── scripts/add_groups_tables.js       # Migration script

client/
├── src/pages/Groups.jsx               # Groups list
├── src/pages/GroupChat.jsx            # Group chat interface
└── src/styles/global.css              # Modal styles
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/groups` | Create group |
| GET | `/api/groups` | Get my groups |
| GET | `/api/groups/:id` | Get group details |
| POST | `/api/groups/:id/members` | Add member (admin) |
| DELETE | `/api/groups/:id/members/:userId` | Remove member (admin) |
| PUT | `/api/groups/:id/members/:userId/role` | Change role (admin) |
| GET | `/api/groups/:id/messages` | Get messages |
| POST | `/api/groups/:id/messages` | Send message |

## Example Use Cases

### 1. Study Group
```
Name: "Math 201 Study Group"
Description: "Weekly study sessions for Math 201"
Members: 5-10 students
Admins: 1-2 organizers
```

### 2. Project Team
```
Name: "Final Project - Team A"
Description: "Collaboration space for our final project"
Members: 3-5 team members
Admins: All members (everyone helps manage)
```

### 3. Class Announcements
```
Name: "CS101 - Fall 2025"
Description: "Official class announcements and discussions"
Members: All enrolled students
Admins: Professor + TAs
```

## Tips & Best Practices

### For Group Creators:
- ✅ Give your group a clear, descriptive name
- ✅ Add a description so members know the purpose
- ✅ Promote active members to admin
- ✅ Remove inactive members to keep chat focused

### For Admins:
- ✅ Welcome new members
- ✅ Keep conversations on-topic
- ✅ Share important resources
- ✅ Help answer questions

### For Members:
- ✅ Introduce yourself when joining
- ✅ Ask questions if you need help
- ✅ Share useful resources
- ✅ Be respectful and helpful

## Troubleshooting

### Groups link not showing?
- Refresh the page
- Clear browser cache
- Check that server is running

### Can't create group?
- Make sure you're logged in
- Check browser console for errors
- Verify server is running on port 4000

### Can't add members?
- Verify you're an admin
- Check that the user exists
- Make sure they're not already a member

## Next Steps

1. ✅ **Test the feature** - Create a test group
2. ✅ **Invite friends** - Add some classmates
3. ✅ **Send messages** - Try the chat
4. ✅ **Test admin controls** - Promote someone
5. ✅ **Customize** - Add your own features!

## Need Help?

Check these files:
- `GROUPS_FEATURE.md` - Complete documentation
- `TESTING_GROUPS.md` - Detailed testing guide
- Server logs - Check for API errors
- Browser console - Check for frontend errors

---

**Ready to go!** Start your servers and create your first group! 🚀
