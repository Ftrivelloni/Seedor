-- DropForeignKey: Remove old foreign keys without proper onDelete behavior
ALTER TABLE "Invitation" DROP CONSTRAINT IF EXISTS "Invitation_invitedBy_fkey";
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_invitedById_fkey";

-- AddForeignKey: Add foreign key with CASCADE for Invitation.invitedBy
-- When a user is deleted, all invitations they sent are also deleted
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedBy_fkey" 
  FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Add foreign key with SET NULL for User.invitedById
-- When a user is deleted, users they invited have their invitedById set to NULL
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" 
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
