interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  ADMIN_DEFAULT_PASSWORD?: string;
  ADMIN_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_NOTIFY_EMAIL?: string;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  meta: { last_row_id?: number };
}

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function signPayload(secret: string, payload: Record<string, unknown>, expiresInSeconds: number): Promise<string> {
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = bytesToBase64Url(encoder.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds })));
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${await hmac(secret, unsigned)}`;
}

async function verifyPayload(secret: string, token: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  if (await hmac(secret, unsigned) !== parts[2]) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))) as Record<string, unknown>;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function pbkdf2(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return bytesToBase64Url(bits);
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface BookingEmailPayload {
  reference: string;
  clientName: string;
  phone: string;
  clientEmail: string;
  serviceName: string;
  date: string;
  time: string;
  totalPrice: number;
  notes?: string | null;
}

function buildClientEmailHtml(data: BookingEmailPayload): string {
  const formattedTotal = `₹${Number(data.totalPrice).toLocaleString("en-IN")}`;
  const notesRow = data.notes
    ? `<tr>
        <td style="padding:12px 0; border-bottom:1px solid #351823; color:#B59A8E;">Notes</td>
        <td align="right" style="padding:12px 0; border-bottom:1px solid #351823; color:#E8D8CE;">${escapeHtml(data.notes)}</td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>THE VIII SALON — Booking Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#12070B; font-family:Georgia, 'Times New Roman', serif; color:#F5EDE6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#12070B; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px; background-color:#1E0C13; border:1px solid #4A2532; border-radius:14px; overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 24px 24px; background-color:#260F18; border-bottom:1px solid #3D1D29;">
              <div style="font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#D4AF37; font-family:Arial, Helvetica, sans-serif; margin-bottom:8px;">
                UNISEX SALON &bull; BENGALURU
              </div>
              <div style="font-size:26px; letter-spacing:2px; color:#FAF3EB;">
                THE VIII SALON
              </div>
              <div style="font-size:12px; font-style:italic; color:#C9B2A6; margin-top:6px;">
                Beauty is endless. So are you.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 28px 12px;">
              <span style="display:inline-block; padding:5px 12px; font-size:11px; font-family:Arial, Helvetica, sans-serif; font-weight:bold; letter-spacing:1.5px; color:#1E0C13; background-color:#D4AF37; border-radius:999px;">
                RESERVATION RECEIVED
              </span>
              <h1 style="margin:16px 0 8px; font-size:22px; font-weight:normal; color:#FAF3EB;">
                Thank you, ${escapeHtml(data.clientName)}
              </h1>
              <p style="margin:0; font-size:14px; line-height:1.6; font-family:Arial, Helvetica, sans-serif; color:#D6C3BA;">
                Your appointment request at our BTM Layout 2nd Stage studio has been recorded. Here are your reservation details:
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#15080D; border:1px dashed #6E4730; border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="font-size:10px; letter-spacing:2px; text-transform:uppercase; font-family:Arial, Helvetica, sans-serif; color:#B59A8E;">
                      Booking Reference
                    </div>
                    <div style="font-size:15px; font-family:'Courier New', Courier, monospace; font-weight:bold; color:#E5C158; margin-top:4px;">
                      ${escapeHtml(data.reference)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family:Arial, Helvetica, sans-serif; font-size:14px;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #351823; color:#B59A8E;">Service</td>
                  <td align="right" style="padding:12px 0; border-bottom:1px solid #351823; color:#FAF3EB; font-weight:bold;">${escapeHtml(data.serviceName)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #351823; color:#B59A8E;">Date &amp; Time</td>
                  <td align="right" style="padding:12px 0; border-bottom:1px solid #351823; color:#FAF3EB;">${escapeHtml(data.date)} at ${escapeHtml(data.time)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #351823; color:#B59A8E;">Contact</td>
                  <td align="right" style="padding:12px 0; border-bottom:1px solid #351823; color:#E8D8CE;">${escapeHtml(data.phone)}</td>
                </tr>
                ${notesRow}
                <tr>
                  <td style="padding:14px 0 0; color:#D4AF37; font-weight:bold; font-size:15px;">Estimated Total</td>
                  <td align="right" style="padding:14px 0 0; color:#E5C158; font-weight:bold; font-size:17px;">${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 28px 30px;">
              <a href="https://viii-eo5.pages.dev/booking" style="display:inline-block; padding:13px 28px; background-color:#D4AF37; color:#1A0A10; font-family:Arial, Helvetica, sans-serif; font-size:13px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-decoration:none; border-radius:999px;">
                Book Another Session
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 24px; background-color:#15080D; border-top:1px solid #351823; font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#9E8479; line-height:1.6;">
              <strong style="color:#D6C3BA;">THE VIII SALON</strong><br />
              BTM Layout 2nd Stage, Bengaluru<br />
              Need to reschedule? Reply directly to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAdminEmailHtml(data: BookingEmailPayload): string {
  const formattedTotal = `₹${Number(data.totalPrice).toLocaleString("en-IN")}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Booking Alert — THE VIII SALON</title>
</head>
<body style="margin:0; padding:0; background-color:#12070B; font-family:Arial, Helvetica, sans-serif; color:#F5EDE6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#12070B; padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px; background-color:#1E0C13; border:1px solid #4A2532; border-radius:14px; overflow:hidden;">
          <tr>
            <td style="padding:22px 26px; background-color:#260F18; border-bottom:1px solid #3D1D29;">
              <span style="display:inline-block; padding:4px 10px; font-size:10px; font-weight:bold; letter-spacing:1.5px; color:#1E0C13; background-color:#E5C158; border-radius:999px;">
                NEW APPOINTMENT DESK ALERT
              </span>
              <h2 style="margin:12px 0 4px; font-family:Georgia, serif; font-size:20px; font-weight:normal; color:#FAF3EB;">
                ${escapeHtml(data.serviceName)} &mdash; ${formattedTotal}
              </h2>
              <div style="font-size:12px; font-family:'Courier New', monospace; color:#D4AF37;">
                Ref: ${escapeHtml(data.reference)}
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 26px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;">
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #351823; color:#B59A8E;">Client Name</td>
                  <td align="right" style="padding:10px 0; border-bottom:1px solid #351823; color:#FAF3EB; font-weight:bold;">${escapeHtml(data.clientName)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #351823; color:#B59A8E;">Phone / WhatsApp</td>
                  <td align="right" style="padding:10px 0; border-bottom:1px solid #351823; color:#E5C158; font-weight:bold;">${escapeHtml(data.phone)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #351823; color:#B59A8E;">Client Email</td>
                  <td align="right" style="padding:10px 0; border-bottom:1px solid #351823; color:#FAF3EB;">${escapeHtml(data.clientEmail)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #351823; color:#B59A8E;">Date &amp; Time</td>
                  <td align="right" style="padding:10px 0; border-bottom:1px solid #351823; color:#FAF3EB;">${escapeHtml(data.date)} at ${escapeHtml(data.time)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; color:#B59A8E;">Client Notes</td>
                  <td align="right" style="padding:10px 0; color:#E8D8CE;">${escapeHtml(data.notes || "None")}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:4px 26px 26px;">
              <a href="https://viii-eo5.pages.dev/admin" style="display:inline-block; padding:12px 26px; background-color:#D4AF37; color:#1A0A10; font-size:12px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; text-decoration:none; border-radius:999px;">
                Open Salon Owner Portal
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function ensureAdmin(env: Env): Promise<void> {
  const email = env.ADMIN_EMAIL?.trim();
  const password = env.ADMIN_DEFAULT_PASSWORD?.trim();
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_DEFAULT_PASSWORD are required");
  const existing = await env.DB.prepare("SELECT id FROM admins WHERE email = ?").bind(email.toLowerCase()).first();
  if (!existing) {
    const passwordHash = await pbkdf2(password, `theviiisalon:${email.toLowerCase()}`);
    await env.DB.prepare("INSERT INTO admins (email, password_hash, role, is_active) VALUES (?, ?, 'ADMIN', 1)")
      .bind(email.toLowerCase(), passwordHash)
      .run();
  }
}

async function requireAdmin(request: Request, env: Env): Promise<boolean> {
  if (!env.JWT_SECRET) return false;
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return false;
  const payload = await verifyPayload(env.JWT_SECRET, token);
  if (!payload || payload.tokenType !== "admin-session" || payload.role !== "ADMIN") return false;
  const admin = await env.DB.prepare("SELECT id FROM admins WHERE id = ? AND is_active = 1")
    .bind(payload.id)
    .first();
  return Boolean(admin);
}

async function sendEmail(env: Env, subject: string, text: string, html: string, to: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }
  const fromAddress = env.EMAIL_FROM?.trim() || "THE VIII SALON <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Resend API error:", response.status, errorBody);
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
}

function reference(): string {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `VIII-${Date.now().toString(36).toUpperCase()}-${random[0].toString(36).toUpperCase()}${random[1].toString(36).toUpperCase()}`.slice(0, 32);
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, "");
    const segments = path.split("/");

    if (request.method === "OPTIONS") return new Response(null, { status: 204 });

    try {
      if (segments[0] !== "api") return json({ message: "The VIII Salon API is running" });

      if (path === "api/auth/login" && request.method === "POST") {
        await ensureAdmin(env);
        const body = await request.json() as { email?: string; password?: string };
        if (!body.email || !body.password) return json({ message: "Email and password are required." }, 400);
        const email = body.email.trim().toLowerCase();
        const admin = await env.DB.prepare("SELECT id, email, password_hash, is_active FROM admins WHERE email = ?")
          .bind(email).first<{ id: number; email: string; password_hash: string; is_active: number }>();
        if (!admin || !admin.is_active) return json({ message: "Entered email is incorrect. Please try again" }, 401);
        const expected = await pbkdf2(body.password, `theviiisalon:${email}`);
        if (expected !== admin.password_hash) return json({ message: "Entered password is incorrect. Please try again" }, 401);
        if (!env.JWT_SECRET) return json({ message: "Server authentication configuration error." }, 500);
        const challengeToken = await signPayload(env.JWT_SECRET, { id: admin.id, email: admin.email, purpose: "admin-secret-verification" }, 300);
        return json({ message: "Email and password verified. Please enter secret key", data: { challengeToken } });
      }

      if (path === "api/auth/verify-secret-key" && request.method === "POST") {
        const body = await request.json() as { challengeToken?: string; secretKey?: string };
        if (!body.challengeToken || !body.secretKey || !env.JWT_SECRET) return json({ message: "Secret key is required." }, 400);
        const challenge = await verifyPayload(env.JWT_SECRET, body.challengeToken);
        if (!challenge || challenge.purpose !== "admin-secret-verification") return json({ message: "Entered credentials is incorrect. Please sign in again." }, 401);
        if (!env.ADMIN_SECRET_KEY || body.secretKey !== env.ADMIN_SECRET_KEY) return json({ message: "Entered admin secret key is incorrect." }, 403);
        const admin = await env.DB.prepare("SELECT id, email, is_active FROM admins WHERE id = ?")
          .bind(challenge.id).first<{ id: number; email: string; is_active: number }>();
        if (!admin || !admin.is_active) return json({ message: "Admin account is inactive or no longer exists." }, 401);
        const token = await signPayload(env.JWT_SECRET, { id: admin.id, email: admin.email, role: "ADMIN", tokenType: "admin-session" }, 604800);
        return json({ message: "Login successful.", data: { token, admin: { id: admin.id, email: admin.email, role: "ADMIN" } } });
      }

      if (path === "api/services" && request.method === "GET") {
        const result = await env.DB.prepare(`SELECT s.id, s.category_id, s.service_name AS name, s.price, s.duration_minutes AS duration,
          s.description, s.is_featured AS featured, s.is_active, c.name AS category
          FROM services s JOIN service_categories c ON s.category_id = c.id
          WHERE s.is_active = 1 AND c.is_active = 1 ORDER BY c.id, s.id`).all();
        return json({ success: true, data: result.results || [] });
      }

      if (path === "api/services/admin/all" && request.method === "GET") {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const result = await env.DB.prepare(`SELECT s.id, s.category_id, s.service_name AS name, s.price, s.duration_minutes AS duration,
          s.description, s.is_featured AS featured, s.is_active, c.name AS category
          FROM services s JOIN service_categories c ON s.category_id = c.id
          WHERE s.is_active = 1 AND c.is_active = 1 ORDER BY c.id, s.id`).all();
        return json({ success: true, data: result.results || [] });
      }

      if (path === "api/services/categories" && request.method === "GET") {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const result = await env.DB.prepare("SELECT id, name FROM service_categories WHERE is_active = 1 ORDER BY name").all();
        return json({ success: true, data: result.results || [] });
      }

      if (path === "api/services" && request.method === "POST") {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const body = await request.json() as { categoryId?: number; name?: string; price?: number; duration?: number; description?: string };
        if (!body.categoryId || !body.name?.trim() || typeof body.price !== "number" || !body.duration) return json({ success: false, message: "A valid service object is required." }, 400);
        const category = await env.DB.prepare("SELECT id FROM service_categories WHERE id = ? AND is_active = 1").bind(body.categoryId).first();
        if (!category) return json({ success: false, message: "Choose an active service category." }, 400);
        const duplicate = await env.DB.prepare("SELECT id FROM services WHERE category_id = ? AND LOWER(service_name) = LOWER(?) AND is_active = 1")
          .bind(body.categoryId, body.name.trim()).first();
        if (duplicate) return json({ success: false, message: "An active service with this name already exists in this category." }, 409);
        const inserted = await env.DB.prepare("INSERT INTO services (category_id, service_name, price, duration_minutes, description, is_active) VALUES (?, ?, ?, ?, ?, 1)")
          .bind(body.categoryId, body.name.trim(), body.price, body.duration, body.description?.trim() || null).run();
        return json({ success: true, data: { id: inserted.meta.last_row_id } }, 201);
      }

      const serviceMatch = path.match(/^api\/services\/([1-9]\d*)$/);
      if (serviceMatch && (request.method === "PATCH" || request.method === "DELETE")) {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const id = Number(serviceMatch[1]);
        if (request.method === "DELETE") {
          await env.DB.prepare("UPDATE services SET is_active = 0 WHERE id = ?").bind(id).run();
          return json({ success: true, message: "Service permanently deleted." });
        }
        const body = await request.json() as { categoryId?: number; name?: string; price?: number; duration?: number; description?: string };
        await env.DB.prepare("UPDATE services SET category_id = ?, service_name = ?, price = ?, duration_minutes = ?, description = ?, is_active = 1 WHERE id = ?")
          .bind(body.categoryId, body.name?.trim(), body.price, body.duration, body.description?.trim() || null, id).run();
        return json({ success: true, message: "Service updated." });
      }

      if (path === "api/bookings" && request.method === "GET") {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const result = await env.DB.prepare(`SELECT b.id, b.reference, c.full_name AS name, c.phone, c.email, b.service_id,
          COALESCE(sc.name, 'Uncategorized') AS category, b.service_name_snapshot AS service_name,
          b.price_snapshot AS bill_amount, b.duration_snapshot AS duration, b.appointment_date AS booking_date,
          substr(b.appointment_time, 1, 5) AS booking_time, b.status, b.notes, b.internal_notes, b.created_at
          FROM bookings b JOIN customers c ON b.customer_id = c.id
          LEFT JOIN services s ON b.service_id = s.id LEFT JOIN service_categories sc ON s.category_id = sc.id
          ORDER BY b.created_at DESC`).all();
        return json({ success: true, data: result.results || [] });
      }

      if (path === "api/bookings" && request.method === "POST") {
        const body = await request.json() as { name?: string; phone?: string; email?: string; serviceId?: number; serviceName?: string; price?: number; services?: Array<{ id: number; name: string; price: number }>; date?: string; time?: string; notes?: string };
        if (!body.name || !body.phone || !body.email || (!body.serviceId && !body.services?.length) || !body.date || !body.time) {
          return json({ success: false, message: "Name, phone, email, service, date, and time are required." }, 400);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return json({ success: false, message: "Please provide a valid email address for your booking confirmation." }, 400);
        const conflict = await env.DB.prepare("SELECT id FROM bookings WHERE appointment_date = ? AND substr(appointment_time, 1, 5) = ? AND status IN ('PENDING','CONFIRMED') LIMIT 1")
          .bind(body.date, body.time.slice(0, 5)).first();
        if (conflict) return json({ success: false, message: "That appointment slot is already reserved." }, 409);

        const items = body.services?.length ? body.services : [{ id: Number(body.serviceId), name: body.serviceName || "Salon Service", price: Number(body.price) || 0 }];
        let primaryServiceId: number | null = null;
        let totalPrice = 0;
        let totalDuration = 0;
        const names: string[] = [];
        for (const item of items) {
          const service = await env.DB.prepare("SELECT id, service_name, price, duration_minutes FROM services WHERE is_active = 1 AND (id = ? OR LOWER(service_name) = LOWER(?)) LIMIT 1")
            .bind(item.id, item.name).first<{ id: number; service_name: string; price: number; duration_minutes: number }>();
          if (service) {
            primaryServiceId ||= service.id;
            totalPrice += Number(service.price);
            totalDuration += Number(service.duration_minutes) || 45;
            names.push(service.service_name);
          } else {
            totalPrice += Number(item.price) || 0;
            totalDuration += 45;
            names.push(item.name);
          }
        }

        await env.DB.prepare("INSERT INTO customers (full_name, phone, whatsapp_number, email) VALUES (?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET full_name = excluded.full_name, email = COALESCE(excluded.email, email)")
          .bind(body.name.trim(), body.phone.trim(), body.phone.trim(), body.email.trim()).run();
        const customer = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?").bind(body.phone.trim()).first<{ id: number }>();
        const bookingReference = reference();
        const serviceName = names.join(", ").slice(0, 500);
        const cleanNotes = body.notes?.trim() || null;
        const inserted = await env.DB.prepare(`INSERT INTO bookings (reference, customer_id, service_id, service_name_snapshot, price_snapshot, duration_snapshot, appointment_date, appointment_time, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(bookingReference, customer!.id, primaryServiceId, serviceName, totalPrice, totalDuration, body.date, body.time, cleanNotes).run();

        const emailData: BookingEmailPayload = {
          reference: bookingReference,
          clientName: body.name.trim(),
          phone: body.phone.trim(),
          clientEmail: body.email.trim(),
          serviceName,
          date: body.date,
          time: body.time,
          totalPrice,
          notes: cleanNotes,
        };
        const emailText = `Booking reference: ${bookingReference}\nName: ${emailData.clientName}\nPhone: ${emailData.phone}\nServices: ${serviceName}\nDate: ${body.date}\nTime: ${body.time}\nTotal: ₹${totalPrice}`;

        let adminEmailStatus: "SENT" | "FAILED" = "FAILED";
        let clientEmailStatus: "SENT" | "FAILED" = "FAILED";
        let emailError: string | null = null;

        try {
          await sendEmail(
            env,
            `New Booking • ${serviceName} (${bookingReference})`,
            emailText,
            buildAdminEmailHtml(emailData),
            env.ADMIN_NOTIFY_EMAIL || env.ADMIN_EMAIL || body.email.trim()
          );
          adminEmailStatus = "SENT";
        } catch (err) {
          emailError = err instanceof Error ? err.message : String(err);
        }

        try {
          await sendEmail(
            env,
            `THE VIII SALON • Appointment Reserved (${bookingReference})`,
            emailText,
            buildClientEmailHtml(emailData),
            body.email.trim()
          );
          clientEmailStatus = "SENT";
        } catch (err) {
          emailError = err instanceof Error ? err.message : String(err);
        }

        return json({
          success: true,
          data: {
            id: inserted.meta.last_row_id,
            reference: bookingReference,
            name: body.name.trim(),
            serviceName,
            date: body.date,
            time: body.time,
            bill_amount: totalPrice,
            emailDelivery: { client: clientEmailStatus, admin: adminEmailStatus, error: emailError },
          },
        }, 201);
      }

      const bookingStatusMatch = path.match(/^api\/bookings\/([1-9]\d*)\/status$/);
      if (bookingStatusMatch && request.method === "PATCH") {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const body = await request.json() as { status?: string };
        const allowed = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];
        if (!body.status || !allowed.includes(body.status)) return json({ success: false, message: "Invalid booking status." }, 400);
        await env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(body.status, Number(bookingStatusMatch[1])).run();
        return json({ success: true, message: "Status updated" });
      }

      if (path === "api/dashboard/stats" && request.method === "GET") {
        if (!(await requireAdmin(request, env))) return json({ success: false, message: "Authentication token required." }, 401);
        const counts = await env.DB.prepare(`SELECT COUNT(*) AS totalBookings,
          SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status='CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
          SUM(CASE WHEN status='COMPLETED' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status IN ('CONFIRMED','COMPLETED') THEN price_snapshot ELSE 0 END) AS grossRevenue
          FROM bookings`).first<Record<string, number>>();
        const activeServices = await env.DB.prepare("SELECT COUNT(*) AS count FROM services WHERE is_active = 1").first<{ count: number }>();
        const registeredClients = await env.DB.prepare("SELECT COUNT(*) AS count FROM customers").first<{ count: number }>();
        return json({ success: true, data: {
          totalBookings: counts?.totalBookings || 0, pending: counts?.pending || 0,
          confirmed: counts?.confirmed || 0, completed: counts?.completed || 0,
          grossRevenue: counts?.grossRevenue || 0,
          activeServices: activeServices?.count || 0, registeredClients: registeredClients?.count || 0,
        } });
      }

      return json({ success: false, message: "Not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ success: false, message: "Internal server error" }, 500);
    }
  },
};

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  return handler.fetch(context.request, context.env);
}