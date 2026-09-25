/**
 * End-to-end API tests against a running server (`npm run build && npm start`).
 *
 * ⚠️  These tests WRITE registrations to the database. Run them only against a
 * development database. They refuse to run unless E2E_ALLOW_WRITES=true.
 *
 *   E2E_ALLOW_WRITES=true E2E_BASE_URL=http://localhost:3000 \
 *   E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… npm run test:e2e
 */
import assert from "node:assert/strict";
import { randomBytes, randomInt } from "node:crypto";
import { after, before, describe, test } from "node:test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

if (process.env.E2E_ALLOW_WRITES !== "true") {
  console.error("Refusing to run: set E2E_ALLOW_WRITES=true (development database only).");
  process.exit(1);
}

// 1×1 PNG
const PNG: Buffer<ArrayBuffer> = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

type Json = Record<string, unknown> & { ok: boolean; data?: any; error?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

const fakeIp = () => `10.${randomInt(255)}.${randomInt(255)}.${randomInt(255)}`;
const uniqueUtr = () => `E2E${Date.now()}${randomBytes(3).toString("hex").toUpperCase()}`;
const phone = () => `9${String(randomInt(100_000_000, 999_999_999))}`;

function member(i: number) {
  return { name: `E2E Member ${i}`, email: `e2e.member${i}@example.com`, phone: phone(), department: "CSE", year: "3rd Year" };
}

function teamDetails(count = 4) {
  return {
    teamName: `E2E Team ${randomBytes(2).toString("hex")}`,
    college: "E2E Test College",
    leaderName: "E2E Leader",
    leaderEmail: "e2e.leader@example.com",
    leaderPhone: phone(),
    members: Array.from({ length: count }, (_, i) => member(i + 1)),
    // Tampering attempts — must be ignored by the server:
    amount: 1,
    amountInr: 1,
    status: "VERIFIED",
  };
}

function individualDetails() {
  return {
    fullName: "E2E Individual",
    email: "e2e.individual@example.com",
    phone: phone(),
    college: "E2E Test College",
    department: "ECE",
    year: "2nd Year",
    amount: 1,
  };
}

async function register(
  slug: string,
  details: unknown,
  utr: string,
  file: { bytes: Uint8Array<ArrayBuffer>; name: string; type: string } = { bytes: PNG, name: "payment.png", type: "image/png" },
) {
  const form = new FormData();
  form.set("details", JSON.stringify(details));
  form.set("utr", utr);
  form.set("amount", "1");
  form.set("screenshot", new Blob([file.bytes], { type: file.type }), file.name);
  const res = await fetch(`${BASE}/api/registrations/${slug}`, { method: "POST", body: form, headers: { "x-forwarded-for": fakeIp() } });
  return { status: res.status, body: (await res.json()) as Json };
}

let cookie = "";

async function admin(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: { Cookie: cookie, Origin: BASE, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  return res;
}

async function adminJson(path: string, init: RequestInit = {}) {
  const res = await admin(path, init);
  return { status: res.status, body: (await res.json()) as Json };
}

/** Returns "name=value" for the named cookie from a response's Set-Cookie headers. */
function cookieFrom(res: Response, name: string): string {
  const header = res.headers.getSetCookie().find((c) => c.startsWith(`${name}=`) && !c.startsWith(`${name}=;`));
  assert.ok(header, `response sets ${name}`);
  return header.split(";")[0]!;
}

const created: Record<string, { registrationId: string; utr: string }> = {};
let originalQuiz: { quizLink: string | null; enabled: boolean; accessRule: string } | null = null;

before(async () => {
  assert.ok(ADMIN_EMAIL && ADMIN_PASSWORD, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
});

describe("security — unauthenticated access", () => {
  test("admin API rejects anonymous requests", async () => {
    for (const path of ["/api/admin/registrations", "/api/admin/stats", "/api/admin/export", "/api/admin/quiz"]) {
      const res = await fetch(`${BASE}${path}`);
      assert.equal(res.status, 401, path);
    }
    const verify = await fetch(`${BASE}/api/admin/payments/anything/verify`, { method: "POST", headers: { Origin: BASE } });
    assert.equal(verify.status, 401);
    const reject = await fetch(`${BASE}/api/admin/payments/anything/reject`, { method: "POST", headers: { Origin: BASE } });
    assert.equal(reject.status, 401);
  });

  test("admin pages redirect to login", async () => {
    for (const path of ["/admin/dashboard", "/admin/hackathon", "/admin/illuminate"]) {
      const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
      assert.ok([302, 303, 307, 308].includes(res.status), `${path} → ${res.status}`);
      assert.match(res.headers.get("location") ?? "", /\/login$/);
    }
  });

  test("a forged session cookie is rejected", async () => {
    const res = await fetch(`${BASE}/api/admin/registrations`, { headers: { Cookie: "ilm_admin_session=forged-token" } });
    assert.equal(res.status, 401);
  });

  test("wrong admin password is rejected", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": fakeIp() },
      body: JSON.stringify({ email: ADMIN_EMAIL, secret: "definitely-wrong-password" }),
    });
    assert.equal(res.status, 401);
  });

  test("participant dashboard requires a participant session", async () => {
    const res = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
    assert.ok([302, 303, 307, 308].includes(res.status));
    assert.match(res.headers.get("location") ?? "", /\/login$/);
  });
});

