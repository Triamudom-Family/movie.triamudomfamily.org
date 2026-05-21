-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "movie";

-- CreateEnum
CREATE TYPE "movie"."SeatStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BLOCKED', 'BROKEN');

-- CreateEnum
CREATE TYPE "movie"."Role" AS ENUM ('STAFF', 'ADMIN', 'STUDENT');

-- CreateTable
CREATE TABLE "movie"."Event" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "venue" TEXT,
    "showAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "movie"."Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie"."Student" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "rollNumber" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "seatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie"."Seat" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "row" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "movie"."SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "bookedBy" TEXT,
    "bookedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("eventId","id")
);

-- CreateTable
CREATE TABLE "movie"."BookingLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "studentId" TEXT,
    "action" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "BookingLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie"."SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "movie"."Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_year_key" ON "movie"."Event"("year");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "movie"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "movie"."User"("email");

-- CreateIndex
CREATE INDEX "Student_eventId_idx" ON "movie"."Student"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_eventId_userId_key" ON "movie"."Student"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_eventId_googleId_key" ON "movie"."Student"("eventId", "googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_eventId_email_key" ON "movie"."Student"("eventId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_eventId_studentId_key" ON "movie"."Student"("eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_eventId_qrToken_key" ON "movie"."Student"("eventId", "qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "Student_eventId_seatId_key" ON "movie"."Student"("eventId", "seatId");

-- CreateIndex
CREATE INDEX "Seat_eventId_idx" ON "movie"."Seat"("eventId");

-- CreateIndex
CREATE INDEX "Seat_row_idx" ON "movie"."Seat"("row");

-- CreateIndex
CREATE INDEX "Seat_status_idx" ON "movie"."Seat"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_eventId_row_number_key" ON "movie"."Seat"("eventId", "row", "number");

-- CreateIndex
CREATE INDEX "BookingLog_eventId_idx" ON "movie"."BookingLog"("eventId");

-- CreateIndex
CREATE INDEX "BookingLog_performedAt_idx" ON "movie"."BookingLog"("performedAt");

-- CreateIndex
CREATE INDEX "BookingLog_seatId_idx" ON "movie"."BookingLog"("seatId");

-- CreateIndex
CREATE INDEX "BookingLog_performedBy_idx" ON "movie"."BookingLog"("performedBy");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "movie"."Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "movie"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "movie"."Session"("token");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "movie"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "movie"."Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "movie"."Verification"("identifier");

-- AddForeignKey
ALTER TABLE "movie"."Student" ADD CONSTRAINT "Student_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "movie"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie"."Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "movie"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie"."Student" ADD CONSTRAINT "Student_eventId_seatId_fkey" FOREIGN KEY ("eventId", "seatId") REFERENCES "movie"."Seat"("eventId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie"."Seat" ADD CONSTRAINT "Seat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "movie"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie"."BookingLog" ADD CONSTRAINT "BookingLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "movie"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "movie"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "movie"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

