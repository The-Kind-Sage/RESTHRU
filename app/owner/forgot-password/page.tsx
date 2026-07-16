"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPassword } from "@/lib/actions/auth";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [username, setUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your email, phone, or username");
      return;
    }

    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setLoading(false);
    setStep("verify");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (verificationCode !== sentCode) {
      setError("Invalid verification code");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(username, newPassword);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-xl bg-success flex items-center justify-center mb-2">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset</CardTitle>
            <CardDescription>Your password has been updated successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/owner/login">
              <Button className="w-full">Sign In with New Password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-2">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>Enter your email, phone, or username to receive a verification code</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email / Phone / Username</Label>
                <Input id="username" placeholder="you@example.com or +977..." value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Sending..." : "Send Verification Code"}</Button>
              <div className="text-center text-sm">
                <Link href="/owner/login" className="text-primary hover:underline">Back to login</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-2">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify & Reset</CardTitle>
          <CardDescription>Enter the verification code sent to your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input id="code" placeholder="Enter 6-digit code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} disabled={loading} required maxLength={6} />
              {sentCode && (
                <p className="text-xs text-muted-foreground mt-1">Demo mode — your code is: <span className="font-mono font-bold text-primary">{sentCode}</span></p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" placeholder="Enter new password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={loading} required className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" placeholder="Confirm new password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Resetting..." : "Reset Password"}</Button>
            <div className="text-center text-sm">
              <button type="button" onClick={() => { setStep("email"); setError(""); setVerificationCode(""); }} className="text-primary hover:underline">Back to email entry</button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
