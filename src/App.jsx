import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
  FolderOpen, Clock, Users, DollarSign, CheckCircle2, AlertCircle, Plus, 
  MoreVertical, FileText, ExternalLink, Shield, Lock, FilePlus, Briefcase, 
  ArrowLeft, Save, Send, List, Calendar, XCircle, Check, Edit, PlayCircle, 
  Search, PenTool, FileSpreadsheet, RefreshCw, Cloud, Layout, ClipboardList, 
  CheckSquare, MoreHorizontal, Flag, Rocket, Home, HardHat, DraftingCompass, 
  UserCog, Phone, Mail, Key, Eye, Trash2, FileEdit, Camera, Image as ImageIcon, 
  LogOut, Layers, ChevronRight, User, UserCheck, CalendarDays, ArrowRight, 
  Filter, AlertTriangle, Wallet, Download, History, BarChart3, Briefcase as CaseIcon, 
  ToggleLeft, ToggleRight, Hammer, FileText as FileTextIcon, SendHorizontal, 
  FileCheck, Bell, Paperclip, Square, ListTodo, AlignLeft, X, File
} from 'lucide-react';

import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // <-- Aquí conectamos con tus llaves reales
import { 
  FolderOpen, Clock, Users, DollarSign, CheckCircle2, AlertCircle, Plus, 
  MoreVertical, FileText, ExternalLink, Shield, Lock, FilePlus, Briefcase, 
  ArrowLeft, Save, Send, List, Calendar, XCircle, Check, Edit, PlayCircle, 
  Search, PenTool, FileSpreadsheet, RefreshCw, Cloud, Layout, ClipboardList, 
  CheckSquare, MoreHorizontal, Flag, Rocket, Home, HardHat, DraftingCompass, 
  UserCog, Phone, Mail, Key, Eye, Trash2, FileEdit, Camera, Image as ImageIcon, 
  LogOut, Layers, ChevronRight, User, UserCheck, CalendarDays, ArrowRight, 
  Filter, AlertTriangle, Wallet, Download, History, BarChart3, Briefcase as CaseIcon, 
  ToggleLeft, ToggleRight, Hammer, FileText as FileTextIcon, SendHorizontal, 
  FileCheck, Bell, Paperclip, Square, ListTodo, AlignLeft, X, File
} from 'lucide-react';

// --- CONSTANTES GLOBALES ---
const SERVICE_OPTIONS = [
  "Diseño arquitectónico",
  "Diseño estructural",
  "Revisor estructural",
  "Estudio de suelos",
  "Concepto de suelos",
  "RPH",
  "PAA",
  "Otros"
];

const ACTIVITY_DEPENDENCIES = {
  "Diseño estructural": "Diseño arquitectónico",
  "Revisor estructural": "Diseño estructural",
};

const TRACKING_CHECKLIST_DEFAULTS = [
  "Documento de identidad",
  "Escritura",
  "Certificado de tradición y libertad",
  "Paz y salvo",
  "Copia predial",
  "Disponibilidad de servicios públicos"
];

const CLIENTS_DB = [
  { name: "Constructora El Roble S.A.S.", nit: "900.123.456-7", address: "Cra 45 # 12-34, Bogotá", phone: "310 123 4567" },
  { name: "Inversiones Los Andes", nit: "800.987.654-3", address: "Av. Poblado # 5-67, Medellín", phone: "311 987 6543" },
  { name: "Hospital San Jorge", nit: "890.111.222-1", address: "Calle 10 # 20-30, Pereira", phone: "(606) 333 4455" },
  { name: "Urbanizadora del Norte", nit: "860.555.111-2", address: "Calle 100 # 15-20, Bogotá", phone: "312 444 5566" },
  { name: "Proyectos Civiles Ltda", nit: "900.222.333-4", address: "Av. Circunvalar # 8-90, Pereira", phone: "(606) 321 0987" }
];

// --- HELPERS ---
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { week: weekNo, year: d.getUTCFullYear() };
};

const getMonthName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
};

const formatDateLocal = (date) => {
    if(!date || (date instanceof Date && isNaN(date.getTime()))) return "Pendiente";
    if(!(date instanceof Date)) return date; 
    return date.toLocaleDateString();
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Licencia aprobada': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Finalizado': return 'bg-emerald-50 text-emerald-700 border-emerald-100'; 
        case 'Suspendido': return 'bg-red-100 text-red-800 border-red-200';
        case 'Radicado': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'En acta de observaciones': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'En liquidación': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Terminado': return 'bg-teal-100 text-teal-800 border-teal-200';
        case 'En ejecución': 
        default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
};

const calculateTimeline = (project) => {
  const startDateStr = project.startDate || getLocalDateString();
  const startDate = new Date(`${startDateStr}T12:00:00`);
  
  const getDays = (act) => {
    if (act.name === "Estudio de suelos" && act.phases) {
        return (parseInt(act.phases.campo.days || 0) + parseInt(act.phases.informe.days || 0));
    }
    return act.days ? parseInt(act.days) : 0;
  };

  const getDaysByName = (name) => {
      const act = project.activities?.find(a => a.name === name);
      return act ? getDays(act) : 0;
  };

  const daysArq = getDaysByName("Diseño arquitectónico");
  const daysEst = getDaysByName("Diseño estructural");
  const daysRev = getDaysByName("Revisor estructural");
  
  const totalSequentialDays = daysArq + daysEst + daysRev;

  const otherActivities = project.activities ? project.activities.filter(a => 
    !["Diseño arquitectónico", "Diseño estructural", "Revisor estructural"].includes(a.name)
  ) : [];
  
  const maxParallelDays = otherActivities.reduce((max, a) => {
    return Math.max(max, getDays(a));
  }, 0);

  let totalProjectDays = Math.max(totalSequentialDays, maxParallelDays);
  if (totalProjectDays === 0) totalProjectDays = 10;

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalProjectDays);

  const today = new Date();
  today.setHours(12,0,0,0);
  
  const diffTime = endDate - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    totalDays: totalProjectDays,
    endDate: formatDateLocal(endDate), 
    startDate: formatDateLocal(startDate),
    daysRemaining,
    accArq: daysArq,
    accEst: daysArq + daysEst,
    accRev: daysArq + daysEst + daysRev
  };
};

