import os
import sys
import json
import re
import argparse
from datetime import datetime
from decimal import Decimal, InvalidOperation
import openpyxl

try:
    from supabase import create_client, Client
except ImportError:
    pass

def normalize_digits(value):
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return re.sub(r'\D', '', str(value))

def normalize_cnpj(cnpj_val):
    digits = normalize_digits(cnpj_val)
    if not digits: return None
    if len(digits) == 13:
        return digits.zfill(14)
    if len(digits) == 14:
        return digits
    raise ValueError(f"CNPJ inválido detectado (tamanho: {len(digits)}): {cnpj_val}")

def normalize_inep(inep_val):
    digits = normalize_digits(inep_val)
    if not digits: return None
    if len(digits) == 8:
        return digits
    raise ValueError(f"INEP inválido detectado (tamanho: {len(digits)}): {inep_val}")

def parse_money_ptbr(value):
    if value is None or str(value).strip() == "":
        return Decimal("0.00")
    
    val_str = str(value).strip()
    
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    
    val_str = val_str.replace("R$", "").strip()
    val_str = val_str.replace(" ", "")
    
    if "," in val_str and "." in val_str:
        val_str = val_str.replace(".", "")
        val_str = val_str.replace(",", ".")
    elif "," in val_str:
        val_str = val_str.replace(",", ".")
        
    try:
        return Decimal(val_str)
    except InvalidOperation:
        raise ValueError(f"Valor financeiro inválido: {value}")

def decimal_to_str(d):
    return str(d.quantize(Decimal("0.01")))

def get_col_index(header_map, possible_names):
    for name in possible_names:
        if name in header_map:
            return header_map[name]
    return None