describe("registrations", () => {
  test("TEST 1 — Deja Vu: exactly 4 members, ₹200, PENDING, tampered amount ignored", async () => {
    const utr = uniqueUtr();
    const { status, body } = await register("hackathon", teamDetails(4), utr);
    assert.equal(status, 201, JSON.stringify(body));
    assert.match(body.data.registrationId, /^ILM-[0-9A-Z]{6}$/);
    assert.equal(body.data.amountInr, 200);
    assert.equal(body.data.paymentStatus, "PENDING");
    assert.ok(body.data.quiz, "hackathon response includes the quiz section");
    created.hackathon = { registrationId: body.data.registrationId, utr };
  });

  test("Deja Vu rejects 3 and 5 members", async () => {
    for (const count of [3, 5]) {
      const { status, body } = await register("hackathon", teamDetails(count), uniqueUtr());
      assert.equal(status, 400);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.fieldErrors.members, `members error for ${count}`);
    }
  });

  test("TEST 2 — duplicate UTR is rejected by the backend (also when re-formatted)", async () => {
    const utr = created.hackathon!.utr;
    const again = await register("hackathon", teamDetails(4), utr);
    assert.equal(again.status, 409);
    assert.equal(again.body.error.code, "DUPLICATE_UTR");
    assert.equal(again.body.error.message, "This transaction ID has already been submitted.");

    const spaced = utr.toLowerCase().replace(/(.{4})/g, "$1 ");
    const reformatted = await register("debate", individualDetails(), spaced);
    assert.equal(reformatted.status, 409);
  });

  test("TEST 3 — AI Debate: individual, ₹50, PENDING", async () => {
    const utr = uniqueUtr();
    const { status, body } = await register("debate", individualDetails(), utr);
    assert.equal(status, 201, JSON.stringify(body));
    assert.equal(body.data.amountInr, 50);
    assert.equal(body.data.paymentStatus, "PENDING");
    assert.equal(body.data.quiz, null);
    created.debate = { registrationId: body.data.registrationId, utr };
  });

  test("TEST 4 — IPL Auction: exactly 4 members, ₹200, PENDING", async () => {
    const utr = uniqueUtr();
    const { status, body } = await register("ipl-auction", teamDetails(4), utr);
    assert.equal(status, 201, JSON.stringify(body));
    assert.equal(body.data.amountInr, 200);
    assert.equal(body.data.paymentStatus, "PENDING");
    created.ipl = { registrationId: body.data.registrationId, utr };

    const tooFew = await register("ipl-auction", teamDetails(2), uniqueUtr());
    assert.equal(tooFew.status, 400);
  });

  test("TEST 5 — Illuminate: individual, ₹799, PENDING", async () => {
    const utr = uniqueUtr();
    const { status, body } = await register("illuminate", individualDetails(), utr);
    assert.equal(status, 201, JSON.stringify(body));
    assert.equal(body.data.amountInr, 799);
    assert.equal(body.data.paymentStatus, "PENDING");
    created.illuminate = { registrationId: body.data.registrationId, utr };
  });

  test("invalid screenshots are rejected (fake PNG, wrong extension, missing)", async () => {
    const fake = await register("debate", individualDetails(), uniqueUtr(), {
      bytes: new TextEncoder().encode("not really an image"),
      name: "payment.png",
      type: "image/png",
    });
    assert.equal(fake.status, 400);
    assert.equal(fake.body.error.fieldErrors.screenshot, "Please upload a JPG, JPEG, PNG, or WEBP payment screenshot.");

    const gif = await register("debate", individualDetails(), uniqueUtr(), { bytes: PNG, name: "payment.gif", type: "image/gif" });
    assert.equal(gif.status, 400);

    const form = new FormData();
    form.set("details", JSON.stringify(individualDetails()));
    form.set("utr", uniqueUtr());
    const missing = await fetch(`${BASE}/api/registrations/debate`, { method: "POST", body: form, headers: { "x-forwarded-for": fakeIp() } });
    assert.equal(missing.status, 400);
  });

  test("missing fields return field errors", async () => {
    const { status, body } = await register("illuminate", { fullName: "" }, "");
    assert.equal(status, 400);
    assert.equal(body.error.fieldErrors.fullName, "Please complete this field.");
    assert.ok(body.error.fieldErrors.email);
    assert.ok(body.error.fieldErrors.utr);
  });

  test("public status lookup exposes no personal data", async () => {
    const res = await fetch(`${BASE}/api/registrations/${created.illuminate!.registrationId}`);
    const body = (await res.json()) as Json;
    assert.equal(res.status, 200);
    assert.equal(body.data.paymentStatus, "PENDING");
    const raw = JSON.stringify(body);
    assert.ok(!raw.includes("@example.com"), "no emails");
    assert.ok(!raw.includes(created.illuminate!.utr), "no UTR");
    const missing = await fetch(`${BASE}/api/registrations/ILM-ZZZZZZ`);
    assert.equal(missing.status, 404);
  });

  test("payment screenshots are not publicly reachable", async () => {
    const id = created.hackathon!.registrationId;
    for (const path of [`/payment-screenshots/${id}/payment.png`, `/storage/payment-screenshots/${id}/payment.png`]) {
      const res = await fetch(`${BASE}${path}`);
      assert.equal(res.status, 404, path);
    }
  });
});

