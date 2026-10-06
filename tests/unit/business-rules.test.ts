import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toCsv, csvCell } from "../../lib/csv";
import { EVENTS, registrationAmountInr } from "../../lib/events/catalog";
import { capacityFrom, registrationFullMessage } from "../../lib/events/capacity";
import { aspectsComparable, changedPixels, FINGERPRINT_BYTES, looksIdentical } from "../../lib/images/similarity";
import { calculateRegistrationAmount } from "../../lib/pricing";
import { normalizeRegistrationCode } from "../../lib/registration-id";
import { debateSurveySchema, DEBATE_SURVEY_QUESTIONS } from "../../lib/events/debate-survey";
import { resolveQuizAccess } from "../../lib/quiz-access";
import { detectImageMimeType, validateScreenshotClientSide } from "../../lib/validation/file";
import {
  individualRegistrationSchema,
  normalizePhone,
  normalizeUtr,
  paymentProofSchema,
  teamRegistrationSchema,
  teamRegistrationSchemaFor,
} from "../../lib/validation/registration";

const member = { name: "A", email: "a@example.com", phone: "9876543210", department: "CSE", year: "1st Year" };
const team = (n: number) => ({
  teamName: "T",
  college: "C",
  leaderName: "L",
  leaderEmail: "l@example.com",
  leaderPhone: "+91 98765 43210",
  theme: "AGENTIC_AI",
  members: Array.from({ length: n }, () => member),
});

describe("pricing", () => {
  test("amounts per event", () => {
    assert.equal(calculateRegistrationAmount(EVENTS.hackathon), 200);
    assert.equal(calculateRegistrationAmount(EVENTS.debate), 50);
    assert.equal(calculateRegistrationAmount(EVENTS["ipl-auction"]), 50);
    assert.equal(calculateRegistrationAmount(EVENTS.illuminate), 799);
    assert.equal(registrationAmountInr(EVENTS.illuminate), 799);
  });
  test("rejects invalid configuration", () => {
    assert.throws(() => calculateRegistrationAmount({ feePerPersonInr: 0, teamSize: 4 }));
    assert.throws(() => calculateRegistrationAmount({ feePerPersonInr: 50, teamSize: 0 }));
  });
  test("event structure: Illuminate only on Day 2, no video editing event", () => {
    assert.equal(EVENTS.illuminate.day, 2);
    assert.deepEqual(
      Object.values(EVENTS).filter((e) => e.day === 1).map((e) => e.slug),
      ["hackathon", "debate", "ipl-auction"],
    );
    assert.ok(!JSON.stringify(EVENTS).toLowerCase().includes("video"));
  });
});

describe("registration caps", () => {
  test("Mind x Machine: 50 participants; IPL Auction (individual) and the others unlimited", () => {
    assert.equal(EVENTS["ipl-auction"].format, "INDIVIDUAL");
    assert.equal(EVENTS["ipl-auction"].maxRegistrations, undefined);
    assert.equal(EVENTS.debate.maxRegistrations, 50);
    assert.equal(EVENTS.hackathon.maxRegistrations, undefined);
    assert.equal(EVENTS.illuminate.maxRegistrations, undefined);
  });
  test("full exactly at the cap", () => {
    assert.deepEqual(capacityFrom(10, 9), { cap: 10, taken: 9, remaining: 1, full: false });
    assert.equal(capacityFrom(10, 10).full, true);
    assert.equal(capacityFrom(10, 12).remaining, 0);
    assert.equal(capacityFrom(null, 500).full, false);
  });
  test("messages", () => {
    assert.equal(
      registrationFullMessage(EVENTS.hackathon, 10),
      "Registration limit reached. All 10 team spots for Deja Vu Hackathon have been filled.",
    );
    assert.equal(
      registrationFullMessage(EVENTS.debate, 50),
      "Registration limit reached. All 50 spots for Mind x Machine: The AI Debate ARENA have been filled.",
    );
  });
});

