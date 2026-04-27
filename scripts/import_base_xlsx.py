import os
import sys
import json
from datetime import datetime
import openpyxl

def pad_cnpj(cnpj_val):
    if not cnpj_val:
        return None
    c = str(cnpj_val).strip()
    if len(c) == 13:
        return c.zfill(14)
    return c

def process_file(filepath, exercicio=2026, programa='basico'):
    print(f"Lendo {filepath} para exercício {exercicio} / {programa}...")
    
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
            
    required_cols = ['DESIGNAÇÃO', 'NOME']
    for req in required_cols:
        if req not in header:
            print(f"ERRO: Coluna {req} obrigatória não encontrada.")
            sys.exit(1)

    preview_data = []
    
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        designacao = row[header['DESIGNAÇÃO']]
        nome = row[header['NOME']]
        
        if not designacao or not nome:
            continue # pula linhas vazias
            
        cnpj_raw = row[header.get('CNPJ')] if 'CNPJ' in header else None
        cnpj_val = pad_cnpj(cnpj_raw)
        
        # Simulando payload para import_preview.json
        payload = {
            'designacao': str(designacao).strip(),
            'nome': str(nome).strip(),
            'inep': str(row[header.get('INEP')]).strip() if 'INEP' in header and row[header.get('INEP')] else None,
            'cnpj': cnpj_val,
            'agencia': str(row[header.get('AGÊNCIA')]).strip() if 'AGÊNCIA' in header and row[header.get('AGÊNCIA')] else None,
            'conta_corrente': str(row[header.get('CONTA CORRENTE')]).strip() if 'CONTA CORRENTE' in header and row[header.get('CONTA CORRENTE')] else None,
            'reprogramado_custeio': float(row[header.get('REPROGRAMADO CUSTEIO', 0)] or 0),
            'reprogramado_capital': float(row[header.get('REPROGRAMADO CAPITAL', 0)] or 0),
            'parcela_1_custeio': float(row[header.get('1ª PARCELA CUSTEIO', 0)] or 0),
            'parcela_1_capital': float(row[header.get('1ª PARCELA CAPITAL', 0)] or 0),
            'parcela_2_custeio': float(row[header.get('2ª PARCELA CUSTEIO', 0)] or 0),
            'parcela_2_capital': float(row[header.get('2ª PARCELA CAPITAL', 0)] or 0),
        }
        preview_data.append(payload)

    # Dry-run ou Insert no banco
    # Neste ambiente simulado (PR2), apenas geramos o dry-run/preview se a DATABASE_URL não estiver ativa.
    db_url = os.environ.get('DATABASE_URL')
    
    os.makedirs('data/output', exist_ok=True)
    with open('data/output/import_preview.json', 'w', encoding='utf-8') as f:
        json.dump(preview_data, f, ensure_ascii=False, indent=2)
        
    report = f"""# Relatório de Importação (Dry-run/Preview)
Data: {datetime.now().isoformat()}
Arquivo: {filepath}
Exercício: {exercicio}
Programa: {programa}

Total Processado: {len(preview_data)} unidades.
"""
    with open('data/output/import_report.md', 'w', encoding='utf-8') as f:
        f.write(report)
        
    print(f"Processamento concluído. {len(preview_data)} linhas válidas salvas no preview. Sem conexão ativa de DB para inserção real (modo dry-run seguro ativado).")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python import_base_xlsx.py <caminho_do_arquivo> [exercicio] [programa]")
        sys.exit(1)
        
    filepath = sys.argv[1]
    exercicio = int(sys.argv[2]) if len(sys.argv) > 2 else 2026
    programa = sys.argv[3] if len(sys.argv) > 3 else 'basico'
    
    process_file(filepath, exercicio, programa)
