import { NextRequest, NextResponse } from "next/server"
import { createServerSupabase } from "@/server/supabase/server"
import { BELT_LABELS, BELT_HEX } from "@/lib/constants/belts"
import type { Belt } from "@/lib/constants/belts"
import QRCode from "qrcode"
import crypto from "crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params
  const url = new URL(request.url)
  const beltParam = url.searchParams.get("belt")
  const dateParam = url.searchParams.get("date")

  // Verify session
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch member
  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id, full_name, belt_rank, stripes, academy_id, created_at")
    .eq("id", memberId)
    .single()

  if (memberErr || !member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  // Fetch academy
  const { data: academy } = await supabase
    .from("academies")
    .select("name")
    .eq("id", member.academy_id)
    .single()

  const academyName = academy?.name ?? "Academy"
  const belt = (beltParam ?? member.belt_rank) as Belt
  const beltLabel = BELT_LABELS[belt] ?? belt
  const beltColor = BELT_HEX[belt] ?? "#6b7280"
  const promotionDate = dateParam ?? new Date().toISOString().split("T")[0]!
  const formattedDate = new Date(promotionDate).toLocaleDateString("pt-BR", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // Generate certificate ID deterministically from member + belt + date
  const certId = crypto
    .createHash("sha256")
    .update(`${memberId}-${belt}-${promotionDate}`)
    .digest("hex")
    .slice(0, 8)
  const certUuid = `GF-${certId.toUpperCase()}`

  // Verification URL
  const baseUrl = url.origin
  const verifyUrl = `${baseUrl}/api/certificate/verify?id=${certUuid}&member=${memberId}`

  // Generate QR code SVG
  let qrSvg = ""
  try {
    qrSvg = await QRCode.toString(verifyUrl, {
      type: "svg",
      color: { dark: "#d4af37", light: "#00000000" },
      margin: 0,
      width: 100,
    })
  } catch {
    // Fallback: no QR code
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate - ${member.full_name} - ${beltLabel} Belt</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }

    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .print-btn {
      margin-bottom: 20px;
      padding: 10px 24px;
      background: #d4af37;
      color: #0a0a0a;
      border: none;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .print-btn:hover { opacity: 0.85; }

    .certificate {
      width: 800px;
      min-height: 560px;
      background: linear-gradient(145deg, #111111 0%, #1a1a1a 50%, #111111 100%);
      border: 2px solid #d4af3744;
      border-radius: 12px;
      padding: 50px 60px;
      position: relative;
      overflow: hidden;
    }

    /* Decorative corner ornaments */
    .certificate::before,
    .certificate::after {
      content: '';
      position: absolute;
      width: 80px;
      height: 80px;
      border: 2px solid #d4af3733;
    }
    .certificate::before {
      top: 16px; left: 16px;
      border-right: none; border-bottom: none;
      border-radius: 4px 0 0 0;
    }
    .certificate::after {
      bottom: 16px; right: 16px;
      border-left: none; border-top: none;
      border-radius: 0 0 4px 0;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 8px;
    }
    .logo-icon {
      font-size: 32px;
      margin-bottom: 4px;
    }
    .academy-name {
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #d4af37;
    }
    .brand-name {
      font-family: 'Inter', sans-serif;
      font-size: 10px;
      font-weight: 400;
      color: #666;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    .title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
      margin: 20px 0 6px;
      letter-spacing: 1px;
    }
    .subtitle {
      text-align: center;
      font-size: 11px;
      color: #888;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 28px;
    }

    .student-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 600;
      color: #ffffff;
      text-align: center;
      margin-bottom: 24px;
    }

    .belt-bar {
      width: 240px;
      height: 10px;
      border-radius: 5px;
      margin: 0 auto 8px;
      background: ${beltColor};
      box-shadow: 0 0 16px ${beltColor}66;
    }
    .belt-label {
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: #e5e5e5;
      letter-spacing: 1px;
    }

    .details {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 28px 0;
      padding: 16px 0;
      border-top: 1px solid #ffffff0d;
      border-bottom: 1px solid #ffffff0d;
    }
    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #666;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 13px;
      font-weight: 500;
      color: #ccc;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 20px;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .qr-label {
      font-size: 8px;
      color: #555;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .cert-id {
      text-align: right;
      font-size: 10px;
      font-family: monospace;
      color: #444;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">
    Save as PDF / Print
  </button>

  <div class="certificate">
    <div class="logo-section">
      <div class="logo-icon">\u{1F94B}</div>
      <div class="academy-name">${escapeHtml(academyName)}</div>
      <div class="brand-name">Powered by Kumo</div>
    </div>

    <div class="title">Certificate of Graduation</div>
    <div class="subtitle">This is to certify that</div>

    <div class="student-name">${escapeHtml(member.full_name)}</div>

    <div class="belt-bar"></div>
    <div class="belt-label">${escapeHtml(beltLabel)} Belt</div>

    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Date of Promotion</div>
        <div class="detail-value">${formattedDate}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Academy</div>
        <div class="detail-value">${escapeHtml(academyName)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Certificate ID</div>
        <div class="detail-value" style="font-family: monospace;">${certUuid}</div>
      </div>
    </div>

    <div class="footer">
      <div class="qr-section">
        ${qrSvg}
        <div class="qr-label">Scan to verify</div>
      </div>
      <div class="cert-id">
        ${certUuid}<br/>
        Issued via Kumo
      </div>
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
