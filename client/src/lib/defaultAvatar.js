// Default avatar for users without profile pictures
export const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="100" cy="100" r="100" fill="%232A2B55"/%3E%3Ccircle cx="100" cy="80" r="35" fill="%2355568A"/%3E%3Cpath d="M100 140C127.614 140 150 157.909 150 180V200H50V180C50 157.909 72.3858 140 100 140Z" fill="%2355568A"/%3E%3C/svg%3E'

// Helper function to get avatar URL with fallback
export function getAvatarUrl(profilePic) {
  return profilePic || DEFAULT_AVATAR
}
