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
import sharp from "sharp";

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

/**
 * A distinct receipt-shaped image: grey background with a few random dark
 * blocks. Every registration needs its own, since a screenshot file can back
 * only one payment.
 */
function receiptPixels(): Uint8Array<ArrayBuffer> {
  const width = 200;
  const height = 400;
  const pixels = new Uint8Array(width * height).fill(230);
  for (let block = 0; block < 6; block++) {
    const x = randomInt(width - 60);
    const y = randomInt(height - 30);
    for (let dy = 0; dy < 30; dy++) pixels.fill(20, (y + dy) * width + x, (y + dy) * width + x + 60);
  }
  return pixels;
}

async function encodeReceipt(pixels: Uint8Array<ArrayBuffer>, format: "png" | "jpeg"): Promise<Buffer<ArrayBuffer>> {
  const image = sharp(pixels, { raw: { width: 200, height: 400, channels: 1 } });
  const out = format === "png" ? await image.png().toBuffer() : await image.jpeg({ quality: 70 }).toBuffer();
  return Buffer.from(out) as Buffer<ArrayBuffer>;
}

const uniquePng = async () => ({ bytes: await encodeReceipt(receiptPixels(), "png"), name: "payment.png", type: "image/png" });

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
    theme: "HARDWARE_EMBEDDED",
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
    // Required for Mind x Machine; ignored by the other individual events.
    survey: { ...SURVEY },
  };
}

/** Two of three knowledge answers right (the deepfake one is wrong). */
const SURVEY = {
  llm: "large-language-model",
  bias: "algorithmic-bias",
  deepfake: "chatbot",
  familiarity: "regularly",
  jobsStance: "not-sure",
  topic: "Should AI tools be allowed in exams?",
};

/** Bytes of the most recent screenshot sent by register(). */
let lastUpload: Uint8Array<ArrayBuffer> = PNG;

