// Team API for listing and inviting members.
// Administrator-managed invite flow with a one-time temporary password.
import { randomBytes } from "crypto";
import { authErrorResponse, hashPassword, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inviteSchema } from "@/lib/validations/team";
import { jsonError } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser();
    const items = await db.teamMember.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } }
      },
      orderBy: { joinedAt: "desc" }
    });
    const activity = await db.activity.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    });
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

    const email = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({
      where: { email },
      include: { teamMemberships: true }
    });
    if (existing?.isActive && existing.teamMemberships.length > 0) {
      return jsonError("This user is already an active workspace member.", 409);
    }

    const passwordHash = await hashPassword(tempPassword);
    const user = existing
      ? await db.user.update({
          where: { id: existing.id },
          data: {
            role: parsed.data.role,
            isActive: true,
            passwordHash,
            name: parsed.data.name ?? existing.name
          }
        })
      : await db.user.create({
          data: {
            email,
            name: parsed.data.name ?? parsed.data.email.split("@")[0],
            role: parsed.data.role,
            passwordHash
          }
        });

    const member = await db.teamMember.upsert({
      where: { userId: user.id },
      update: { role: parsed.data.role },
      create: { userId: user.id, role: parsed.data.role }
    });

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
