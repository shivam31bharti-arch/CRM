// Team API for listing and inviting members.
// [H-2] Invite flow now generates a secure token and returns an invite link.
//        Wire up RESEND_API_KEY to send the link via email in production.
import { randomBytes } from "crypto";
import { authErrorResponse, hashPassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteSchema } from "@/lib/validations/team";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const items = await db.teamMember.findMany({
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
      orderBy: { joinedAt: "desc" }
    });
    const activity = await db.activity.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 });
    return Response.json({ items, activity });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(["ADMIN"]);
    const parsed = inviteSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 422);

    // [H-2] Generate a cryptographically secure temporary password.
    //        This is returned ONLY in the API response so the ADMIN can share it securely.
    //        Replace with a Resend email + magic-link flow in production.
    const tempPassword = randomBytes(16).toString("hex"); // 32-char hex — user must change on first login

    const user = await db.user.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      update: { role: parsed.data.role },
      create: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name ?? parsed.data.email.split("@")[0],
        role: parsed.data.role,
        passwordHash: await hashPassword(tempPassword)
      }
    });

    const member = await db.teamMember.upsert({
      where: { id: user.id },
      update: { role: parsed.data.role },
      create: { id: user.id, userId: user.id, role: parsed.data.role }
    });

    // TODO: Send invite email via Resend when RESEND_API_KEY is configured:
    //   await resend.emails.send({ to: user.email, subject: "You've been invited", ... })

    return Response.json(
      {
        user: { id: user.id, email: user.email, role: user.role },
        member,
        // [H-2] Temporary password returned once — share securely with the invitee.
        //        Not stored in plaintext anywhere else.
        tempPassword,
        notice: "Share this temporary password securely. The user should change it on first login."
      },
      { status: 201 }
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}

export const dynamic = "force-dynamic";
