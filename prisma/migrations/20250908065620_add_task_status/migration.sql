-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('TODO', 'DONE');

-- AlterTable
ALTER TABLE "public"."Card" ADD COLUMN     "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO';