def process_file(filepath, exercicio=2026, programa='basico', apply=False):
    print(f"Lendo {filepath} para exercício {exercicio} / {programa} (Apply: {apply})...")
    
    if not os.path.exists(filepath):
        print(f"ERRO: Arquivo {filepath} não encontrado.")
        sys.exit(1)
        
    wb = openpyxl.load_workbook(filepath, data_only=True)
    if 'BASE' not in wb.sheetnames:
        print("ERRO: Aba 'BASE' não encontrada na planilha.")
        sys.exit(1)
        
    ws = wb['BASE']
    
    header = {}
    for idx, cell in enumerate(ws[1]):
        if cell.value:
            header[cell.value.strip().upper()] = idx
            
    col_designacao = get_col_index(header, ['DESIGNAÇÃO', 'DESIGNACAO'])
    col_nome = get_col_index(header, ['NOME'])
    col_cnpj = get_col_index(header, ['CNPJ'])
    col_inep = get_col_index(header, ['INEP'])
    col_diretor = get_col_index(header, ['DIRETOR'])
    col_endereco = get_col_index(header, ['ENDEREÇO', 'ENDERECO'])
    col_agencia = get_col_index(header, ['AGÊNCIA', 'AGENCIA'])
    col_conta = get_col_index(header, ['CONTA CORRENTE', 'CONTA'])
    col_rep_cust = get_col_index(header, ['REPROGRAMADO CUSTEIO'])
    col_rep_cap = get_col_index(header, ['REPROGRAMADO CAPITAL'])
    col_p1_cust = get_col_index(header, ['1 PARCELA CUSTEIO', '1ª PARCELA CUSTEIO', '1A PARCELA CUSTEIO'])
    col_p1_cap = get_col_index(header, ['1 PARCELA CAPITAL', '1ª PARCELA CAPITAL', '1A PARCELA CAPITAL'])
    col_p2_cust = get_col_index(header, ['2 PARCELA CUSTEIO', '2ª PARCELA CUSTEIO', '2A PARCELA CUSTEIO'])
    col_p2_cap = get_col_index(header, ['2 PARCELA CAPITAL', '2ª PARCELA CAPITAL', '2A PARCELA CAPITAL'])

    if col_designacao is None or col_nome is None:
        print("ERRO: Colunas obrigatórias (Designação/Nome) não encontradas.")
        sys.exit(1)

    parsed_data = []
    skipped = 0
    errors_list = []
    
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        try:
            designacao = str(row[col_designacao]).strip() if row[col_designacao] else None
            nome = str(row[col_nome]).strip() if row[col_nome] else None
            
            if not designacao or not nome or designacao == 'None':
                skipped += 1
                continue
                
            cnpj_val = normalize_cnpj(row[col_cnpj] if col_cnpj is not None else None)
            inep_val = normalize_inep(row[col_inep] if col_inep is not None else None)
            diretor_val = str(row[col_diretor]).strip() if col_diretor is not None and row[col_diretor] else None
            endereco_val = str(row[col_endereco]).strip() if col_endereco is not None and row[col_endereco] else None
            agencia_val = str(row[col_agencia]).strip() if col_agencia is not None and row[col_agencia] else None
            conta_val = str(row[col_conta]).strip() if col_conta is not None and row[col_conta] else None

            # Construir source_payload detalhado para auditoria
            source_payload = {k: str(row[v]) if row[v] is not None else None for k, v in header.items()}

            payload = {
                'unidade': {
                    'designacao': designacao,
                    'nome': nome,
                    'inep': inep_val,
                    'cnpj': cnpj_val,
                    'diretor': diretor_val,
                    'endereco': endereco_val,
                    'agencia': agencia_val,
                    'conta_corrente': conta_val,
                    'source_payload': source_payload
                },
                'financeiro': {
                    'exercicio': exercicio,
                    'programa': programa,
                    'reprogramado_custeio': decimal_to_str(parse_money_ptbr(row[col_rep_cust] if col_rep_cust is not None else 0)),
                    'reprogramado_capital': decimal_to_str(parse_money_ptbr(row[col_rep_cap] if col_rep_cap is not None else 0)),
                    'parcela_1_custeio': decimal_to_str(parse_money_ptbr(row[col_p1_cust] if col_p1_cust is not None else 0)),
                    'parcela_1_capital': decimal_to_str(parse_money_ptbr(row[col_p1_cap] if col_p1_cap is not None else 0)),
                    'parcela_2_custeio': decimal_to_str(parse_money_ptbr(row[col_p2_cust] if col_p2_cust is not None else 0)),
                    'parcela_2_capital': decimal_to_str(parse_money_ptbr(row[col_p2_cap] if col_p2_cap is not None else 0))
                }
            }
            parsed_data.append(payload)
        except Exception as e:
            err_msg = f"Linha {row_idx}: {str(e)}"
            print(f"Erro na validação - {err_msg}")
            errors_list.append({'linha': row_idx, 'erro': str(e)})

    total_valid = len(parsed_data)
    if apply and not (150 <= total_valid <= 200):
        print(f"ERRO DE SEGURANÇA: Contagem de unidades válidas ({total_valid}) fora do limite seguro (150-200).")
        sys.exit(1)

    if not apply:
        os.makedirs('data/output', exist_ok=True)
        with open('data/output/import_preview.json', 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, ensure_ascii=False, indent=2)
            
        report = f"""# Relatório de Importação (Modo DRY-RUN)
Data: {datetime.now().isoformat()}
Arquivo: {filepath}
Exercício: {exercicio} / {programa}
Válidas: {total_valid}
Puladas: {skipped}
Erros de Validação: {len(errors_list)}
Modo: PREVIEW ONLY (Nenhuma alteração no banco)"""
        with open('data/output/import_report.md', 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"Dry-run concluído. {total_valid} linhas prontas. Relatório salvo em data/output/.")
        sys.exit(0)

    # Modo Apply
    db_url = os.environ.get('SUPABASE_URL')
    db_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not db_url or not db_key:
        print("ERRO: Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY não encontradas para o modo --apply.")
        sys.exit(1)

    print("Conectando ao banco de dados via Supabase API...")
    sb: Client = create_client(db_url, db_key)

    processed = 0
    db_errors = []
    
    for item in parsed_data:
        try:
            res_ue = sb.table('unidades_escolares').upsert(
                item['unidade'], on_conflict='designacao'
            ).execute()
            
            unidade_id = res_ue.data[0]['id']
            
            fin = item['financeiro']
            fin['unidade_id'] = unidade_id
            sb.table('execucao_financeira').upsert(
                fin, on_conflict='unidade_id,exercicio,programa'
            ).execute()
            
            processed += 1
        except Exception as e:
            print(f"Erro DB na unidade {item['unidade']['designacao']}: {str(e)}")
            db_errors.append({'designacao': item['unidade']['designacao'], 'erro': str(e)})

    # Concatenar todos os erros para log
    all_errors = errors_list + db_errors

    try:
        sb.table('import_logs').insert({
            'source': 'Script python --apply',
            'filename': filepath,
            'exercicio': exercicio,
            'programa': programa,
            'total_rows': total_valid + skipped + len(errors_list),
            'inserted_rows': processed,  # Usado aqui como "processed_rows" no sentido de sucesso no DB
            'updated_rows': 0, # Como o upsert não expõe nativamente se foi insert/update pela rest api Python, mantemos 0 e documentamos.
            'skipped_rows': skipped,
            'errors': all_errors,
            'status': 'sucesso' if len(all_errors) == 0 else 'com_erros'
        }).execute()
    except Exception as e:
        print(f"Erro ao gravar import_logs: {str(e)}")

    report = f"""# Relatório de Importação (Modo APPLY)
Data: {datetime.now().isoformat()}
Arquivo: {filepath}
Exercício: {exercicio} / {programa}
Processadas/Salvas no DB: {processed}
Puladas vazias: {skipped}
Erros Totais (Validação + DB): {len(all_errors)}
Modo: GRAVADO NO BANCO DE DADOS."""
    with open('data/output/import_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
        
    print("Modo Apply concluído. Relatório gerado.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Script de importação PDDE")
    parser.add_argument("filepath", help="Caminho do arquivo XLSX")
    parser.add_argument("--exercicio", type=int, default=2026)
    parser.add_argument("--programa", type=str, default='basico')
    parser.add_argument("--apply", action='store_true', help="Gravar no banco")
    
    args = parser.parse_args()
    process_file(args.filepath, args.exercicio, args.programa, args.apply)
