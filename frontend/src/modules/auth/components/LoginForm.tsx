"use client";

import { useLoginForm } from "../hooks/useAuthForm";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

export function LoginForm() {
  const { form, onSubmit } = useLoginForm();
  const { register, formState } = form;
  const { errors, isSubmitting } = formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField
        id="login-username"
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.username}
        {...register("username")}
      />
      <FormField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
        {...register("password")}
      />
      {errors.root && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>}
      <SubmitButton pending={isSubmitting} pendingLabel="Finding your seat…">
        Take my seat
      </SubmitButton>
    </form>
  );
}
