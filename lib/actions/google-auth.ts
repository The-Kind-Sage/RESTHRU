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
    let email: string;
    let firstName: string;
    let lastName: string;
    let picture: string;

    // Try as access token first, fall back to id_token
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${credential}` },
    });

    if (userInfoRes.ok) {
      const info = await userInfoRes.json();
      email = info.email || "";
      firstName = info.given_name || "";
      lastName = info.family_name || "";
      picture = info.picture || "";
    } else {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload) return { error: "Invalid Google token" };
      email = payload.email || "";
      firstName = payload.given_name || "";
      lastName = payload.family_name || "";
      picture = payload.picture || "";
    }

    if (!email) {
      return { error: "Email not found in Google account" };
    }

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
      select: { id: true, name: true, type: true, street: true, city: true, phoneNumber: true },
    });

    // If the user already had a restaurant from a previous sign-up, don't let
    // them create a second one — prompt them to log in instead.
    if (restaurant) {
      return {
        success: true,
        alreadyRegistered: true,
        hasRestaurant: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          picture: user.profileImage || "",
        },
      };
    }

    // New user — go through the start free trial dialog
    return {
      success: true,
      needsRegistration: true,
      hasRestaurant: false,
      restaurant: null,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.profileImage || "",
      },
    };
  } catch (err: any) {
    console.error("googleLogin error:", err?.message);
    return { error: "Failed to verify Google sign-in. Please try again." };
  }
}

/**
 * Creates a JWT session for an existing Google user so they can sign in without
 * going through the registration flow a second time.
 */
export async function sessionForExistingGoogleUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, firstName: true, lastName: true, email: true, restaurantId: true },
    });
    if (!user) return { error: "User not found" };

    await createSession({
      id: user.id,
      username: user.username || "",
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      restaurantId: user.restaurantId ?? null,
    });

    return { success: true, redirectTo: "/owner" };
  } catch {
    return { error: "Failed to create session" };
  }
}
