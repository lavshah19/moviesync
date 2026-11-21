"use client";

import { useRegisterForm } from "../hooks/useAuthForm";
import { ROLES } from "../types";
import { FormField } from "./FormField";
import { SubmitButton } from "./SubmitButton";

export function RegisterForm() {
  const { form, onSubmit } = useRegisterForm();
  const { register, formState } = form;
  const { errors, isSubmitting } = formState;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormField id="reg-name" label="Full name" autoComplete="name" error={errors.fullName} {...register("fullName")} />
      <FormField id="reg-email" label="Email" type="email" autoComplete="email" error={errors.email} {...register("email")} />
      <FormField
        id="reg-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        {...register("password")}
      />

      <fieldset className="flex flex-col gap-2" aria-describedby={errors.role ? "reg-role-error" : undefined}>
        <legend className="text-sm font-medium">Who are you?</legend>
        <div className="flex gap-3">
          {ROLES.map((role) => (
            <label
              key={role}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 capitalize has-checked:border-zinc-900 has-checked:bg-zinc-100 dark:border-zinc-700 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-800"
            >
              <input type="radio" value={role} className="sr-only" {...register("role")} />
              {role}
            </label>
          ))}
        </div>
        {errors.role && (
          <p id="reg-role-error" className="text-sm text-red-600 dark:text-red-400">
            {errors.role.message}
          </p>
        )}
      </fieldset>

      {errors.root && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>}
      <SubmitButton pending={isSubmitting}>Create account</SubmitButton>
    </form>
  );
}