describe("team validation", () => {
  test("exactly 4 members", () => {
    assert.equal(teamRegistrationSchema.safeParse(team(4)).success, true);
    for (const n of [0, 3, 5]) assert.equal(teamRegistrationSchema.safeParse(team(n)).success, false, `n=${n}`);
  });
  test("Deja Vu teams must pick one of the three themes; other team events ignore it", () => {
    const { theme: _theme, ...noTheme } = team(4);
    const missing = teamRegistrationSchema.safeParse(noTheme);
    assert.equal(missing.success, false);
    assert.equal(missing.error?.issues[0]?.path[0], "theme");
    assert.equal(teamRegistrationSchema.safeParse({ ...team(4), theme: "BLOCKCHAIN" }).success, false);
    for (const theme of ["AGENTIC_AI", "HARDWARE_EMBEDDED", "CAMPUS_SOLVE"]) {
      assert.equal(teamRegistrationSchema.safeParse({ ...team(4), theme }).success, true, theme);
    }
    const unthemed = teamRegistrationSchemaFor(5);
    assert.equal(unthemed.safeParse({ ...team(5), theme: "" }).success, true);
    assert.equal(unthemed.parse({ ...team(5), theme: "BLOCKCHAIN" }).theme, undefined);
    assert.deepEqual(EVENTS.hackathon.highlights[0]?.items, ["Agentic AI", "Hardware and Embedded Systems", "CampusSolve"]);
  });
  test("team size comes from the event", () => {
    const five = teamRegistrationSchemaFor(5);
    assert.equal(five.safeParse(team(5)).success, true);
    for (const n of [4, 6]) assert.equal(five.safeParse(team(n)).success, false, `n=${n}`);
  });
  test("strips unknown keys such as a client-sent amount", () => {
    const parsed = teamRegistrationSchema.parse({ ...team(4), amount: 1 });
    assert.ok(!("amount" in parsed));
    assert.equal(parsed.leaderPhone, "9876543210");
  });
  test("individual validation messages", () => {
    const r = individualRegistrationSchema.safeParse({ fullName: " ", email: "x", phone: "123", college: "C", department: "D", year: "9th" });
    assert.equal(r.success, false);
  });
  test("rejects markup", () => {
    assert.equal(individualRegistrationSchema.safeParse({ fullName: "<script>", email: "a@b.co", phone: "9876543210", college: "C", department: "D", year: "Other" }).success, false);
  });
});

describe("normalisation", () => {
  test("UTR", () => {
    assert.equal(normalizeUtr(" 1234 5678-9012 "), "123456789012");
    assert.equal(normalizeUtr("axis123abc"), "AXIS123ABC");
    assert.equal(paymentProofSchema.safeParse({ utr: "12$45678" }).success, false);
    assert.equal(paymentProofSchema.safeParse({ utr: "123" }).success, false);
  });
  test("phone", () => {
    assert.equal(normalizePhone("+91 98765-43210"), "9876543210");
    assert.equal(normalizePhone("098765 43210"), "9876543210");
  });
});

