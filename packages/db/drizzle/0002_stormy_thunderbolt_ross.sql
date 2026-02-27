ALTER TABLE "activity_log" ADD COLUMN "document_id" uuid;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_project_id_idx" ON "activity_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "activity_log_document_id_idx" ON "activity_log" USING btree ("document_id");