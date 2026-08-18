import { describe, expect, it } from "vitest";
import { AppDatabase } from "../../src/db/db";
import type { StudentRecord } from "../../src/domain/models/student";
import {
  HARDCODED_STUDENT_GROUP_FALLBACK,
  assessHardcodedStudentGroupCleanupCandidate,
  readHardcodedStudentGroupCleanupCandidates
} from "../../src/features/students/services/studentCleanupCandidates";
import { createSearchText, normalizeText } from "../../src/utils/normalizeText";

const timestamp = "2026-06-01T10:00:00.000Z";

async function createDatabase() {
  const database = new AppDatabase(`test-student-cleanup-candidates-${crypto.randomUUID()}`);
  await database.open();
  return database;
}

function student(overrides: Partial<StudentRecord> = {}): StudentRecord {
  const fullName = overrides.student_full_name ?? "Ayse Yilmaz";

  return {
    uuid: crypto.randomUUID(),
    student_full_name: fullName,
    normalized_student_name: normalizeText(fullName),
    search_text: createSearchText([fullName]),
    current_class: "8",
    student_group: HARDCODED_STUDENT_GROUP_FALLBACK,
    category: "YKS",
    campaign_id: null,
    lifecycle_status: "candidate",
    last_call_result: "not_called",
    source_file_name: "pilot.xlsx",
    source_sheet_name: "Sayfa1",
    source_row_number: 6,
    general_note: null,
    sync_status: "local",
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
    ...overrides
  };
}

describe("readHardcodedStudentGroupCleanupCandidates", () => {
  it("reports current_class 8 with the hardcoded fallback as high confidence", async () => {
    const database = await createDatabase();

    try {
      const id = await database.students.add(student({ student_full_name: "Yaren Beren Kızıl" }));

      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(candidates).toEqual([
        expect.objectContaining({
          id,
          full_name: "Yaren Beren Kızıl",
          current_class: "8",
          student_group: HARDCODED_STUDENT_GROUP_FALLBACK,
          category: "YKS",
          updated_at: timestamp,
          risk_level: "high_confidence"
        })
      ]);
      expect(candidates[0].reason).toContain("sınıf 8");
      expect(candidates[0].reason).toContain("Kategori de YKS");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not report current_class 11 with the hardcoded fallback", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student({ current_class: "11" }));

      await expect(readHardcodedStudentGroupCleanupCandidates(database)).resolves.toEqual([]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not report an unrelated student group", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student({ current_class: "8", student_group: "8. Sınıf LGS Hazırlık" }));

      await expect(readHardcodedStudentGroupCleanupCandidates(database)).resolves.toEqual([]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("does not report an empty student group", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student({ current_class: "8", student_group: "" }));

      await expect(readHardcodedStudentGroupCleanupCandidates(database)).resolves.toEqual([]);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("reports blank current_class with the hardcoded fallback as needs_review", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student({ current_class: null }));

      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toMatchObject({
        current_class: null,
        risk_level: "needs_review"
      });
      expect(candidates[0].reason).toContain("sınıf bilgisi boş veya net yorumlanamıyor");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("carries source metadata in the candidate report", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(
        student({
          current_class: "7",
          source_file_name: "import-pilot.xlsx",
          source_sheet_name: "Adaylar",
          source_row_number: 42,
          created_at: "2026-06-01T11:00:00.000Z",
          updated_at: "2026-06-01T11:30:00.000Z"
        })
      );

      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(candidates[0]).toMatchObject({
        current_class: "7",
        source_file_name: "import-pilot.xlsx",
        source_sheet_name: "Adaylar",
        source_row_number: 42,
        created_at: "2026-06-01T11:00:00.000Z",
        updated_at: "2026-06-01T11:30:00.000Z"
      });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("reports LGS-labeled current_class with the fallback as high confidence", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student({ current_class: "LGS", category: "Diger" }));

      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toMatchObject({
        current_class: "LGS",
        category: "Diger",
        risk_level: "high_confidence"
      });
      expect(candidates[0].reason).toContain("LGS");
      expect(candidates[0].reason).not.toContain("Kategori de YKS");
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("keeps unrecognized class labels as needs_review", async () => {
    const database = await createDatabase();

    try {
      await database.students.add(student({ current_class: "Mezun", category: "Diger" }));

      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toMatchObject({ current_class: "Mezun", risk_level: "needs_review" });
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("excludes deleted records and preserves exact fallback matching semantics", async () => {
    const database = await createDatabase();

    try {
      await database.students.bulkAdd([
        student({ deleted_at: "2026-06-01T12:00:00.000Z" }),
        student({ student_group: `  ${HARDCODED_STUDENT_GROUP_FALLBACK}  ` }),
        student({ student_group: HARDCODED_STUDENT_GROUP_FALLBACK.toLocaleLowerCase("tr-TR") })
      ]);

      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].student_group).toBe(`  ${HARDCODED_STUDENT_GROUP_FALLBACK}  `);
    } finally {
      database.close();
      await database.delete();
    }
  });

  it("uses the same assessment for the reader and correction revalidation", async () => {
    const database = await createDatabase();

    try {
      const id = await database.students.add(student({ current_class: "9" }));
      const storedStudent = await database.students.get(id);
      const candidates = await readHardcodedStudentGroupCleanupCandidates(database);

      expect(storedStudent).toBeDefined();
      expect(assessHardcodedStudentGroupCleanupCandidate(storedStudent!)).toEqual({
        risk_level: candidates[0].risk_level,
        reason: candidates[0].reason
      });
    } finally {
      database.close();
      await database.delete();
    }
  });
});