describe("screenshot validation", () => {
  test("magic bytes", () => {
    assert.equal(detectImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
    assert.equal(detectImageMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
    assert.equal(detectImageMimeType(new TextEncoder().encode("RIFF____WEBPVP8 ")), "image/webp");
    assert.equal(detectImageMimeType(new TextEncoder().encode("GIF89a")), null);
    assert.equal(detectImageMimeType(new TextEncoder().encode("<svg")), null);
  });
  test("client-side checks", () => {
    assert.equal(validateScreenshotClientSide({ name: "a.PNG", type: "image/png", size: 10 }), null);
    assert.ok(validateScreenshotClientSide({ name: "a.pdf", type: "application/pdf", size: 10 }));
    assert.ok(validateScreenshotClientSide({ name: "a.jpg", type: "image/jpeg", size: 6 * 1024 * 1024 }));
  });
});

describe("quiz access rule", () => {
  const cfg = { enabled: true, quizLink: "https://example.com/q", accessRule: "AFTER_SUBMISSION" as const };
  test("after submission", () => {
    assert.equal(resolveQuizAccess(cfg, "PENDING").state, "available");
    assert.equal(resolveQuizAccess(cfg, "REJECTED").state, "payment_rejected");
  });
  test("after verification", () => {
    const strict = { ...cfg, accessRule: "AFTER_VERIFICATION" as const };
    assert.equal(resolveQuizAccess(strict, "PENDING").state, "awaiting_verification");
    assert.equal(resolveQuizAccess(strict, "VERIFIED").state, "available");
  });
  test("disabled or missing link", () => {
    assert.equal(resolveQuizAccess({ ...cfg, enabled: false }, "VERIFIED").state, "not_available");
    assert.equal(resolveQuizAccess({ ...cfg, quizLink: null }, "VERIFIED").state, "not_available");
  });
});

describe("csv", () => {
  test("escapes and neutralises formulas", () => {
    assert.equal(csvCell('a,"b"'), '"a,""b"""');
    assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
    assert.equal(csvCell("+91"), "'+91");
    assert.equal(csvCell(null), "");
    assert.ok(toCsv(["h"], [["v"]]).startsWith("﻿h\r\nv"));
  });
});

describe("re-used screenshot detection", () => {
  const base = () => new Uint8Array(FINGERPRINT_BYTES).fill(200);
  const with_ = (changes: number, delta: number) => {
    const fp = base();
    for (let i = 0; i < changes; i++) fp[i * 97] = 200 - delta;
    return fp;
  };

  test("small grey-level noise (re-compression) is not a change", () => {
    assert.equal(changedPixels(base(), with_(500, 30)), 0);
  });

  test("a re-saved copy matches; a receipt with different text lines does not", () => {
    const a = { fingerprint: base(), aspect: 0.455 };
    assert.ok(looksIdentical(a, { fingerprint: with_(2, 120), aspect: 0.456 }));
    assert.ok(!looksIdentical(a, { fingerprint: with_(7, 120), aspect: 0.455 }));
  });

  test("screenshots of different shapes are never compared", () => {
    assert.ok(aspectsComparable(0.45, 0.455));
    assert.ok(!aspectsComparable(0.45, 0.5625));
    assert.ok(!looksIdentical({ fingerprint: base(), aspect: 0.45 }, { fingerprint: base(), aspect: 0.5625 }));
  });

  test("a fingerprint of the wrong size never matches", () => {
    assert.equal(changedPixels(base(), new Uint8Array(10)), FINGERPRINT_BYTES);
  });
});

describe("registration IDs typed at login", () => {
  test("common ways of typing an ID all mean the same registration", () => {
    for (const typed of ["INV-08", "inv-08", " INV 08 ", "INV08", "INV-8", "INV–08", "INV—08", "INV-O8", "inv_08", "08", "8"]) {
      assert.equal(normalizeRegistrationCode(typed), "INV-08", JSON.stringify(typed));
    }
    assert.equal(normalizeRegistrationCode("INV-100"), "INV-100");
  });
  test("phone numbers and passwords are not mistaken for IDs", () => {
    assert.equal(normalizeRegistrationCode("9394813935"), "9394813935");
    assert.equal(normalizeRegistrationCode("Secret-Pass1"), "SECRETPASS1");
    assert.equal(normalizeRegistrationCode("OOO"), "OOO");
  });
});

describe("Mind x Machine survey", () => {
  const full = { llm: "large-language-model", bias: "algorithmic-bias", deepfake: "deepfake", familiarity: "never", jobsStance: "agree" };
  test("all five multiple-choice answers are required; the topic is optional", () => {
    assert.equal(debateSurveySchema.safeParse(full).success, true);
    assert.equal(debateSurveySchema.parse({ ...full, topic: "  " }).topic, undefined);
    for (const key of Object.keys(full)) {
      const { [key as keyof typeof full]: _removed, ...rest } = full;
      assert.equal(debateSurveySchema.safeParse(rest).success, false, key);
    }
    assert.equal(debateSurveySchema.safeParse({ ...full, topic: "x".repeat(301) }).success, false);
  });
  test("three knowledge and two opinion questions, each with real options", () => {
    assert.equal(DEBATE_SURVEY_QUESTIONS.filter((q) => q.kind === "knowledge").length, 3);
    assert.equal(DEBATE_SURVEY_QUESTIONS.filter((q) => q.kind === "opinion").length, 2);
    for (const q of DEBATE_SURVEY_QUESTIONS) assert.ok(q.options.length >= 3, q.id);
  });
});
