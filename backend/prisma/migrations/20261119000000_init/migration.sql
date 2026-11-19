-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "log_source" AS ENUM ('manual', 'patients', 'diagnostics', 'system');

-- CreateTable
CREATE TABLE "dataset_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "seed" INTEGER NOT NULL,
    "generated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dataset_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "ward" TEXT NOT NULL,
    "heart_rate" INTEGER NOT NULL,
    "systolic" INTEGER NOT NULL,
    "diastolic" INTEGER NOT NULL,
    "spo2" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "admitted_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_results" (
    "id" TEXT NOT NULL,
    "test" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "diagnostic_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_wait_times" (
    "department" TEXT NOT NULL,
    "avg_wait_minutes" INTEGER NOT NULL,
    "patient_count" INTEGER NOT NULL,

    CONSTRAINT "department_wait_times_pkey" PRIMARY KEY ("department")
);

-- CreateTable
CREATE TABLE "interaction_events" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "source" "log_source" NOT NULL,
    "section" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "patient_id" TEXT,
    "target_id" TEXT,
    "stress_mode" BOOLEAN,
    "ms_since_section_open" INTEGER,
    "ms_since_alarm_onset" INTEGER,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_ward_idx" ON "patients"("ward");

-- CreateIndex
CREATE INDEX "diagnostic_results_patient_id_idx" ON "diagnostic_results"("patient_id");

-- CreateIndex
CREATE INDEX "interaction_events_session_id_idx" ON "interaction_events"("session_id");

-- CreateIndex
CREATE INDEX "interaction_events_user_id_timestamp_idx" ON "interaction_events"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "interaction_events_timestamp_idx" ON "interaction_events"("timestamp");

-- AddForeignKey
ALTER TABLE "diagnostic_results" ADD CONSTRAINT "diagnostic_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

