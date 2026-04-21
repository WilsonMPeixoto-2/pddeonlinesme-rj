export type Escola = {
  id: string;
  designacao: string;
  inep: string;
  cnpj: string;
  diretor: string;
  email: string;
  alunos: number;
  saldoAnterior: number;
  recebido: number;
  gasto: number;
};

export const mockEscolas: Escola[] = [
  {
    id: "1",
    designacao: "EM EMA NEGRÃO DE LIMA",
    inep: "33012345",
    cnpj: "12.345.678/0001-90",
    diretor: "Maria Aparecida Silva",
    email: "ema.negrao@sme.rio",
    alunos: 412,
    saldoAnterior: 1250.33,
    recebido: 8400.0,
    gasto: 7980.55,
  },
  {
    id: "2",
    designacao: "EM ALBINO SOUZA CRUZ",
    inep: "33023456",
    cnpj: "23.456.789/0001-12",
    diretor: "João Carlos Pereira",
    email: "albino.souza@sme.rio",
    alunos: 287,
    saldoAnterior: 540.1,
    recebido: 6200.0,
    gasto: 6100.0,
  },
  {
    id: "3",
    designacao: "EM JOÃO BARBALHO",
    inep: "33034567",
    cnpj: "34.567.890/0001-34",
    diretor: "Ana Lúcia Fernandes",
    email: "joao.barbalho@sme.rio",
    alunos: 530,
    saldoAnterior: 2100.0,
    recebido: 9800.0,
    gasto: 8450.27,
  },
  {
    id: "4",
    designacao: "EM PROF. DARCY RIBEIRO",
    inep: "33045678",
    cnpj: "45.678.901/0001-56",
    diretor: "Roberto Almeida",
    email: "darcy.ribeiro@sme.rio",
    alunos: 198,
    saldoAnterior: 320.0,
    recebido: 4800.0,
    gasto: 4600.0,
  },
  {
    id: "5",
    designacao: "EM CECÍLIA MEIRELES",
    inep: "33056789",
    cnpj: "56.789.012/0001-78",
    diretor: "Patrícia Souza",
    email: "cecilia.meireles@sme.rio",
    alunos: 645,
    saldoAnterior: 3400.5,
    recebido: 11200.0,
    gasto: 10980.0,
  },
];
