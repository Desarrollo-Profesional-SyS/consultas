# Compara, lead por lead, el cálculo propio del periodo 5-15 oct contra la hoja Datos de la línea base publicada.
import sys, os
import pandas as pd
D = sys.argv[1]; BASE = sys.argv[2]
L = pd.read_pickle(os.path.join(D, 'leads_base.pkl')).set_index('lead')
B = pd.read_pickle(BASE).set_index('ID (#)')
print('leads propios', len(L), 'publicados', len(B), 'en ambos', len(L.index.intersection(B.index)))
print('solo propios', sorted(set(L.index) - set(B.index))[:30])
print('solo publicados', sorted(set(B.index) - set(L.index))[:30])
J = L.join(B, how='inner')
sn = lambda s: s.map({'Sí': True, 'No': False})
checks = {
    'contestó saludo': (J.contesto_saludo, sn(J['¿Contestó el saludo?'])),
    'dejó en saludo': (J.dejo_en_saludo, J['Dejó de escribir en'].isin(['Solo su primer mensaje', 'Saludo: contestó y no volvió'])),
    'dejó en (exacto)': (J.dejo_en, J['Dejó de escribir en']),
    'ocupación': (J.contesto_area.fillna(False).astype(bool), sn(J['¿Contestó la ocupación?']).fillna(False)),
    'negativo': (J.entro_negativo, sn(J['¿Entró a Negativo?'])),
    'facilidades': (J.llego_facilidades, sn(J['¿Llegó a facilidades de pago?'])),
    'forma de pago': (J.llego_pago, sn(J['¿Llegó a forma de pago?'])),
    'oferta': (J.recibio_oferta, sn(J['¿Recibió oferta?'])),
    '2799': (J.recibio_2799, J['Ofertas recibidas'].fillna('').str.contains('2,799')),
    'oferta 1 bot': (J.oferta_1_bot.fillna(False).astype(bool), J['Primera oferta enviada por'].eq('Bot')),
    'audio equipo': (J.audio_equipo, sn(J['¿Audio del equipo?'])),
    'link': (J.abrio_link, sn(J['¿Abrió algún link?'])),
    'nunca persona': (J.nunca_persona, J['Minutos hasta el 1er mensaje de una persona'].isna()),
    'estado': (J.estado, J['Estado']),
    'compró': (J.venta, sn(J['¿Compró?'])),
    'fuera horario': (J.fuera_horario, sn(J['¿Entró de 9 a 21 h?']).map(lambda v: not v)),
}
for k, (a, b) in checks.items():
    ok = (a.values == b.values).mean()
    print(f'{k:20s} coincide {ok:.1%}   propio {pd.Series(a).astype(str).value_counts().to_dict() if k in ("dejó en (exacto)", "estado") else round(pd.Series(a).astype(float).mean(), 3)}   publicado {pd.Series(b).astype(str).value_counts().to_dict() if k in ("dejó en (exacto)", "estado") else round(pd.Series(b).astype(float).mean(), 3)}')
for k, a, b in [('msgs lead', J.msgs_lead, J['Mensajes del lead']), ('msgs bot', J.msgs_bot, J['Mensajes del bot']), ('msgs persona', J.msgs_persona, J['Mensajes de personas']),
                ('h persona', J.h_1er_msg_persona, J['Minutos hasta el 1er mensaje de una persona'] / 60), ('h oferta', J.h_1a_oferta, J['Horas hasta la 1a oferta']), ('precio', J.precio, J['Precio de venta'])]:
    d = (a.astype(float) - b.astype(float)).abs()
    print(f'{k:20s} iguales(±0.1) {(d <= 0.1).mean():.1%} de {d.notna().sum()}  media propia {a.astype(float).mean():.2f} publicada {b.astype(float).mean():.2f}')
J.to_pickle(os.path.join(D, 'validacion.pkl'))
