# Métricas por embudo con las definiciones del As Is, para comparar periodos.
import sys, os, json
import pandas as pd
EMB = ['ISO + Calidad', 'Manufactura y Calidad', 'Core Tools Premium']

def metricas(L):
    out = {}
    for nombre, X in [(e, L[L.embudo == e]) for e in EMB] + [('Tres embudos', L)]:
        m = {}
        n = len(X); m['Leads'] = n
        m['% entra fuera de horario'] = X.fuera_horario.mean()
        m['% contesta el saludo'] = X.contesto_saludo.mean()
        m['% deja de escribir en el saludo o antes'] = X.dejo_en_saludo.mean()
        m['% llega a facilidades de pago'] = X.llego_facilidades.mean()
        m['% llega a forma de pago'] = X.llego_pago.mean()
        m['% entra a Negativo'] = X.entro_negativo.mean()
        Q = X[X.recibio_pregunta_area == True]
        m['% contesta la ocupación'] = Q.contesto_area.astype(float).mean() if len(Q) else None
        m['Horas al 1er mensaje de una persona (mediana)'] = X.h_1er_msg_persona.median()
        m['% nunca recibió mensaje de una persona'] = X.nunca_persona.mean()
        m['% con audio del equipo'] = X.audio_equipo.mean()
        m['% recibe alguna oferta'] = X.recibio_oferta.mean()
        m['% recibe $3,799'] = X.recibio_3799.mean()
        m['% recibe $2,799'] = X.recibio_2799.mean()
        O = X[X.recibio_oferta]
        m['% de primeras ofertas que manda el bot'] = O.oferta_1_bot.astype(float).mean() if len(O) else None
        m['Horas a la 1a oferta (mediana)'] = O.h_1a_oferta.median() if len(O) else None
        m['% abrió algún link'] = X.abrio_link.mean()
        m['Compra si abrió link'] = X[X.abrio_link].venta.mean() if X.abrio_link.any() else None
        m['Compra si no abrió link'] = X[~X.abrio_link].venta.mean()
        P1 = X[X.h_1er_msg_persona <= 1]; P24 = X[X.h_1er_msg_persona > 24]
        m['Compra con mensaje de persona en la 1a hora'] = P1.venta.mean() if len(P1) else None
        m['Compra con mensaje de persona después de 1 día'] = P24.venta.mean() if len(P24) else None
        m['Mensajes del bot por lead'] = X.msgs_bot.mean()
        m['Mensajes del lead por lead'] = X.msgs_lead.mean()
        m['Mensajes de personas por lead'] = X.msgs_persona.mean()
        V = X[X.venta]
        m['Ventas'] = int(X.venta.sum())
        m['Conversión'] = X.venta.mean()
        m['Ventas a $3,999 o más'] = int((V.precio >= 3999).sum())
        m['Ventas con descuento'] = int((V.precio < 3999).sum())
        m['Precio promedio de venta'] = V.precio.mean() if len(V) else None
        m['Ingreso registrado'] = V.precio.sum()
        m['Abiertos al corte'] = int((X.estado == 'Abierto').sum())
        m['Perdidos al corte'] = int((X.estado == 'Perdido').sum())
        Pe = X[X.estado == 'Perdido']
        m['% de Perdidos con razón «No contestaron»'] = (Pe.razon_perdida == 'No contestaron').mean() if len(Pe) else None
        m['% de Perdidos que marcó una persona'] = (Pe.perdido_por == 'Persona').mean() if len(Pe) else None
        m['Escribieron después de marcarlos Perdido'] = int(X.escribio_en_perdido.sum())
        m['Ventas de leads que estuvieron en Perdido'] = int(X.venta_estuvo_perdido.sum())
        # Temperatura (primeras 24 h)
        for t in ['Caliente', 'Tibio', 'Frío']:
            T = X[X.temperatura == t]
            m[f'{t}: leads'] = len(T)
            m[f'{t}: ventas'] = int(T.venta.sum())
            m[f'{t}: recibieron $2,799'] = int(T.recibio_2799.sum())
            m[f'{t}: recibieron oferta con descuento'] = int(T.recibio_oferta.sum())
            m[f'{t}: plantillas pagadas'] = int(T.plantillas_pagadas.sum())
            m[f'{t}: respuestas a plantillas pagadas'] = int(T.plantillas_pagadas_resp.sum())
        m['Plantillas pagadas (estimado)'] = int(X.plantillas_pagadas.sum())
        m['% de respuesta a plantillas pagadas'] = X.plantillas_pagadas_resp.sum() / X.plantillas_pagadas.sum() if X.plantillas_pagadas.sum() else None
        m['Leads con mensajes retenidos por Meta'] = int(X.meta_retenido.sum())
        m['Leads que se dieron de baja de marketing'] = int(X.baja_marketing.sum())
        m['Envíos fallidos'] = int(X.envios_fallidos.sum())
        # Caso del proyecto
        C = X[X.temperatura == 'Caliente']; TF = X[X.temperatura != 'Caliente']
        c_cal = int((~(C.ruta_pdf & C.audio_corto)).sum())
        c_tf = int(TF.recibio_2799.sum())
        c_tf_any = int(TF.recibio_oferta.sum())
        m['Caso · calientes sin ruta PDF + audio ≤ 1 min'] = c_cal
        m['Caso · tibios y fríos con $2,799'] = c_tf
        m['Caso · total (con $2,799)'] = c_cal + c_tf
        m['Caso · % (con $2,799)'] = (c_cal + c_tf) / n if n else None
        m['Caso · tibios y fríos con cualquier oferta con descuento'] = c_tf_any
        m['Caso · % (cualquier descuento)'] = (c_cal + c_tf_any) / n if n else None
        m['Calientes con ruta PDF'] = int(C.ruta_pdf.sum())
        m['Calientes con audio ≤ 1 min'] = int(C.audio_corto.sum())
        out[nombre] = m
    return pd.DataFrame(out)

if __name__ == '__main__':
    D = sys.argv[1]
    for p in sys.argv[2:]:
        L = pd.read_pickle(os.path.join(D, f'leads_{p}.pkl'))
        M = metricas(L)
        pd.set_option('display.width', 250); pd.set_option('display.max_rows', 200)
        print('=====', p); print(M.map(lambda v: round(v, 3) if isinstance(v, float) else v).to_string())
        M.to_pickle(os.path.join(D, f'metricas_{p}.pkl'))
