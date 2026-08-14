"""
Extrae Portafolio.ods -> JSON limpio, uno por coleccion de Firestore.
Se corre una sola vez de forma local. No toca Firestore, solo genera JSON
en scripts/import-data/ para revisar antes de importar.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
    'text': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0',
    'office': 'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
}
OFFICE = '{urn:oasis:names:tc:opendocument:xmlns:office:1.0}'
TABLE = '{urn:oasis:names:tc:opendocument:xmlns:table:1.0}'


def cell_text(cell):
    parts = []
    for p in cell.findall('text:p', NS):
        parts.append(''.join(p.itertext()))
    return ' '.join(parts).strip()


def cell_value(cell):
    vtype = cell.get(OFFICE + 'value-type')
    if vtype in ('float', 'currency', 'percentage'):
        v = cell.get(OFFICE + 'value')
        return float(v) if v is not None else None
    if vtype == 'date':
        v = cell.get(OFFICE + 'date-value')
        return v[:10] if v else None
    txt = cell_text(cell)
    return txt if txt else None


def sheet_rows(table):
    """Devuelve lista de filas, cada una lista de valores (None si vacio), columnas 0-indexed.

    Importante: no se debe truncar number-columns-repeated en celdas vacias,
    o las columnas posteriores quedan desalineadas. Se expande completo y
    luego se recortan los None sobrantes al final de la fila.
    """
    rows = []
    for row in table.findall('table:table-row', NS):
        values = []
        for cell in row.findall('table:table-cell', NS):
            repeat = int(cell.get(TABLE + 'number-columns-repeated', '1'))
            val = cell_value(cell)
            values.extend([val] * repeat)
        while values and values[-1] is None:
            values.pop()
        if values:
            rows.append(values)
    return rows


def get(row, i):
    return row[i] if i < len(row) else None


def clean_number(raw):
    """Limpia numeros con basura de copy-paste: comillas, corchetes, etc."""
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    s = re.sub(r'[^0-9.\-]', '', str(raw))
    if s in ('', '-', '.'):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def load_sheets(path):
    with open(path, 'rb') as f:
        # content.xml esta dentro del .zip (.ods)
        pass
    import zipfile
    with zipfile.ZipFile(path) as z:
        with z.open('content.xml') as f:
            tree = ET.parse(f)
    root = tree.getroot()
    body = root.find('office:body', NS)
    spreadsheet = body.find('office:spreadsheet', NS)
    sheets = {}
    for table in spreadsheet.findall('table:table', NS):
        name = table.get(TABLE + 'name')
        sheets[name] = sheet_rows(table)
    return sheets


def extract_totales(rows):
    """Hoja Totales: histórico semanal (columnas H..K aprox: fecha, aporte, valor, rendimiento)."""
    snapshots = []
    for row in rows[1:]:
        fecha = get(row, 8)
        aporte = get(row, 9)
        valor = get(row, 10)
        rendimiento = get(row, 11)
        if fecha and isinstance(fecha, str) and re.match(r'^\d{4}-\d{2}-\d{2}', fecha):
            if aporte is not None and valor is not None:
                snapshots.append({
                    'fecha': fecha[:10],
                    'aporteTotal': aporte,
                    'valorTotal': valor,
                    'rendimiento': rendimiento if rendimiento is not None else 0,
                    'porInstrumento': {},
                })
    return snapshots


def extract_casa(rows):
    items = []
    for row in rows[1:]:
        concepto = get(row, 0)
        cantidad = get(row, 1)
        precio = get(row, 2)
        total = get(row, 3)
        if concepto and cantidad is not None and precio is not None:
            items.append({
                'concepto': concepto,
                'cantidad': cantidad,
                'precioUnitario': precio,
                'total': total if total is not None else cantidad * precio,
            })
    return items


def extract_afore(rows):
    balances = []
    for row in rows:
        fecha = get(row, 0)
        saldo = get(row, 1)
        if isinstance(fecha, str) and re.match(r'^\d{4}-\d{2}-\d{2}', fecha) and saldo is not None:
            balances.append({'fecha': fecha[:10], 'saldo': saldo})
    return balances


def extract_yotepresto(rows):
    values = []
    movimientos = []
    for row in rows[1:]:
        fecha_val = get(row, 3)
        valor_cuenta = get(row, 4)
        if isinstance(fecha_val, str) and re.match(r'^\d{4}-\d{2}-\d{2}', fecha_val) and valor_cuenta is not None:
            values.append({'fecha': fecha_val[:10], 'valorCuenta': valor_cuenta})
        fecha_mov = get(row, 0)
        monto_mov = get(row, 1)
        if isinstance(fecha_mov, str) and re.match(r'^\d{4}-\d{2}-\d{2}', fecha_mov) and monto_mov is not None:
            movimientos.append({'fecha': fecha_mov[:10], 'monto': monto_mov})
    return values, movimientos


DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}')


def extract_finsus(rows):
    cuentas = []
    movimientos = []
    for row in rows[1:]:
        cuenta = get(row, 2)
        saldo_raw = get(row, 4)
        saldo = clean_number(saldo_raw)
        if cuenta:
            tasa = get(row, 6)
            plazo = get(row, 7)
            f_ape = get(row, 8)
            vence = get(row, 9)
            if saldo is not None and isinstance(f_ape, str):
                # Si el saldo crudo viene como texto (con comilla/corchete extra)
                # es la marca manual del usuario para que no sume en el total:
                # significa que el pagare ya vencio.
                vencida = isinstance(saldo_raw, str)
                cuentas.append({
                    'cuenta': str(cuenta),
                    'saldo': saldo,
                    'tasa': tasa if tasa is not None else 0,
                    'plazo': str(plazo) if plazo is not None else '',
                    'fechaApertura': f_ape[:10],
                    'fechaVencimiento': vence[:10] if isinstance(vence, str) else f_ape[:10],
                    'vencida': vencida,
                })
        elif saldo is not None:
            # fila suelta de deposito individual (sin cuenta asociada): la
            # fecha es el primer valor con forma de fecha en la fila.
            fecha = next((v for v in row if isinstance(v, str) and DATE_RE.match(v)), None)
            if fecha:
                movimientos.append({'fecha': fecha[:10], 'monto': saldo})
    # Deposito inicial estimado de la fila 2 (columnas N/O/P)
    if len(rows) > 1:
        dep_monto = get(rows[1], 13)
        dep_fecha = get(rows[1], 14)
        if dep_monto is not None and isinstance(dep_fecha, str):
            movimientos.insert(0, {'fecha': dep_fecha[:10], 'monto': dep_monto, 'nota': 'Inicial estimado'})
    return cuentas, movimientos


def clean_symbol(nombre):
    base = re.split(r'[\s(]', str(nombre), maxsplit=1)[0]
    return re.sub(r'[^A-Z0-9]', '', base.upper())


def extract_criptos(rows):
    holdings = []
    movimientos = []
    in_deposits = False
    for row in rows[1:]:
        col0 = get(row, 0)
        if col0 == 'Depositos':
            in_deposits = True
            continue
        if in_deposits:
            fecha = get(row, 0)
            monto = get(row, 1)
            if isinstance(fecha, str) and DATE_RE.match(fecha) and monto is not None:
                movimientos.append({'fecha': fecha[:10], 'monto': monto, 'nota': get(row, 2)})
            continue
        nombre = col0
        cantidad = get(row, 1)
        if nombre and cantidad is not None and not DATE_RE.match(str(nombre)):
            holdings.append({
                'nombre': str(nombre),
                'symbol': clean_symbol(nombre),
                'cantidad': cantidad,
                'costoTotal': get(row, 3) or 0,
            })
    return holdings, movimientos


def extract_bolsa(rows):
    """La hoja Bolsa no tiene fila de encabezado: la fila 0 ya es un holding real."""
    holdings = []
    movimientos = []
    in_deposits = False
    for row in rows:
        col0 = get(row, 0)
        if col0 == 'Depositos':
            in_deposits = True
            continue
        if in_deposits:
            fecha = get(row, 0)
            monto = get(row, 1)
            if isinstance(fecha, str) and DATE_RE.match(fecha) and monto is not None:
                movimientos.append({'fecha': fecha[:10], 'monto': monto})
            continue
        ticker = col0
        cantidad = get(row, 1)
        if ticker and cantidad is not None and not DATE_RE.match(str(ticker)):
            holdings.append({
                'ticker': clean_symbol(ticker),
                'nombre': str(ticker),
                'cantidad': cantidad,
                'costoTotal': 0,
            })
    return holdings, movimientos


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / 'Descargas' / 'Portafolio.ods')
    out_dir = Path(__file__).parent / 'import-data'
    out_dir.mkdir(exist_ok=True)

    sheets = load_sheets(src)

    snapshots = extract_totales(sheets['Totales'])
    casa = extract_casa(sheets['Casa'])
    afore = extract_afore(sheets['AFORE'])
    yotepresto_valores, yotepresto_mov = extract_yotepresto(sheets['YoTePresto'])
    finsus_cuentas, finsus_mov = extract_finsus(sheets['Finsus'])
    cripto_holdings, cripto_mov = extract_criptos(sheets['Criptos'])
    bolsa_holdings, bolsa_mov = extract_bolsa(sheets['Bolsa'])

    data = {
        'snapshots': snapshots,
        'casaGastos': casa,
        'aforeValores': afore,
        'yotePrestoValores': yotepresto_valores,
        'yotePrestoMovimientos': yotepresto_mov,
        'finsusCuentas': finsus_cuentas,
        'finsusMovimientos': finsus_mov,
        'criptoHoldings': cripto_holdings,
        'criptoMovimientos': cripto_mov,
        'bolsaHoldings': bolsa_holdings,
        'bolsaMovimientos': bolsa_mov,
    }

    for name, items in data.items():
        with open(out_dir / f'{name}.json', 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)

    print('Resumen de extraccion:')
    for name, items in data.items():
        print(f'  {name}: {len(items)} registros')
    print(f'\nJSON escrito en {out_dir}')


if __name__ == '__main__':
    main()
