import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toCsv, csvCell } from "../../lib/csv";
import { EVENTS, registrationAmountInr } from "../../lib/events/catalog";
import { calculateRegistrationAmount } from "../../lib/pricing";
import { resolveQuizAccess } from "../../lib/quiz-access";
import { detectImageMimeType, validateScreenshotClientSide } from "../../lib/validation/file";
import {
  individualRegistrationSchema,
  normalizePhone,
  normalizeUtr,
  paymentProofSchema,
  teamRegistrationSchema,
} from "../../lib/validation/registration";

const member = { name: "A", email: "a@example.com", phone: "9876543210", department: "CSE", year: "1st Year" };
const team = (n: number) => ({
  teamName: "T",
  college: "C",
  leaderName: "L",
  leaderEmail: "l@example.com",
  leaderPhone: "+91 98765 43210",
  members: Array.from({ length: n }, () => member),
});

describe("pricing", () => {
  test("amounts per event", () => {
    assert.equal(calculateRegistrationAmount(EVENTS.hackathon), 200);
    assert.equal(calculateRegistrationAmount(EVENTS.debate), 50);
    assert.equal(calculateRegistrationAmount(EVENTS["ipl-auction"]), 200);
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

describe("team validation", () => {
  test("exactly 4 members", () => {
    assert.equal(teamRegistrationSchema.safeParse(team(4)).success, true);
    for (const n of [0, 3, 5]) assert.equal(teamRegistrationSchema.safeParse(team(n)).success, false, `n=${n}`);
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