describe("admin workflow", () => {
  before(async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": fakeIp() },
      body: JSON.stringify({ email: ADMIN_EMAIL, secret: ADMIN_PASSWORD }),
    });
    assert.equal(res.status, 200, "admin login");
    const body = (await res.json()) as Json;
    assert.equal(body.data.role, "admin");
    assert.equal(body.data.redirectTo, "/admin/dashboard");
    const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("ilm_admin_session=")) ?? "";
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=lax/i);
    cookie = cookieFrom(res, "ilm_admin_session");

    const quiz = await adminJson("/api/admin/quiz");
    originalQuiz = { quizLink: quiz.body.data.quizLink, enabled: quiz.body.data.enabled, accessRule: quiz.body.data.accessRule };
  });

  after(async () => {
    if (originalQuiz) {
      await adminJson("/api/admin/quiz", { method: "PUT", body: JSON.stringify({ ...originalQuiz, quizLink: originalQuiz.quizLink ?? "" }) });
    }
    await admin("/api/auth/logout", { method: "POST", body: "{}" });
    const res = await fetch(`${BASE}/api/admin/registrations`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 401, "session invalid after logout");
  });

  test("admin sees the registration and can search by UTR, team name and phone", async () => {
    const { registrationId, utr } = created.hackathon!;
    const byUtr = await adminJson(`/api/admin/registrations?q=${utr}`);
    assert.equal(byUtr.status, 200);
    assert.equal(byUtr.body.data.items[0].registrationId, registrationId);

    const byId = await adminJson(`/api/admin/registrations?q=${registrationId.toLowerCase()}&event=hackathon&status=PENDING`);
    assert.equal(byId.body.data.total, 1);

    const detail = await adminJson(`/api/admin/registrations/${registrationId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.team.members.length, 4);
    assert.equal(detail.body.data.paymentDetail.amountInr, 200);

    const byTeam = await adminJson(`/api/admin/registrations?q=${encodeURIComponent(detail.body.data.team.name)}`);
    assert.ok(byTeam.body.data.items.some((i: { registrationId: string }) => i.registrationId === registrationId));

    const byPhone = await adminJson(`/api/admin/registrations?q=${detail.body.data.team.members[2].phone}`);
    assert.ok(byPhone.body.data.items.some((i: { registrationId: string }) => i.registrationId === registrationId));
  });

  test("admin can filter by date range", async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const inRange = await adminJson(`/api/admin/registrations?from=${today}&to=${today}&q=${created.debate!.utr}`);
    assert.equal(inRange.body.data.total, 1);
    const outOfRange = await adminJson(`/api/admin/registrations?to=2000-01-01&q=${created.debate!.utr}`);
    assert.equal(outOfRange.body.data.total, 0);
  });

  test("admin can view the payment screenshot", async () => {
    const detail = await adminJson(`/api/admin/registrations/${created.hackathon!.registrationId}`);
    const res = await admin(detail.body.data.paymentDetail.screenshot.url);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/png");
    assert.match(res.headers.get("cache-control") ?? "", /no-store/);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), PNG);
    const anon = await fetch(`${BASE}${detail.body.data.paymentDetail.screenshot.url}`);
    assert.equal(anon.status, 401);
  });

  test("cross-origin state changes are blocked", async () => {
    const detail = await adminJson(`/api/admin/registrations/${created.debate!.registrationId}`);
    const res = await admin(`/api/admin/payments/${detail.body.data.paymentDetail.id}/verify`, {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    assert.equal(res.status, 403);
  });

  for (const key of ["hackathon", "debate", "ipl", "illuminate"] as const) {
    test(`VERIFY sets VERIFIED automatically (${key})`, async () => {
      const detail = await adminJson(`/api/admin/registrations/${created[key]!.registrationId}`);
      const paymentId = detail.body.data.paymentDetail.id;
      const res = await adminJson(`/api/admin/payments/${paymentId}/verify`, { method: "POST", body: "{}" });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(res.body.data.status, "VERIFIED");
      assert.ok(res.body.data.verifiedAt);
      assert.ok(res.body.data.verifiedBy);

      const again = await adminJson(`/api/admin/payments/${paymentId}/verify`, { method: "POST", body: "{}" });
      assert.equal(again.status, 409);
    });
  }

  test("TEST 6 — REJECT with optional reason sets REJECTED", async () => {
    const utr = uniqueUtr();
    const reg = await register("debate", individualDetails(), utr);
    assert.equal(reg.status, 201);
    const detail = await adminJson(`/api/admin/registrations/${reg.body.data.registrationId}`);
    const paymentId = detail.body.data.paymentDetail.id;

    const res = await adminJson(`/api/admin/payments/${paymentId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: "UTR not found in bank statement", status: "VERIFIED" }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "REJECTED");
    assert.equal(res.body.data.rejectionReason, "UTR not found in bank statement");
    assert.equal(res.body.data.verifiedAt, null);
    assert.ok(res.body.data.rejectedBy);

    const pub = await fetch(`${BASE}/api/registrations/${reg.body.data.registrationId}`).then((r) => r.json() as Promise<Json>);
    assert.equal(pub.data.paymentStatus, "REJECTED");
    assert.equal(pub.data.rejectionReason, "UTR not found in bank statement");

    // Reject without reason
    const reg2 = await register("illuminate", individualDetails(), uniqueUtr());
    const d2 = await adminJson(`/api/admin/registrations/${reg2.body.data.registrationId}`);
    const r2 = await adminJson(`/api/admin/payments/${d2.body.data.paymentDetail.id}/reject`, { method: "POST", body: "{}" });
    assert.equal(r2.body.data.status, "REJECTED");
    assert.equal(r2.body.data.rejectionReason, null);
  });

  test("TEST 7 — quiz link follows the configured access rule", async () => {
    const link = `https://example.com/e2e-quiz-${Date.now()}`;

    const enableWithoutLink = await adminJson("/api/admin/quiz", {
      method: "PUT",
      body: JSON.stringify({ quizLink: "", enabled: true, accessRule: "AFTER_SUBMISSION" }),
    });
    assert.equal(enableWithoutLink.status, 400);

    const badUrl = await adminJson("/api/admin/quiz", {
      method: "PUT",
      body: JSON.stringify({ quizLink: "javascript:alert(1)", enabled: true, accessRule: "AFTER_SUBMISSION" }),
    });
    assert.equal(badUrl.status, 400);

    // Rule: only after verification.
    let res = await adminJson("/api/admin/quiz", {
      method: "PUT",
      body: JSON.stringify({ quizLink: link, enabled: true, accessRule: "AFTER_VERIFICATION" }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.quizLink, link);

    const pending = await register("hackathon", teamDetails(4), uniqueUtr());
    assert.equal(pending.body.data.quiz.state, "awaiting_verification");

    const verified = await fetch(`${BASE}/api/quiz?registrationId=${created.hackathon!.registrationId}`).then((r) => r.json() as Promise<Json>);
    assert.equal(verified.data.quiz.state, "available");
    assert.equal(verified.data.quiz.quizLink, link);

    // Rule: after submission.
    res = await adminJson("/api/admin/quiz", {
      method: "POST",
      body: JSON.stringify({ quizLink: link, enabled: true, accessRule: "AFTER_SUBMISSION" }),
    });
    assert.equal(res.status, 200);
    const pendingNow = await fetch(`${BASE}/api/quiz?registrationId=${pending.body.data.registrationId}`).then((r) => r.json() as Promise<Json>);
    assert.equal(pendingNow.data.quiz.state, "available");

    // Disabled.
    await adminJson("/api/admin/quiz", { method: "PUT", body: JSON.stringify({ quizLink: link, enabled: false, accessRule: "AFTER_SUBMISSION" }) });
    const disabled = await fetch(`${BASE}/api/quiz?registrationId=${pending.body.data.registrationId}`).then((r) => r.json() as Promise<Json>);
    assert.equal(disabled.data.quiz.state, "not_available");

    // Non-hackathon registrations never get the quiz.
    const other = await fetch(`${BASE}/api/quiz?registrationId=${created.debate!.registrationId}`);
    assert.equal(other.status, 400);
  });

  test("CSV export comes from the database", async () => {
    const res = await admin(`/api/admin/export?event=hackathon`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/csv/);
    const csv = await res.text();
    assert.ok(csv.includes("Registration ID,Event,Day"));
    assert.ok(csv.includes(created.hackathon!.registrationId));
    assert.ok(csv.includes("Member 4 Name"));
    assert.ok(!csv.includes(created.debate!.registrationId), "event filter applied");
  });

  test("dashboard stats are real counts", async () => {
    const res = await adminJson("/api/admin/stats");
    assert.equal(res.status, 200);
    const s = res.body.data;
    assert.equal(s.totalRegistrations, s.pendingPayments + s.verifiedPayments + s.rejectedPayments);
    assert.equal(s.totalRegistrations, s.day1Registrations + s.day2Registrations);
    assert.ok(s.verifiedPayments >= 4);
  });
});

