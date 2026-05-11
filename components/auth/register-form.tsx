"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { registerAction, type AuthActionResult } from "@/lib/auth/actions";
import { formatAllowedEmailDomains } from "@/lib/settings/app-settings";
import { registerSchema, type RegisterValues } from "@/lib/auth/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldError,
  getFieldDescribedBy,
} from "@/components/shared/form-field-error";
import { FormFieldHelper } from "@/components/shared/form-field-helper";

export function RegisterForm({
  allowedEmailDomains = [],
}: {
  allowedEmailDomains?: string[];
}) {
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const fullNameError = form.formState.errors.fullName?.message;
  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmPasswordError = form.formState.errors.confirmPassword?.message;

  function onSubmit(values: RegisterValues) {
    const formData = new FormData();
    formData.set("fullName", values.fullName);
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("confirmPassword", values.confirmPassword);

    startTransition(async () => {
      const actionResult = await registerAction(formData);
      setResult(actionResult);

      if (actionResult.status === "success") {
        form.reset();
      }
    });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      {result ? (
          <Alert variant={result.status === "error" ? "destructive" : "success"}>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : null}

      {allowedEmailDomains.length > 0 ? (
        <Alert>
          <AlertDescription>
            Registration is limited to these domains:{" "}
            {formatAllowedEmailDomains(allowedEmailDomains)}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          aria-describedby={getFieldDescribedBy(
            fullNameError && "register-full-name-error",
          )}
          aria-invalid={Boolean(fullNameError)}
          {...form.register("fullName")}
        />
        <FormFieldError id="register-full-name-error">
          {fullNameError}
        </FormFieldError>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-describedby={getFieldDescribedBy(
            allowedEmailDomains.length > 0 && "register-email-helper",
            emailError && "register-email-error",
          )}
          aria-invalid={Boolean(emailError)}
          {...form.register("email")}
        />
        {allowedEmailDomains.length > 0 ? (
          <FormFieldHelper id="register-email-helper">
            Use one of the approved company email domains.
          </FormFieldHelper>
        ) : null}
        <FormFieldError id="register-email-error">{emailError}</FormFieldError>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-describedby={getFieldDescribedBy(
            "register-password-helper",
            passwordError && "register-password-error",
          )}
          aria-invalid={Boolean(passwordError)}
          {...form.register("password")}
        />
        <FormFieldHelper id="register-password-helper">
          Use at least 8 characters.
        </FormFieldHelper>
        <FormFieldError id="register-password-error">
          {passwordError}
        </FormFieldError>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-describedby={getFieldDescribedBy(
            confirmPasswordError && "register-confirm-password-error",
          )}
          aria-invalid={Boolean(confirmPasswordError)}
          {...form.register("confirmPassword")}
        />
        <FormFieldError id="register-confirm-password-error">
          {confirmPasswordError}
        </FormFieldError>
      </div>

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground">
          Log in
        </Link>
      </p>
    </form>
  );
}
