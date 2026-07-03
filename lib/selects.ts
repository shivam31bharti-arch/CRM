// Shared Prisma selections for records that contain secrets.
// Never return OAuth access or refresh tokens to a browser response.
export const safeSocialAccountSelect = {
  id: true,
  platform: true,
  accountName: true,
  accountId: true,
  avatarUrl: true,
  followerCount: true,
  isActive: true,
  tokenExpiry: true,
  createdAt: true,
  updatedAt: true
} as const;
