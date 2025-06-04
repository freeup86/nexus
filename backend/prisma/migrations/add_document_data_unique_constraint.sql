-- CreateIndex
CREATE UNIQUE INDEX "DocumentData_documentId_fieldName_key" ON "DocumentData"("documentId", "fieldName");