async function register(
  slug: string,
  details: unknown,
  utr: string,
  upload?: { bytes: Uint8Array<ArrayBuffer>; name: string; type: string },
) {
  const file = upload ?? (await uniquePng());
  lastUpload = file.bytes;
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

const created: Record<string, { registrationId: string; utr: string; screenshot?: Uint8Array<ArrayBuffer> }> = {};
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
    for (const path of ["/admin/dashboard", "/admin/hackathon", "/admin/illuminate", "/admin/attempts"]) {
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
    assert.match(body.data.registrationId, /^INV-\d{2,}$/);
    assert.equal(body.data.amountInr, 200);
    assert.equal(body.data.paymentStatus, "PENDING");
    assert.ok(body.data.quiz, "hackathon response includes the quiz section");
    created.hackathon = { registrationId: body.data.registrationId, utr, screenshot: lastUpload };
  });

  test("Deja Vu requires one of its three themes", async () => {
    const { theme: _theme, ...noTheme } = teamDetails(4);
    const missing = await register("hackathon", noTheme, uniqueUtr());
    assert.equal(missing.status, 400);
    assert.equal(missing.body.error.fieldErrors.theme, "Please choose a theme for your team.");
    const unknown = await register("hackathon", { ...teamDetails(4), theme: "BLOCKCHAIN" }, uniqueUtr());
    assert.equal(unknown.status, 400);
    assert.ok(unknown.body.error.fieldErrors.theme);
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

  test("registration IDs are sequential and a rejected attempt uses none up", async () => {
    const num = (id: string) => Number(id.slice(4));
    const firstUtr = uniqueUtr();
    const first = await register("debate", individualDetails(), firstUtr);
    assert.equal(first.status, 201, JSON.stringify(first.body));
    const duplicate = await register("debate", individualDetails(), firstUtr);
    assert.equal(duplicate.status, 409);
    const second = await register("debate", individualDetails(), uniqueUtr());
    assert.equal(second.status, 201, JSON.stringify(second.body));
    assert.equal(num(second.body.data.registrationId), num(first.body.data.registrationId) + 1);
  });

  test("TEST 3 — Mind x Machine: The AI Debate ARENA: individual, ₹50, PENDING", async () => {
    const utr = uniqueUtr();
    const { status, body } = await register("debate", individualDetails(), utr);
    assert.equal(status, 201, JSON.stringify(body));
    assert.equal(body.data.amountInr, 50);
    assert.equal(body.data.paymentStatus, "PENDING");
    assert.equal(body.data.quiz, null);
    assert.equal(body.data.whatsappGroupUrl, "https://chat.whatsapp.com/BAq9wEEfPrD52c6ioCY28C", "registrant gets the event's group");
    created.debate = { registrationId: body.data.registrationId, utr };
  });

  test("Mind x Machine requires the AI survey; other events ignore it", async () => {
    const { survey: _survey, ...noSurvey } = individualDetails();
    const missing = await register("debate", noSurvey, uniqueUtr());
    assert.equal(missing.status, 400);
    assert.equal(missing.body.error.fieldErrors["survey.llm"], "Please choose an answer.");

    const partial = await register("debate", { ...individualDetails(), survey: { ...SURVEY, jobsStance: undefined } }, uniqueUtr());
    assert.equal(partial.status, 400);
    assert.ok(partial.body.error.fieldErrors["survey.jobsStance"]);
    assert.ok(!partial.body.error.fieldErrors["survey.topic"], "the topic line is optional");

    const unknown = await register("debate", { ...individualDetails(), survey: { ...SURVEY, llm: "made-up" } }, uniqueUtr());
    assert.equal(unknown.status, 400);

    const other = await register("illuminate", noSurvey, uniqueUtr());
    assert.equal(other.status, 201, "no survey needed outside Mind x Machine");
  });

  test("TEST 4 — IPL Auction: exactly 6 members, ₹300, PENDING", async () => {
    const utr = uniqueUtr();
    const { status, body } = await register("ipl-auction", teamDetails(6), utr);
    assert.equal(status, 201, JSON.stringify(body));
    assert.equal(body.data.amountInr, 300);
    assert.equal(body.data.paymentStatus, "PENDING");
    assert.equal(body.data.quiz, null, "no quiz for the IPL Auction");
    created.ipl = { registrationId: body.data.registrationId, utr };

    for (const count of [5, 7]) {
      const wrongSize = await register("ipl-auction", teamDetails(count), uniqueUtr());
      assert.equal(wrongSize.status, 400);
      assert.ok(wrongSize.body.error.fieldErrors.members, `members error for ${count}`);
    }
    const asIndividual = await register("ipl-auction", individualDetails(), uniqueUtr());
    assert.equal(asIndividual.status, 400);
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
    assert.ok(!raw.includes("chat.whatsapp.com"), "no WhatsApp group link");
    const missing = await fetch(`${BASE}/api/registrations/INV-999999`);
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
    assert.equal(detail.body.data.team.theme, "Hardware and Embedded Systems");
    assert.equal(byUtr.body.data.items[0].theme, "Hardware and Embedded Systems");
    assert.equal(detail.body.data.paymentDetail.amountInr, 200);

    const byTeam = await adminJson(`/api/admin/registrations?q=${encodeURIComponent(detail.body.data.team.name)}`);
    assert.ok(byTeam.body.data.items.some((i: { registrationId: string }) => i.registrationId === registrationId));

    const byPhone = await adminJson(`/api/admin/registrations?q=${detail.body.data.team.members[2].phone}`);
    assert.ok(byPhone.body.data.items.some((i: { registrationId: string }) => i.registrationId === registrationId));
  });

  test("admin can set or change a Deja Vu team's theme, and only for Deja Vu", async () => {
    const { registrationId } = created.hackathon!;
    const path = `/api/admin/registrations/${registrationId}/theme`;
    const set = await adminJson(path, { method: "PUT", body: JSON.stringify({ theme: "CAMPUS_SOLVE" }) });
    assert.equal(set.status, 200, JSON.stringify(set.body));
    assert.equal(set.body.data.theme, "CampusSolve");
    const detail = await adminJson(`/api/admin/registrations/${registrationId}`);
    assert.equal(detail.body.data.team.theme, "CampusSolve");

    assert.equal((await adminJson(path, { method: "PUT", body: JSON.stringify({ theme: "NOPE" }) })).status, 400);
    const notDejaVu = await adminJson(`/api/admin/registrations/${created.debate!.registrationId}/theme`, {
      method: "PUT",
      body: JSON.stringify({ theme: "AGENTIC_AI" }),
    });
    assert.equal(notDejaVu.status, 400);
    const anonymous = await fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: BASE },
      body: JSON.stringify({ theme: "AGENTIC_AI" }),
    });
    assert.equal(anonymous.status, 401);
    const crossOrigin = await admin(path, { method: "PUT", body: JSON.stringify({ theme: "AGENTIC_AI" }), headers: { Origin: "https://evil.example" } });
    assert.equal(crossOrigin.status, 403);

    // Put it back for the tests that follow.
    await adminJson(path, { method: "PUT", body: JSON.stringify({ theme: "HARDWARE_EMBEDDED" }) });
  });

  test("admin sees the Mind x Machine survey answers and the knowledge score", async () => {
    const detail = await adminJson(`/api/admin/registrations/${created.debate!.registrationId}`);
    const survey = detail.body.data.survey;
    assert.ok(survey, "survey stored");
    assert.equal(survey.score, 2);
    assert.equal(survey.outOf, 3);
    assert.equal(survey.answers[0].answer, "Large Language Model");
    assert.equal(survey.answers[2].correct, false);
    assert.equal(survey.answers[3].correct, null, "opinion questions aren't marked");
    assert.equal(survey.topic, "Should AI tools be allowed in exams?");

    const ipl = await adminJson(`/api/admin/registrations/${created.ipl!.registrationId}`);
    assert.equal(ipl.body.data.survey, null, "other events never keep survey answers");

    const csv = await (await admin(`/api/admin/export?event=debate`)).text();
    assert.ok(csv.includes("AI Survey Score"));
    assert.ok(csv.includes("2/3"));

    // The right answers never reach the browser.
    const form = await (await fetch(`${BASE}/register/debate`)).text();
    assert.ok(form.includes("A quick AI survey"));
    assert.ok(!/CORRECT|correct:\s*\{/.test(form));
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
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), Buffer.from(created.hackathon!.screenshot!));
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

  test("Mind x Machine closes at 50 registrations with a clear message, and never shows spots left", async () => {
    const rejectRegistration = async (registrationId: string) => {
      const detail = await adminJson(`/api/admin/registrations/${registrationId}`);
      const res = await adminJson(`/api/admin/payments/${detail.body.data.paymentDetail.id}/reject`, { method: "POST", body: "{}" });
      assert.equal(res.status, 200, JSON.stringify(res.body));
    };
    const noSpotsLeftText = async (path: string) => {
      const html = await (await fetch(`${BASE}${path}`)).text();
      assert.doesNotMatch(html, /spots? left|slots? left|filling (up|fast)/i, path);
      return html;
    };
    await noSpotsLeftText("/register");
    await noSpotsLeftText("/register/debate");
    await noSpotsLeftText("/day-1");

    const mine: string[] = [];
    let refused: Awaited<ReturnType<typeof register>> | null = null;
    for (let i = 0; i <= 50 && !refused; i++) {
      const res = await register("debate", individualDetails(), uniqueUtr());
      if (res.status === 409) refused = res;
      else {
        assert.equal(res.status, 201, JSON.stringify(res.body));
        mine.push(res.body.data.registrationId);
      }
    }
    assert.ok(mine.length > 0, "Mind x Machine was already full: reset the development database");
    assert.ok(refused, "the registration after the 50th is refused");
    assert.equal(refused.body.error.code, "REGISTRATION_FULL");
    assert.equal(
      refused.body.error.message,
      "Registration limit reached. All 50 spots for Mind x Machine: The AI Debate ARENA have been filled.",
    );
    assert.match(await noSpotsLeftText("/register/debate"), /Registration limit reached/);
    assert.match(await noSpotsLeftText("/register"), /Registration limit reached/);

    // The IPL Auction has no limit any more.
    const ipl = await register("ipl-auction", teamDetails(6), uniqueUtr());
    assert.equal(ipl.status, 201);
    mine.push(ipl.body.data.registrationId);

    // A rejection frees a spot; then free them all so the suite can run again.
    await rejectRegistration(mine.shift()!);
    const again = await register("debate", individualDetails(), uniqueUtr());
    assert.equal(again.status, 201, "a rejected registration's spot is free again");
    mine.push(again.body.data.registrationId);
    for (const id of mine) await rejectRegistration(id);
    assert.doesNotMatch(await noSpotsLeftText("/register/debate"), /Registration limit reached/);
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

    // The team's quiz ID: on the signed-in dashboard only, never on public pages or APIs.
    const memberLogin = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": fakeIp() },
      body: JSON.stringify({ email: "e2e.member1@example.com", secret: created.hackathon!.registrationId }),
    });
    assert.equal(memberLogin.status, 200);
    const dashboard = await (await fetch(`${BASE}/dashboard`, { headers: { Cookie: cookieFrom(memberLogin, "ilm_participant_session") } })).text();
    const shownId = /Your team(?:&#x27;|')s quiz ID<\/p>.*?<code[^>]*>([a-z0-9]{20,})<\/code>/s.exec(dashboard)?.[1];
    assert.ok(shownId, "dashboard shows the team's quiz ID");
    assert.ok(dashboard.includes("Copy ID"), "with a copy button");
    assert.ok(!JSON.stringify(verified).includes(shownId), "the public quiz API never returns it");
    const publicPage = await (await fetch(`${BASE}/registration/${created.hackathon!.registrationId}`)).text();
    assert.ok(!publicPage.includes(shownId), "the public status page never shows it");
    assert.ok(publicPage.includes("Log in to your dashboard"), "the public page points to the dashboard instead");

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
  test("failed registrations are logged with contact details and UTR for admins", async () => {
    // Rejected by the server: a duplicate UTR.
    const { utr } = created.debate!;
    const details = { ...individualDetails(), fullName: "Attempt Logger", email: "attempt.logger@example.com" };
    const dup = await register("debate", details, utr);
    assert.equal(dup.status, 409);

    // Reported by the browser: blocked on the payment step.
    const reportUtr = uniqueUtr();
    const reportBody = {
      event: "illuminate",
      reason: "BLOCKED_IN_BROWSER",
      message: "Blocked by the form's own checks on the payment step.",
      fieldErrors: { screenshot: "The screenshot must be 4 MB or smaller." },
      details: { fullName: "Browser Reporter", email: "browser.reporter@example.com", phone: "9876501234" },
      utr: reportUtr,
      screenshot: { name: "IMG_1.heic", type: "image/heic", size: 5_000_000 },
    };
    const report = await fetch(`${BASE}/api/registrations/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": fakeIp() },
      body: JSON.stringify(reportBody),
    });
    assert.equal(report.status, 201);

    const crossOrigin = await fetch(`${BASE}/api/registrations/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://evil.example", "x-forwarded-for": fakeIp() },
      body: JSON.stringify(reportBody),
    });
    assert.equal(crossOrigin.status, 403);
    const invalid = await fetch(`${BASE}/api/registrations/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, "x-forwarded-for": fakeIp() },
      body: JSON.stringify({ ...reportBody, event: "not-an-event" }),
    });
    assert.equal(invalid.status, 400);

    const page = await admin("/admin/attempts");
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes("attempt.logger@example.com") && html.includes(utr), "server-side rejection listed with email and UTR");
    assert.ok(html.includes("UTR already used"), "reason shown");
    assert.ok(html.includes("browser.reporter@example.com") && html.includes(reportUtr), "browser report listed");
    assert.ok(html.includes("Blocked by form checks"), "browser reason shown");

    const anonymous = await fetch(`${BASE}/admin/attempts`, { redirect: "manual" });
    assert.ok([302, 303, 307, 308].includes(anonymous.status), "admin-only");
  });

  test("a screenshot file backs only one payment; a re-saved copy is flagged for admins", async () => {
    const pixels = receiptPixels();
    const original = { bytes: await encodeReceipt(pixels, "png"), name: "receipt.png", type: "image/png" };
    const first = await register("illuminate", individualDetails(), uniqueUtr(), original);
    assert.equal(first.status, 201);
    const firstId: string = first.body.data.registrationId;

    // The same file for a second registration is refused on the screenshot field.
    const sameFile = await register("debate", individualDetails(), uniqueUtr(), original);
    assert.equal(sameFile.status, 409);
    assert.equal(sameFile.body.error.code, "DUPLICATE_SCREENSHOT");
    assert.match(sameFile.body.error.fieldErrors.screenshot, /already been used/);

    // A re-saved copy (as WhatsApp does) is accepted but flagged against the original.
    const jpeg = { bytes: await encodeReceipt(pixels, "jpeg"), name: "receipt.jpg", type: "image/jpeg" };
    const copy = await register("debate", individualDetails(), uniqueUtr(), jpeg);
    assert.equal(copy.status, 201);
    const copyId: string = copy.body.data.registrationId;
    const copyDetail = await adminJson(`/api/admin/registrations/${copyId}`);
    assert.equal(copyDetail.body.data.paymentDetail.screenshotMatch, firstId);
    const listed = await adminJson(`/api/admin/registrations?q=${copyId}`);
    assert.equal(listed.body.data.items[0].payment.screenshotMatch, firstId);
    const firstDetail = await adminJson(`/api/admin/registrations/${firstId}`);
    assert.equal(firstDetail.body.data.paymentDetail.screenshotMatch, null);
    assert.deepEqual(firstDetail.body.data.screenshotReusedBy, [copyId]);

    // A different receipt is not flagged.
    const other = await register("debate", individualDetails(), uniqueUtr());
    assert.equal(other.status, 201);
    const otherDetail = await adminJson(`/api/admin/registrations/${other.body.data.registrationId}`);
    assert.equal(otherDetail.body.data.paymentDetail.screenshotMatch, null);

    // Once that payment is rejected (say, a mistyped UTR) the file can be submitted again.
    const rejected = await adminJson(`/api/admin/payments/${firstDetail.body.data.paymentDetail.id}/reject`, { method: "POST", body: "{}" });
    assert.equal(rejected.status, 200);
    const retry = await register("illuminate", individualDetails(), uniqueUtr(), original);
    assert.equal(retry.status, 201);

    const page = await admin("/admin/attempts");
    assert.match(await page.text(), /Screenshot already used/);
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
    const reg = await register("hackathon", details, uniqueUtr());
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

    // IDs typed loosely still work: "inv 108", "INV–108" (en dash), just "108".
    const number = code.replace(/^INV-/, "");
    for (const typed of [`inv ${number}`, `INV–${number}`, number]) {
      const loose = await participantLogin(memberEmail, typed);
      assert.equal(loose.status, 200, typed);
    }
    const page = await fetch(`${BASE}/dashboard`, { headers: { Cookie: participantCookie } });
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes(code), "dashboard lists the registration");

    // Signed in: the header shows their name and the page no longer links to Login.
    const home = await (await fetch(`${BASE}/`, { headers: { Cookie: participantCookie } })).text();
    assert.ok(home.includes(details.members[2]!.name.split(" ")[0]!), "header shows the participant's name");
    assert.ok(!home.includes('href="/login"'), "no Login link while signed in");
    const anonymousHome = await (await fetch(`${BASE}/`)).text();
    assert.ok(anonymousHome.includes('href="/login"'), "Login link for anonymous visitors");
    assert.ok(html.includes(details.members[2]!.email), "profile shows the participant's details");

    // A participant session never grants admin access.
    const adminRes = await fetch(`${BASE}/api/admin/registrations`, { headers: { Cookie: participantCookie } });
    assert.equal(adminRes.status, 401);

    // The chosen theme shows on the dashboard; the dashboard picker is only for
    // teams registered before themes existed, so this team can't change it.
    assert.ok(html.includes("Hardware and Embedded Systems"), "dashboard shows the theme");
    assert.ok(!html.includes(`For registration ${code}.`), "no theme picker for a team that already has one");
    const chooseTheme = (cookieHeader: string, body: unknown, origin = BASE) =>
      fetch(`${BASE}/api/participant/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookieHeader, "x-forwarded-for": fakeIp() },
        body: JSON.stringify(body),
      });
    const again = await chooseTheme(participantCookie, { registrationId: code, theme: "AGENTIC_AI" });
    assert.equal(again.status, 409);
    assert.match(((await again.json()) as Json).error.message, /already chosen/);
    assert.equal((await chooseTheme("", { registrationId: code, theme: "AGENTIC_AI" })).status, 401);
    assert.equal((await chooseTheme(participantCookie, { registrationId: code, theme: "AGENTIC_AI" }, "https://evil.example")).status, 403);
    assert.equal((await chooseTheme(participantCookie, { registrationId: code, theme: "NOPE" })).status, 400);
    assert.equal((await chooseTheme(participantCookie, { registrationId: created.debate!.registrationId, theme: "AGENTIC_AI" })).status, 404);
  });

  test("forgot the ID: email + phone of the same person logs in", async () => {
    const details = teamDetails(4);
    const reg = await register("hackathon", details, uniqueUtr());
    assert.equal(reg.status, 201);
    const member = details.members[1]!;

    // Same person's email and phone (phone typed with +91 and spaces) → success.
    const formatted = `+91 ${member.phone.slice(0, 5)} ${member.phone.slice(5)}`;
    const ok = await participantLogin(member.email, formatted);
    assert.equal(ok.status, 200);
    const body = (await ok.json()) as Json;
    assert.equal(body.data.role, "participant");
    const page = await fetch(`${BASE}/dashboard`, { headers: { Cookie: cookieFrom(ok, "ilm_participant_session") } });
    assert.ok((await page.text()).includes(reg.body.data.registrationId), "dashboard lists the registration");

    // Leader's email works with the leader's phone...
    const leader = await participantLogin(details.leaderEmail, details.leaderPhone);
    assert.equal(leader.status, 200);

    // ...but an email and phone from two different people on the same team do not.
    const mixed = await participantLogin(member.email, details.members[2]!.phone);
    assert.equal(mixed.status, 401);

    // Wrong phone → rejected.
    const wrong = await participantLogin(member.email, "9000000001");
    assert.equal(wrong.status, 401);
  });

  test("wrong email or unknown registration ID is rejected with a generic message", async () => {
    const reg = await register("debate", individualDetails(), uniqueUtr());
    const code = reg.body.data.registrationId as string;
    const wrongEmail = await participantLogin("someone.else@example.com", code);
    assert.equal(wrongEmail.status, 401);
    const unknown = await participantLogin("e2e.individual@example.com", "INV-999999");
    assert.equal(unknown.status, 401);
    const a = ((await wrongEmail.json()) as Json).error.message;
    const b = ((await unknown.json()) as Json).error.message;
    assert.equal(a, b);
  });
});
