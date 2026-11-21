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
      <FormField
        id="reg-username"
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="e.g. your name"
        error={errors.username}
        {...register("username")}
      />
      <FormField
        id="reg-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password}
        {...register("password")}
      />

      <fieldset className="flex flex-col gap-2" aria-describedby={errors.role ? "reg-role-error" : undefined}>
        <legend className="text-sm font-medium">Which seat is yours?</legend>
        <div className="flex gap-3">
          {ROLES.map((role) => (
            <label
              key={role}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 px-3 py-2.5 font-medium capitalize transition duration-150 hover:-translate-y-px hover:border-rose-300 has-checked:border-rose-600 has-checked:bg-rose-50 has-checked:text-rose-700 has-focus-visible:ring-2 has-focus-visible:ring-rose-500/40 dark:border-zinc-700 dark:hover:border-rose-800 dark:has-checked:border-rose-400 dark:has-checked:bg-rose-950/40 dark:has-checked:text-rose-200"
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
      <SubmitButton pending={isSubmitting} pendingLabel="Booking your seat…">
        Book my seat
      </SubmitButton>
    </form>
  );
}
