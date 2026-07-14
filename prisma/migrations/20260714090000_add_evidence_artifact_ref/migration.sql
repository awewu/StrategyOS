-- 证据接地门：L3+ 证据须挂物证（URL/文件/文档编号），否则级别封顶 L2
ALTER TABLE "innovation_evidence" ADD COLUMN "artifact_ref" VARCHAR(300);
