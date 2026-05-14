import React, { useState, useEffect } from "react";
import axios from "axios";
import editarIcon from "../assets/editar.png";
import iconBorrar from "../assets/icon_borrar.png";
import iconAgregaDoc from "../assets/icon_agrega_doc.png";
import { useLocation } from "react-router-dom";
import "./TramitesAdmin.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const token = () => localStorage.getItem("token");

const TIPOS_DISPONIBLES = ["LAU", "COA", "MIA", "PSE", "RRME"];

const NOMBRES_TRAMITE = {
  LAU: "Licencia Ambiental Única",
  COA: "Cédula de Operación Anual",
  MIA: "Manifestación de Impacto Ambiental",
  PSE: "Prestadores de Servicios Ecológicos",
  RRME: "Registro de Residuos de Manejo Especial",
};

const ESTADO_COLORS = {
  borrador: { bg: "#e5e7eb", text: "#374151" },
  enviado: { bg: "#dbeafe", text: "#1d4ed8" },
  en_revision: { bg: "#fef3c7", text: "#92400e" },
  con_observaciones: { bg: "#fee2e2", text: "#b91c1c" },
  validado: { bg: "#d1fae5", text: "#065f46" },
  cerrado: { bg: "#f3f4f6", text: "#6b7280" },
};

const ESTADO_LABELS = {
  borrador: "Borrador",
  enviado: "Enviado",
  en_revision: "En revisión",
  con_observaciones: "Con observaciones",
  validado: "Validado",
  cerrado: "Cerrado",
};

const modalBase = {
  tipo: "",
  nombre: "",
  activo: true,
  fechaApertura: "",
  fechaCierre: "",
  diasCorreccion: 10,
  requisitos: [],
};

