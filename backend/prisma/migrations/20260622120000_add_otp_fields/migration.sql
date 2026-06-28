-- Add OTP authentication fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp" VARCHAR(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otp_expires_at" TIMESTAMPTZ;
