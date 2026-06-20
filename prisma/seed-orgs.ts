/**
 * 种子数据: 瑞合瑞德三级组织结构
 * 集团 → 高管层(8个) → 执行层示例
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding org structure...");

  // 层级1: 集团
  const group = await prisma.orgUnit.upsert({
    where: { id: "org-group-rhautt" },
    update: {},
    create: {
      id: "org-group-rhautt",
      name: "瑞合瑞德集团",
      nameEn: "RHAUTT GROUP",
      level: "GROUP",
      sortOrder: 1,
    },
  });

  // 层级2: 高管层 (产品事业部 + 职能体系)
  const executives = [
    { id: "org-exec-ac", name: "空调事业部", nameEn: "Air Conditioning BU", sortOrder: 10 },
    { id: "org-exec-hw", name: "热水事业部", nameEn: "Hot Water BU", sortOrder: 20 },
    { id: "org-exec-brand", name: "品牌事业部", nameEn: "Brand BU", sortOrder: 30 },
    { id: "org-exec-rd", name: "研发中心", nameEn: "R&D Center", sortOrder: 40 },
    { id: "org-exec-mfg", name: "制造事业部", nameEn: "Manufacturing BU", sortOrder: 50 },
    { id: "org-exec-cmo", name: "CMO", nameEn: "Chief Marketing Officer", sortOrder: 60 },
    { id: "org-exec-hr", name: "HR", nameEn: "Human Resources", sortOrder: 70 },
    { id: "org-exec-finance", name: "财务", nameEn: "Finance", sortOrder: 80 },
  ];

  for (const exec of executives) {
    await prisma.orgUnit.upsert({
      where: { id: exec.id },
      update: {},
      create: { ...exec, level: "EXECUTIVE", parentId: group.id },
    });
  }

  // 层级3: 执行层示例 (各事业部/体系下的二级部门)
  const operatingUnits = [
    // 空调事业部下
    { id: "org-op-ac-commercial", name: "商用空调部", parentId: "org-exec-ac", sortOrder: 11 },
    { id: "org-op-ac-residential", name: "家用空调部", parentId: "org-exec-ac", sortOrder: 12 },
    // 热水事业部下
    { id: "org-op-hw-heatpump", name: "热泵产品部", parentId: "org-exec-hw", sortOrder: 21 },
    { id: "org-op-hw-storage", name: "储水产品部", parentId: "org-exec-hw", sortOrder: 22 },
    // 研发中心下
    { id: "org-op-rd-core", name: "核心技术部", parentId: "org-exec-rd", sortOrder: 41 },
    { id: "org-op-rd-product", name: "产品开发部", parentId: "org-exec-rd", sortOrder: 42 },
    // 制造事业部下
    { id: "org-op-mfg-supply", name: "供应链部", parentId: "org-exec-mfg", sortOrder: 51 },
    { id: "org-op-mfg-quality", name: "质量管理部", parentId: "org-exec-mfg", sortOrder: 52 },
    // HR下
    { id: "org-op-hr-talent", name: "人才发展部", parentId: "org-exec-hr", sortOrder: 71 },
    // 财务下
    { id: "org-op-finance-fpa", name: "FP&A", parentId: "org-exec-finance", sortOrder: 81 },
  ];

  for (const unit of operatingUnits) {
    await prisma.orgUnit.upsert({
      where: { id: unit.id },
      update: {},
      create: { ...unit, level: "OPERATING_UNIT", nameEn: unit.name },
    });
  }

  console.log("✓ Org structure seeded");
  console.log(`  - 1 GROUP`);
  console.log(`  - ${executives.length} EXECUTIVE units`);
  console.log(`  - ${operatingUnits.length} OPERATING_UNIT samples`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
