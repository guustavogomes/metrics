"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export async function registerUser(data: {
  email: string;
  name: string;
  password: string;
}) {
  try {
    const validated = registerSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { error: "Email já cadastrado" };
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    await prisma.user.create({
      data: {
        email: validated.email,
        name: validated.name,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Erro ao criar usuário" };
  }
}