const TramitesAdmin = () => {
  const location = useLocation();

  const [tramites, setTramites] = useState([]);
  const [vistaLista, setVistaLista] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tramiteEditando, setTramiteEditando] = useState(null);
  const [form, setForm] = useState(modalBase);
  const [nuevoRequisito, setNuevoRequisito] = useState("");
  const [requisitoOblig, setRequisitoOblig] = useState(true);
  const [loading, setLoading] = useState(false);

  const [tramiteSeleccionado, setTramiteSeleccionado] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [loadingExp, setLoadingExp] = useState(false);
  const [expedienteDetalle, setExpedienteDetalle] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const getCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, type: 'prev' });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, type: 'current', isToday: i === today.getDate() });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, type: 'next' });
    }
    return days;
  };

  const getMonthName = () => {
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const today = new Date();
    return `${months[today.getMonth()]} ${today.getFullYear()}`;
  };
  useEffect(() => {
    cargarTramites();
  }, []);

  useEffect(() => {
    if (location.state?.tipoAuto && tramites.length > 0) {
      const tramite = tramites.find((t) => t.tipo === location.state.tipoAuto);
      if (tramite) seleccionarTramite(tramite);
    }
  }, [tramites, location.state]);

  const cargarTramites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/config-tramites`, {
        headers: { Authorization: `Bearer ${token()}` },
      });

      setTramites(res.data.tramites || []);
    } catch (err) {
      console.error(err);
    }
  };

  const abrirAgregar = () => {
    setTramiteEditando(null);
    setForm(modalBase);
    setModalAbierto(true);
  };

  const abrirEditar = (t) => {
    setTramiteEditando(t);
    setForm({
      tipo: t.tipo,
      nombre: t.nombre,
      activo: t.activo,
      fechaApertura: t.fechaApertura ? t.fechaApertura.slice(0, 10) : "",
      fechaCierre: t.fechaCierre ? t.fechaCierre.slice(0, 10) : "",
      diasCorreccion: t.diasCorreccion,
      requisitos: t.requisitos || [],
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTramiteEditando(null);
    setForm(modalBase);
    setNuevoRequisito("");
  };

  const agregarRequisito = () => {
    if (!nuevoRequisito.trim()) return;

    setForm((f) => ({
      ...f,
      requisitos: [
        ...f.requisitos,
        {
          nombre: nuevoRequisito.trim(),
          obligatorio: requisitoOblig,
        },
      ],
    }));

    setNuevoRequisito("");
  };

  const eliminarRequisito = (i) => {
    setForm((f) => ({
      ...f,
      requisitos: f.requisitos.filter((_, idx) => idx !== i),
    }));
  };

  const guardarTramite = async () => {
    setLoading(true);

    try {
      const payload = {
        ...form,
        fechaApertura: form.fechaApertura || undefined,
        fechaCierre: form.fechaCierre || undefined,
      };

      if (tramiteEditando) {
        await axios.put(
          `${API_BASE_URL}/api/config-tramites/${tramiteEditando._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token()}` },
          }
        );
      } else {
        await axios.post(`${API_BASE_URL}/api/config-tramites`, payload, {
          headers: { Authorization: `Bearer ${token()}` },
        });
      }

      await cargarTramites();
      cerrarModal();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const seleccionarTramite = async (t) => {
    setTramiteSeleccionado(t);
    setExpedienteDetalle(null);
    setLoadingExp(true);

    try {
      const res = await axios.get(`${API_BASE_URL}/api/expedientes`, {
        headers: { Authorization: `Bearer ${token()}` },
      });

      const filtrados = (res.data.expedientes || []).filter(
        (e) => e.tipo === t.tipo
      );

      setExpedientes(filtrados);

      if (location.state?.expedienteId) {
        const expDirecto = filtrados.find(
          (e) => e._id === location.state.expedienteId
        );

        if (expDirecto) verDetalle(expDirecto);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingExp(false);
    }
  };

  const verDetalle = async (exp) => {
    setExpedienteDetalle(exp);
    setLoadingDetalle(true);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/expedientes/${exp._id}/documentos`,
        {
          headers: { Authorization: `Bearer ${token()}` },
        }
      );

      setChecklist(res.data.checklist || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const recargarChecklist = async () => {
    if (!expedienteDetalle?._id) return;

    const res = await axios.get(
      `${API_BASE_URL}/api/expedientes/${expedienteDetalle._id}/documentos`,
      {
        headers: { Authorization: `Bearer ${token()}` },
      }
    );

    setChecklist(res.data.checklist || []);
  };

  const cambiarEstado = async (expId, nuevoEstado, obs = "") => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/expedientes/${expId}/estado`,
        { estado: nuevoEstado, observacionesGenerales: obs },
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      setExpedientes((prev) =>
        prev.map((e) => (e._id === expId ? { ...e, estado: nuevoEstado } : e))
      );

      setExpedienteDetalle((prev) =>
        prev ? { ...prev, estado: nuevoEstado } : null
      );
    } catch (err) {
      alert(err.response?.data?.msg || "Error al cambiar estado del expediente");
    }
  };

  const validarDocumento = async (documentoId, estado) => {
    let observacion = "";

    if (estado === "con_observaciones") {
      observacion = prompt("Escribe la observación para este documento:");

      if (observacion === null) return;

      if (!observacion.trim()) {
        alert("La observación no puede estar vacía.");
        return;
      }
    }

    try {
      await axios.patch(
        `${API_BASE_URL}/api/expedientes/${expedienteDetalle._id}/documentos/${documentoId}/validar`,
        { estado, observacion },
        { headers: { Authorization: `Bearer ${token()}` } }
      );

      await recargarChecklist();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al validar documento");
    }
  };

  const abrirDocumento = async (rutaArchivo) => {
    const url = `${API_BASE_URL}/${rutaArchivo}`;

    try {
      const res = await fetch(url, { method: "HEAD" });

      if (!res.ok) {
        alert(
          "El archivo no está disponible en este entorno. Probablemente fue subido desde otra computadora o servidor."
        );
        return;
      }

      window.open(url, "_blank");
    } catch (error) {
      alert("No se pudo acceder al archivo.");
    }
  };

  if (expedienteDetalle) {
    return (
      <div className="tramites-detalle-container fade-in">
        <div className="detalle-header">
          <button
            className="btn-volver"
            onClick={() => setExpedienteDetalle(null)}
          >
            ← Volver
          </button>

          <h2>
            Expediente: <span>{expedienteDetalle.folio}</span>
          </h2>

          <span
            className="estado-badge"
            style={{
              backgroundColor: ESTADO_COLORS[expedienteDetalle.estado]?.bg,
              color: ESTADO_COLORS[expedienteDetalle.estado]?.text,
            }}
          >
            {ESTADO_LABELS[expedienteDetalle.estado]}
          </span>
        </div>

        <div className="detalle-info">
          <span>
            <strong>Tipo:</strong> {expedienteDetalle.tipo}
          </span>

          <span>
            <strong>Usuario:</strong>{" "}
            {expedienteDetalle.usuario?.email || expedienteDetalle.usuario}
          </span>

          <span>
            <strong>Enviado:</strong>{" "}
            {expedienteDetalle.fechaEnvio
              ? new Date(expedienteDetalle.fechaEnvio).toLocaleDateString(
                "es-MX"
              )
              : "—"}
          </span>

          {expedienteDetalle.fechaLimiteCorreccion && (
            <span style={{ color: "#b91c1c" }}>
              <strong>Límite corrección:</strong>{" "}
              {new Date(
                expedienteDetalle.fechaLimiteCorreccion
              ).toLocaleDateString("es-MX")}
            </span>
          )}
        </div>

        {expedienteDetalle.observacionesGenerales && (
          <div className="detalle-obs">
            <strong>Observaciones generales:</strong>{" "}
            {expedienteDetalle.observacionesGenerales}
          </div>
        )}

        <div className="detalle-acciones">
          <button
            className="btn-estado en-revision"
            onClick={() => cambiarEstado(expedienteDetalle._id, "en_revision")}
          >
            Marcar En revisión
          </button>
        </div>

        <h3 className="checklist-titulo">
          Requisitos — {expedienteDetalle.tipo}
        </h3>

        {loadingDetalle ? (
          <div className="loader">Cargando...</div>
        ) : (
          <div className="checklist-lista">
            {checklist.map((item, i) => (
              <div key={i} className="checklist-item">
                <div className="checklist-nombre">
                  <span
                    className={`req-badge ${item.obligatorio ? "oblig" : "opcional"
                      }`}
                  >
                    {item.obligatorio ? "Requerido" : "Opcional"}
                  </span>

                  {item.requisito}
                </div>

                <div
                  className="checklist-estado"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className={`doc-estado ${item.estado.replace("_", "-")}`}
                  >
                    {item.estado === "no_subido"
                      ? "No subido"
                      : item.estado === "pendiente"
                        ? "Pendiente"
                        : item.estado === "validado"
                          ? "✓ Validado"
                          : "Con observaciones"}
                  </span>

                  {item.documento && (
                    <>
                      <button
                        className="doc-nombre"
                        onClick={() =>
                          abrirDocumento(item.documento.rutaArchivo)
                        }
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        📄 {item.documento.nombreArchivo}
                      </button>

                      <button
                        className="btn-estado validado"
                        onClick={(e) => {
                          e.stopPropagation();
                          validarDocumento(item.documento._id, "validado");
                        }}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.6rem",
                        }}
                      >
                        ✓ Validar
                      </button>

                      <button
                        className="btn-estado con-obs"
                        onClick={(e) => {
                          e.stopPropagation();
                          validarDocumento(
                            item.documento._id,
                            "con_observaciones"
                          );
                        }}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.3rem 0.6rem",
                        }}
                      >
                        ✕ Observación
                      </button>

                      {item.documento.observacion && (
                        <div
                          style={{
                            width: "100%",
                            fontSize: "0.78rem",
                            color: "#b91c1c",
                            marginTop: "0.25rem",
                          }}
                        >
                          <strong>Observación:</strong>{" "}
                          {item.documento.observacion}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tramiteSeleccionado) {
    return (
      <div className="tramites-lista-container fade-in">
        <div className="lista-header">
          <button
            className="btn-volver"
            onClick={() => setTramiteSeleccionado(null)}
          >
            ← Volver
          </button>

          <h2>{tramiteSeleccionado.nombre}</h2>
        </div>

        {loadingExp ? (
          <div className="loader">Cargando...</div>
        ) : expedientes.length === 0 ? (
          <div className="lista-vacia">
            No hay expedientes para {tramiteSeleccionado.tipo}
          </div>
        ) : (
          <div className="expedientes-lista">
            {expedientes.map((exp) => (
              <div
                key={exp._id}
                className="expediente-row"
                onClick={() => verDetalle(exp)}
              >
                <span className="exp-folio">{exp.folio}</span>

                <span className="exp-usuario">
                  {exp.usuario?.email || "—"}
                </span>

                <span
                  className="exp-estado"
                  style={{
                    backgroundColor: ESTADO_COLORS[exp.estado]?.bg,
                    color: ESTADO_COLORS[exp.estado]?.text,
                  }}
                >
                  {ESTADO_LABELS[exp.estado]}
                </span>

                <span className="exp-fecha">
                  {new Date(exp.createdAt).toLocaleDateString("es-MX")}
                </span>

                <span className="exp-ver">Ver →</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (modalAbierto) {
    return (
      <div className="tramites-admin-container fade-in" style={{ width: '100%' }}>
        <div className="tramite-form-container">
          <div className="tramite-form-layout">

            {/* Left Column */}
            <div className="form-left-col">

              <div className="t-input-group">
                <label>Nombre del tramite</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="ej. REQUISITOS PARA EL TRÁMITE DE LA CÉDULA DE OPERACIÓN ANUAL"
                />
              </div>

              <div className="t-input-group">
                <label>Abreviación</label>
                <input
                  type="text"
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value.toUpperCase() }))}
                  readOnly={!!tramiteEditando}
                  placeholder="ej. COA"
                  style={{
                    border: 'none',
                    borderBottom: '2px solid #4b5563',
                    fontSize: '1.5rem',
                    padding: '0.5rem 0',
                    color: '#374151',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>

              <div>
                <div className="t-requisitos-header">Obligatorio</div>

                {form.requisitos.map((r, i) => (
                  <div key={i} className="t-requisito-row">
                    <div
                      className={`t-toggle ${r.obligatorio ? "active" : ""}`}
                      onClick={() => {
                        const newReqs = [...form.requisitos];
                        newReqs[i].obligatorio = !newReqs[i].obligatorio;
                        setForm((f) => ({ ...f, requisitos: newReqs }));
                      }}
                    >
                      <div className="t-toggle-circle"></div>
                    </div>

                    <input
                      type="text"
                      className={`t-req-input ${i % 2 === 0 ? "white-bg" : "gray-bg"}`}
                      value={r.nombre}
                      onChange={(e) => {
                        const newReqs = [...form.requisitos];
                        newReqs[i].nombre = e.target.value;
                        setForm((f) => ({ ...f, requisitos: newReqs }));
                      }}
                      placeholder="Escribe el nombre del documento"
                    />

                    <button
                      className="btn-borrar-req"
                      onClick={() => eliminarRequisito(i)}
                      title="Eliminar requisito"
                    >
                      <img src={iconBorrar} alt="Borrar" />
                    </button>
                  </div>
                ))}

                <div className="t-requisito-row" style={{ marginTop: '1rem' }}>
                  <div
                    className={`t-toggle ${requisitoOblig ? "active" : ""}`}
                    onClick={() => setRequisitoOblig(!requisitoOblig)}
                  >
                    <div className="t-toggle-circle"></div>
                  </div>

                  <input
                    type="text"
                    className={`t-req-input ${form.requisitos.length % 2 === 0 ? "white-bg" : "gray-bg"}`}
                    value={nuevoRequisito}
                    onChange={(e) => setNuevoRequisito(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && agregarRequisito()}
                    placeholder="**************************************"
                  />
                </div>

                <button className="btn-agregar-doc" onClick={agregarRequisito}>
                  <img src={iconAgregaDoc} alt="Agregar doc" />
                  Agregar documentacion
                </button>
              </div>

            </div>

            {/* Right Column */}
            <div className="form-right-col">

              <div className="t-rango-fechas">
                <h3>Rango de fechas disponibles</h3>
                <div className="t-fechas-inputs">
                  <span>Del:</span>
                  <input
                    type="date"
                    className="t-date-input"
                    value={form.fechaApertura}
                    onChange={(e) => setForm((f) => ({ ...f, fechaApertura: e.target.value }))}
                  />
                </div>
                <div className="t-fechas-inputs">
                  <span>al:</span>
                  <input
                    type="date"
                    className="t-date-input"
                    value={form.fechaCierre}
                    onChange={(e) => setForm((f) => ({ ...f, fechaCierre: e.target.value }))}
                  />
                </div>
                <div className="t-fechas-inputs" style={{ marginTop: '1rem' }}>
                  <span>Días corrección:</span>
                  <input
                    type="number"
                    min="1"
                    className="t-date-input"
                    style={{ width: '80px' }}
                    value={form.diasCorreccion}
                    onChange={(e) => setForm((f) => ({ ...f, diasCorreccion: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="t-calendar-container">
                <div className="t-calendar-header">
                  &lt; {getMonthName()} &gt;
                </div>
                <div className="t-calendar-body">
                  <div className="t-calendar-weekdays">
                    <span>LUN</span><span>MAR</span><span>MIE</span><span>JUE</span><span>VIE</span><span>SAB</span><span>DOM</span>
                  </div>
                  <div className="t-calendar-days">
                    {getCalendarDays().map((d, idx) => (
                      <span key={idx} className={`t-cal-day ${d.type !== 'current' ? 'gray' : ''} ${d.isToday ? 'red' : ''}`}>
                        {d.day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="t-acciones-bottom">
            <button className="btn-t-cancelar" onClick={cerrarModal} disabled={loading}>
              <div className="btn-t-icon-circle" style={{ color: '#000', backgroundColor: 'transparent', fontWeight: 'bold', border: '2px solid #000', padding: '0', width: '22px', height: '22px' }}>✕</div>
              Cancelar
            </button>
            <button className="btn-t-continuar" onClick={guardarTramite} disabled={loading}>
              Continuar
              <span style={{ fontSize: '1.2rem', marginLeft: '0.2rem' }}>✔</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="empresas-container fade-in">
      <div
        className="empresas-toolbar"
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "flex",
          justifyContent: "flex-start",
          paddingBottom: "1rem",
        }}
      >
        <span className="empresas-count">
          {tramites.length} trámite{tramites.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="toggle-bottom-right">
        <button
          className={`vista-btn ${!vistaLista ? "active" : ""}`}
          onClick={() => setVistaLista(false)}
          title="Vista cuadrícula"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>

        <button
          className={`vista-btn ${vistaLista ? "active" : ""}`}
          onClick={() => setVistaLista(true)}
          title="Vista lista"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9f2241"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>

      {!vistaLista && (
        <div className="empresas-grid">
          {tramites.length === 0 && (
            <div className="lista-vacia">No hay trámites configurados.</div>
          )}

          {tramites.map((t) => (
            <div
              key={t._id}
              className="empresa-card"
              onClick={() => seleccionarTramite(t)}
              style={{ cursor: "pointer" }}
            >
              <span className="empresa-name-text">{t.tipo}</span>

              <div className="empresa-action-container">
                {activeDropdown === t._id ? (
                  <div
                    className="empresa-action-dropdown fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="action-btn edit-btn"
                      style={{ paddingBottom: "10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(null);
                        abrirEditar(t);
                      }}
                    >
                      <img
                        src={editarIcon}
                        alt="Editar"
                        style={{
                          width: "16px",
                          height: "16px",
                          objectFit: "contain",
                        }}
                      />
                      Editar
                    </button>
                  </div>
                ) : (
                  <div
                    className="empresa-edit-icon"
                    title="Opciones"
                    onClick={(e) => toggleDropdown(t._id, e)}
                  >
                    <img
                      src={editarIcon}
                      alt="Editar"
                      style={{
                        width: "18px",
                        height: "18px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            className="agregar-empresa-btn"
            onClick={abrirAgregar}
            style={{ width: "260px", marginTop: "1rem" }}
          >
            + Agregar trámite
          </button>
        </div>
      )}

      {vistaLista && (
        <div className="empresas-grid-wide">
          {tramites.length === 0 && (
            <div className="lista-vacia">No hay trámites configurados.</div>
          )}

          {tramites.map((t) => (
            <div
              key={t._id}
              className="empresa-card-wide"
              onClick={() => seleccionarTramite(t)}
              style={{ cursor: "pointer" }}
            >
              <span className="empresa-name-text">
                {t.tipo} — {t.nombre}
              </span>

              <div className="empresa-action-container-wide">
                {activeDropdown === t._id ? (
                  <div
                    className="empresa-dropdown-expanded fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn-edit-half"
                      style={{ height: "100%" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(null);
                        abrirEditar(t);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                ) : (
                  <div
                    className="empresa-action-square"
                    onClick={(e) => toggleDropdown(t._id, e)}
                  >
                    <img
                      src={editarIcon}
                      alt="Editar"
                      style={{
                        width: "22px",
                        height: "22px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button className="btn-agregar-wide" onClick={abrirAgregar}>
            Agregar trámite
          </button>
        </div>
      )}

    </div>
  );
};

export default TramitesAdmin;