"use client";

import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { apiErrorMessage } from "@/lib/apiError";
import { authApi } from "../api/auth.api";
import { loginSchema, registerSchema } from "../schema/auth.schema";
import { useAuthStore } from "../store/auth.store";
import type { AuthUser } from "../types";


function useAuthForm<T extends FieldValues>(
  schema: z.ZodType<T, T>,
  submit: (values: T) => Promise<AuthUser>,
  defaultValues: DefaultValues<T>,
) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const form = useForm<T>({ resolver: zodResolver(schema), defaultValues });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setUser(await submit(values));
      router.push("/");
    } catch (err) {
      form.setError("root", { message: apiErrorMessage(err) });
    }
  });

  return { form, onSubmit };
}

export const useLoginForm = () =>
  useAuthForm(loginSchema, authApi.login, { email: "", password: "" });

export const useRegisterForm = () =>
  useAuthForm(registerSchema, authApi.register, { email: "", password: "", fullName: "" });
