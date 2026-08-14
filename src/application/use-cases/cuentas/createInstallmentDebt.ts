import type { ICuentasRepository } from "@/domain/repositories/ICuentasRepository";

export interface CreateInstallmentDebtInput {
  personaId: string;
  descripcion: string;
  numCuotas: number;
  montoCuota: number;
  fechaPrimeraCuota: string;
}

function addMonths(dateOnly: string, months: number): string {
  const d = new Date(`${dateOnly}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Crea la deuda y genera las N cuotas mensuales a partir de la primera fecha. */
export async function createInstallmentDebt(
  repo: ICuentasRepository,
  uid: string,
  input: CreateInstallmentDebtInput,
): Promise<void> {
  const debtId = await repo.addDebt(uid, {
    personaId: input.personaId,
    tipo: "cuotas",
    descripcion: input.descripcion,
    montoTotal: input.numCuotas * input.montoCuota,
    fechaCreacion: input.fechaPrimeraCuota,
    numCuotas: input.numCuotas,
    montoCuota: input.montoCuota,
  });

  await Promise.all(
    Array.from({ length: input.numCuotas }, (_, i) =>
      repo.addInstallment(uid, {
        deudaId: debtId,
        numero: i + 1,
        fecha: addMonths(input.fechaPrimeraCuota, i),
        monto: input.montoCuota,
        pagada: false,
      }),
    ),
  );
}
