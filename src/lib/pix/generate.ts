/**
 * PIX QR Code Payload Generator
 *
 * Generates PIX "copia e cola" (copy-paste) strings following the
 * BR Code standard (EMV QR Code Specification for Payment Systems).
 *
 * Reference: Banco Central do Brasil — Manual de Padrões para Iniciação do PIX
 */

export interface PixPayloadOptions {
  /** PIX key: CPF, CNPJ, email, phone, or random key */
  pixKey: string
  /** Type of the PIX key */
  pixKeyType: "cpf" | "cnpj" | "email" | "phone" | "random"
  /** Academy/merchant name (max 25 chars) */
  merchantName: string
  /** City (max 15 chars) */
  merchantCity: string
  /** Amount in BRL (e.g. 120.00) */
  amount: number
  /** Transaction ID (max 25 chars, alphanumeric) */
  txid?: string
  /** Description (max 40 chars) */
  description?: string
}

/**
 * Build a TLV (Type-Length-Value) field.
 * ID is a 2-char string, value is the content.
 */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0")
  return id + len + value
}

/**
 * CRC-16 CCITT (polynomial 0x1021, init 0xFFFF).
 * Used to generate the mandatory checksum at the end of a PIX payload.
 */
function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

/**
 * Sanitize a string for use in PIX payload fields.
 * Removes accents, special chars, and trims to max length.
 */
function sanitize(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9 ]/g, "") // only alphanumeric + space
    .trim()
    .slice(0, maxLength)
}

/**
 * Generate a PIX EMV QR Code payload string ("copia e cola").
 *
 * The resulting string can be:
 * 1. Copied and pasted into a banking app
 * 2. Encoded into a QR code image for scanning
 */
export function generatePixPayload(options: PixPayloadOptions): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txid,
    description,
  } = options

  // ── ID 00: Payload Format Indicator ──────────────────────────────────────
  const id00 = tlv("00", "01")

  // ── ID 26: Merchant Account Information (PIX) ────────────────────────────
  // Sub-fields:
  //   00 = GUI (globally unique identifier): "br.gov.bcb.pix"
  //   01 = PIX key
  //   02 = Description (optional)
  let merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey)
  if (description) {
    merchantAccountInfo += tlv("02", sanitize(description, 40))
  }
  const id26 = tlv("26", merchantAccountInfo)

  // ── ID 52: Merchant Category Code ────────────────────────────────────────
  const id52 = tlv("52", "0000")

  // ── ID 53: Transaction Currency (986 = BRL) ──────────────────────────────
  const id53 = tlv("53", "986")

  // ── ID 54: Transaction Amount ────────────────────────────────────────────
  const formattedAmount = amount.toFixed(2)
  const id54 = tlv("54", formattedAmount)

  // ── ID 58: Country Code ──────────────────────────────────────────────────
  const id58 = tlv("58", "BR")

  // ── ID 59: Merchant Name ─────────────────────────────────────────────────
  const id59 = tlv("59", sanitize(merchantName, 25))

  // ── ID 60: Merchant City ─────────────────────────────────────────────────
  const id60 = tlv("60", sanitize(merchantCity, 15))

  // ── ID 62: Additional Data Field Template ────────────────────────────────
  // Sub-field 05 = Reference Label (txid)
  const refLabel = txid ? sanitize(txid, 25) : "***"
  const additionalData = tlv("05", refLabel)
  const id62 = tlv("62", additionalData)

  // ── ID 63: CRC16 ─────────────────────────────────────────────────────────
  // Build the payload without CRC, then append the CRC placeholder "6304"
  // and compute the checksum over the entire string including "6304".
  const payloadWithoutCRC =
    id00 + id26 + id52 + id53 + id54 + id58 + id59 + id60 + id62
  const payloadForCRC = payloadWithoutCRC + "6304"
  const checksum = crc16(payloadForCRC)
  const id63 = "6304" + checksum

  return payloadWithoutCRC + id63
}

/**
 * Generate a PIX QR code as a Data URL (base64 PNG).
 * Uses the `qrcode` package.
 */
export async function generatePixQrDataUrl(
  options: PixPayloadOptions,
): Promise<{ payload: string; qrDataUrl: string }> {
  const QRCode = await import("qrcode")
  const payload = generatePixPayload(options)
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  })
  return { payload, qrDataUrl }
}
