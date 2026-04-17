import mongoose from 'mongoose';
import 'dotenv/config';
import { ConfigTramite } from './models/ConfigTramite';

const MONGO_URI = process.env.MONGO_URI || '';

const tramites = [
  {
    tipo: 'LAU',
    nombre: 'Licencia Ambiental Única',
    activo: true,
    diasCorreccion: 10,
    requisitos: [
      { nombre: 'Escrito libre de solicitud de trámite ante la Secretaría', obligatorio: true },
      { nombre: 'Formato de solicitud de trámite de la LAU', obligatorio: true },
      { nombre: 'Copia de identificación oficial (INE) del titular o representante legal', obligatorio: true },
      { nombre: 'Acta constitutiva (en caso de persona moral)', obligatorio: false, descripcion: 'Solo requerido para personas morales' },
      { nombre: 'Constancia de situación fiscal (persona física o moral)', obligatorio: true },
      { nombre: 'Estudio de emisiones contaminantes a la atmósfera elaborado por laboratorio acreditado ante la EMA A.C.', obligatorio: true },
      { nombre: 'Diagramas de funcionamiento de cada uno de los procesos del establecimiento', obligatorio: true },
      { nombre: 'Copia del comprobante de domicilio del establecimiento', obligatorio: true },
      { nombre: 'Plan de contingencia atmosférica interno', obligatorio: true },
    ],
  },
  {
    tipo: 'COA',
    nombre: 'Cédula de Operación Anual',
    activo: true,
    diasCorreccion: 10,
    // COA tiene periodo: enero–abril
    fechaApertura: new Date(`${new Date().getFullYear()}-01-01`),
    fechaCierre: new Date(`${new Date().getFullYear()}-04-30`),
    requisitos: [
      { nombre: 'Escrito libre de solicitud de trámite ante la Secretaría', obligatorio: true },
      { nombre: 'Formato de la COA debidamente requisitado', obligatorio: true },
      { nombre: 'Copia de identificación oficial (INE) del titular o representante legal', obligatorio: true },
      { nombre: 'Acta constitutiva (en caso de persona moral)', obligatorio: false, descripcion: 'Solo requerido para personas morales' },
      { nombre: 'Constancia de situación fiscal (persona física o moral)', obligatorio: true },
      { nombre: 'Estudio de emisiones contaminantes a la atmósfera elaborado por laboratorio acreditado ante la EMA A.C.', obligatorio: false, descripcion: 'En caso de aplicar' },
      { nombre: 'Documentación técnica: comprobantes de recolección de residuos de manejo especial del año anterior (bitácoras, etc.)', obligatorio: true },
      { nombre: 'Diagramas de funcionamiento de cada uno de los procesos del establecimiento', obligatorio: true },
      { nombre: 'Copia simple de análisis de calidad del agua residual realizados durante el periodo', obligatorio: false, descripcion: 'En caso de aplicar' },
      { nombre: 'Copia del comprobante de domicilio del establecimiento', obligatorio: true },
    ],
  },
  {
    tipo: 'MIA',
    nombre: 'Manifestación de Impacto Ambiental',
    activo: true,
    diasCorreccion: 10,
    requisitos: [
      { nombre: 'Escrito libre de solicitud de trámite ante la Secretaría', obligatorio: true },
      { nombre: 'Copia de la Cédula del prestador de servicios ecológicos y ambientales (PSEA vigente) quien realizó el estudio', obligatorio: true },
      { nombre: 'Comprobante de pago de derechos a evaluación y resolución de impacto ambiental emitido por SEFIN', obligatorio: true },
      { nombre: 'Constancia de Compatibilidad Urbanística Estatal emitida por SEDUVOT', obligatorio: true },
      { nombre: 'Constancia de Compatibilidad Urbanística Municipal', obligatorio: true },
      { nombre: 'Cambio de Uso de suelo y/o estudio técnico emitido ante SEMARNAT', obligatorio: true },
      { nombre: 'Documentación legal del predio (escritura notarial, contratos, etc.)', obligatorio: true },
      { nombre: 'Copia de identificación oficial (INE) del representante legal del proyecto', obligatorio: true },
      { nombre: 'Constancia de Situación Fiscal', obligatorio: true },
      { nombre: 'Acta constitutiva y poder notarial (en caso de persona moral)', obligatorio: false, descripcion: 'Solo requerido para personas morales' },
      { nombre: 'Constancia de factibilidad de servicio de agua potable, saneamiento y alcantarillado', obligatorio: true },
      { nombre: 'Constancia de factibilidad de servicio de energía eléctrica emitida por CFE', obligatorio: true },
      { nombre: 'Constancia de factibilidad de servicio de recolección de residuos sólidos (no peligrosos)', obligatorio: true },
      { nombre: 'Opinión técnica favorable del derecho de vía emitida por SCT', obligatorio: true },
      { nombre: 'Opinión técnica favorable emitida por CONAGUA', obligatorio: true },
      { nombre: 'Opinión técnica favorable de salubridad emitida por COFEPRIS', obligatorio: true },
      { nombre: 'Opinión técnica favorable emitida por la Coordinación Estatal de Protección Civil', obligatorio: true },
      { nombre: 'Opinión técnica favorable emitida por el INAH', obligatorio: true },
      { nombre: 'Resolución positiva emitida por la Agencia de Seguridad, Energía y Ambiente (ASEA)', obligatorio: true },
      { nombre: 'Estudio de Mecánica de suelos elaborado por laboratorio certificado', obligatorio: true },
      { nombre: 'Planos de localización del proyecto', obligatorio: true },
      { nombre: 'Carta protesta de decir verdad firmada por el responsable del estudio y el promovente', obligatorio: true },
      { nombre: 'Copia digital de la Manifestación de Impacto Ambiental o Informe Preventivo (con la totalidad de sus anexos)', obligatorio: true },
    ],
  },
];

async function seed() {
  try {
    if (!MONGO_URI) throw new Error('Falta MONGO_URI en variables de entorno');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB conectado');

    for (const tramite of tramites) {
      await ConfigTramite.findOneAndUpdate(
        { tipo: tramite.tipo },
        tramite,
        { upsert: true, new: true }
      );
      console.log(` ${tramite.tipo} - ${tramite.nombre} cargado (${tramite.requisitos.length} requisitos)`);
    }

    console.log('\n Seed completado exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

seed();