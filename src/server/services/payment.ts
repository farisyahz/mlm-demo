import { env } from "~/env";

/**
 * Xendit Payment Service.
 * Handles disbursements (payouts) for withdrawal approvals.
 */

interface DisbursementParams {
  externalId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  description?: string;
}

interface DisbursementResult {
  id: string;
  status: string;
  amount: number;
}

/**
 * Create a disbursement (payout) via Xendit.
 */
export async function createDisbursement(
  params: DisbursementParams,
): Promise<DisbursementResult> {
  const secretKey = env.XENDIT_SECRET_KEY;

  if (!secretKey) {
    console.warn("Xendit secret key not configured. Skipping disbursement.");
    return {
      id: `mock_${params.externalId}`,
      status: "PENDING",
      amount: params.amount,
    };
  }

  try {
    // Using Xendit REST API directly for disbursement
    const authHeader = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch("https://api.xendit.co/v2/payouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
        "Idempotency-key": params.externalId,
      },
      body: JSON.stringify({
        reference_id: params.externalId,
        channel_code: mapBankCode(params.bankCode),
        channel_properties: {
          account_number: params.accountNumber,
          account_holder_name: params.accountHolderName,
        },
        amount: params.amount,
        currency: "IDR",
        description: params.description ?? "Withdrawal payout",
        type: "DIRECT_DISBURSEMENT",
      }),
    });

    const result = (await response.json()) as {
      id?: string;
      status?: string;
    };

    return {
      id: result.id ?? params.externalId,
      status: result.status ?? "PENDING",
      amount: params.amount,
    };
  } catch (error) {
    console.error("Xendit disbursement error:", error);
    throw new Error("Failed to create disbursement");
  }
}

/**
 * Map common Indonesian bank names to Xendit channel codes.
 */
function mapBankCode(bankName: string): string {
  const bankMap: Record<string, string> = {
    bca: "ID_BCA",
    bni: "ID_BNI",
    bri: "ID_BRI",
    mandiri: "ID_MANDIRI",
    cimb: "ID_CIMB",
    permata: "ID_PERMATA",
    danamon: "ID_DANAMON",
    btn: "ID_BTN",
    bsi: "ID_BSI",
  };

  const normalized = bankName.toLowerCase().replace(/\s+/g, "");
  return bankMap[normalized] ?? `ID_${bankName.toUpperCase()}`;
}
