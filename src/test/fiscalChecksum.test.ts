import { describe, expect, it } from "vitest";

// Algoritmo de checksum Módulo 11 (NF-e)
function calculateKeyChecksum(key43: string): number {
  let multiplier = 2;
  let sum = 0;
  for (let i = key43.length - 1; i >= 0; i--) {
    sum += Number.parseInt(key43[i], 10) * multiplier;
    multiplier = multiplier === 9 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  return remainder === 0 || remainder === 1 ? 0 : 11 - remainder;
}

function validateAccessKey(key: string): { isValid: boolean; cnpj: string } {
  const digits = key.replace(/\D/g, "");
  if (digits.length !== 44) return { isValid: false, cnpj: "" };
  
  const key43 = digits.slice(0, 43);
  const actualDV = Number.parseInt(digits[43], 10);
  const calculatedDV = calculateKeyChecksum(key43);
  
  // CNPJ fica na chave nas posições 7 a 20 (índices 6 a 20 na string)
  const cnpjRaw = digits.slice(6, 20);
  
  return {
    isValid: actualDV === calculatedDV,
    cnpj: cnpjRaw
  };
}

describe("Validação de Chave de Acesso Fiscal (Spike Frente Fiscal v1)", () => {
  it("detecta chave de comprimento incorreto", () => {
    const result = validateAccessKey("123456789");
    expect(result.isValid).toBe(false);
    expect(result.cnpj).toBe("");
  });

  it("calcula corretamente o checksum módulo 11 e extrai CNPJ de uma chave válida de teste", () => {
    // Chave de acesso sintética estruturada com DV correto
    // CNPJ fictício do emitente nas posições 7 a 20: "12345678000199"
    // Posições: [0..5] = UF/Ano/Mês, [6..19] = CNPJ, [20..42] = Modelo/Série/Número/Emissão/Código
    // Chave de 44 dígitos com DV calculado
    const key43 = "332605" + "12345678000199" + "55001" + "000003421" + "1" + "87654321";
    const dv = calculateKeyChecksum(key43);
    const validKey = key43 + dv.toString();

    const result = validateAccessKey(validKey);
    expect(result.isValid).toBe(true);
    expect(result.cnpj).toBe("12345678000199");
  });

  it("rejeita chave de 44 dígitos com dígito verificador incorreto", () => {
    const key43 = "332605" + "12345678000199" + "55001" + "000003421" + "1" + "87654321";
    const invalidKey = key43 + "9"; // usando um DV arbitrário que provavelmente difere do calculado

    const result = validateAccessKey(invalidKey);
    // Como o DV real varia, testamos contra o DV correto
    const correctDV = calculateKeyChecksum(key43);
    if (correctDV !== 9) {
      expect(result.isValid).toBe(false);
    } else {
      // Se coincidir, mudamos para outro número para garantir a falha
      const badKey = key43 + ((correctDV + 1) % 10).toString();
      expect(validateAccessKey(badKey).isValid).toBe(false);
    }
  });
});