describe("participant login", () => {
  async function participantLogin(email: string, secret: string) {
    return fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": fakeIp() },
      body: JSON.stringify({ email, secret }),
    });
  }

  test("a team member logs in with their email + registration ID and sees the registration", async () => {
    const details = teamDetails(4);
    const reg = await register("ipl-auction", details, uniqueUtr());
    assert.equal(reg.status, 201);
    const code = reg.body.data.registrationId as string;
    // Any member's email works, not only the leader's; the ID is case-insensitive.
    const memberEmail = details.members[2]!.email;
    const res = await participantLogin(memberEmail.toUpperCase(), code.toLowerCase());
    assert.equal(res.status, 200);
    const body = (await res.json()) as Json;
    assert.equal(body.data.role, "participant");
    assert.equal(body.data.redirectTo, "/dashboard");

    const participantCookie = cookieFrom(res, "ilm_participant_session");
    const page = await fetch(`${BASE}/dashboard`, { headers: { Cookie: participantCookie } });
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes(code), "dashboard lists the registration");

    // A participant session never grants admin access.
    const adminRes = await fetch(`${BASE}/api/admin/registrations`, { headers: { Cookie: participantCookie } });
    assert.equal(adminRes.status, 401);
  });

  test("wrong email or unknown registration ID is rejected with a generic message", async () => {
    const reg = await register("debate", individualDetails(), uniqueUtr());
    const code = reg.body.data.registrationId as string;
    const wrongEmail = await participantLogin("someone.else@example.com", code);
    assert.equal(wrongEmail.status, 401);
    const unknown = await participantLogin("e2e.individual@example.com", "ILM-ZZZZZZ");
    assert.equal(unknown.status, 401);
    const a = ((await wrongEmail.json()) as Json).error.message;
    const b = ((await unknown.json()) as Json).error.message;
    assert.equal(a, b);
  });
});
