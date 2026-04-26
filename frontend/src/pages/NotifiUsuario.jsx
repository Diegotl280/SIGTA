import React from 'react';

const NotifiUsuario = () => {
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div style={{
        backgroundColor: '#ebd02f',
        padding: '1.5rem',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '800px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        textAlign: 'left'
      }}>
        {/*Este es solo un ejemplo de notificacion. Luego lo conectaremos con la base de datos DIEGO!!!*/}

        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a', fontWeight: '500' }}>La documentación</h3>
        <p style={{ margin: '0 0 1rem 0', color: '#1a1a1a', fontStyle: 'italic', fontSize: '1rem' }}>
          REQUISITOS PARA EL TRÁMITE DE LA MANIFESTACIÓN DE IMPACTO AMBIENTAL (MIA) E INFORME PREVENTIVO (IP),
          <span style={{ fontStyle: 'normal', fontWeight: 'bold' }}> esta incompleta o es errónea, favor de corrección lo antes posible.</span>
        </p>
        <p style={{ margin: '0', color: '#1a1a1a', fontSize: '1rem' }}>
          Lapso de tiempo permitido: <span style={{ fontWeight: 'bold' }}>10 días.</span>
        </p>
      </div>
      {/*FIN DEL EJEMPLO DE NOTIFICACION*/}

      <div style={{ color: '#888', marginTop: '1rem', fontSize: '0.9rem' }}>
        No hay mas pendientes
      </div>

    </div>
  );
};

export default NotifiUsuario;
