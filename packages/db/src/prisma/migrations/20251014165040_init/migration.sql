-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "public"."JobSource" AS ENUM ('PLATSBANKEN', 'LINKEDIN', 'INDEED', 'STEPSTONE', 'GLASSDOOR');

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "id_token" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cv" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "typst_source" TEXT,
    "pdf_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "removed_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3) NOT NULL,
    "last_publication_date" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "last_checked" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "company_id" TEXT,
    "employment_type" TEXT,
    "working_hours_type" TEXT,
    "duration" TEXT,
    "vacancies" INTEGER,
    "start_date" TIMESTAMP(3),
    "workload_min" DOUBLE PRECISION,
    "workload_max" DOUBLE PRECISION,
    "salary_min" DOUBLE PRECISION,
    "salary_max" DOUBLE PRECISION,
    "salary_currency" TEXT,
    "salary_period" TEXT,
    "salary_type" TEXT,
    "salary_description" TEXT,
    "occupation" TEXT,
    "occupation_group" TEXT,
    "occupation_field" TEXT,
    "experience_required" BOOLEAN NOT NULL DEFAULT false,
    "driving_license_required" BOOLEAN NOT NULL DEFAULT false,
    "access_to_own_car" BOOLEAN NOT NULL DEFAULT false,
    "application_deadline" TIMESTAMP(3),
    "application_instructions" TEXT,
    "application_url" TEXT,
    "application_email" TEXT,
    "application_reference" TEXT,
    "application_via_af" BOOLEAN NOT NULL DEFAULT false,
    "application_other" TEXT,
    "workplace" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "street_address" TEXT,
    "city" TEXT,
    "municipality" TEXT,
    "municipality_code" TEXT,
    "region" TEXT,
    "region_code" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SE',
    "country_code" TEXT,
    "location_formatted" TEXT,
    "coordinates" geometry(Point, 4326),
    "search_text" TEXT,
    "relevance_vector" vector(1536),

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_source_link" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "source" "public"."JobSource" NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_url" TEXT,
    "discovered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_source_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_number" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "description" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_requirement" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "weight" INTEGER,

    CONSTRAINT "job_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_contact" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "description" TEXT,

    CONSTRAINT "job_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "public"."session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "public"."account"("user_id");

-- CreateIndex
CREATE INDEX "cv_user_id_idx" ON "public"."cv"("user_id");

-- CreateIndex
CREATE INDEX "job_removed_published_at_idx" ON "public"."job"("removed", "published_at");

-- CreateIndex
CREATE INDEX "job_company_id_idx" ON "public"."job"("company_id");

-- CreateIndex
CREATE INDEX "job_employment_type_idx" ON "public"."job"("employment_type");

-- CreateIndex
CREATE INDEX "job_remote_idx" ON "public"."job"("remote");

-- CreateIndex
CREATE INDEX "job_city_idx" ON "public"."job"("city");

-- CreateIndex
CREATE INDEX "job_municipality_idx" ON "public"."job"("municipality");

-- CreateIndex
CREATE INDEX "job_region_idx" ON "public"."job"("region");

-- CreateIndex
CREATE INDEX "job_country_idx" ON "public"."job"("country");

-- CreateIndex
CREATE INDEX "job_occupation_idx" ON "public"."job"("occupation");

-- CreateIndex
CREATE INDEX "job_occupation_group_idx" ON "public"."job"("occupation_group");

-- CreateIndex
CREATE INDEX "job_occupation_field_idx" ON "public"."job"("occupation_field");

-- CreateIndex
CREATE INDEX "job_source_link_job_id_idx" ON "public"."job_source_link"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_source_link_source_source_id_key" ON "public"."job_source_link"("source", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_organization_number_key" ON "public"."company"("organization_number");

-- CreateIndex
CREATE INDEX "company_name_idx" ON "public"."company"("name");

-- CreateIndex
CREATE INDEX "company_organization_number_idx" ON "public"."company"("organization_number");

-- CreateIndex
CREATE INDEX "job_requirement_job_id_idx" ON "public"."job_requirement"("job_id");

-- CreateIndex
CREATE INDEX "job_requirement_category_idx" ON "public"."job_requirement"("category");

-- CreateIndex
CREATE INDEX "job_requirement_requirement_type_idx" ON "public"."job_requirement"("requirement_type");

-- CreateIndex
CREATE INDEX "job_requirement_label_idx" ON "public"."job_requirement"("label");

-- CreateIndex
CREATE INDEX "job_contact_job_id_idx" ON "public"."job_contact"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cv" ADD CONSTRAINT "cv_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job" ADD CONSTRAINT "job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_source_link" ADD CONSTRAINT "job_source_link_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_requirement" ADD CONSTRAINT "job_requirement_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_contact" ADD CONSTRAINT "job_contact_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
