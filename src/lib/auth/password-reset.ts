import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { notifyPasswordReset } from "@/lib/notifications";

const RESET_DURATION_MS = 60 * 60 * 1000;

function createResetToken(): string {
  return randomBytes(32).toString("hex");
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return;
  }

  await db.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  const token = createResetToken();
  const expiresAt = new Date(Date.now() + RESET_DURATION_MS);

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  await notifyPasswordReset({ email: user.email, token });
}

export async function resetPasswordWithToken(
  token: string,
  password: string,
): Promise<void> {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    throw new Error("Invalid or expired reset link");
  }

  if (resetToken.expiresAt < new Date()) {
    await db.passwordResetToken.delete({ where: { id: resetToken.id } });
    throw new Error("Invalid or expired reset link");
  }

  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    db.passwordResetToken.delete({ where: { id: resetToken.id } }),
    db.session.deleteMany({ where: { userId: resetToken.userId } }),
  ]);
}
