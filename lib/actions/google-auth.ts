"use server";

import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const client = new OAuth2Client(googleClientId);

function generateUsername(email: string): string {
  let base = email.split("@")[0] || "user";
  base = base.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  return `${base}_${Math.random().toString(36).substring(2, 7)}`;
}

export async function googleLogin(credential: string) {
  if (!googleClientId) {
    return { error: "Google sign-in is not configured. Please set GOOGLE_CLIENT_ID." };
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return { error: "Invalid Google token" };
    }

    const email = payload.email;
    if (!email) {
      return { error: "Email not found in Google account" };
    }

    const firstName = payload.given_name || "";
    const lastName = payload.family_name || "";
    const googleId = payload.sub;
    const picture = payload.picture || "";

    // Find existing user by email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user (no password needed for Google auth)
      user = await prisma.user.create({
        data: {
          email,
          username: generateUsername(email),
          firstName,
          lastName,
          profileImage: picture,
          role: "RESTAURANT_OWNER",
          isActive: true,
        },
      });
    } else {
      // Update profile image if not set
      if (!user.profileImage && picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileImage: picture },
        });
      }
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Find restaurant by ownerId
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });

    // Link user to restaurant if needed
    if (restaurant && !user.restaurantId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { restaurantId: restaurant.id },
      });
      user.restaurantId = restaurant.id;
    }

    // Create JWT session
    await createSession({
      id: user.id,
      username: user.username || "",
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      restaurantId: restaurant?.id ?? user.restaurantId ?? null,
    });

    return { success: true, redirectTo: "/owner" };
  } catch (err: any) {
    console.error("googleLogin error:", err?.message);
    return { error: "Failed to verify Google sign-in. Please try again." };
  }
}
