-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "fullname" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL;