const exportToTxt = (project) => {
  let content = `REPORTE FINANCIERO - JAMG INGENIERÍA\nPROYECTO: ${project.name}\nCLIENTE: ${project.client}\nFECHA: ${new Date().toLocaleDateString()}\n====================\n\n`;
  let projectTotalValue = 0;
  let projectTotalPaid = 0;

  project.activities.forEach(activity => {
    const actPrice = activity.price || 0;
    const actPaid = activity.paid || 0; 
    const actBalance = actPrice - actPaid;
    projectTotalValue += actPrice;
    projectTotalPaid += actPaid;

    content += `ACTIVIDAD: ${activity.name.toUpperCase()}\nVALOR: $${actPrice.toLocaleString('es-CO')}\n`;
    content += `--------------------\nFECHA | ABONO | SALDO\n--------------------\n`;
    
    let currentBalance = actPrice;
    if (activity.paymentHistory && activity.paymentHistory.length > 0) {
        activity.paymentHistory.forEach(payment => {
            currentBalance -= payment.amount;
            content += `${payment.date} | $${payment.amount.toLocaleString('es-CO')} | $${currentBalance.toLocaleString('es-CO')}\n`;
        });
    } else {
        content += `SIN MOVIMIENTOS\n`;
    }
    content += `TOTAL ABONADO: $${actPaid.toLocaleString('es-CO')}\nSALDO RESTANTE: $${actBalance.toLocaleString('es-CO')}\n\n`;
  });

  const projectTotalPending = projectTotalValue - projectTotalPaid;
  content += `====================\nTOTAL PROYECTO: $${projectTotalValue.toLocaleString('es-CO')}\nTOTAL ABONADO: $${projectTotalPaid.toLocaleString('es-CO')}\nSALDO PENDIENTE: $${projectTotalPending.toLocaleString('es-CO')}\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Reporte_${project.id}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- COMPONENTES UI BÁSICOS ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Cancelar</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Eliminar</button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- LOGIN ---
const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return setError('Ingresa correo y contraseña');
    if (!onLogin(email, password)) setError('Credenciales incorrectas');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200"><span className="text-white font-black text-2xl">JAMG</span></div>
          <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-2">Ingeniería & Construcción</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-bold text-slate-700 mb-2">Correo</label><input type="email" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="w-full p-3 pr-12 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 focus:outline-none">
                      <Eye size={20} className={showPassword ? "text-blue-600" : ""} />
                  </button>
              </div>
          </div>
          {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-colors">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
};

// --- GESTIÓN DE PROYECTOS AVANZADA (FICHAS) ---
const TaskBoard = ({ activityName, project, onBack, onUpdateFichas, onSetActivityStatus }) => {
  const activity = project.activities.find(a => a.name === activityName);
  const fichas = activity?.fichas || [];

  const [newFichaTitle, setNewFichaTitle] = useState("");
  const [isCreatingFicha, setIsCreatingFicha] = useState(false);
  const [fichaToDelete, setFichaToDelete] = useState(null);

  const handleAddFicha = () => {
    if (!newFichaTitle.trim()) return;
    const newFicha = { 
      id: Date.now(), 
      title: newFichaTitle, 
      checklist: [], 
      notes: "", 
      completed: false,
      attachments: [] 
    };
    onUpdateFichas(project.id, activityName, [...fichas, newFicha]);
    setNewFichaTitle("");
    setIsCreatingFicha(false);
  };

  const handleConfirmDeleteFicha = () => {
    const updated = fichas.filter(f => f.id !== fichaToDelete);
    onUpdateFichas(project.id, activityName, updated);
    if (updated.length > 0 && updated.every(f => f.completed)) {
        onSetActivityStatus(project.id, activityName, 'done');
    }
    setFichaToDelete(null);
  };

  const handleUpdateFicha = (updatedFicha) => {
      const newFichas = fichas.map(f => f.id === updatedFicha.id ? updatedFicha : f);
      onUpdateFichas(project.id, activityName, newFichas);
      const allCompleted = newFichas.every(f => f.completed);
      if (allCompleted) {
          onSetActivityStatus(project.id, activityName, 'done');
      }
  };

  const updateChecklist = (ficha, newItemOrId, action) => {
      let newChecklist = [...(ficha.checklist || [])];
      if (action === 'add') {
          newChecklist.push({ id: Date.now(), text: newItemOrId, done: false });
      } else if (action === 'toggle') {
          newChecklist = newChecklist.map(i => i.id === newItemOrId ? { ...i, done: !i.done } : i);
      } else if (action === 'delete') {
          newChecklist = newChecklist.filter(i => i.id !== newItemOrId);
      }
      handleUpdateFicha({ ...ficha, checklist: newChecklist });
  };

  const handleFileAction = (ficha, data, action) => {
      let newFiles = [...(ficha.attachments || [])];
      if (action === 'add') {
          newFiles.push({
              id: Date.now(),
              name: data.name,
              size: (data.size / 1024).toFixed(0) + ' KB',
              date: new Date().toLocaleDateString()
          });
      } else if (action === 'delete') {
          newFiles = newFiles.filter(f => f.id !== data);
      }
      handleUpdateFicha({ ...ficha, attachments: newFiles });
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <ConfirmationModal
        isOpen={!!fichaToDelete}
        title="Eliminar Ficha"
        message="¿Estás seguro de eliminar esta ficha? Se perderán todas las notas y checklists asociados."
        onConfirm={handleConfirmDeleteFicha}
        onCancel={() => setFichaToDelete(null)}
      />

      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <span onClick={onBack} className="hover:underline cursor-pointer hover:text-blue-600">Proyecto: {project.name}</span>
        <ChevronRight size={14} />
        <span className="font-bold text-slate-800">{activityName}</span>
      </div>

      <div className="mb-6 flex justify-between items-center">
         <div>
             <h2 className="text-2xl font-bold text-slate-900">Tablero de Trabajo</h2>
             <p className="text-slate-500 text-sm">Gestiona tareas y notas para {activityName}</p>
         </div>
         <button 
            onClick={() => setIsCreatingFicha(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
         >
            <Plus size={18} /> Nueva Ficha
         </button>
      </div>

      {isCreatingFicha && (
          <div className="mb-6 bg-white p-4 rounded-xl shadow border border-indigo-100 flex items-center gap-2 animate-in slide-in-from-top-2">
              <input 
                  autoFocus
                  type="text" 
                  placeholder="Título de la nueva ficha (Ej: Correcciones Planos)" 
                  className="flex-1 p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newFichaTitle}
                  onChange={(e) => setNewFichaTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFicha()}
              />
              <button onClick={handleAddFicha} className="bg-indigo-600 text-white p-2 rounded-lg font-bold">Crear</button>
              <button onClick={() => setIsCreatingFicha(false)} className="bg-slate-100 text-slate-600 p-2 rounded-lg"><X size={20}/></button>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-8">
          {fichas.map(ficha => (
              <div key={ficha.id} className={`bg-white rounded-xl shadow-sm border transition-all duration-300 flex flex-col ${ficha.completed ? 'border-emerald-200 opacity-75' : 'border-slate-200'}`}>
                  <div className={`p-4 border-b flex justify-between items-center ${ficha.completed ? 'bg-emerald-50 rounded-t-xl' : 'bg-slate-50 rounded-t-xl'}`}>
                      <h3 className={`font-bold text-lg ${ficha.completed ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>{ficha.title}</h3>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateFicha({ ...ficha, completed: !ficha.completed })} 
                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${ficha.completed ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            title={ficha.completed ? "Reabrir ficha" : "Terminar ficha"}
                          >
                             {ficha.completed ? <CheckCircle2 size={16}/> : <Square size={16}/>}
                             {ficha.completed ? 'Terminada' : 'Terminar'}
                          </button>
                          <button onClick={() => setFichaToDelete(ficha.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                      </div>
                  </div>

                  <div className="p-4 space-y-6 flex-1">
                      <div>
                          <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold text-sm">
                              <ListTodo size={16} className="text-indigo-500"/> Checklist
                          </div>
                          <div className="space-y-2 mb-3">
                              {ficha.checklist.map(item => (
                                  <div key={item.id} className="flex items-start gap-2 group">
                                      <button 
                                        onClick={() => updateChecklist(ficha, item.id, 'toggle')}
                                        className={`mt-0.5 flex-shrink-0 transition-colors ${item.done ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
                                      >
                                          {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                                      </button>
                                      <span className={`text-sm flex-1 break-words ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                                      <button onClick={() => updateChecklist(ficha, item.id, 'delete')} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><X size={14}/></button>
                                  </div>
                              ))}
                          </div>
                          {!ficha.completed && (
                              <input 
                                  type="text" 
                                  placeholder="+ Agregar item" 
                                  className="w-full text-sm bg-slate-50 border-none rounded p-2 focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-400"
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          updateChecklist(ficha, e.target.value, 'add');
                                          e.target.value = '';
                                      }
                                  }}
                              />
                          )}
                      </div>

                      <div>
                          <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold text-sm">
                              <AlignLeft size={16} className="text-amber-500"/> Notas
                          </div>
                          <textarea 
                              disabled={ficha.completed}
                              className={`w-full text-sm p-3 rounded-lg border resize-none focus:ring-2 focus:ring-amber-200 outline-none ${ficha.completed ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-amber-50/50 border-amber-100 text-slate-700'}`}
                              rows={4}
                              placeholder="Escribe aquí notas, observaciones o detalles importantes..."
                              value={ficha.notes}
                              onChange={(e) => handleUpdateFicha({ ...ficha, notes: e.target.value })}
                          />
                      </div>

                      <div>
                          <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                  <Paperclip size={16} className="text-slate-500"/> Adjuntos
                              </div>
                              {!ficha.completed && (
                                  <label className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 font-bold">
                                      <Plus size={12}/> Agregar
                                      <input 
                                        type="file" 
                                        className="hidden" 
                                        onChange={(e) => {
                                            if(e.target.files[0]) {
                                                handleFileAction(ficha, e.target.files[0], 'add');
                                                e.target.value = null;
                                            }
                                        }}
                                      />
                                  </label>
                              )}
                          </div>
                          
                          {(ficha.attachments && ficha.attachments.length > 0) ? (
                              <div className="space-y-1.5">
                                  {ficha.attachments.map(att => (
                                      <div key={att.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                          <div className="flex items-center gap-2 overflow-hidden">
                                              <File size={12} className="text-slate-400 flex-shrink-0"/>
                                              <span className="truncate max-w-[120px]" title={att.name}>{att.name}</span>
                                          </div>
                                          {!ficha.completed && (
                                              <button onClick={() => handleFileAction(ficha, att.id, 'delete')} className="text-slate-300 hover:text-red-500">
                                                  <X size={12}/>
                                              </button>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded text-center border border-dashed border-slate-200">
                                  Sin archivos
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

// --- OTROS MÓDULOS ---

const CollaboratorForm = ({ onBack, onSave, initialData }) => {
    const [formData, setFormData] = useState(() => {
      const defaultState = { 
        name: '', email: '', password: '', phone: '', role: '', photo: null, 
        permissions: { 
          quotes: { view: true, create: false, delete: false }, 
          projects: { view: true, edit_tasks: true, manage_team: false }, 
          finance: { view_costs: false, register_payments: false }, 
          admin: { view: false, manage_users: false }
        } 
      };
      if (initialData) {
         return { 
           ...defaultState, 
           ...initialData, 
           permissions: { 
             ...defaultState.permissions, 
             quotes: { ...defaultState.permissions.quotes, ...(initialData.permissions?.quotes || {}) },
             projects: { ...defaultState.permissions.projects, ...(initialData.permissions?.projects || {}) },
             finance: { ...defaultState.permissions.finance, ...(initialData.permissions?.finance || {}) },
             admin: { ...defaultState.permissions.admin, ...(initialData.permissions?.admin || {}) }
           } 
         };
      }
      return defaultState;
    });

    const handleSubmit = () => { if (!formData.name) return; onSave({ id: initialData?.id || Date.now(), status: 'Active', ...formData }); };

    const getModuleState = (module) => {
        const perms = formData.permissions[module];
        let hasAccess = false;
        let isEdit = false;
        if (module === 'quotes') { hasAccess = perms.view; isEdit = perms.create; }
        if (module === 'projects') { hasAccess = perms.view; isEdit = perms.edit_tasks; }
        if (module === 'finance') { hasAccess = perms.view_costs; isEdit = perms.register_payments; }
        if (module === 'admin') { hasAccess = perms.view; isEdit = perms.manage_users; }
        return { hasAccess, isEdit };
    };

    const updatePermissions = (module, type, value) => {
        setFormData(prev => {
            const newPerms = { ...prev.permissions };
            const modPerms = { ...newPerms[module] };
            if (type === 'access') {
                if (module === 'quotes') modPerms.view = value;
                if (module === 'projects') modPerms.view = value;
                if (module === 'finance') modPerms.view_costs = value;
                if (module === 'admin') modPerms.view = value;
                if (!value) {
                    if (module === 'quotes') { modPerms.create = false; modPerms.delete = false; }
                    if (module === 'projects') { modPerms.edit_tasks = false; modPerms.manage_team = false; }
                    if (module === 'finance') { modPerms.register_payments = false; }
                    if (module === 'admin') { modPerms.manage_users = false; }
                }
            } else if (type === 'edit') {
                if (module === 'quotes') { modPerms.create = value; modPerms.delete = value; }
                if (module === 'projects') { modPerms.edit_tasks = value; modPerms.manage_team = value; }
                if (module === 'finance') { modPerms.register_payments = value; }
                if (module === 'admin') { modPerms.manage_users = value; }
            }
            newPerms[module] = modPerms;
            return { ...prev, permissions: newPerms };
        });
    };

    const ModulePermissionRow = ({ label, icon: Icon, module }) => {
        const { hasAccess, isEdit } = getModuleState(module);
        return (
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg mb-3 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${hasAccess ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 border border-slate-100'}`}><Icon size={20} /></div>
                    <span className={`font-bold text-sm ${hasAccess ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
                </div>
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${hasAccess ? 'bg-blue-600' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${hasAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={hasAccess} onChange={(e) => updatePermissions(module, 'access', e.target.checked)} />
                        <span className="text-xs font-medium text-slate-600 w-16">{hasAccess ? 'Habilitado' : 'Apagado'}</span>
                    </label>
                    <div className={`flex items-center gap-2 transition-opacity duration-300 ${hasAccess ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="h-8 w-px bg-slate-300 mx-2"></div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${isEdit ? 'bg-indigo-600 border-indigo-600' : 'border-slate-400 bg-white'}`}>
                                {isEdit && <Check size={12} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={isEdit} onChange={(e) => updatePermissions(module, 'edit', e.target.checked)} />
                            <span className="text-xs font-medium text-slate-600">Permitir Edición</span>
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button><div><h2 className="text-2xl font-bold text-slate-900">{initialData ? 'Editar Colaborador' : 'Nuevo Colaborador'}</h2></div></div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
            <section><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-6 flex items-center gap-2"><Users size={16} className="text-blue-600"/> Perfil y Acceso</h3><div className="flex flex-col md:flex-row gap-8"><div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label><input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Rol</label><input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Móvil</label><input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div><div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100"><h4 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2"><Lock size={12}/> Credenciales de Acceso</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-blue-700 mb-1">Correo</label><input type="email" className="w-full p-2 border border-blue-200 rounded outline-none text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div><div><label className="block text-xs font-bold text-blue-700 mb-1">Contraseña</label><input type="text" className="w-full p-2 border border-blue-200 rounded outline-none text-sm font-mono" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div></div></div></div></div></section>
            <section>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2 mb-6 flex items-center gap-2"><Shield size={16} className="text-blue-600"/> Autorizaciones por Módulo</h3>
                <div>
                    <ModulePermissionRow label="Gestión de Cotizaciones" icon={FileText} module="quotes" />
                    <ModulePermissionRow label="Diseños y Proyectos" icon={ClipboardList} module="projects" />
                    <ModulePermissionRow label="Control Financiero" icon={DollarSign} module="finance" />
                    <ModulePermissionRow label="Administración y Equipo" icon={UserCog} module="admin" />
                </div>
            </section>
            <div className="flex justify-end pt-4 border-t border-slate-100"><button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"><Check size={18} /> Guardar Colaborador</button></div>
        </div>
      </div>
    );
};

const TeamDirectory = ({ onBack, onNew, onEdit, staffList, canEdit }) => {
    return (
      <div className="animate-in fade-in duration-500">
         <div className="mb-6 flex items-center justify-between"><button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600"><ArrowLeft size={20}/> Volver</button>{canEdit && <button onClick={onNew} className="bg-blue-600 text-white px-4 py-2 rounded font-bold shadow-sm hover:bg-blue-700">Nuevo Colaborador</button>}</div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{staffList.map(p => (<div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative"><div className="flex items-start gap-4 mb-4"><div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl border border-slate-200 overflow-hidden">{p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover"/> : p.name.charAt(0)}</div><div className="flex-1"><h3 className="text-lg font-bold text-slate-800">{p.name}</h3><p className="text-blue-600 font-medium text-sm">{p.role}</p><span className={`px-2 py-0.5 rounded text-[10px] font-bold border mt-1 inline-block ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{p.status === 'Active' ? 'Activo' : 'Inactivo'}</span></div></div><div className="space-y-2 border-t border-slate-50 pt-3"><div className="flex items-center gap-2 text-sm text-slate-500"><Briefcase size={14} className="text-slate-400" /><span>Prestación de Servicios</span></div><div className="flex items-center gap-2 text-sm text-slate-500"><Phone size={14} className="text-slate-400" /><span>{p.phone || 'Sin teléfono'}</span></div><div className="flex items-center gap-2 text-sm text-slate-500 truncate" title={p.email}><Mail size={14} className="text-slate-400" /><span>{p.email}</span></div></div>{canEdit && <button onClick={() => onEdit(p)} className="absolute top-4 right-4 text-slate-300 hover:text-blue-600"><Edit size={16}/></button>}</div>))}</div>
      </div>
    );
};

const QuoteGenerator = ({ onBack, onSave, userRole, initialData, nextId, isDirectProject }) => {
    const [formData, setFormData] = useState(() => {
      const defaultState = { 
          clientName: '', clientNit: '', clientAddress: '', clientPhone: '', 
          selectedServices: ['Diseño arquitectónico'], servicePrices: { "Diseño arquitectónico": 0 }, 
          otherServiceText: '', scope: '', validityDays: 15, paymentTerms: '50_50', 
          discount: 0, applyIva: true,
          exclusions: { licencias: true, impresiones: true, topografia: false, viaticos: false } 
      };
      if (initialData) return { ...defaultState, ...initialData, servicePrices: { ...defaultState.servicePrices, ...(initialData.servicePrices || {}) }, exclusions: { ...defaultState.exclusions, ...(initialData.exclusions || {}) } };
      return defaultState;
    });
    
    const [financials, setFinancials] = useState({ subtotal: 0, total: 0, discountVal: 0, subtotalNeto: 0, ivaVal: 0 });
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    
    useEffect(() => {
      let subtotal = 0;
      formData.selectedServices.forEach(s => { 
          const val = formData.servicePrices[s] ? formData.servicePrices[s].toString().replace(/\D/g, '') : 0; 
          subtotal += parseFloat(val || 0); 
      });
      const discountVal = parseFloat(formData.discount || 0);
      const subtotalNeto = Math.max(0, subtotal - discountVal);
      const ivaVal = formData.applyIva ? Math.round(subtotalNeto * 0.19) : 0;
      const total = subtotalNeto + ivaVal;
      
      setFinancials({ subtotal, discountVal, subtotalNeto, ivaVal, total });
    }, [formData.selectedServices, formData.servicePrices, formData.discount, formData.applyIva]);

    const toggleService = (s) => setFormData(prev => ({ ...prev, selectedServices: prev.selectedServices.includes(s) ? prev.selectedServices.filter(x => x !== s) : [...prev.selectedServices, s] }));
    const handlePriceChange = (s, v) => { const rawVal = v.replace(/\D/g, ''); setFormData(prev => ({ ...prev, servicePrices: { ...prev.servicePrices, [s]: rawVal } })); };
    
    const handleClientSelect = (c) => { 
        setFormData(prev => ({ 
            ...prev, 
            clientName: c.name, 
            clientNit: c.nit, 
            clientPhone: c.phone, 
            clientAddress: c.address
        })); 
        setShowClientSuggestions(false); 
    };

    const formatCurrency = (value) => { 
        if (!value && value !== 0) return ''; 
        const number = parseInt(value.toString().replace(/\D/g, ''), 10); 
        if (isNaN(number)) return ''; 
        return number.toLocaleString('es-CO'); 
    };
    
    const handleSave = (status = 'Enviada') => { 
        onSave({ 
            id: initialData?.id || nextId, 
            status, 
            date: initialData?.date || getLocalDateString(), 
            startDate: initialData?.startDate || getLocalDateString(), 
            ...formData, 
            total: financials.total 
        }); 
    };
    
    return (
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><ArrowLeft size={24} /></button><div><h2 className="text-2xl font-bold text-slate-900">{isDirectProject ? 'Nuevo Diseño en Proceso' : (initialData ? 'Editar Cotización' : 'Nueva Cotización')}</h2><p className="text-slate-500 text-sm">{isDirectProject ? 'Creación rápida de proyecto' : 'Diligencia los datos para generar el consecutivo'}</p></div></div></div>
        <div className={`grid grid-cols-1 ${!isDirectProject ? 'xl:grid-cols-2' : ''} gap-8`}>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <section>
                    <h3 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2"><Users size={16} className="text-blue-600"/> Cliente</h3>
                    <div className="relative mb-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nombre / Razón Social</label>
                        <div className="relative"><input type="text" className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Buscar Cliente..." value={formData.clientName} onChange={(e) => {setFormData({...formData, clientName: e.target.value}); setShowClientSuggestions(true);}} onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}/><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /></div>
                        {showClientSuggestions && <div className="absolute z-10 w-full bg-white border rounded shadow-lg mt-1 max-h-48 overflow-auto">{CLIENTS_DB.filter(c=>c.name.toLowerCase().includes(formData.clientName.toLowerCase())).map((c,i)=><div key={i} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0" onClick={()=>handleClientSelect(c)}><p className="font-bold text-sm">{c.name}</p><p className="text-xs text-slate-500">{c.nit}</p></div>)}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">NIT / C.C.</label><input className="w-full p-2 border rounded" placeholder="NIT" value={formData.clientNit} onChange={e=>setFormData({...formData, clientNit: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Teléfono</label><input className="w-full p-2 border rounded" placeholder="Teléfono" value={formData.clientPhone} onChange={e=>setFormData({...formData, clientPhone: e.target.value})} /></div>
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Dirección</label>
                         <input className="w-full p-2 border rounded" placeholder="Dirección del proyecto o cliente" value={formData.clientAddress} onChange={e=>setFormData({...formData, clientAddress: e.target.value})} />
                    </div>
                </section>
                <section>
                    <h3 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2"><DollarSign size={16} className="text-blue-600"/> {isDirectProject ? 'Servicios Contratados' : 'Servicios Cotizados'}</h3>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        {SERVICE_OPTIONS.map(opt => (
                            <div key={opt} className={`flex items-center justify-between p-2 rounded transition-colors ${formData.selectedServices.includes(opt) ? 'bg-white shadow-sm border border-blue-100' : 'hover:bg-slate-100'}`}>
                                <label className="flex items-center gap-3 cursor-pointer flex-1"><input type="checkbox" checked={formData.selectedServices.includes(opt)} onChange={() => toggleService(opt)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"/> <span className={`text-sm ${formData.selectedServices.includes(opt) ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{opt}</span></label>
                                {formData.selectedServices.includes(opt) && (<div className="relative w-36"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span><input className="w-full pl-5 p-1.5 border border-slate-300 rounded text-right text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0" value={formatCurrency(formData.servicePrices[opt])} onChange={(e) => handlePriceChange(opt, e.target.value)} /></div>)}
                            </div>
                        ))}
                    </div>
                </section>
                {!isDirectProject && (<section className="space-y-4"><h3 className="font-bold text-slate-800 border-b pb-2 text-sm uppercase tracking-wide flex items-center gap-2"><FileText size={16} className="text-blue-600"/> Alcance y Exclusiones</h3><div><label className="block text-xs font-bold text-slate-500 mb-1">Descripción General del Alcance</label><textarea className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none text-sm" placeholder="Detalles adicionales..." value={formData.scope} onChange={(e) => setFormData({...formData, scope: e.target.value})}/></div><div className="bg-orange-50 p-4 rounded-lg border border-orange-100"><label className="block text-xs font-bold text-orange-800 mb-2">Exclusiones (NO Incluye)</label><div className="grid grid-cols-2 gap-2">{Object.entries({ licencias: 'Licencias', impresiones: 'Impresiones', topografia: 'Topografía', viaticos: 'Viáticos' }).map(([key, label]) => (<label key={key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.exclusions[key]} onChange={() => setFormData(prev => ({...prev, exclusions: {...prev.exclusions, [key]: !prev.exclusions[key]}}))} className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"/><span className="text-sm text-slate-700">{label}</span></label>))}</div></div></section>)}
                <section className="space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2 text-sm uppercase tracking-wide flex items-center gap-2"><DollarSign size={16} className="text-blue-600"/> Totales y Condiciones</h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="space-y-2 text-sm mb-4 border-b border-slate-200 pb-4">
                             <div className="flex justify-between text-slate-600"><span>Subtotal Servicios:</span><span className="font-mono">${financials.subtotal.toLocaleString('es-CO')}</span></div>
                             <div className="flex justify-between items-center text-slate-600">
                                 <span>Descuento:</span>
                                 <div className="flex items-center w-32 relative">
                                     <span className="text-slate-400 text-xs absolute left-2 pointer-events-none">-$</span>
                                     <input type="text" className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded text-right text-xs font-mono outline-none focus:border-blue-500" placeholder="0" value={formatCurrency(formData.discount)} onChange={(e) => { const val = parseFloat(e.target.value.replace(/\D/g, '') || 0); setFormData({...formData, discount: val}); }}/>
                                 </div>
                             </div>
                             <div className="flex justify-between font-bold text-slate-700"><span>Subtotal Neto:</span><span className="font-mono">${financials.subtotalNeto.toLocaleString('es-CO')}</span></div>
                             <div className="flex justify-between items-center text-slate-600">
                                 <label className="flex items-center gap-2 cursor-pointer select-none">
                                     <input type="checkbox" checked={formData.applyIva} onChange={(e) => setFormData({...formData, applyIva: e.target.checked})} className="rounded text-blue-600 w-4 h-4"/>
                                     <span>IVA (19%)</span>
                                 </label>
                                 <span className="font-mono">${financials.ivaVal.toLocaleString('es-CO')}</span>
                             </div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg text-white flex justify-between items-end">
                            <div><span className="block text-xs text-slate-400 uppercase font-bold mb-1">Total a Pagar</span><span className="text-xs text-slate-400 font-normal">COP</span></div>
                            <span className="text-3xl font-bold tracking-tight">${financials.total.toLocaleString('es-CO')}</span>
                        </div>
                    </div>
                    {!isDirectProject && (<div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 mb-1">Forma de Pago</label><select className="w-full p-2 border border-slate-300 rounded text-sm" value={formData.paymentTerms} onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}><option value="50_50">50% - 50%</option><option value="40_30_30">40% - 30% - 30%</option></select></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Validez (Días)</label><input type="number" className="w-full p-2 border border-slate-300 rounded text-sm" value={formData.validityDays} onChange={(e) => setFormData({...formData, validityDays: parseInt(e.target.value) || 0})} /></div></div>)}
                </section>
                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-2">
                    {isDirectProject ? (
                        <button onClick={() => handleSave('Aceptada')} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center gap-2"><Rocket size={18}/> Crear e Iniciar</button>
                    ) : (
                        <button onClick={() => handleSave('Enviada')} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2"><Send size={18}/> Generar Cotización</button>
                    )}
                </div>
            </div>
            
            {!isDirectProject && (<div className="bg-slate-600 p-8 rounded-xl shadow-inner flex flex-col items-center justify-start min-h-[800px] overflow-auto"><div className="text-white text-xs font-bold mb-4 flex items-center gap-2 opacity-80"><FileText size={14}/> VISTA PREVIA PDF</div><div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-2xl p-12 text-xs leading-relaxed flex flex-col relative"><div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8"><div className="w-2/3"><h2 className="text-3xl font-black text-slate-900 leading-none mb-2">JAMG <span className="text-blue-600">INGENIERÍA</span></h2><p className="text-[10px] tracking-[0.2em] uppercase text-slate-500 font-bold mb-4">Diseño • Consultoría • Construcción</p><div className="text-slate-600 space-y-0.5"><p>Nit: 900.XXX.XXX-X</p><p>contacto@jamgingenieria.com</p><p>Ciudad, Colombia</p></div></div><div className="text-right w-1/3"><div className="bg-slate-100 px-4 py-3 rounded-lg mb-2 text-center"><h4 className="font-bold text-slate-800 text-lg uppercase">Cotización</h4><p className="font-mono text-blue-600 font-bold text-xl"># {initialData?.id || nextId}</p></div><p className="text-slate-500 mt-2 font-medium">Fecha: {new Date().toLocaleDateString()}</p></div></div><div className="mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100"><h5 className="font-bold text-slate-800 text-[10px] uppercase border-b border-slate-200 pb-1 mb-3">Información del Cliente</h5><div className="grid grid-cols-2 gap-y-3 gap-x-8"><div><span className="text-slate-400 block text-[10px]">Cliente:</span><span className="font-bold text-slate-900 uppercase text-sm">{formData.clientName || "--------"}</span></div><div><span className="text-slate-400 block text-[10px]">NIT / C.C.:</span><span className="font-medium text-slate-700">{formData.clientNit || "--------"}</span></div><div><span className="text-slate-400 block text-[10px]">Teléfono:</span><span className="font-medium text-slate-700">{formData.clientPhone || "--------"}</span></div><div><span className="text-slate-400 block text-[10px]">Validez Oferta:</span><span className="font-medium text-slate-700">Hasta {new Date(new Date().setDate(new Date().getDate() + formData.validityDays)).toLocaleDateString()}</span></div></div></div><div className="flex-1"><h5 className="font-bold text-slate-800 border-b-2 border-slate-800 mb-4 pb-1 uppercase text-[11px]">Descripción de Servicios</h5><table className="w-full text-left mb-6"><thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]"><tr><th className="p-3 w-3/4">Ítem / Descripción</th><th className="p-3 text-right">Valor</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-700">{formData.selectedServices.map(s => (<tr key={s}><td className="p-3"><span className="font-bold block text-slate-800">{s}</span></td><td className="p-3 text-right font-mono">${parseFloat(formData.servicePrices[s] || 0).toLocaleString('es-CO')}</td></tr>))}</tbody></table><div className="mb-6"><h5 className="font-bold text-slate-800 mb-2">Alcance:</h5><p className="text-slate-600 whitespace-pre-wrap">{formData.scope || "Según requerimientos técnicos estándar."}</p></div>{(Object.values(formData.exclusions).some(v => v)) && (<div className="mb-6"><h5 className="font-bold text-slate-800 mb-2">Exclusiones:</h5><ul className="list-disc list-inside text-slate-600 grid grid-cols-2">{Object.entries(formData.exclusions).map(([key, value]) => value && <li key={key}>{key === 'licencias' ? 'Pago de Impuestos y Licencias' : key === 'impresiones' ? 'Impresión de Planos' : key === 'topografia' ? 'Estudios Topográficos' : 'Viáticos'}</li>)}</ul></div>)}<div className="flex justify-end border-t-2 border-slate-800 pt-4"><div className="w-1/2 space-y-2 text-right"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-mono">${financials.subtotal.toLocaleString('es-CO')}</span></div>{financials.discountVal > 0 && <div className="flex justify-between text-red-500"><span>Descuento</span><span className="font-mono">-${financials.discountVal.toLocaleString('es-CO')}</span></div>}<div className="flex justify-between text-slate-500"><span>IVA (19%)</span><span className="font-mono">${financials.ivaVal.toLocaleString('es-CO')}</span></div><div className="flex justify-between text-slate-900 font-black text-lg pt-2 border-t border-slate-100"><span>TOTAL</span><span>${financials.total.toLocaleString('es-CO')}</span></div></div></div></div><div className="mt-auto pt-12 flex justify-center"><div className="text-center w-64"><div className="h-16 mb-2 border-b border-slate-400 flex items-end justify-center"><span className="text-slate-400 italic font-handwriting text-xl">Firma Digitalizada</span></div><p className="font-bold text-slate-800 text-sm">JUAN A. MARTÍNEZ G.</p><p className="text-slate-500 text-[10px]">Gerente General</p></div></div></div></div>)}
        </div>
      </div>
    );
};

const QuotesList = ({ onNewQuote, quotes, onEdit, onAccept, onReject, userRole, onDelete, onBack }) => {
  const [viewMode, setViewMode] = useState('summary'); 
  const [filter, setFilter] = useState('Todos');
  const [quoteToDelete, setQuoteToDelete] = useState(null); 
  const [detailFilters, setDetailFilters] = useState({ startDate: '2024-01-01', endDate: new Date().toISOString().split('T')[0], groupBy: 'none', activity: 'Todas', status: 'Todos' });

  const filteredQuotes = quotes.filter(q => filter === 'Todos' || q.status === filter);

  const getGroupedData = () => {
      let data = quotes.filter(q => {
          const qDate = new Date(q.date);
          const start = new Date(detailFilters.startDate);
          const end = new Date(detailFilters.endDate);
          end.setHours(23, 59, 59, 999);
          const statusMatch = detailFilters.status === 'Todos' || q.status === detailFilters.status;
          const activityMatch = detailFilters.activity === 'Todas' || q.selectedServices.includes(detailFilters.activity);
          return qDate >= start && qDate <= end && statusMatch && activityMatch;
      });
      data.sort((a, b) => new Date(a.date) - new Date(b.date));

      const grouped = {};
      data.forEach(q => {
          let key = 'Listado General';
          if (detailFilters.groupBy === 'week') { const { week, year } = getWeekNumber(new Date(q.date)); key = `Semana ${week} - ${year}`; }
          else if (detailFilters.groupBy === 'month') { key = getMonthName(q.date); }
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(q);
      });
      return grouped;
  };

  const groupedData = viewMode === 'detailed' ? getGroupedData() : {};
  
  const globalTotals = viewMode === 'detailed' ? (() => {
      const allItems = Object.values(groupedData).flat();
      const totals = SERVICE_OPTIONS.reduce((acc, svc) => {
          acc[svc] = allItems.reduce((sum, item) => sum + (parseFloat(item.servicePrices[svc]) || 0), 0);
          return acc;
      }, {});
      totals.grandTotal = allItems.reduce((sum, item) => sum + item.total, 0);
      return totals;
  })() : {};

  return (
    <div className="animate-in fade-in duration-500">
       <ConfirmationModal isOpen={!!quoteToDelete} title="Eliminar Cotización" message="¿Está seguro?" onCancel={() => setQuoteToDelete(null)} onConfirm={() => { onDelete(quoteToDelete); setQuoteToDelete(null); }} />
       <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft size={24}/></button>
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Cotizaciones</h2>
                <div className="flex gap-2 mt-2">
                    <button onClick={() => setViewMode('summary')} className={`px-3 py-1 text-xs font-bold rounded-full ${viewMode === 'summary' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Resumido</button>
                    <button onClick={() => setViewMode('detailed')} className={`px-3 py-1 text-xs font-bold rounded-full ${viewMode === 'detailed' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Detallado</button>
                </div>
             </div>
         </div>
         <div className="flex gap-3"><button onClick={onNewQuote} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2"><FilePlus size={18}/>Nueva</button></div>
       </div>

       {viewMode === 'summary' ? (
           <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 border-b flex justify-end">
                    <select className="p-2 border rounded text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="Todos">Todos</option><option value="Enviada">Enviada</option><option value="Aceptada">Aceptada</option><option value="Rechazada">Rechazada</option>
                    </select>
                </div>
                <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="p-4">ID</th><th className="p-4">Cliente</th><th className="p-4 text-right">Total</th><th className="p-4 text-center">Estado</th><th className="p-4 text-center">Acciones</th></tr></thead>
                <tbody>{filteredQuotes.map((q) => (<tr key={q.id} className="hover:bg-slate-50 border-b"><td className="p-4 text-blue-600 font-medium">{q.id}</td><td className="p-4">{q.clientName}</td><td className="p-4 text-right">${q.total.toLocaleString()}</td><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${q.status==='Aceptada'?'bg-emerald-100 text-emerald-700':q.status==='Rechazada'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}`}>{q.status}</span></td><td className="p-4 flex justify-center gap-2">{q.status!=='Aceptada' && (<><button onClick={()=>onEdit(q)}><Edit size={16}/></button><button onClick={()=>onAccept(q)}><CheckCircle2 size={16}/></button><button onClick={()=>onReject(q)}><XCircle size={16}/></button></>)}{userRole.permissions.quotes.delete && <button onClick={()=>setQuoteToDelete(q.id)}><Trash2 size={16}/></button>}</td></tr>))}</tbody></table>
           </div>
       ) : (
           <div className="space-y-6">
               <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
                   <div><label className="text-xs font-bold block mb-1">Inicio</label><input type="date" className="w-full text-xs p-2 border rounded" value={detailFilters.startDate} onChange={e => setDetailFilters({...detailFilters, startDate: e.target.value})} /></div>
                   <div><label className="text-xs font-bold block mb-1">Fin</label><input type="date" className="w-full text-xs p-2 border rounded" value={detailFilters.endDate} onChange={e => setDetailFilters({...detailFilters, endDate: e.target.value})} /></div>
                   <div><label className="text-xs font-bold block mb-1">Agrupar</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.groupBy} onChange={e => setDetailFilters({...detailFilters, groupBy: e.target.value})}><option value="none">Sin Agrupar</option><option value="week">Semanal</option><option value="month">Mensual</option></select></div>
                   <div><label className="text-xs font-bold block mb-1">Actividad</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.activity} onChange={e => setDetailFilters({...detailFilters, activity: e.target.value})}><option value="Todas">Todas</option>{SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                   <div><label className="text-xs font-bold block mb-1">Estado</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.status} onChange={e => setDetailFilters({...detailFilters, status: e.target.value})}><option value="Todos">Todos</option><option value="Enviada">Enviada</option><option value="Aceptada">Aceptada</option><option value="Rechazada">Rechazada</option></select></div>
               </div>
               <div className="bg-white rounded-xl shadow border overflow-x-auto">
                   <table className="min-w-full w-auto text-left text-xs whitespace-nowrap">
                       <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                           <tr><th className="p-3 sticky left-0 bg-slate-50 border-r shadow-sm">ID</th><th className="p-3 border-r">Fecha</th><th className="p-3 border-r">Cliente</th>{SERVICE_OPTIONS.map(opt => <th key={opt} className="p-3 text-right border-r px-6">{opt}</th>)}<th className="p-3 text-right sticky right-0 bg-slate-100 border-l shadow-sm">Total</th></tr>
                       </thead>
                       <tbody>
                           {Object.entries(groupedData).map(([groupKey, items]) => {
                               const groupTotals = SERVICE_OPTIONS.reduce((acc, svc) => {
                                   const total = items.reduce((s, i) => s + (parseFloat(i.servicePrices[svc])||0), 0);
                                   return { ...acc, [svc]: total };
                               }, {});
                               const groupGrand = items.reduce((s, i) => s + i.total, 0);
                               return (
                                   <React.Fragment key={groupKey}>
                                           {detailFilters.groupBy !== 'none' && <tr className="bg-slate-100"><td colSpan={SERVICE_OPTIONS.length + 4} className="p-2 font-bold uppercase">{groupKey}</td></tr>}
                                           {items.map(item => (
                                               <tr key={item.id} className="hover:bg-slate-50 border-b">
                                                   <td className="p-3 text-blue-600 font-medium sticky left-0 bg-white border-r shadow-sm">{item.id}</td><td className="p-3 border-r">{item.date}</td><td className="p-3 border-r font-medium text-slate-700">{item.clientName}</td>
                                                   {SERVICE_OPTIONS.map(svc => <td key={svc} className="p-3 text-right font-mono text-slate-600 border-r px-6">{item.servicePrices[svc] ? `$${parseInt(item.servicePrices[svc]).toLocaleString('es-CO')}` : '$0'}</td>)}
                                                   <td className="p-3 text-right font-black sticky right-0 bg-slate-50 border-l shadow-sm">${item.total.toLocaleString('es-CO')}</td>
                                               </tr>
                                           ))}
                                           <tr className="bg-indigo-50 font-bold border-y-2 border-indigo-100"><td colSpan={3} className="p-3 text-right sticky left-0 bg-indigo-50 border-r shadow-sm">SUBTOTAL {groupKey !== 'Listado General' ? groupKey : ''}:</td>{SERVICE_OPTIONS.map(svc => <td key={svc} className="p-3 text-right font-mono border-r px-6">${groupTotals[svc].toLocaleString('es-CO')}</td>)}<td className="p-3 text-right bg-indigo-100 sticky right-0 border-l shadow-sm">${groupGrand.toLocaleString('es-CO')}</td></tr>
                                   </React.Fragment>
                               );
                           })}
                       </tbody>
                       <tfoot className="bg-slate-800 text-white border-t-4 border-slate-600"><tr><td colSpan={3} className="p-3 text-right font-black sticky left-0 bg-slate-800 border-r shadow-sm">TOTAL GENERAL:</td>{SERVICE_OPTIONS.map(svc => <td key={svc} className="p-3 text-right font-mono font-bold border-r border-slate-700 px-6">${globalTotals[svc]?.toLocaleString('es-CO')}</td>)}<td className="p-3 text-right font-black sticky right-0 bg-slate-900 border-l border-slate-700 shadow-sm">${globalTotals.grandTotal?.toLocaleString('es-CO')}</td></tr></tfoot>
                   </table>
               </div>
           </div>
       )}
    </div>
  );
};

const ProjectActivitiesView = ({ 
    project, 
    onOpenActivity, 
    onBack, 
    staffList, 
    onAssignActivity, 
    onToggleActivityStatus,
    onAddAttachment,
    onDeleteAttachment,
    onUpdateProjectTracking,
    onDismissNotification,
    onUpdatePhase
}) => {
  const [assigningActivity, setAssigningActivity] = useState(null); 
  const [tempAssignData, setTempAssignData] = useState({ assigneeId: "", days: "" }); 
  
  const timeline = calculateTimeline(project);

  const handleStartAssign = (activity) => {
    setAssigningActivity(activity.name);
    setTempAssignData({ 
      assigneeId: activity.assigneeId || "", 
      days: activity.days || "" 
    });
  };

  const handleConfirmAssign = () => {
    if (!tempAssignData.assigneeId || !tempAssignData.days) return;
    onAssignActivity(
        project.id, 
        assigningActivity, 
        tempAssignData.assigneeId, 
        tempAssignData.days
    );
    setAssigningActivity(null);
  };

  const handlePhaseChange = (activityName, phaseName, field, value) => {
      onUpdatePhase(project.id, activityName, phaseName, field, value);
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          onAddAttachment(project.id, file);
      }
      e.target.value = null; 
  };

  const getStaff = (id) => staffList.find(s => s.id === parseInt(id)) || { name: "Desconocido", photo: null };

  const getActivityDates = (activity) => {
    const days = parseInt(activity.days || 0);
    const dateStr = project.startDate ? project.startDate : new Date().toISOString().split('T')[0];
    const start = new Date(dateStr + "T12:00:00");
    let offset = 0;

    if (activity.name === "Diseño estructural") {
      offset = timeline.accArq; 
    } else if (activity.name === "Revisor estructural") {
      offset = timeline.accEst;
    } else {
      offset = 0; 
    }

    start.setDate(start.getDate() + offset);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    return {
      start: start.toLocaleDateString(),
      end: end.toLocaleDateString()
    };
  };

  const toggleTrackingCheck = (idx) => {
      const newChecklist = project.tracking.checklist.map((item, i) => 
          i === idx ? { ...item, done: !item.done } : item
      );
      onUpdateProjectTracking(project.id, { ...project.tracking, checklist: newChecklist });
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <header className="mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4 transition-colors"><ArrowLeft size={20} /> Volver al Listado</button>
        <div className="flex justify-between items-start">
          <div><h1 className="text-3xl font-bold text-slate-900">{project.name}</h1><p className="text-slate-500 text-lg">{project.client}</p></div>
          <div className="text-right">
              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border mb-2 ${getStatusColor(project.status)}`}>
                    {project.status}
                </span>
                <div className="flex items-center gap-4 text-sm bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold">Terminación Estimada</p>
                    <p className="font-mono font-bold text-slate-700">{timeline.endDate}</p>
                  </div>
                  <div className={`text-right ${timeline.daysRemaining < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    <p className="text-xs uppercase font-bold">Días Restantes</p>
                    <p className="font-mono font-bold">{timeline.daysRemaining} días</p>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </header>

      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold text-xl border-b pb-4">
              <ClipboardList size={24} className="text-indigo-600"/> Seguimiento Administrativo
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:border-r border-slate-100 md:pr-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><FileCheck size={16}/> Documentación Requerida</h4>
                  <div className="space-y-3">
                      {project.tracking.checklist.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                              <button onClick={() => toggleTrackingCheck(idx)} className={`mt-0.5 flex-shrink-0 transition-colors ${item.done ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}>
                                  {item.done ? <CheckSquare size={18} /> : <Square size={18} />}
                              </button>
                              <span className={`text-sm leading-tight ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                          </div>
                      ))}
                      <div className="mt-3 pt-3 border-t border-dashed border-slate-100">
                          <div className="flex items-start gap-2">
                              <button 
                                  onClick={() => onUpdateProjectTracking(project.id, { ...project.tracking, others: { ...project.tracking.others, checked: !project.tracking.others.checked } })}
                                  className={`mt-0.5 flex-shrink-0 transition-colors ${project.tracking.others.checked ? 'text-indigo-500' : 'text-slate-300 hover:text-indigo-500'}`}
                              >
                                  {project.tracking.others.checked ? <CheckSquare size={18} /> : <Square size={18} />}
                              </button>
                              <span className="text-sm text-slate-700 font-medium">Otros Documentos</span>
                          </div>
                          {project.tracking.others.checked && (
                              <input 
                                  type="text" 
                                  className="mt-2 w-full text-sm p-2 border rounded bg-indigo-50/30 outline-none focus:ring-1 focus:ring-indigo-300"
                                  placeholder="Describir documento..."
                                  value={project.tracking.others.description}
                                  onChange={(e) => onUpdateProjectTracking(project.id, { ...project.tracking, others: { ...project.tracking.others, description: e.target.value } })}
                              />
                          )}
                      </div>
                  </div>
              </div>

              <div className="md:border-r border-slate-100 md:px-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><SendHorizontal size={16}/> Estado del Proceso</h4>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      
                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${project.tracking.deliveryStatus === 'ejecucion' ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <input 
                              type="radio" 
                              name="projectStatus"
                              checked={project.tracking.deliveryStatus === 'ejecucion'}
                              onChange={() => onUpdateProjectTracking(project.id, { ...project.tracking, deliveryStatus: 'ejecucion' })}
                              className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-800">En ejecución</span>
                      </label>

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${project.tracking.deliveryStatus === 'entregado' ? 'bg-white border-teal-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <input 
                              type="radio" 
                              name="projectStatus"
                              checked={project.tracking.deliveryStatus === 'entregado'}
                              onChange={() => onUpdateProjectTracking(project.id, { ...project.tracking, deliveryStatus: 'entregado' })}
                              className="text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-800">Terminado</span>
                      </label>

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${project.tracking.deliveryStatus === 'radicado' ? 'bg-white border-purple-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <input 
                              type="radio" 
                              name="projectStatus"
                              checked={project.tracking.deliveryStatus === 'radicado'}
                              onChange={() => onUpdateProjectTracking(project.id, { ...project.tracking, deliveryStatus: 'radicado' })}
                              className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-800">Radicado</span>
                      </label>

                      {project.tracking.deliveryStatus === 'radicado' && (
                          <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                              <label className="block text-[10px] font-bold text-purple-600 uppercase mb-1">Número de Radicado</label>
                              <input 
                                  type="text" 
                                  className="w-full text-sm p-2 border border-purple-200 rounded focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                                  placeholder="Ej: 2024-ER-12345"
                                  value={project.tracking.radicadoNumber}
                                  onChange={(e) => onUpdateProjectTracking(project.id, { ...project.tracking, radicadoNumber: e.target.value })}
                              />
                          </div>
                      )}

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${project.tracking.deliveryStatus === 'observaciones' ? 'bg-white border-amber-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <input 
                              type="radio" 
                              name="projectStatus"
                              checked={project.tracking.deliveryStatus === 'observaciones'}
                              onChange={() => onUpdateProjectTracking(project.id, { ...project.tracking, deliveryStatus: 'observaciones' })}
                              className="text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-800">En acta de observaciones</span>
                      </label>

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${project.tracking.deliveryStatus === 'liquidacion' ? 'bg-white border-orange-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <input 
                              type="radio" 
                              name="projectStatus"
                              checked={project.tracking.deliveryStatus === 'liquidacion'}
                              onChange={() => onUpdateProjectTracking(project.id, { ...project.tracking, deliveryStatus: 'liquidacion' })}
                              className="text-orange-600 focus:ring-orange-500 w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-800">En liquidación</span>
                      </label>

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${project.tracking.deliveryStatus === 'aprobada' ? 'bg-white border-emerald-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-slate-200'}`}>
                          <input 
                              type="radio" 
                              name="projectStatus"
                              checked={project.tracking.deliveryStatus === 'aprobada'}
                              onChange={() => onUpdateProjectTracking(project.id, { ...project.tracking, deliveryStatus: 'aprobada' })}
                              className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span className="text-sm font-bold text-slate-800">Licencia aprobada</span>
                      </label>

                  </div>
              </div>

              <div className="md:pl-6">
                  <div className="flex justify-between items-center mb-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Paperclip size={16}/> Archivos y Soportes</h4>
                     <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                         <input type="file" className="hidden" onChange={handleFileSelect} />
                         <Plus size={14} /> Adjuntar
                     </label>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl border border-slate-100 min-h-[200px] p-2">
                      {(!project.attachments || project.attachments.length === 0) ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-6">
                              <File size={32} className="opacity-20"/>
                              <p className="text-xs text-center">No hay archivos adjuntos.<br/>Sube documentos, planos o soportes aquí.</p>
                          </div>
                      ) : (
                          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                              {project.attachments.map(file => (
                                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow group">
                                          <div className="flex items-center gap-3 overflow-hidden">
                                              <div className="p-1.5 bg-slate-100 rounded text-slate-500">
                                                  <File size={16} />
                                              </div>
                                              <div className="min-w-0">
                                                  <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                                  <p className="text-[10px] text-slate-400">{file.date} • {file.size}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Descargar"><Download size={14} /></button>
                                              <button onClick={() => onDeleteAttachment(project.id, file.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={14} /></button>
                                          </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </section>

      <div className="mb-6"><h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers size={24} className="text-indigo-600" /> Actividades Contratadas</h3><p className="text-slate-500 mb-6">Gestiona el detalle técnico de cada actividad.</p></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {project.activities.map((activity, index) => {
          
          if (activity.name === "Estudio de suelos") {
              const assignedCampo = activity.phases?.campo?.assigneeId ? getStaff(activity.phases.campo.assigneeId) : null;
              const assignedInforme = activity.phases?.informe?.assigneeId ? getStaff(activity.phases.informe.assigneeId) : null;
              
              const startCampo = new Date(project.startDate + "T12:00:00");
              const daysCampo = parseInt(activity.phases?.campo?.days || 0);
              const endCampo = new Date(startCampo);
              endCampo.setDate(endCampo.getDate() + daysCampo);

              const startInforme = new Date(endCampo);
              const daysInforme = parseInt(activity.phases?.informe?.days || 0);
              const endInforme = new Date(startInforme);
              endInforme.setDate(endInforme.getDate() + daysInforme);

              return (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 col-span-1 md:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Layers size={24}/>
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">Estudio de Suelos</h4>
                        </div>
                        <button onClick={() => onOpenActivity(activity.name)} className="text-xs font-bold text-indigo-600 flex items-center hover:underline">
                            Tablero <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-slate-300 z-0">
                            <ChevronRight size={32} />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 z-10 relative">
                            <h5 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                <Hammer size={14} className="text-amber-600"/> Trabajo de Campo
                            </h5>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Responsable</label>
                                    <select 
                                        className="w-full text-xs p-2 border rounded bg-white"
                                        value={activity.phases?.campo?.assigneeId || ""}
                                        onChange={(e) => handlePhaseChange(activity.name, 'campo', 'assigneeId', e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {staffList.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duración (Días)</label>
                                    <input 
                                        type="number" 
                                        className="w-full text-xs p-2 border rounded"
                                        value={activity.phases?.campo?.days || ""}
                                        onChange={(e) => handlePhaseChange(activity.name, 'campo', 'days', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="pt-2">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Inicio:</span>
                                        <span className="font-mono font-bold text-slate-700">{formatDateLocal(startCampo)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>Fin Estimado:</span>
                                        <span className="font-mono font-bold text-amber-600">{formatDateLocal(endCampo)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 z-10 relative">
                            <h5 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                <FileTextIcon size={14} className="text-blue-600"/> Informe Técnico
                            </h5>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Responsable</label>
                                    <select 
                                        className="w-full text-xs p-2 border rounded bg-white"
                                        value={activity.phases?.informe?.assigneeId || ""}
                                        onChange={(e) => handlePhaseChange(activity.name, 'informe', 'assigneeId', e.target.value)}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {staffList.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duración (Días)</label>
                                    <input 
                                        type="number" 
                                        className="w-full text-xs p-2 border rounded"
                                        value={activity.phases?.informe?.days || ""}
                                        onChange={(e) => handlePhaseChange(activity.name, 'informe', 'days', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="pt-2">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Inicio (Fin de Campo):</span>
                                        <span className="font-mono font-bold text-slate-700">{formatDateLocal(startInforme)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>Entrega Final:</span>
                                        <span className="font-mono font-bold text-blue-600">{formatDateLocal(endInforme)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              );
          }

          const isAssigned = activity.assigneeId !== null;
          const assignedStaff = isAssigned ? getStaff(activity.assigneeId) : null;
          const isEditing = assigningActivity === activity.name;
          const dates = getActivityDates(activity); 
          const isDone = activity.status === 'done';

          return (
            <div key={index} className={`bg-white p-6 rounded-xl shadow-sm border transition-all ${isAssigned ? (isDone ? 'border-emerald-200 bg-emerald-50/30' : 'border-indigo-200 hover:shadow-md') : 'border-slate-200 border-dashed hover:border-slate-400'}`}>
              
              {activity.notification && (
                  <div className="mb-3 bg-blue-50 text-blue-700 p-2 rounded text-xs flex justify-between items-center animate-in slide-in-from-top-2 border border-blue-100">
                      <span className="flex items-center gap-1.5 font-bold"><Bell size={12} className="text-blue-500"/> {activity.notification}</span>
                      <button onClick={() => onDismissNotification(project.id, activity.name)} className="text-blue-400 hover:text-blue-600"><X size={12}/></button>
                  </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${isAssigned ? (isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600') : 'bg-slate-100 text-slate-400'}`}>
                    {isDone ? <CheckCircle2 size={24} /> : <DraftingCompass size={24} />}
                </div>
                {isAssigned && !isEditing && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 select-none" title="Estado">
                         <span className={`text-xs font-bold ${isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isDone ? 'Terminada' : 'Pendiente'}
                         </span>
                      </div>
                      <div className="w-px h-4 bg-slate-200"></div>
                      <button onClick={() => handleStartAssign(activity)} className="text-slate-400 hover:text-blue-600 p-1" title="Editar Responsable/Tiempo">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => onOpenActivity(activity.name)} className="text-xs font-bold text-indigo-600 flex items-center hover:underline">
                        Tablero <ChevronRight size={14} />
                      </button>
                    </div>
                )}
              </div>
              
              <h4 className={`text-lg font-bold mb-1 ${isDone ? 'text-emerald-800 line-through decoration-emerald-300' : 'text-slate-800'}`}>{activity.name}</h4>
              
              {isEditing ? (
                  <div className="mt-4 space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200 animate-in fade-in">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Responsable</label>
                        <select className="w-full text-xs p-2 border rounded bg-white" value={tempAssignData.assigneeId} onChange={(e) => setTempAssignData({...tempAssignData, assigneeId: e.target.value})}>
                          <option value="">Seleccionar...</option>
                          {staffList.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Días Hábiles</label>
                        <input type="number" className="w-full text-xs p-2 border rounded" placeholder="Ej: 15" value={tempAssignData.days} onChange={(e) => setTempAssignData({...tempAssignData, days: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setAssigningActivity(null)} className="flex-1 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded">Cancelar</button>
                        <button onClick={handleConfirmAssign} className="flex-1 py-1 text-xs bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Guardar</button>
                    </div>
                  </div>
              ) : isAssigned ? (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                        {assignedStaff.photo ? <img src={assignedStaff.photo} className="w-full h-full object-cover"/> : <User size={16} className="text-slate-400"/>}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Responsable</p>
                        <p className="text-sm font-bold text-slate-700">{assignedStaff.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded mb-2">
                      <div>
                        <span className="text-slate-400 block">Inicia</span>
                        <span className="font-mono font-bold text-slate-700">{dates.start}</span>
                      </div>
                      <div className="text-right">
                          <span className="text-slate-400 block">Termina</span>
                          <span className="font-mono font-bold text-slate-700">{dates.end}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
                      <Clock size={12} /> {activity.days} días asignados
                    </div>
                </div>
              ) : (
                <div className="mt-4">
                    <button onClick={() => handleStartAssign(activity)} className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-lg font-bold text-sm hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2">
                        <UserCheck size={16} /> Asignar Responsable
                    </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProjectsList = ({ onNewProject, onOpenProject, projects, onBack, userRole }) => {
  const [viewMode, setViewMode] = useState('summary'); 
  
  const [detailFilters, setDetailFilters] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'none',
    activity: 'Todas',
    status: 'Todos'
  });

  const getGroupedProjects = () => {
      let data = projects.filter(p => {
          const pDate = new Date(p.startDate);
          const start = new Date(detailFilters.startDate);
          const end = new Date(detailFilters.endDate);
          end.setHours(23, 59, 59, 999);
          
          const inDateRange = pDate >= start && pDate <= end;
          const statusMatch = detailFilters.status === 'Todos' || p.status === detailFilters.status;
          const activityMatch = detailFilters.activity === 'Todas' || p.activities.some(a => a.name === detailFilters.activity);

          return inDateRange && statusMatch && activityMatch;
      });

      data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const grouped = {};
      data.forEach(p => {
          let key = 'Listado General';
          if (detailFilters.groupBy === 'week') {
              const { week, year } = getWeekNumber(new Date(p.startDate));
              key = `Semana ${week} - ${year}`;
          } else if (detailFilters.groupBy === 'month') {
              key = getMonthName(p.startDate);
          }
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(p);
      });
      return grouped;
  };

  const groupedData = viewMode === 'detailed' ? getGroupedProjects() : {};
  
  const globalTotals = viewMode === 'detailed' ? (() => {
      const allItems = Object.values(groupedData).flat();
      const totals = SERVICE_OPTIONS.reduce((acc, svc) => {
          acc[svc] = allItems.reduce((sum, item) => sum + (item.activities.find(a => a.name === svc)?.price || 0), 0);
          return acc;
      }, {});
      totals.grandTotal = allItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
      return totals;
  })() : {};

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button>
          <div>
             <h2 className="text-2xl font-bold text-slate-900">Diseños en Proceso</h2>
             <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setViewMode('summary')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${viewMode === 'summary' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Resumido</button>
                <button onClick={() => setViewMode('detailed')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${viewMode === 'detailed' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Detallado</button>
             </div>
          </div>
        </div>
        {userRole.permissions.projects.edit_tasks && (
          <button onClick={onNewProject} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-200"><FilePlus size={18} />Nuevo Diseño</button>
        )}
      </div>

      {viewMode === 'summary' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 font-bold text-slate-600">ID</th>
                  <th className="p-4 font-bold text-slate-600">Cliente</th>
                  <th className="p-4 font-bold text-slate-600 hidden md:table-cell">Actividades</th>
                  <th className="p-4 font-bold text-slate-600 hidden lg:table-cell">Procesos Terminados</th>
                  <th className="p-4 font-bold text-slate-600">Inicio</th>
                  <th className="p-4 font-bold text-slate-600">Terminación</th>
                  <th className="p-4 font-bold text-slate-600 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.length === 0 ? (<tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">No hay diseños activos</td></tr>) : (
                  projects.map((project) => {
                    const timeline = calculateTimeline(project);
                    return (
                      <tr key={project.id} onClick={() => onOpenProject(project)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                        <td className="p-4 font-medium text-indigo-600">{project.id}</td>
                        <td className="p-4 font-bold text-slate-800">{project.client}</td>
                        <td className="p-4 hidden md:table-cell"><div className="flex flex-wrap gap-1">{project.type && project.type.split('+').map((activity, idx) => (<span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">{activity.trim()}</span>))}</div></td>
                        <td className="p-4 hidden lg:table-cell">
                          {(() => {
                            const doneActs = project.activities.filter(a => a.status === 'done');
                            if (doneActs.length === 0) return <span className="text-xs text-slate-400 italic">Sin finalizados</span>;
                            return (
                              <div className="flex flex-wrap gap-1">
                                {doneActs.map((act, i) => (
                                  <span key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {act.name}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-slate-500">{project.startDate}</td>
                        <td className="p-4 font-mono text-slate-700">{timeline.endDate}</td>
                        <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>{project.status}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
      ) : (
           <div className="space-y-6">
               <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4">
                   <div><label className="block text-xs font-bold text-slate-500 mb-1">Fecha Inicio</label><input type="date" className="w-full text-xs p-2 border rounded bg-slate-50" value={detailFilters.startDate} onChange={e => setDetailFilters({...detailFilters, startDate: e.target.value})} /></div>
                   <div><label className="block text-xs font-bold text-slate-500 mb-1">Fecha Fin</label><input type="date" className="w-full text-xs p-2 border rounded bg-slate-50" value={detailFilters.endDate} onChange={e => setDetailFilters({...detailFilters, endDate: e.target.value})} /></div>
                   <div><label className="block text-xs font-bold text-slate-500 mb-1">Agrupar Por</label><select className="w-full text-xs p-2 border rounded bg-slate-50" value={detailFilters.groupBy} onChange={e => setDetailFilters({...detailFilters, groupBy: e.target.value})}><option value="none">Sin Agrupar</option><option value="week">Semanal</option><option value="month">Mensual</option></select></div>
                   <div><label className="block text-xs font-bold text-slate-500 mb-1">Filtrar por Actividad</label><select className="w-full text-xs p-2 border rounded bg-slate-50" value={detailFilters.activity} onChange={e => setDetailFilters({...detailFilters, activity: e.target.value})}><option value="Todas">Todas las Actividades</option>{SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">Estado Proyecto</label>
                       <select className="w-full text-xs p-2 border rounded bg-slate-50" value={detailFilters.status} onChange={e => setDetailFilters({...detailFilters, status: e.target.value})}>
                           <option value="Todos">Todos</option>
                           <option value="En Ejecución">En ejecución</option>
                           <option value="Finalizado">Finalizado</option>
                           <option value="Suspendido">Suspendido</option>
                           <option value="Radicado">Radicado</option>
                           <option value="En acta de observaciones">En acta de observaciones</option>
                           <option value="En liquidación">En liquidación</option>
                           <option value="Licencia aprobada">Licencia aprobada</option>
                           <option value="Terminado">Terminado</option>
                       </select>
                   </div>
               </div>

               <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto">
                   <table className="min-w-full w-auto text-left text-xs whitespace-nowrap">
                       <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase">
                           <tr>
                               <th className="p-3 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-sm">ID</th>
                               <th className="p-3 border-r border-slate-200">Inicio</th>
                               <th className="p-3 border-r border-slate-200">Cliente</th>
                               {SERVICE_OPTIONS.map(opt => <th key={opt} className="p-3 text-center border-r border-slate-100 min-w-[120px] px-6">{opt}</th>)}
                               <th className="p-3 text-right bg-slate-100 font-bold sticky right-0 border-l border-slate-200 shadow-sm">Valor Total</th>
                           </tr>
                       </thead>
                       <tbody>
                           {Object.keys(groupedData).length === 0 ? (
                               <tr><td colSpan={SERVICE_OPTIONS.length + 4} className="p-8 text-center text-slate-400 italic">No se encontraron registros con estos filtros.</td></tr>
                           ) : (
                               Object.entries(groupedData).map(([groupKey, items]) => {
                                   const groupGrandTotal = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
                                   return (
                                       <React.Fragment key={groupKey}>
                                            {detailFilters.groupBy !== 'none' && <tr className="bg-slate-100 border-y border-slate-300"><td colSpan={SERVICE_OPTIONS.length + 4} className="p-3 font-bold text-slate-800 text-sm uppercase tracking-wide">{groupKey}</td></tr>}
                                            {items.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100 cursor-pointer" onClick={() => onOpenProject(item)}>
                                                    <td className="p-3 font-medium text-indigo-600 sticky left-0 bg-white border-r border-slate-100 shadow-sm">{item.id}</td>
                                                    <td className="p-3 text-slate-500 border-r border-slate-100">{item.startDate}</td>
                                                    <td className="p-3 font-medium text-slate-700 border-r border-slate-100 truncate max-w-[200px]" title={item.client}>{item.client}</td>
                                                    {SERVICE_OPTIONS.map(svc => {
                                                        const activity = item.activities.find(a => a.name === svc);
                                                        const value = activity ? activity.price : 0;
                                                        return <td key={svc} className="p-3 text-right font-mono text-slate-600 border-r border-slate-100 px-6">${value.toLocaleString('es-CO')}</td>;
                                                    })}
                                                    <td className="p-3 text-right font-black text-slate-900 bg-slate-50 sticky right-0 border-l border-slate-200 shadow-sm">${(item.totalValue || 0).toLocaleString('es-CO')}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-indigo-50 border-y-2 border-indigo-100 font-bold text-indigo-900">
                                                 <td colSpan={SERVICE_OPTIONS.length + 3} className="p-3 text-right uppercase text-[10px] tracking-widest sticky left-0 bg-indigo-50 border-r border-indigo-100 shadow-sm">Total Valor Proyectos ({groupKey === 'Listado General' ? 'General' : groupKey}):</td>
                                                 <td className="p-3 text-right font-black text-indigo-700 bg-indigo-100 sticky right-0 border-l border-indigo-200 shadow-sm">${groupGrandTotal.toLocaleString('es-CO')}</td>
                                            </tr>
                                       </React.Fragment>
                                   );
                               })
                           )}
                       </tbody>
                       {Object.keys(groupedData).length > 0 && (
                           <tfoot className="bg-slate-800 text-white border-t-4 border-slate-600">
                               <tr>
                                   <td colSpan={3} className="p-4 text-right uppercase font-black tracking-widest sticky left-0 bg-slate-800 border-r border-slate-700 shadow-sm">TOTAL GENERAL FILTRADO:</td>
                                   {SERVICE_OPTIONS.map(svc => <td key={svc} className="p-4 text-right font-mono font-bold border-r border-slate-700 px-6">${globalTotals[svc]?.toLocaleString('es-CO')}</td>)}
                                   <td className="p-4 text-right font-black text-lg bg-slate-900 sticky right-0 border-l border-slate-700 shadow-sm">${globalTotals.grandTotal?.toLocaleString('es-CO')}</td>
                               </tr>
                           </tfoot>
                       )}
                   </table>
               </div>
           </div>
       )}
    </div>
  );
};

const FinanceProjectList = ({ projects, onOpenProject, onBack }) => {
  const [viewMode, setViewMode] = useState('summary'); 
  const [detailFilters, setDetailFilters] = useState({ 
    startDate: '2024-01-01', 
    endDate: new Date().toISOString().split('T')[0], 
    groupBy: 'none', 
    activity: 'Todas', 
    status: 'Todos',
    valueType: 'all' 
  });

  const getGroupedFinance = () => {
      let data = projects.filter(p => {
          const pDate = new Date(p.startDate);
          const start = new Date(detailFilters.startDate);
          const end = new Date(detailFilters.endDate);
          end.setHours(23, 59, 59, 999);
          const statusMatch = detailFilters.status === 'Todos' || p.status === detailFilters.status;
          const activityMatch = detailFilters.activity === 'Todas' || p.activities.some(a => a.name === detailFilters.activity);
          return pDate >= start && pDate <= end && statusMatch && activityMatch;
      });
      data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      const grouped = {};
      data.forEach(p => {
          let key = 'Listado General';
          if (detailFilters.groupBy === 'week') { const { week, year } = getWeekNumber(new Date(p.startDate)); key = `Semana ${week} - ${year}`; }
          else if (detailFilters.groupBy === 'month') { key = getMonthName(p.startDate); }
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(p);
      });
      return grouped;
  };

  const groupedData = viewMode === 'detailed' ? getGroupedFinance() : {};
  
  const globalTotals = viewMode === 'detailed' ? (() => {
      const allItems = Object.values(groupedData).flat();
      const totals = SERVICE_OPTIONS.reduce((acc, svc) => {
          const svcTotals = allItems.reduce((t, item) => {
              const activity = item.activities.find(a => a.name === svc);
              const price = activity ? (activity.price || 0) : 0;
              const paid = activity ? (activity.paid || 0) : 0;
              return { price: t.price + price, paid: t.paid + paid };
          }, { price: 0, paid: 0 });
          acc[svc] = { ...svcTotals, balance: svcTotals.price - svcTotals.paid };
          return acc;
      }, {});
      const grand = allItems.reduce((t, item) => {
           const totalVal = item.totalValue || 0;
           const totalPaid = item.activities.reduce((acc, act) => acc + (act.paid || 0), 0);
           return { price: t.price + totalVal, paid: t.paid + totalPaid };
      }, { price: 0, paid: 0 });
      totals.grandTotal = { ...grand, balance: grand.price - grand.paid };
      return totals;
  })() : {};

  const colSpanPerService = detailFilters.valueType === 'all' ? 3 : 1;
  const colSpanGrandTotal = detailFilters.valueType === 'all' ? 3 : 1;
  const totalColumns = 3 + (SERVICE_OPTIONS.length * colSpanPerService) + colSpanGrandTotal;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft size={24} /></button>
          <div><h2 className="text-2xl font-bold text-slate-900">Control Financiero</h2><div className="flex gap-2 mt-2"><button onClick={() => setViewMode('summary')} className={`px-3 py-1 text-xs font-bold rounded-full ${viewMode === 'summary' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Resumido</button><button onClick={() => setViewMode('detailed')} className={`px-3 py-1 text-xs font-bold rounded-full ${viewMode === 'detailed' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>Detallado</button></div></div>
        </div>
      </div>

      {viewMode === 'summary' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">ID</th><th className="p-4">Proyecto</th><th className="p-4">Cliente</th><th className="p-4 text-right">Total</th><th className="p-4 text-right">Pagado</th><th className="p-4 text-right">Saldo</th><th className="p-4 text-center">Acción</th></tr></thead>
              <tbody>{projects.map(p => { const paid = p.activities?.reduce((a,c)=>a+(c.paid||0),0)||0; const bal = (p.totalValue||0)-paid; return (<tr key={p.id} onClick={() => onOpenProject(p)} className="hover:bg-slate-50 cursor-pointer border-b"><td className="p-4 text-emerald-600 font-medium">{p.id}</td><td className="p-4 font-bold">{p.name}</td><td className="p-4">{p.client}</td><td className="p-4 text-right">${(p.totalValue||0).toLocaleString('es-CO')}</td><td className="p-4 text-right text-emerald-600">${paid.toLocaleString('es-CO')}</td><td className="p-4 text-right text-red-600 font-bold">${bal.toLocaleString('es-CO')}</td><td className="p-4 text-center"><Wallet size={18} className="text-emerald-600"/></td></tr>) })}</tbody></table>
          </div>
      ) : (
           <div className="space-y-6">
               <div className="bg-white p-4 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4">
                   <div><label className="text-xs font-bold block mb-1">Inicio</label><input type="date" className="w-full text-xs p-2 border rounded" value={detailFilters.startDate} onChange={e => setDetailFilters({...detailFilters, startDate: e.target.value})} /></div>
                   <div><label className="text-xs font-bold block mb-1">Fin</label><input type="date" className="w-full text-xs p-2 border rounded" value={detailFilters.endDate} onChange={e => setDetailFilters({...detailFilters, endDate: e.target.value})} /></div>
                   <div><label className="text-xs font-bold block mb-1">Agrupar</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.groupBy} onChange={e => setDetailFilters({...detailFilters, groupBy: e.target.value})}><option value="none">Sin Agrupar</option><option value="week">Semanal</option><option value="month">Mensual</option></select></div>
                   <div><label className="text-xs font-bold block mb-1">Estado</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.status} onChange={e => setDetailFilters({...detailFilters, status: e.target.value})}><option value="Todos">Todos</option><option value="En Ejecución">En Proceso</option><option value="Finalizado">Terminado</option><option value="Suspendido">Cancelado</option></select></div>
                   <div><label className="text-xs font-bold block mb-1">Actividad</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.activity} onChange={e => setDetailFilters({...detailFilters, activity: e.target.value})}><option value="Todas">Todas</option>{SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                   <div><label className="text-xs font-bold block mb-1">Ver Valor</label><select className="w-full text-xs p-2 border rounded" value={detailFilters.valueType} onChange={e => setDetailFilters({...detailFilters, valueType: e.target.value})}><option value="all">Todo (C/A/P)</option><option value="contracted">Solo Contratado</option><option value="paid">Solo Abonado</option><option value="pending">Solo Pendiente</option></select></div>
               </div>
               <div className="bg-white rounded-xl shadow border overflow-x-auto">
                   <table className="min-w-full w-auto text-left text-xs whitespace-nowrap">
                       <thead className="bg-slate-50 border-b text-slate-600 uppercase">
                           <tr>
                               <th rowSpan="2" className="p-3 sticky left-0 bg-slate-50 z-10 border-r border-b shadow-sm">ID</th>
                               <th rowSpan="2" className="p-3 border-r border-b">Inicio</th>
                               <th rowSpan="2" className="p-3 border-r border-b">Cliente</th>
                               {SERVICE_OPTIONS.map(opt => (<th key={opt} colSpan={colSpanPerService} className="p-3 text-center border-r border-b">{opt}</th>))}
                               <th colSpan={colSpanGrandTotal} className="p-3 text-center bg-slate-100 border-l border-b sticky right-0 shadow-sm">Totales Generales</th>
                           </tr>
                           <tr>
                               {SERVICE_OPTIONS.map(opt => (
                                   <React.Fragment key={opt + '-sub'}>
                                           {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <th className="p-2 text-right text-[10px] text-blue-600 bg-blue-50 border-r border-b min-w-[80px]">Cont.</th>}
                                           {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <th className="p-2 text-right text-[10px] text-emerald-600 bg-emerald-50 border-r border-b min-w-[80px]">Abo.</th>}
                                           {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <th className="p-2 text-right text-[10px] text-red-600 bg-red-50 border-r border-b min-w-[80px]">Pend.</th>}
                                   </React.Fragment>
                               ))}
                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <th className="p-2 text-right text-[10px] text-blue-800 bg-blue-100 border-l border-b min-w-[100px]">T. Cont</th>}
                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <th className="p-2 text-right text-[10px] text-emerald-800 bg-emerald-100 border-b min-w-[100px]">T. Pag</th>}
                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <th className="p-2 text-right text-[10px] text-red-800 bg-red-100 border-b sticky right-0 shadow-sm min-w-[100px]">T. Pen</th>}
                           </tr>
                       </thead>
                       <tbody>
                           {Object.entries(groupedData).map(([groupKey, items]) => {
                               const groupTotals = SERVICE_OPTIONS.reduce((acc, svc) => {
                                   const totals = items.reduce((t, i) => {
                                           const act = i.activities.find(a => a.name === svc);
                                           const p = act ? (act.price || 0) : 0;
                                           const pd = act ? (act.paid || 0) : 0;
                                           return { price: t.price + p, paid: t.paid + pd };
                                   }, { price: 0, paid: 0 });
                                   acc[svc] = { ...totals, balance: totals.price - totals.paid };
                                   return acc;
                               }, {});
                               const groupGrand = items.reduce((t, i) => {
                                   const val = i.totalValue || 0;
                                   const paid = i.activities.reduce((a, act) => a + (act.paid || 0), 0);
                                   return { price: t.price + val, paid: t.paid + paid };
                               }, { price: 0, paid: 0 });

                               return (
                                   <React.Fragment key={groupKey}>
                                           {detailFilters.groupBy !== 'none' && <tr className="bg-slate-100"><td colSpan={totalColumns} className="p-2 font-bold uppercase">{groupKey}</td></tr>}
                                           {items.map(item => {
                                               const itemPaid = item.activities.reduce((a,c)=>a+(c.paid||0),0);
                                               const itemTotal = item.totalValue || 0;
                                               const itemPending = itemTotal - itemPaid;
                                               return (
                                                   <tr key={item.id} className="hover:bg-slate-50 border-b cursor-pointer" onClick={() => onOpenProject(item)}>
                                                       <td className="p-3 text-emerald-600 font-medium sticky left-0 bg-white border-r shadow-sm">{item.id}</td><td className="p-3 border-r">{item.startDate}</td><td className="p-3 border-r font-medium text-slate-700">{item.client}</td>
                                                       {SERVICE_OPTIONS.map(svc => { 
                                                           const act = item.activities.find(a => a.name === svc); 
                                                           const price = act ? (act.price || 0) : 0;
                                                           const paid = act ? (act.paid || 0) : 0;
                                                           const pending = price - paid;
                                                           return (
                                                               <React.Fragment key={svc}>
                                                                   {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <td className="p-3 text-right font-mono text-blue-600 bg-blue-50/30 border-r">{price > 0 ? `$${price.toLocaleString('es-CO')}` : '-'}</td>}
                                                                   {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <td className="p-3 text-right font-mono text-emerald-600 bg-emerald-50/30 border-r">{paid > 0 ? `$${paid.toLocaleString('es-CO')}` : '-'}</td>}
                                                                   {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <td className="p-3 text-right font-mono text-red-600 bg-red-50/30 border-r font-bold">{pending > 0 ? `$${pending.toLocaleString('es-CO')}` : '-'}</td>}
                                                               </React.Fragment>
                                                           ); 
                                                       })}
                                                       {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <td className="p-3 text-right font-bold text-blue-800 bg-blue-50 border-l">${itemTotal.toLocaleString('es-CO')}</td>}
                                                       {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <td className="p-3 text-right font-bold text-emerald-800 bg-emerald-50">${itemPaid.toLocaleString('es-CO')}</td>}
                                                       {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <td className="p-3 text-right font-black text-red-800 bg-red-50 sticky right-0 shadow-sm">${itemPending.toLocaleString('es-CO')}</td>}
                                                   </tr>
                                               );
                                           })}
                                           <tr className="bg-indigo-50 font-bold border-y-2 border-indigo-100">
                                               <td colSpan={3} className="p-3 text-right sticky left-0 bg-indigo-50 border-r shadow-sm">SUBTOTAL {groupKey !== 'Listado General' ? groupKey : ''}:</td>
                                               {SERVICE_OPTIONS.map(svc => (
                                                   <React.Fragment key={svc}>
                                                       {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <td className="p-3 text-right font-mono text-blue-700 border-r">${groupTotals[svc].price.toLocaleString('es-CO')}</td>}
                                                       {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <td className="p-3 text-right font-mono text-emerald-700 border-r">${groupTotals[svc].paid.toLocaleString('es-CO')}</td>}
                                                       {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <td className="p-3 text-right font-mono text-red-700 border-r">${groupTotals[svc].balance.toLocaleString('es-CO')}</td>}
                                                   </React.Fragment>
                                               ))}
                                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <td className="p-3 text-right text-blue-900 border-l">${groupGrand.price.toLocaleString('es-CO')}</td>}
                                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <td className="p-3 text-right text-emerald-900">${groupGrand.paid.toLocaleString('es-CO')}</td>}
                                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <td className="p-3 text-right text-red-900 sticky right-0 bg-indigo-100 shadow-sm">${(groupGrand.price - groupGrand.paid).toLocaleString('es-CO')}</td>}
                                           </tr>
                                   </React.Fragment>
                               );
                           })}
                       </tbody>
                       <tfoot className="bg-slate-800 text-white border-t-4 border-slate-600">
                           <tr>
                               <td colSpan={3} className="p-3 text-right font-black sticky left-0 bg-slate-800 border-r shadow-sm">TOTAL GENERAL:</td>
                               {SERVICE_OPTIONS.map(svc => (
                                   <React.Fragment key={svc}>
                                           {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <td className="p-3 text-right font-mono font-bold text-blue-200 border-r border-slate-700">${globalTotals[svc]?.price.toLocaleString('es-CO')}</td>}
                                           {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <td className="p-3 text-right font-mono font-bold text-emerald-200 border-r border-slate-700">${globalTotals[svc]?.paid.toLocaleString('es-CO')}</td>}
                                           {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <td className="p-3 text-right font-mono font-bold text-red-200 border-r border-slate-700">${globalTotals[svc]?.balance.toLocaleString('es-CO')}</td>}
                                   </React.Fragment>
                               ))}
                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'contracted') && <td className="p-3 text-right font-black text-blue-300 border-l border-slate-700">${globalTotals.grandTotal?.price.toLocaleString('es-CO')}</td>}
                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'paid') && <td className="p-3 text-right font-black text-emerald-300 border-slate-700">${globalTotals.grandTotal?.paid.toLocaleString('es-CO')}</td>}
                               {(detailFilters.valueType === 'all' || detailFilters.valueType === 'pending') && <td className="p-3 text-right font-black text-red-300 sticky right-0 bg-slate-900 border-slate-700 shadow-sm">${globalTotals.grandTotal?.balance.toLocaleString('es-CO')}</td>}
                           </tr>
                       </tfoot>
                   </table>
               </div>
           </div>
      )}
    </div>
  );
};

const FinanceDetailView = ({ project, onBack, onUpdatePayment }) => {
    const [payments, setPayments] = useState({});
    const [paymentDates, setPaymentDates] = useState({}); 
    const [showHistory, setShowHistory] = useState(null); 
    const today = getLocalDateString();

    const handleSave = (actName) => {
        const amount = parseInt(payments[actName] || 0);
        if (amount > 0) { onUpdatePayment(project.id, actName, amount, paymentDates[actName] || today); setPayments({...payments, [actName]: ''}); }
    };
    
    const totalPaid = project.activities?.reduce((acc, act) => acc + (act.paid || 0), 0) || 0;
    const totalPending = (project.totalValue || 0) - totalPaid;
    
    return (
      <div className="animate-in fade-in duration-500">
        <div className="mb-6 flex justify-between items-start">
              <div><button onClick={onBack} className="text-slate-500 hover:text-blue-600 flex gap-2 mb-2"><ArrowLeft size={20}/> Volver</button><h1 className="text-2xl font-bold">{project.name}</h1><p className="text-slate-500">{project.client}</p></div>
              <div className="text-right"><button onClick={() => exportToTxt(project)} className="bg-white border px-4 py-2 rounded shadow-sm hover:bg-slate-50 flex items-center gap-2 mb-2"><Download size={16}/> Reporte TXT</button><div className="bg-white p-3 border rounded shadow-sm"><p className="text-xs text-slate-400 font-bold uppercase">Pendiente Total</p><p className="text-2xl font-black text-red-600">${totalPending.toLocaleString('es-CO')}</p></div></div>
        </div>
        <div className="bg-white rounded-xl shadow border overflow-hidden">
           <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Actividad</th><th className="p-4 text-right">Valor</th><th className="p-4 text-right">Pagado</th><th className="p-4 text-center">Registrar Abono</th><th className="p-4 text-right">Saldo</th></tr></thead>
              <tbody>
                  {project.activities.map(act => (
                      <React.Fragment key={act.name}>
                        <tr className="border-b hover:bg-slate-50">
                            <td className="p-4"><span className="font-bold block">{act.name}</span><button onClick={() => setShowHistory(showHistory === act.name ? null : act.name)} className="text-xs text-blue-500 hover:underline flex gap-1 mt-1"><History size={12}/> Historial ({act.paymentHistory?.length||0})</button></td>
                            <td className="p-4 text-right font-mono">${act.price.toLocaleString('es-CO')}</td><td className="p-4 text-right font-mono text-emerald-600">${(act.paid||0).toLocaleString('es-CO')}</td>
                            <td className="p-4 flex justify-center gap-2"><input type="date" className="p-1 border rounded text-xs w-28" value={paymentDates[act.name]||today} onChange={e=>setPaymentDates({...paymentDates, [act.name]: e.target.value})} /><input type="text" className="w-24 p-1 border rounded text-right text-xs" placeholder="$0" value={payments[act.name] ? parseInt(payments[act.name]).toLocaleString('es-CO') : ''} onChange={e=>setPayments({...payments, [act.name]: e.target.value.replace(/\D/g,'')})} /><button onClick={()=>handleSave(act.name)} disabled={!payments[act.name]} className="bg-emerald-600 text-white p-1 rounded disabled:opacity-50"><Save size={16}/></button></td>
                            <td className="p-4 text-right font-mono font-bold text-red-600">${(act.price-(act.paid||0)).toLocaleString('es-CO')}</td>
                        </tr>
                        {showHistory === act.name && <tr className="bg-slate-50"><td colSpan={5} className="p-4"><div className="max-w-md mx-auto bg-white border rounded"><table className="w-full text-xs"><thead><tr className="bg-slate-100"><th className="p-2">Fecha</th><th className="p-2 text-right">Monto</th></tr></thead><tbody>{act.paymentHistory?.map((h,i)=><tr key={i} className="border-b"><td className="p-2">{h.date}</td><td className="p-2 text-right">${h.amount.toLocaleString('es-CO')}</td></tr>)}</tbody></table></div></td></tr>}
                      </React.Fragment>
                  ))}
              </tbody>
           </table>
        </div>
      </div>
    );
};

const HomeView = ({ onNavigate, userRole }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto py-8">
      <div className="text-center mb-12"><h1 className="text-3xl font-black text-slate-900 mb-2">Bienvenido a JAMG Ingeniería</h1><p className="text-slate-500">Selecciona el módulo para comenzar a trabajar</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div onClick={() => onNavigate('quotes_list')} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all cursor-pointer group"><div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors"><FileText size={32} className="text-blue-600 group-hover:text-white transition-colors" /></div><h3 className="text-xl font-bold text-slate-800 mb-2">Gestión de Cotizaciones</h3><p className="text-slate-500 text-sm leading-relaxed">Crea ofertas comerciales y seguimiento a clientes.</p></div>
        <div onClick={() => onNavigate('projects_list')} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all cursor-pointer group"><div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors"><Briefcase size={32} className="text-indigo-600 group-hover:text-white transition-colors" /></div><h3 className="text-xl font-bold text-slate-800 mb-2">Diseños en Proceso</h3><p className="text-slate-500 text-sm leading-relaxed">Administra tus diseños activos y cronogramas.</p></div>
        
        {userRole?.permissions?.finance?.view_costs && (
            <div onClick={() => onNavigate('finance_list')} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-500 hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                    <Wallet size={32} className="text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Control Financiero</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Registro de abonos, control de cartera y saldos pendientes.</p>
            </div>
        )}

        <div onClick={() => onNavigate('team_list')} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-400 hover:-translate-y-1 transition-all cursor-pointer group"><div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-600 transition-colors"><UserCog size={32} className="text-slate-600 group-hover:text-white transition-colors" /></div><h3 className="text-xl font-bold text-slate-800 mb-2">Directorio de Equipo</h3><p className="text-slate-500 text-sm leading-relaxed">Base de datos de colaboradores y roles.</p></div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL APP CON FIREBASE ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [currentView, setCurrentView] = useState('login'); 
  const [editingQuote, setEditingQuote] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeProject, setActiveProject] = useState(null); 
  const [activeActivity, setActiveActivity] = useState(null); 
  
  const DEFAULT_ADMIN = { id: 1, name: "Admin JAMG", role: "Gerente", email: "jamg@jamg.com", password: "Concreto25#", status: "Active", permissions: { quotes: {view: true, create: true, delete: true}, projects: {view: true, edit_tasks: true, manage_team: true}, finance: {view_costs: true, register_payments: true}, admin: {manage_users: true} } };

  // Estados de datos
  const [staffList, setStaffList] = useState([DEFAULT_ADMIN]);
  const [quotes, setQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // 1. Cargar y sincronizar datos en TIEMPO REAL desde Firestore
  useEffect(() => {
    if (!db) {
        setIsDbLoaded(true);
        return;
    }

    // Rutas limpias en tu base de datos
    const staffRef = collection(db, 'staff');
    const quotesRef = collection(db, 'quotes');
    const projectsRef = collection(db, 'projects');

    // Escuchar el equipo
    const unsubStaff = onSnapshot(staffRef, (snap) => {
      const staffData = snap.docs.map(d => d.data());
      if (staffData.length === 0) {
          setDoc(doc(staffRef, '1'), DEFAULT_ADMIN);
          setStaffList([DEFAULT_ADMIN]);
      } else {
          setStaffList(staffData);
      }
    }, console.error);

    // Escuchar cotizaciones
    const unsubQuotes = onSnapshot(quotesRef, (snap) => {
      setQuotes(snap.docs.map(d => d.data()));
    }, console.error);

    // Escuchar proyectos
    const unsubProjects = onSnapshot(projectsRef, (snap) => {
      setProjects(snap.docs.map(d => d.data()));
      setIsDbLoaded(true); // Ocultar pantalla de carga
    }, console.error);

    return () => { unsubStaff(); unsubQuotes(); unsubProjects(); };
  }, []);

  // 2. Funciones puente para escribir en la nube
  const saveProjectToDB = async (project) => {
    try {
      if(!db) {
        console.warn("La tubería de la base de datos no existe (!db)");
        return;
      }
      console.log("⏳ Intentando enviar datos de proyecto a Firebase...");
      await setDoc(doc(db, 'projects', String(project.id)), project);
      console.log("✅ ¡Éxito rotundo! Los datos llegaron a la nube.");
    } catch (error) {
      console.error("❌ Fallo al guardar en Firebase. El guardia dijo:", error);
    }
  };

  const saveQuoteToDB = async (quote) => {
    if(!db) return;
    await setDoc(doc(db, 'quotes', String(quote.id)), quote);
  };

  const deleteQuoteFromDB = async (id) => {
    if(!db) return;
    await deleteDoc(doc(db, 'quotes', String(id)));
  };
  
  const saveStaffToDB = async (staff) => {
    if(!db) return;
    await setDoc(doc(db, 'staff', String(staff.id)), staff);
  };

  // Autenticación de UI
  const handleLogin = (email, pass) => { 
      const u = staffList.find(x => x.email === email && x.password === pass); 
      if(u) { setCurrentUser(u); setCurrentView('home'); return true; } 
      return false; 
  };

  // --- MANEJADORES DE ESTADO (Actualizados para funcionar Local y Nube) ---
  const handleUpdatePhase = (projectId, activityName, phaseName, field, value) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = {
          ...p,
          activities: p.activities.map(a => a.name === activityName ? {
              ...a, phases: { ...a.phases, [phaseName]: { ...a.phases[phaseName], [field]: value } }
          } : a)
      };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x)); // Actualización Local
      saveProjectToDB(updated); // Nube
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleDismissNotification = (projectId, activityName) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = {
        ...p,
        activities: p.activities.map(a => a.name === activityName ? { ...a, notification: null } : a)
      };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleUpdateProjectTracking = (projectId, newTrackingData) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = { ...p, tracking: newTrackingData };
      const statusMap = {
          'ejecucion': 'En ejecución', 'entregado': 'Terminado', 'radicado': 'Radicado',
          'observaciones': 'En acta de observaciones', 'liquidacion': 'En liquidación', 'aprobada': 'Licencia aprobada'
      };
      if (statusMap[newTrackingData.deliveryStatus]) {
          updated.status = statusMap[newTrackingData.deliveryStatus];
      }
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleAssignActivity = (projectId, activityName, assigneeId, days) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = {
        ...p,
        activities: p.activities.map(a => a.name === activityName ? { ...a, assigneeId: parseInt(assigneeId), days: parseInt(days), status: 'En Progreso' } : a)
      };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleToggleActivityStatus = (projectId, activityName) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      let updatedActivities = p.activities.map(a => a.name === activityName ? { ...a, status: a.status === 'done' ? 'En Progreso' : 'done' } : a);
      const changedActivity = updatedActivities.find(a => a.name === activityName);
      if (changedActivity.status === 'done') {
           const dependentName = Object.keys(ACTIVITY_DEPENDENCIES).find(key => ACTIVITY_DEPENDENCIES[key] === activityName);
           if (dependentName) {
               updatedActivities = updatedActivities.map(a => a.name === dependentName ? { ...a, notification: "¡Habilitado! El proceso anterior ha finalizado." } : a);
           }
      }
      const updated = { ...p, activities: updatedActivities };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleSetActivityStatus = (projectId, activityName, newStatus) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      let updatedActivities = p.activities.map(a => a.name === activityName ? { ...a, status: newStatus } : a);
      if (newStatus === 'done') {
           const dependentName = Object.keys(ACTIVITY_DEPENDENCIES).find(key => ACTIVITY_DEPENDENCIES[key] === activityName);
           if (dependentName) {
               updatedActivities = updatedActivities.map(a => a.name === dependentName ? { ...a, notification: "¡Habilitado! El proceso anterior ha finalizado." } : a);
           }
      }
      const updated = { ...p, activities: updatedActivities };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleAddAttachment = (projectId, file) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const newAttachment = { id: Date.now(), name: file.name, date: new Date().toLocaleDateString(), size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, type: file.type };
      const updated = { ...p, attachments: [...(p.attachments || []), newAttachment] };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleDeleteAttachment = (projectId, attachmentId) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = { ...p, attachments: p.attachments.filter(a => a.id !== attachmentId) };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleUpdateActivityFichas = (projectId, activityName, newFichas) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = { ...p, activities: p.activities.map(a => a.name === activityName ? { ...a, fichas: newFichas } : a) };
      setProjects(prev => prev.map(x => x.id === projectId ? updated : x));
      saveProjectToDB(updated);
      if(activeProject?.id === projectId) setActiveProject(updated);
  };

  const handleSaveQuoteOrProject = (q) => { 
      if(q.status === 'Aceptada') {
          const newActivities = q.selectedServices.map(s => {
              const defaultFichas = [{ id: `tasks-new-${Date.now()}`, title: "Tareas", type: "general", checklist: [], notes: "", completed: false, attachments: [] }];
              if (s === "Estudio de suelos") {
                  return {
                      name: s, assigneeId: null, days: 0, status: "Pending", price: parseFloat(q.servicePrices[s] || 0), paid: 0, fichas: defaultFichas,
                      phases: { campo: { assigneeId: null, days: 0 }, informe: { assigneeId: null, days: 0 } }
                  };
              }
              return { name: s, assigneeId: null, days: null, status: "Pending", price: parseFloat(q.servicePrices[s] || 0), paid: 0, fichas: defaultFichas };
          });
          
          const newProjectReal = {
            id: `PR-${Date.now().toString().slice(-6)}`,
            name: `Proyecto ${q.clientName}`, client: q.clientName, type: q.selectedServices.join(' + '), activities: newActivities,
            startDate: q.startDate || getLocalDateString(), totalValue: q.total, status: "En Ejecución", attachments: [],
            tracking: { checklist: TRACKING_CHECKLIST_DEFAULTS.map((text, idx) => ({ id: idx, text, done: false })), others: { checked: false, description: '' }, deliveryStatus: null, radicadoNumber: '' }
          };

          // --- ACTUALIZACIÓN LOCAL ---
          setProjects(prev => [newProjectReal, ...prev]);
          setQuotes(prev => {
              const idx = prev.findIndex(x => x.id === q.id);
              const updatedQ = {...q, status: 'Aceptada'};
              return idx >= 0 ? prev.map(x => x.id === q.id ? updatedQ : x) : [updatedQ, ...prev];
          });
          
          // --- NUBE ---
          saveProjectToDB(newProjectReal);
          saveQuoteToDB({...q, status: 'Aceptada'}); 

          if(currentView==='project_new') setCurrentView('projects_list'); else setCurrentView('quotes_list');
      } else {
          // --- ACTUALIZACIÓN LOCAL ---
          setQuotes(prev => {
              const idx = prev.findIndex(x => x.id === q.id);
              return idx >= 0 ? prev.map(x => x.id === q.id ? q : x) : [q, ...prev];
          });
          // --- NUBE ---
          saveQuoteToDB(q);
          setCurrentView('quotes_list');
      }
  };
  
  const handleDeleteQuote = (id) => { 
      setQuotes(prev => prev.filter(q => q.id !== id)); // Local
      deleteQuoteFromDB(id); // Nube
  };
  
  const handleUpdatePayment = (pid, aname, amt, date) => {
      const p = projects.find(x => x.id === pid);
      if(!p) return;
      const updated = { ...p, activities: p.activities.map(a => a.name === aname ? { ...a, paid: (a.paid||0)+amt, paymentHistory: [...(a.paymentHistory||[]), {date, amount: amt}] } : a) };
      
      setProjects(prev => prev.map(x => x.id === pid ? updated : x)); // Local
      saveProjectToDB(updated); // Nube
      
      if(activeProject && activeProject.id === pid) setActiveProject(updated);
  };

  // Pantalla de carga mientras conecta a la base de datos
  if (!isDbLoaded) {
      return (
          <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-500 font-bold animate-pulse">Conectando a la nube...</p>
          </div>
      );
  }

  if (!currentUser) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-500">LOGO</div>
            <div><h1 className="text-xl font-bold">JAMG <span className="text-blue-600">Ingeniería</span></h1></div>
        </div>
        <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Cloud size={14}/> Sincronizado</span>
            <span className="text-slate-500 font-bold hidden md:inline-block">Hola, {currentUser.name}</span>
            <button onClick={() => setCurrentUser(null)} className="text-slate-400 hover:text-red-600" title="Cerrar sesión"><LogOut size={20}/></button>
        </div>
      </nav>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1">
        {currentView === 'home' && <HomeView onNavigate={setCurrentView} userRole={currentUser} />}
        
        {currentView === 'projects_list' && (
            <ProjectsList 
                projects={projects} 
                onNewProject={()=>{setEditingQuote(null); setCurrentView('project_new')}} 
                onOpenProject={(p)=>{setActiveProject(p); setCurrentView('project_activities')}} 
                onBack={() => setCurrentView('home')} 
                userRole={currentUser} 
            />
        )}
        
        {currentView === 'project_activities' && (
            <ProjectActivitiesView 
                project={activeProject} 
                onOpenActivity={(a)=>{setActiveActivity(a); setCurrentView('activity_taskboard')}} 
                onBack={() => setCurrentView('projects_list')} 
                staffList={staffList} 
                onAssignActivity={handleAssignActivity} 
                onToggleActivityStatus={handleToggleActivityStatus}
                onAddAttachment={handleAddAttachment}
                onDeleteAttachment={handleDeleteAttachment}
                onUpdateProjectTracking={handleUpdateProjectTracking}
                onDismissNotification={handleDismissNotification}
                onUpdatePhase={handleUpdatePhase}
            />
        )}
        
        {currentView === 'activity_taskboard' && (
            <TaskBoard 
                activityName={activeActivity} 
                project={activeProject} 
                onBack={() => setCurrentView('project_activities')} 
                onUpdateFichas={handleUpdateActivityFichas}
                onSetActivityStatus={handleSetActivityStatus}
            />
        )}
        
        {currentView === 'finance_list' && <FinanceProjectList projects={projects} onOpenProject={(p)=>{setActiveProject(p); setCurrentView('finance_detail')}} onBack={() => setCurrentView('home')} />}
        {currentView === 'finance_detail' && <FinanceDetailView project={activeProject} onBack={() => setCurrentView('finance_list')} onUpdatePayment={handleUpdatePayment} />}
        {currentView === 'team_list' && <TeamDirectory onBack={() => setCurrentView('home')} onNew={()=>{setEditingStaff(null); setCurrentView('team_new')}} onEdit={(s)=>{setEditingStaff(s); setCurrentView('team_new')}} staffList={staffList} canEdit={true} />}
        {currentView === 'team_new' && <CollaboratorForm onBack={() => setCurrentView('team_list')} onSave={(s)=>{ setStaffList(prev => prev.find(x=>x.id===s.id) ? prev.map(x=>x.id===s.id?s:x) : [...prev, s]); saveStaffToDB(s); setCurrentView('team_list'); }} initialData={editingStaff} />}
        
        {currentView === 'project_new' && <QuoteGenerator onBack={() => setCurrentView('projects_list')} onSave={handleSaveQuoteOrProject} userRole={currentUser} initialData={null} nextId={`PR-${Date.now().toString().slice(-6)}`} isDirectProject={true} />}
        
        {currentView === 'quotes_list' && <QuotesList onNewQuote={()=>{setEditingQuote(null); setCurrentView('quote_new')}} quotes={quotes} onEdit={(q)=>{setEditingQuote(q); setCurrentView('quote_new')}} onAccept={(q)=>{ const updated = {...q, status:'Aceptada'}; saveQuoteToDB(updated); handleSaveQuoteOrProject(updated);}} onReject={(q)=>{saveQuoteToDB({...q, status:'Rechazada'})}} onDelete={handleDeleteQuote} userRole={currentUser} onBack={() => setCurrentView('home')} />}
        
        {currentView === 'quote_new' && <QuoteGenerator onBack={() => setCurrentView('quotes_list')} onSave={handleSaveQuoteOrProject} userRole={currentUser} initialData={editingQuote} nextId={`CT-${Date.now().toString().slice(-6)}`} />}
      </div>
    </div>
  );
}