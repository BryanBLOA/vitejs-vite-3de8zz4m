import { useState, useRef, useMemo } from "react";

// ─── Permisos ─────────────────────────────────────────────────────────────────
const BASE_PERMS = {
  "Administrador":       ["dashboard","patients","appointments","calendar","shifts","beds","icu","surgery","assign_surgery","lab","pharmacy","inventory","suppliers","payments","reports","staff","roles","meds_dose","returns","alerts","clinics","consultations","prescriptions","maintenance"],
  "Médico":              ["dashboard","patients","appointments","calendar","lab","consultations","prescriptions"],
  "Médico+Cirugía":      ["dashboard","patients","appointments","calendar","surgery","assign_surgery","lab","consultations","prescriptions"],
  "Enfermera/o":         ["dashboard","patients","beds","meds_dose"],
  "Secretaria/o":        ["dashboard","patients","appointments","payments"],
  "Técnico Laboratorio": ["dashboard","lab"],
  "Farmacéutico":        ["dashboard","pharmacy","inventory","returns","alerts","prescriptions"],
  "Recepcionista":       ["dashboard","patients","appointments","payments"],
};
const ALL_EXTRA_PERMS = [
  { id:"assign_surgery",  label:"Asignar Cirugías",   icon:"🔬", desc:"Programar salas de operaciones" },
  { id:"returns",         label:"Devoluciones",        icon:"↩️",  desc:"Registrar devoluciones/canjes" },
  { id:"alerts",          label:"Ver Alertas",         icon:"🔔", desc:"Panel de alertas de vencimiento y stock" },
  { id:"payments",        label:"Registrar Pagos",     icon:"💳", desc:"Cobros a pacientes" },
  { id:"reports",         label:"Ver Reportes",        icon:"📊", desc:"Acceso al módulo de reportes" },
  { id:"staff",           label:"Gestionar Personal",  icon:"🩺", desc:"Editar fichas del personal" },
  { id:"consultations",   label:"Consultas",           icon:"🩻", desc:"Registrar consultas médicas" },
  { id:"prescriptions",   label:"Recetas",             icon:"📋", desc:"Emitir y ver recetas" },
  { id:"clinics",         label:"Clínicas",            icon:"🏥", desc:"Gestionar clínicas y especialidades" },
];
const MODULES = [
  { id:"dashboard",      label:"Dashboard",        icon:"🏠" },
  { id:"alerts",         label:"Alertas",          icon:"🔔" },
  { id:"patients",       label:"Pacientes",        icon:"👤" },
  { id:"consultations",  label:"Consultas",        icon:"🩻" },
  { id:"prescriptions",  label:"Recetas",          icon:"📋" },
  { id:"appointments",   label:"Citas",            icon:"📅" },
  { id:"calendar",       label:"Calendario",       icon:"🗓"  },
  { id:"shifts",         label:"Turnos",           icon:"🔄" },
  { id:"clinics",        label:"Clínicas",         icon:"🏥" },
  { id:"beds",           label:"Encamamiento",     icon:"🛏" },
  { id:"icu",            label:"UCI",              icon:"💊" },
  { id:"surgery",        label:"Salas de Op.",     icon:"🔬" },
  { id:"lab",            label:"Laboratorios",     icon:"🧪" },
  { id:"pharmacy",       label:"Farmacia",         icon:"💉" },
  { id:"inventory",      label:"Inventario",       icon:"📦" },
  { id:"returns",        label:"Devoluciones",     icon:"↩️"  },
  { id:"suppliers",      label:"Proveedores",      icon:"🏭" },
  { id:"payments",       label:"Pagos",            icon:"💳" },
  { id:"reports",        label:"Reportes",         icon:"📊" },
  { id:"staff",          label:"Personal",         icon:"🩺" },
  { id:"roles",          label:"Roles / Usuarios", icon:"🔐" },
  { id:"meds_dose",      label:"Medicación/Dosis", icon:"🩹" },
  { id:"maintenance",    label:"Mantenimiento",    icon:"⚙️" },
];
const EMPLOYEE_CATEGORIES = ["Médico","Técnico de Laboratorio","Enfermera/o","Farmacéutico","Camillero","Recepcionista","Administrador","Limpieza","Radiólogo","Nutricionista","Secretaria/o"];
const SHIFT_NAMES = ["Mañana (07:00–15:00)","Tarde (15:00–23:00)","Noche (23:00–07:00)","Completo (07:00–19:00)","Especial"];

// ─── Datos semilla ─────────────────────────────────────────────────────────────
const TODAY = "2026-06-03";
const INITIAL_DATA = {
  patients: [
    { id:"P001", name:"María López",    dpi:"2233445566778", age:45, blood:"A+",  status:"Hospitalizado", ward:"General",  bedId:"H101", doctor:"Dr. Roberto Méndez",  phone:"5512-0001", photo:null },
    { id:"P002", name:"Carlos Ruiz",    dpi:"3344556677889", age:32, blood:"O-",  status:"Ambulatorio",   ward:"—",        bedId:null,   doctor:"Dra. Ana Torres",      phone:"5522-0002", photo:null },
    { id:"P003", name:"Ana Morales",    dpi:"4455667788990", age:67, blood:"B+",  status:"UCI",           ward:"UCI",      bedId:"U001", doctor:"Dr. Luis Cifuentes",   phone:"5533-0003", photo:null },
    { id:"P004", name:"Pedro Castillo", dpi:"5566778899001", age:28, blood:"AB+", status:"Urgencias",     ward:"Urgencias",bedId:null,   doctor:"Dra. Ana Torres",      phone:"5544-0004", photo:null },
    { id:"P005", name:"Luisa Herrera",  dpi:"6677889900112", age:54, blood:"A-",  status:"Alta",          ward:"—",        bedId:null,   doctor:"Dr. Roberto Méndez",   phone:"5555-0005", photo:null },
  ],
  staff: [
    { id:"E001", name:"Dr. Roberto Méndez",  dpi:"1122334455667", category:"Médico",        specialty:"Medicina Interna",  colegiado:"12345", shifts:["Mañana (07:00–15:00)"], clinics:["CL001","CL002"], dept:"Medicina",    salary:12500, status:"Activo",   userEmail:"rmenendez@hospital.gt", photo:null },
    { id:"E002", name:"Dra. Ana Torres",     dpi:"2233445566778", category:"Médico",        specialty:"Urgencias",          colegiado:"22891", shifts:["Tarde (15:00–23:00)"],  clinics:["CL001"],         dept:"Urgencias",   salary:13000, status:"Activo",   userEmail:"atorres@hospital.gt",   photo:null },
    { id:"E003", name:"Dr. Luis Cifuentes",  dpi:"3344556677889", category:"Médico",        specialty:"Cuidados Críticos",  colegiado:"33104", shifts:["Noche (23:00–07:00)"],  clinics:["CL003"],         dept:"UCI",         salary:14000, status:"Activo",   userEmail:"lcifuentes@hospital.gt",photo:null },
    { id:"E004", name:"Dra. Carmen Vásquez", dpi:"4455667788990", category:"Médico",        specialty:"Cirugía General",    colegiado:"41782", shifts:["Mañana (07:00–15:00)"], clinics:["CL004"],         dept:"Cirugía",     salary:15000, status:"Inactivo", userEmail:"",                      photo:null },
    { id:"E005", name:"Julio Ramírez",       dpi:"5566778899001", category:"Técnico de Laboratorio", specialty:"Hematología",colegiado:"",     shifts:["Mañana (07:00–15:00)"], clinics:[],                dept:"Laboratorio", salary:5800,  status:"Activo",   userEmail:"jramirez@hospital.gt",  photo:null },
    { id:"E006", name:"Sara Pérez",          dpi:"6677889900112", category:"Enfermera/o",   specialty:"Cuidados Generales", colegiado:"",     shifts:["Tarde (15:00–23:00)"],  clinics:[],                dept:"General",     salary:4500,  status:"Activo",   userEmail:"sperez@hospital.gt",    photo:null },
    { id:"E007", name:"Mario Godínez",       dpi:"7788990011223", category:"Farmacéutico",  specialty:"Farmacología",       colegiado:"",     shifts:["Mañana (07:00–15:00)"], clinics:[],                dept:"Farmacia",    salary:6200,  status:"Activo",   userEmail:"mgodinez@hospital.gt",  photo:null },
    { id:"E008", name:"Lucía Barrera",       dpi:"8899001122334", category:"Secretaria/o",  specialty:"Administración",     colegiado:"",     shifts:["Mañana (07:00–15:00)"], clinics:[],                dept:"Dirección",   salary:4200,  status:"Activo",   userEmail:"lbarrera@hospital.gt",  photo:null },
  ],
  clinics: [
    { id:"CL001", name:"Clínica General",        specialty:"Medicina Interna",  room:"Consultorio 1", schedule:"Lun-Vie 08:00-17:00", status:"Activa"   },
    { id:"CL002", name:"Clínica de Urgencias",   specialty:"Urgencias",          room:"Urgencias",     schedule:"24/7",               status:"Activa"   },
    { id:"CL003", name:"Clínica UCI",            specialty:"Cuidados Críticos",  room:"UCI",           schedule:"24/7",               status:"Activa"   },
    { id:"CL004", name:"Clínica Quirúrgica",     specialty:"Cirugía General",    room:"Consultorio 4", schedule:"Lun-Vie 07:00-15:00", status:"Activa"   },
    { id:"CL005", name:"Clínica Pediátrica",     specialty:"Pediatría",          room:"Consultorio 5", schedule:"Lun-Vie 08:00-16:00", status:"Inactiva" },
  ],
  specialties: ["Medicina Interna","Urgencias","Cuidados Críticos","Cirugía General","Pediatría","Cardiología","Neurología","Oncología","Ortopedia","Dermatología","Ginecología","Nefrología","Psiquiatría","Radiología","Nutrición"],
  consultations: [
    { id:"CON001", patientId:"P001", patient:"María López",    doctorId:"E001", doctor:"Dr. Roberto Méndez", date:"2026-06-03", time:"08:00", clinicId:"CL001", clinic:"Clínica General",      motivo:"Control hipertensión", diagnostico:"Hipertensión arterial controlada", tratamiento:"Continuar medicación actual", peso:"68kg", presion:"130/85", temp:"36.5°C", notas:"Próxima cita en 30 días", prescriptionId:"RX001", status:"Completada" },
    { id:"CON002", patientId:"P002", patient:"Carlos Ruiz",    doctorId:"E002", doctor:"Dra. Ana Torres",    date:"2026-06-03", time:"09:30", clinicId:"CL001", clinic:"Clínica General",      motivo:"Glucosa elevada",       diagnostico:"Diabetes tipo 2 incipiente",     tratamiento:"Dieta y control glucémico",  peso:"82kg", presion:"125/80", temp:"36.8°C", notas:"Solicitar hemoglobina glicosilada", prescriptionId:null, status:"Completada" },
    { id:"CON003", patientId:"P004", patient:"Pedro Castillo", doctorId:"E002", doctor:"Dra. Ana Torres",    date:"2026-06-04", time:"11:00", clinicId:"CL002", clinic:"Clínica de Urgencias", motivo:"Dolor abdominal agudo", diagnostico:"Apendicitis aguda",              tratamiento:"Cirugía de urgencia",         peso:"75kg", presion:"120/78", temp:"38.2°C", notas:"Referir a cirugía",                  prescriptionId:"RX002", status:"Completada" },
  ],
  prescriptions: [
    { id:"RX001", consultationId:"CON001", patientId:"P001", patient:"María López",    doctorId:"E001", doctor:"Dr. Roberto Méndez", date:"2026-06-03", items:[
      { drug:"Enalapril 10mg",     drugId:"",    source:"interna", dose:"1 tableta",  route:"Oral", freq:"Cada 12h", days:30, qty:60,  notes:"Con agua, en ayunas" },
      { drug:"Aspirina 100mg",     drugId:"",    source:"interna", dose:"1 tableta",  route:"Oral", freq:"Cada 24h", days:30, qty:30,  notes:"Después de comer" },
    ], dx:"Hipertensión arterial", status:"Emitida", dispensada:true },
    { id:"RX002", consultationId:"CON003", patientId:"P004", patient:"Pedro Castillo", doctorId:"E002", doctor:"Dra. Ana Torres",    date:"2026-06-04", items:[
      { drug:"Metronidazol 500mg", drugId:"",    source:"interna", dose:"1 tableta",  route:"Oral", freq:"Cada 8h",  days:7,  qty:21,  notes:"Terminar el tratamiento" },
      { drug:"Ketorolaco 10mg",    drugId:"",    source:"externa", dose:"1 tableta",  route:"Oral", freq:"Cada 6h",  days:3,  qty:12,  notes:"Solo si hay dolor intenso — comprar en farmacia externa" },
    ], dx:"Apendicitis aguda post-op", status:"Emitida", dispensada:false },
  ],
  appointments: [
    { id:"C001", patient:"María López",    patientId:"P001", doctorId:"E001", doctor:"Dr. Roberto Méndez", date:"2026-06-03", time:"08:00", status:"Confirmada", type:"Seguimiento",  surgeryRoom:null, clinicId:"CL001" },
    { id:"C002", patient:"Carlos Ruiz",    patientId:"P002", doctorId:"E002", doctor:"Dra. Ana Torres",    date:"2026-06-03", time:"09:30", status:"Pendiente",  type:"Primera vez",  surgeryRoom:null, clinicId:"CL001" },
    { id:"C003", patient:"Pedro Castillo", patientId:"P004", doctorId:"E002", doctor:"Dra. Ana Torres",    date:"2026-06-04", time:"11:00", status:"Confirmada", type:"Urgencia",     surgeryRoom:null, clinicId:"CL002" },
    { id:"C004", patient:"Luisa Herrera",  patientId:"P005", doctorId:"E001", doctor:"Dr. Roberto Méndez", date:"2026-06-05", time:"14:00", status:"Pendiente",  type:"Control",      surgeryRoom:null, clinicId:"CL001" },
    { id:"C005", patient:"Ana Morales",    patientId:"P003", doctorId:"E003", doctor:"Dr. Luis Cifuentes", date:"2026-06-06", time:"10:00", status:"Confirmada", type:"Cirugía",      surgeryRoom:"Sala 2", clinicId:"CL004" },
  ],
  beds: [
    { id:"H101", ward:"General",  patient:"María López", patientId:"P001", status:"Ocupada",  since:"2026-05-30" },
    { id:"H102", ward:"General",  patient:"—",           patientId:null,   status:"Libre",    since:"—" },
    { id:"H103", ward:"General",  patient:"—",           patientId:null,   status:"Limpieza", since:"—" },
    { id:"U001", ward:"UCI",      patient:"Ana Morales", patientId:"P003", status:"Ocupada",  since:"2026-06-01" },
    { id:"U002", ward:"UCI",      patient:"—",           patientId:null,   status:"Libre",    since:"—" },
    { id:"Q001", ward:"Post-Op",  patient:"—",           patientId:null,   status:"Libre",    since:"—" },
  ],
  surgeries: [
    { id:"SQ001", room:"Sala 1", patient:"—",           patientId:null,   surgeonId:"E004", surgeon:"Dra. Carmen Vásquez", status:"Disponible",    scheduled:"—",           scheduledDate:"" },
    { id:"SQ002", room:"Sala 2", patient:"Ana Morales", patientId:"P003", surgeonId:"E003", surgeon:"Dr. Luis Cifuentes",  status:"Programada",    scheduled:"06/06 10:00", scheduledDate:"2026-06-06" },
    { id:"SQ003", room:"Sala 3", patient:"—",           patientId:null,   surgeonId:null,   surgeon:"—",                   status:"Mantenimiento", scheduled:"—",           scheduledDate:"" },
  ],
  lab: [
    { id:"L001", patient:"María López",    patientId:"P001", test:"Hemograma completo",  ordered:"2026-06-02", status:"Completado", result:"Normal",    cost:85  },
    { id:"L002", patient:"Ana Morales",    patientId:"P003", test:"Gasometría arterial", ordered:"2026-06-02", status:"En proceso", result:"—",         cost:220 },
    { id:"L003", patient:"Carlos Ruiz",    patientId:"P002", test:"Glucosa en ayunas",   ordered:"2026-06-01", status:"Completado", result:"126 mg/dL", cost:65  },
    { id:"L004", patient:"Pedro Castillo", patientId:"P004", test:"PCR Covid",           ordered:"2026-06-02", status:"Pendiente",  result:"—",         cost:150 },
  ],
  pharmacy: [
    { id:"F001", drug:"Amoxicilina 500mg", stock:240, unit:"cáps", reorder:50,  price:1.20,  supplier:"Farmacéutica GT", expiry:"2027-03-15", minStock:80  },
    { id:"F002", drug:"Paracetamol 1g IV", stock:18,  unit:"amp",  reorder:30,  price:8.50,  supplier:"MedSupply",       expiry:"2026-08-01", minStock:50  },
    { id:"F003", drug:"Omeprazol 40mg",    stock:120, unit:"cáps", reorder:40,  price:2.80,  supplier:"Farmacéutica GT", expiry:"2026-07-20", minStock:60  },
    { id:"F004", drug:"Metformina 850mg",  stock:0,   unit:"comp", reorder:60,  price:0.95,  supplier:"Genéricos SA",    expiry:"2026-06-10", minStock:100 },
    { id:"F005", drug:"Insulina Glargina", stock:45,  unit:"mL",   reorder:30,  price:185.0, supplier:"MedSupply",       expiry:"2026-06-25", minStock:60  },
    { id:"F006", drug:"Ceftriaxona 1g",    stock:8,   unit:"vial", reorder:20,  price:32.0,  supplier:"MedSupply",       expiry:"2026-06-15", minStock:30  },
    { id:"F007", drug:"Enalapril 10mg",    stock:180, unit:"comp", reorder:60,  price:0.65,  supplier:"Farmacéutica GT", expiry:"2027-01-10", minStock:80  },
    { id:"F008", drug:"Metronidazol 500mg",stock:90,  unit:"comp", reorder:40,  price:1.10,  supplier:"Genéricos SA",    expiry:"2026-11-20", minStock:60  },
  ],
  inventory: [
    { id:"I001", item:"Guantes nitrilo (M)", qty:500, unit:"pares",   reorder:200, category:"EPP",        cost:0.85,  supplier:"InsumosMed",      expiry:null,         minStock:300 },
    { id:"I002", item:"Mascarillas N95",     qty:80,  unit:"unid",    reorder:100, category:"EPP",        cost:12.50, supplier:"InsumosMed",      expiry:null,         minStock:150 },
    { id:"I003", item:"Jeringas 5mL",        qty:600, unit:"unid",    reorder:200, category:"Insumo",     cost:1.20,  supplier:"MedSupply",       expiry:null,         minStock:300 },
    { id:"I004", item:"Suero Fis. 500mL",    qty:35,  unit:"bolsas",  reorder:50,  category:"Soluciones", cost:18.0,  supplier:"Farmacéutica GT", expiry:"2026-09-01", minStock:80  },
    { id:"I005", item:"Oxímetro de pulso",   qty:12,  unit:"equipo",  reorder:5,   category:"Equipo",     cost:450.0, supplier:"EquiposMéd GT",   expiry:null,         minStock:8   },
    { id:"I006", item:"Gasas estériles 10x", qty:90,  unit:"paquetes",reorder:100, category:"Insumo",     cost:4.50,  supplier:"InsumosMed",      expiry:"2026-06-30", minStock:150 },
  ],
  dosages: [
    { id:"D001", patientId:"P001", patient:"María López", bedId:"H101", drugId:"F001", drug:"Amoxicilina 500mg", dose:"500mg", route:"Oral", freq:"Cada 8h", prescribedBy:"Dr. Roberto Méndez", nurseId:"E006", nurse:"Sara Pérez", date:"2026-06-02", time:"08:00", status:"Administrada" },
    { id:"D002", patientId:"P003", patient:"Ana Morales", bedId:"U001", drugId:"F002", drug:"Paracetamol 1g IV", dose:"1g",    route:"IV",   freq:"Cada 6h", prescribedBy:"Dr. Luis Cifuentes",  nurseId:"E006", nurse:"Sara Pérez", date:"2026-06-02", time:"09:00", status:"Pendiente"    },
  ],
  returns: [
    { id:"RET001", drugId:"F004", drug:"Metformina 850mg", qty:60, unit:"comp", reason:"Vencido",          expiry:"2026-06-10", supplier:"Genéricos SA", status:"Aprobada",  date:"2026-06-01", approvedBy:"Mario Godínez", credit:57.0  },
    { id:"RET002", drugId:"F006", drug:"Ceftriaxona 1g",   qty:10, unit:"vial", reason:"Próximo a vencer", expiry:"2026-06-15", supplier:"MedSupply",    status:"Pendiente", date:"2026-06-02", approvedBy:"",              credit:320.0 },
  ],
  suppliers: [
    { id:"S001", name:"Farmacéutica GT",   nit:"987654-3", contact:"Jorge Sosa",    phone:"2234-5678", email:"ventas@farmgt.com",     category:"Medicamentos",  credit:30, status:"Activo",   lastOrder:"2026-05-28", balance:4250.00 },
    { id:"S002", name:"MedSupply",         nit:"456789-1", contact:"Linda Flores",  phone:"5512-3344", email:"lflores@medsupply.com", category:"Medicamentos",  credit:45, status:"Activo",   lastOrder:"2026-06-01", balance:1800.50 },
    { id:"S003", name:"InsumosMed",        nit:"321654-7", contact:"Carlos Barrera",phone:"2255-6677", email:"cbarrera@insumos.com",  category:"Insumos/EPP",   credit:30, status:"Activo",   lastOrder:"2026-05-20", balance:950.00  },
    { id:"S004", name:"EquiposMéd GT",     nit:"741852-9", contact:"Patricia Ajú",  phone:"4401-2233", email:"ventas@equiposgt.com",  category:"Equipos",       credit:60, status:"Activo",   lastOrder:"2026-04-15", balance:12300.0 },
    { id:"S005", name:"Genéricos SA",      nit:"258963-2", contact:"Raúl Monzón",   phone:"2288-9900", email:"rmonzon@genericos.com", category:"Medicamentos",  credit:15, status:"Inactivo", lastOrder:"2026-03-10", balance:0       },
    { id:"S006", name:"Oxígeno Industrial",nit:"369147-5", contact:"Pedro Salazar", phone:"5598-7766", email:"psalazar@oxigeno.com",  category:"Gases Médicos", credit:30, status:"Activo",   lastOrder:"2026-06-02", balance:3100.00 },
  ],
  payments: [
    { id:"PAG001", patientId:"P001", patient:"María López",    date:"2026-06-01", amount:850.00,  method:"Efectivo",     authCode:"",          concept:"Hospitalización + exámenes", status:"Pagado",    secretary:"Lucía Barrera" },
    { id:"PAG002", patientId:"P002", patient:"Carlos Ruiz",    date:"2026-06-02", amount:250.00,  method:"Transferencia",authCode:"TRF-447821", concept:"Consulta + laboratorio",     status:"Pagado",    secretary:"Lucía Barrera" },
    { id:"PAG003", patientId:"P004", patient:"Pedro Castillo", date:"2026-06-02", amount:1200.00, method:"Transferencia",authCode:"TRF-553309", concept:"Urgencias + cirugía",        status:"Pendiente", secretary:"Lucía Barrera" },
  ],
  roles: [
    { id:"R001", name:"Administrador General", user:"admin@hospital.gt",     role:"Administrador",       dept:"Dirección",    active:true,  staffId:"",    extraPerms:[], photo:null },
    { id:"R002", name:"Dr. Roberto Méndez",    user:"rmenendez@hospital.gt", role:"Médico",              dept:"Medicina Int", active:true,  staffId:"E001",extraPerms:["assign_surgery","reports","consultations","prescriptions"], photo:null },
    { id:"R003", name:"Dra. Ana Torres",       user:"atorres@hospital.gt",   role:"Médico",              dept:"Urgencias",    active:true,  staffId:"E002",extraPerms:["consultations","prescriptions"], photo:null },
    { id:"R004", name:"Sara Pérez",            user:"sperez@hospital.gt",    role:"Enfermera/o",         dept:"General",      active:true,  staffId:"E006",extraPerms:[], photo:null },
    { id:"R005", name:"Julio Ramírez",         user:"jramirez@hospital.gt",  role:"Técnico Laboratorio", dept:"Laboratorio",  active:true,  staffId:"E005",extraPerms:[], photo:null },
    { id:"R006", name:"Lucía Barrera",         user:"lbarrera@hospital.gt",  role:"Secretaria/o",        dept:"Dirección",    active:true,  staffId:"E008",extraPerms:[], photo:null },
    { id:"R007", name:"Dr. Luis Cifuentes",    user:"lcifuentes@hospital.gt",role:"Médico",              dept:"UCI",          active:true,  staffId:"E003",extraPerms:["assign_surgery","consultations","prescriptions"], photo:null },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Qtz = n=>`Q ${Number(n||0).toLocaleString("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const daysBetween=(a,b)=>Math.ceil((new Date(a)-new Date(b))/(1000*60*60*24));
const daysUntilExpiry=expiry=>expiry?daysBetween(expiry,TODAY):null;
const expiryLevel=expiry=>{if(!expiry)return null;const d=daysUntilExpiry(expiry);if(d<=0)return"vencido";if(d<=15)return"critico";if(d<=60)return"pronto";return"ok";};
const expiryBg=level=>({vencido:"bg-red-50 border-red-300",critico:"bg-orange-50 border-orange-300",pronto:"bg-amber-50 border-amber-200",ok:""})[level]||"";

const Badge=({val,map})=>{const c=map?.[val]||"bg-slate-100 text-slate-700";return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${c}`}>{val}</span>;};
const statusBed ={"Ocupada":"bg-red-100 text-red-700","Libre":"bg-emerald-100 text-emerald-700","Limpieza":"bg-amber-100 text-amber-700","Mantenimiento":"bg-slate-100 text-slate-600"};
const statusLab ={"Completado":"bg-emerald-100 text-emerald-700","En proceso":"bg-blue-100 text-blue-700","Pendiente":"bg-amber-100 text-amber-700"};
const statusPhar={"OK":"bg-emerald-100 text-emerald-700","Bajo":"bg-amber-100 text-amber-700","Agotado":"bg-red-100 text-red-700"};
const statusCita={"Confirmada":"bg-emerald-100 text-emerald-700","Pendiente":"bg-amber-100 text-amber-700","Cancelada":"bg-red-100 text-red-700"};
const statusPat ={"Hospitalizado":"bg-blue-100 text-blue-700","Ambulatorio":"bg-slate-100 text-slate-600","UCI":"bg-red-100 text-red-700","Alta":"bg-emerald-100 text-emerald-700","Urgencias":"bg-orange-100 text-orange-700"};
const statusSurg={"Disponible":"bg-emerald-100 text-emerald-700","En curso":"bg-red-100 text-red-700","Mantenimiento":"bg-slate-100 text-slate-600","Programada":"bg-blue-100 text-blue-700"};
const statusGen ={"Activo":"bg-emerald-100 text-emerald-700","Inactivo":"bg-slate-100 text-slate-500","Activa":"bg-emerald-100 text-emerald-700","Inactiva":"bg-slate-100 text-slate-500"};
const statusPago={"Pagado":"bg-emerald-100 text-emerald-700","Pendiente":"bg-amber-100 text-amber-700","Anulado":"bg-red-100 text-red-700"};
const statusRet ={"Aprobada":"bg-emerald-100 text-emerald-700","Pendiente":"bg-amber-100 text-amber-700","Rechazada":"bg-red-100 text-red-700"};
const statusRx  ={"Emitida":"bg-blue-100 text-blue-700","Dispensada":"bg-emerald-100 text-emerald-700","Cancelada":"bg-red-100 text-red-700"};
const statusCon ={"Completada":"bg-emerald-100 text-emerald-700","En curso":"bg-blue-100 text-blue-700","Pendiente":"bg-amber-100 text-amber-700"};
const catColors ={"Médico":"bg-blue-600 text-white","Técnico de Laboratorio":"bg-emerald-600 text-white","Enfermera/o":"bg-cyan-600 text-white","Farmacéutico":"bg-amber-500 text-white","Camillero":"bg-orange-500 text-white","Recepcionista":"bg-pink-500 text-white","Administrador":"bg-violet-600 text-white","Limpieza":"bg-slate-400 text-white","Radiólogo":"bg-indigo-600 text-white","Nutricionista":"bg-teal-600 text-white","Secretaria/o":"bg-rose-500 text-white"};

const Card=({title,value,sub,color,alert})=>(
  <div className={`bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-md border-l-4 ${alert?"border-l-red-500 ring-2 ring-red-200 animate-pulse":"border-l-blue-600"} ${color}`}>
    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-semibold leading-tight">{title}</span>
    <span className={`text-2xl sm:text-3xl font-extrabold ${alert?"text-red-600":"text-slate-800"}`}>{value}</span>
    {sub&&<span className="text-[10px] sm:text-xs text-slate-400">{sub}</span>}
  </div>
);
const Table=({cols,rows,renderRow})=>(
  <div className="rounded-2xl shadow-md border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{minWidth:"600px"}}>
        <thead><tr className="bg-[#0f2a56] text-left">{cols.map(c=><th key={c} className="px-3 py-3 text-xs uppercase tracking-wider text-blue-200 font-bold whitespace-nowrap">{c}</th>)}</tr></thead>
        <tbody className="bg-white divide-y divide-slate-100">{rows.map((r,i)=><tr key={i} className="hover:bg-blue-50 transition-colors">{renderRow(r)}</tr>)}</tbody>
      </table>
    </div>
  </div>
);
const TD=({children})=><td className="px-3 py-3 text-slate-700 text-xs sm:text-sm">{children}</td>;

function Avatar({photo,name,size="md",gradient="from-blue-600 to-blue-800"}){
  const sz=size==="lg"?"w-20 h-20 text-2xl":size==="sm"?"w-8 h-8 text-xs":"w-12 h-12 text-base";
  const ini=name?.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";
  if(photo)return <img src={photo} alt={name} className={`${sz} rounded-full object-cover shrink-0 border-2 border-white shadow-md`}/>;
  return <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shrink-0 border-2 border-white shadow-md`}>{ini}</div>;
}
function PhotoPicker({value,onChange,label="Foto (opcional)"}){
  const ref=useRef();
  const handle=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);};
  return(
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</label>
      <div className="flex items-center gap-3">
        {value?<img src={value} className="w-14 h-14 rounded-full object-cover border-2 border-blue-400 shadow"/>
              :<div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xl">＋</div>}
        <div className="flex flex-col gap-1">
          <button onClick={()=>ref.current.click()} className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">{value?"Cambiar":"Subir foto"}</button>
          {value&&<button onClick={()=>onChange(null)} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg font-semibold">Quitar</button>}
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle}/>
    </div>
  );
}
function Modal({title,onClose,children,wide=false,extraWide=false}){
  return(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0f2a56]/60 backdrop-blur-sm sm:p-4">
      <div className={`bg-white w-full ${extraWide?"sm:max-w-4xl":wide?"sm:max-w-2xl":"sm:max-w-lg"} rounded-t-3xl sm:rounded-3xl max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col`}>
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-100 bg-[#0f2a56] rounded-t-3xl shrink-0">
          <h3 className="font-bold text-white text-base sm:text-lg">{title}</h3>
          <button onClick={onClose} className="text-blue-200 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full">✕</button>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
function Field({label,children}){return <div className="flex flex-col gap-1"><label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</label>{children}</div>;}
const Input=(p)=><input {...p} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full transition-all"/>;
const Textarea=(p)=><textarea {...p} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full transition-all resize-none"/>;
const Select=({children,...p})=><select {...p} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full transition-all">{children}</select>;
const Btn=({children,onClick,variant="primary",className=""})=>{
  const v=variant==="primary"?"bg-blue-600 hover:bg-blue-700 text-white shadow-md":variant==="danger"?"bg-red-100 hover:bg-red-200 text-red-700 border border-red-200":variant==="success"?"bg-emerald-600 hover:bg-emerald-700 text-white shadow-md":"bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200";
  return <button onClick={onClick} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${v} ${className}`}>{children}</button>;
};

function ExpiryChip({expiry}){
  if(!expiry)return <span className="text-xs text-slate-400">—</span>;
  const d=daysUntilExpiry(expiry);const level=expiryLevel(expiry);
  const labels={vencido:"⛔ VENCIDO",critico:`⚠️ ${d}d`,pronto:`🟡 ${d}d`,ok:`✅ ${d}d`};
  const cls={vencido:"bg-red-100 text-red-700 border border-red-200",critico:"bg-orange-100 text-orange-700 border border-orange-200",pronto:"bg-amber-100 text-amber-700 border border-amber-200",ok:"bg-emerald-100 text-emerald-700 border border-emerald-200"};
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cls[level]}`}>{labels[level]}</span>;
}
function StockChip({qty,minStock}){
  if(qty===0)return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-xs font-bold">⛔ Agotado</span>;
  if(qty<minStock*0.5)return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-xs font-bold">🔴 Crítico</span>;
  if(qty<minStock)return <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold">🟡 Bajo</span>;
  return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-bold">✅ OK</span>;
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({data,setActive}){
  const hospitalized=data.patients.filter(p=>p.status==="Hospitalizado").length;
  const icu=data.patients.filter(p=>p.status==="UCI").length;
  const freeBeds=data.beds.filter(b=>b.status==="Libre").length;
  const todayCitas=data.appointments.filter(a=>a.date===TODAY).length;
  const pendPagos=data.payments.filter(p=>p.status==="Pendiente").reduce((a,p)=>a+Number(p.amount),0);
  const totalAlerts=[...data.pharmacy,...data.inventory].filter(i=>{const el=expiryLevel(i.expiry);return el==="vencido"||el==="critico"||el==="pronto"||(i.stock??i.qty)<i.minStock;}).length;
  const pendReturns=data.returns.filter(r=>r.status==="Pendiente").length;
  return(
    <div className="space-y-6 sm:space-y-8">
      <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-1">Dashboard General</h2><p className="text-slate-500 text-sm">Martes 3 de junio, 2026</p></div>
      {totalAlerts>0&&(
        <button onClick={()=>setActive("alerts")} className="w-full bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center gap-4 hover:bg-red-100 transition-all text-left shadow-md">
          <span className="text-3xl">🔔</span>
          <div><p className="font-extrabold text-red-700">¡{totalAlerts} alertas activas en farmacia/bodega!</p><p className="text-xs text-red-500">Productos vencidos, próximos a vencer o con stock crítico.</p></div>
          <span className="ml-auto text-red-500 text-lg font-bold">→</span>
        </button>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <Card title="Hospitalizados" value={hospitalized}  color="" sub="activos"/>
        <Card title="UCI"            value={icu}           color="" sub="críticos"/>
        <Card title="Camas libres"   value={freeBeds}      color="" sub="disponibles"/>
        <Card title="Citas hoy"      value={todayCitas}    color="" sub="programadas"/>
        <Card title="Cobros pend."   value={Qtz(pendPagos)}color="" sub="pacientes"/>
        <Card title="🔔 Alertas"      value={totalAlerts}   color="" alert={totalAlerts>0} sub="venc./stock"/>
        <Card title="Dev. pendientes" value={pendReturns}  color="" sub="por aprobar"/>
        <Card title="Consultas hoy"  value={data.consultations.filter(c=>c.date===TODAY).length} color="" sub="registradas"/>
        <Card title="Recetas emitidas" value={data.prescriptions.length} color="" sub="total"/>
        <Card title="Clínicas activas" value={data.clinics.filter(c=>c.status==="Activa").length} color="" sub="en operación"/>
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-3">Quirófanos</h3>
        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {data.surgeries.map(s=>(
            <div key={s.id} className={`bg-white rounded-2xl shadow p-4 border-l-4 space-y-2 ${s.status==="En curso"?"border-l-red-500":s.status==="Programada"?"border-l-blue-500":"border-l-emerald-400"}`}>
              <div className="flex justify-between"><span className="font-bold text-slate-800">{s.room}</span><Badge val={s.status} map={statusSurg}/></div>
              <p className="text-xs text-slate-500">👨‍⚕️ {s.surgeon}</p><p className="text-xs text-slate-500">🏥 {s.patient}</p>
              {s.scheduled!=="—"&&<p className="text-xs text-blue-600 font-semibold">🕒 {s.scheduled}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSULTAS
// ══════════════════════════════════════════════════════════════════════════════
function Consultations({data,setData}){
  const [showForm,setShowForm]=useState(false);
  const [selected,setSelected]=useState(null);
  const [showNewPat,setShowNewPat]=useState(false);
  const blank={id:"",patientId:"",patient:"",doctorId:"",doctor:"",date:TODAY,time:"",clinicId:"",clinic:"",motivo:"",diagnostico:"",tratamiento:"",peso:"",presion:"",temp:"",notas:"",prescriptionId:null,status:"En curso"};
  const [form,setForm]=useState(blank);
  const blankPat={id:"",name:"",dpi:"",age:"",blood:"A+",phone:"",status:"Ambulatorio",ward:"—",bedId:null,doctor:"",photo:null};
  const [newPat,setNewPat]=useState(blankPat);

  const doctors=data.staff.filter(e=>e.category==="Médico"&&e.status==="Activo");
  const openNew=()=>{setForm({...blank,id:`CON${String(data.consultations.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=c=>{setForm({...c});setSelected(c.id);setShowForm(true);};

  const saveNewPatient=()=>{
    if(!newPat.name.trim())return;
    const id=`P${String(data.patients.length+1).padStart(3,"0")}`;
    const pat={...newPat,id};
    setData(d=>({...d,patients:[...d.patients,pat]}));
    setForm(f=>({...f,patientId:id,patient:pat.name}));
    setShowNewPat(false);setNewPat(blankPat);
  };

  const save=()=>{
    if(!form.patientId||!form.doctorId)return;
    const doc=doctors.find(d=>d.id===form.doctorId);
    const cl=data.clinics.find(c=>c.id===form.clinicId);
    const entry={...form,doctor:doc?.name||form.doctor,clinic:cl?.name||form.clinic};
    setData(d=>({...d,consultations:selected?d.consultations.map(c=>c.id===selected?entry:c):[...d.consultations,entry]}));
    setShowForm(false);
  };

  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Consultas Médicas</h2><p className="text-slate-500 text-sm">El médico registra la consulta y puede agregar un paciente nuevo</p></div>
        <Btn onClick={openNew}>＋ Nueva consulta</Btn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {["Completada","En curso","Pendiente"].map(s=>(
          <div key={s} className="bg-white rounded-2xl shadow border border-slate-100 p-4 text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{data.consultations.filter(c=>c.status===s).length}</div>
            <div className="text-xs text-slate-500 mt-1 font-semibold">{s}</div>
          </div>
        ))}
      </div>
      <Table
        cols={["ID","Paciente","Doctor","Clínica","Fecha","Hora","Diagnóstico","Receta","Estado",""]}
        rows={data.consultations}
        renderRow={r=>(<>
          <TD><span className="font-mono text-blue-700 font-bold">{r.id}</span></TD>
          <TD><span className="font-semibold text-slate-800">{r.patient}</span></TD>
          <TD>{r.doctor}</TD>
          <TD><span className="text-xs text-slate-500">{r.clinic}</span></TD>
          <TD>{r.date}</TD><TD>{r.time}</TD>
          <TD><span className="text-xs text-slate-700">{r.diagnostico||"—"}</span></TD>
          <TD>{r.prescriptionId?<span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">📋 {r.prescriptionId}</span>:<span className="text-slate-400 text-xs">—</span>}</TD>
          <TD><Badge val={r.status} map={statusCon}/></TD>
          <td className="px-4 py-2"><button onClick={()=>openEdit(r)} className="text-xs text-blue-600 font-semibold hover:underline">Editar</button></td>
        </>)}
      />

      {showForm&&(
        <Modal title={selected?"Editar Consulta":"Nueva Consulta Médica"} onClose={()=>setShowForm(false)} extraWide>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 font-semibold">🩻 Si el paciente no existe, puedes registrarlo directamente desde aquí.</div>

          {/* Paciente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <Field label="Paciente">
              <Select value={form.patientId} onChange={e=>{const p=data.patients.find(x=>x.id===e.target.value);setForm(f=>({...f,patientId:e.target.value,patient:p?.name||""}));}}>
                <option value="">— Seleccionar —</option>
                {data.patients.map(p=><option key={p.id} value={p.id}>{p.name} (DPI: {p.dpi||"—"})</option>)}
              </Select>
            </Field>
            <button onClick={()=>setShowNewPat(true)} className="h-10 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all">＋ Paciente nuevo</button>
          </div>

          {showNewPat&&(
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3">
              <p className="font-bold text-emerald-700 text-sm">🆕 Registrar paciente nuevo</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombre completo"><Input value={newPat.name} onChange={e=>setNewPat(p=>({...p,name:e.target.value}))}/></Field>
                <Field label="DPI"><Input value={newPat.dpi} onChange={e=>setNewPat(p=>({...p,dpi:e.target.value}))} placeholder="13 dígitos"/></Field>
                <Field label="Edad"><Input type="number" value={newPat.age} onChange={e=>setNewPat(p=>({...p,age:e.target.value}))}/></Field>
                <Field label="Teléfono"><Input value={newPat.phone} onChange={e=>setNewPat(p=>({...p,phone:e.target.value}))}/></Field>
                <Field label="Tipo de sangre"><Select value={newPat.blood} onChange={e=>setNewPat(p=>({...p,blood:e.target.value}))}>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b=><option key={b}>{b}</option>)}</Select></Field>
              </div>
              <div className="flex gap-2"><Btn variant="success" onClick={saveNewPatient}>Guardar paciente</Btn><Btn variant="secondary" onClick={()=>setShowNewPat(false)}>Cancelar</Btn></div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Médico">
              <Select value={form.doctorId} onChange={e=>setForm(f=>({...f,doctorId:e.target.value}))}>
                <option value="">— Seleccionar —</option>
                {doctors.map(d=><option key={d.id} value={d.id}>{d.name} (Col.{d.colegiado})</option>)}
              </Select>
            </Field>
            <Field label="Clínica">
              <Select value={form.clinicId} onChange={e=>{const cl=data.clinics.find(c=>c.id===e.target.value);setForm(f=>({...f,clinicId:e.target.value,clinic:cl?.name||""}));}}>
                <option value="">— Seleccionar —</option>
                {data.clinics.filter(c=>c.status==="Activa").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fecha"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
            <Field label="Hora"><Input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📋 Datos clínicos</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Peso"><Input value={form.peso} onChange={e=>setForm(f=>({...f,peso:e.target.value}))} placeholder="ej. 68kg"/></Field>
              <Field label="Presión arterial"><Input value={form.presion} onChange={e=>setForm(f=>({...f,presion:e.target.value}))} placeholder="ej. 120/80"/></Field>
              <Field label="Temperatura"><Input value={form.temp} onChange={e=>setForm(f=>({...f,temp:e.target.value}))} placeholder="ej. 36.5°C"/></Field>
            </div>
            <Field label="Motivo de consulta"><Input value={form.motivo} onChange={e=>setForm(f=>({...f,motivo:e.target.value}))}/></Field>
            <Field label="Diagnóstico"><Textarea rows={2} value={form.diagnostico} onChange={e=>setForm(f=>({...f,diagnostico:e.target.value}))}/></Field>
            <Field label="Tratamiento indicado"><Textarea rows={2} value={form.tratamiento} onChange={e=>setForm(f=>({...f,tratamiento:e.target.value}))}/></Field>
            <Field label="Notas adicionales"><Textarea rows={2} value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))}/></Field>
          </div>
          <Field label="Estado">
            <Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              {["En curso","Completada","Pendiente"].map(s=><option key={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar consulta</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RECETAS
// ══════════════════════════════════════════════════════════════════════════════
function Prescriptions({data,setData}){
  const [showForm,setShowForm]=useState(false);
  const [selected,setSelected]=useState(null);
  const blankItem={drug:"",drugId:"",source:"interna",dose:"",route:"Oral",freq:"Cada 8h",days:"",qty:"",notes:""};
  const blank={id:"",consultationId:"",patientId:"",patient:"",doctorId:"",doctor:"",date:TODAY,items:[{...blankItem}],dx:"",status:"Emitida",dispensada:false};
  const [form,setForm]=useState(blank);

  const doctors=data.staff.filter(e=>e.category==="Médico"&&e.status==="Activo");
  const openNew=()=>{setForm({...blank,id:`RX${String(data.prescriptions.length+1).padStart(3,"0")}`,items:[{...blankItem}]});setSelected(null);setShowForm(true);};
  const openEdit=r=>{setForm({...r,items:r.items.map(i=>({...i}))});setSelected(r.id);setShowForm(true);};

  const addItem=()=>setForm(f=>({...f,items:[...f.items,{...blankItem}]}));
  const removeItem=idx=>setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}));
  const updateItem=(idx,field,val)=>setForm(f=>({...f,items:f.items.map((it,i)=>i===idx?{...it,[field]:val}:it)}));

  const save=()=>{
    if(!form.patientId||!form.doctorId||form.items.length===0)return;
    const doc=doctors.find(d=>d.id===form.doctorId);
    const entry={...form,doctor:doc?.name||form.doctor};
    setData(d=>({...d,prescriptions:selected?d.prescriptions.map(r=>r.id===selected?entry:r):[...d.prescriptions,entry]}));
    setShowForm(false);
  };

  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Recetas Médicas</h2><p className="text-slate-500 text-sm">Medicamentos del inventario o para compra externa</p></div>
        <Btn onClick={openNew}>＋ Nueva receta</Btn>
      </div>

      <div className="space-y-4">
        {data.prescriptions.map(rx=>(
          <div key={rx.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
            <div className="bg-[#0f2a56] px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="font-mono text-blue-200 font-bold">{rx.id}</span>
                <span className="font-bold text-white">{rx.patient}</span>
                <span className="text-blue-300 text-sm">{rx.doctor}</span>
                <span className="text-blue-300 text-xs">{rx.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge val={rx.status} map={statusRx}/>
                {rx.dispensada?<span className="bg-emerald-400 text-white text-xs px-2 py-0.5 rounded-full font-bold">✓ Dispensada</span>:<span className="bg-amber-300 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">Pendiente</span>}
                <button onClick={()=>openEdit(rx)} className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg font-semibold">Editar</button>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-slate-500 font-bold uppercase mb-3">Dx: {rx.dx}</p>
              <div className="space-y-2">
                {rx.items.map((it,i)=>(
                  <div key={i} className={`flex flex-wrap gap-3 items-center p-3 rounded-xl border ${it.source==="externa"?"bg-amber-50 border-amber-200":"bg-slate-50 border-slate-200"}`}>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800">{it.drug}</span>
                      <span className="text-slate-500 text-xs ml-2">{it.dose} · {it.route} · {it.freq} · {it.days} días</span>
                    </div>
                    {it.source==="externa"
                      ?<span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">🏪 Compra externa</span>
                      :<span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">🏥 Farmacia interna</span>
                    }
                    {it.notes&&<span className="text-xs text-slate-400 italic">{it.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {data.prescriptions.length===0&&<div className="text-center py-12 text-slate-400"><div className="text-5xl mb-3">📋</div><p>Sin recetas registradas.</p></div>}
      </div>

      {showForm&&(
        <Modal title={selected?"Editar Receta":"Nueva Receta Médica"} onClose={()=>setShowForm(false)} extraWide>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 font-semibold">📋 Puede incluir medicamentos del inventario (farmacia interna) o externos para que el paciente los compre.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Paciente">
              <Select value={form.patientId} onChange={e=>{const p=data.patients.find(x=>x.id===e.target.value);setForm(f=>({...f,patientId:e.target.value,patient:p?.name||""}));}}>
                <option value="">— Seleccionar —</option>
                {data.patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Médico">
              <Select value={form.doctorId} onChange={e=>setForm(f=>({...f,doctorId:e.target.value}))}>
                <option value="">— Seleccionar —</option>
                {doctors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Diagnóstico (Dx)"><Input value={form.dx} onChange={e=>setForm(f=>({...f,dx:e.target.value}))}/></Field>
            <Field label="Fecha"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Medicamentos recetados</p>
              <button onClick={addItem} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-blue-700">＋ Agregar medicamento</button>
            </div>
            {form.items.map((it,idx)=>(
              <div key={idx} className={`rounded-2xl border p-4 mb-3 ${it.source==="externa"?"bg-amber-50 border-amber-200":"bg-slate-50 border-slate-200"}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-2">
                    <button onClick={()=>updateItem(idx,"source","interna")} className={`text-xs px-3 py-1 rounded-full font-bold border transition-all ${it.source==="interna"?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-500 border-slate-300"}`}>🏥 Farmacia interna</button>
                    <button onClick={()=>updateItem(idx,"source","externa")} className={`text-xs px-3 py-1 rounded-full font-bold border transition-all ${it.source==="externa"?"bg-amber-500 text-white border-amber-500":"bg-white text-slate-500 border-slate-300"}`}>🏪 Compra externa</button>
                  </div>
                  {form.items.length>1&&<button onClick={()=>removeItem(idx)} className="text-red-500 hover:text-red-700 text-lg font-bold leading-none">✕</button>}
                </div>

                {it.source==="interna"?(
                  <Field label="Medicamento del inventario">
                    <Select value={it.drugId} onChange={e=>{const drug=data.pharmacy.find(f=>f.id===e.target.value);updateItem(idx,"drugId",e.target.value);updateItem(idx,"drug",drug?.drug||"");}}>
                      <option value="">— Seleccionar —</option>
                      {data.pharmacy.map(f=><option key={f.id} value={f.id}>{f.drug} (Stock: {f.stock} {f.unit})</option>)}
                    </Select>
                  </Field>
                ):(
                  <Field label="Nombre del medicamento (externo)">
                    <Input value={it.drug} onChange={e=>updateItem(idx,"drug",e.target.value)} placeholder="ej. Ciprofloxacino 500mg"/>
                  </Field>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <Field label="Dosis"><Input value={it.dose} onChange={e=>updateItem(idx,"dose",e.target.value)} placeholder="ej. 1 tableta"/></Field>
                  <Field label="Vía"><Select value={it.route} onChange={e=>updateItem(idx,"route",e.target.value)}>{["Oral","IV","IM","SC","Tópico","Sublingual","Inhalado"].map(r=><option key={r}>{r}</option>)}</Select></Field>
                  <Field label="Frecuencia"><Select value={it.freq} onChange={e=>updateItem(idx,"freq",e.target.value)}>{["Cada 4h","Cada 6h","Cada 8h","Cada 12h","Cada 24h","Una vez","Según necesidad"].map(r=><option key={r}>{r}</option>)}</Select></Field>
                  <Field label="Días"><Input type="number" value={it.days} onChange={e=>updateItem(idx,"days",e.target.value)}/></Field>
                </div>
                <Field label="Indicaciones / notas"><Input value={it.notes} onChange={e=>updateItem(idx,"notes",e.target.value)} placeholder="Indicaciones especiales para el paciente"/></Field>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{["Emitida","Dispensada","Cancelada"].map(s=><option key={s}>{s}</option>)}</Select></Field>
            <Field label="¿Dispensada en farmacia?">
              <div className="flex gap-3 mt-1">
                {[true,false].map(v=><button key={String(v)} onClick={()=>setForm(f=>({...f,dispensada:v}))} className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${form.dispensada===v?"bg-blue-600 text-white border-blue-600":"bg-slate-50 text-slate-600 border-slate-300"}`}>{v?"✓ Sí":"✗ No"}</button>)}
              </div>
            </Field>
          </div>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar receta</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CLÍNICAS
// ══════════════════════════════════════════════════════════════════════════════
function Clinics({data,setData}){
  const [showForm,setShowForm]=useState(false);
  const [selected,setSelected]=useState(null);
  const [showSpecialties,setShowSpecialties]=useState(false);
  const [newSpec,setNewSpec]=useState("");
  const blank={id:"",name:"",specialty:"Medicina Interna",room:"",schedule:"",status:"Activa"};
  const [form,setForm]=useState(blank);

  const openNew=()=>{setForm({...blank,id:`CL${String(data.clinics.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=c=>{setForm({...c});setSelected(c.id);setShowForm(true);};
  const save=()=>{if(!form.name.trim())return;setData(d=>({...d,clinics:selected?d.clinics.map(c=>c.id===selected?form:c):[...d.clinics,form]}));setShowForm(false);};

  const assignedDoctors=(clinicId)=>data.staff.filter(e=>e.category==="Médico"&&(e.clinics||[]).includes(clinicId));

  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Clínicas y Especialidades</h2><p className="text-slate-500 text-sm">Gestiona clínicas, horarios y médicos asignados</p></div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={()=>setShowSpecialties(true)}>⚕️ Editar especialidades</Btn>
          <Btn onClick={openNew}>＋ Nueva clínica</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data.clinics.map(cl=>{
          const docs=assignedDoctors(cl.id);
          return(
            <div key={cl.id} className={`bg-white rounded-2xl shadow-md border-l-4 ${cl.status==="Activa"?"border-l-blue-600":"border-l-slate-300"} overflow-hidden`}>
              <div className="px-5 pt-4 pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-extrabold text-slate-800">{cl.name}</p>
                    <p className="text-xs text-blue-600 font-semibold">{cl.specialty}</p>
                  </div>
                  <Badge val={cl.status} map={statusGen}/>
                </div>
                <p className="text-xs text-slate-500">🚪 {cl.room}</p>
                <p className="text-xs text-slate-500">🕒 {cl.schedule}</p>
              </div>
              {docs.length>0&&(
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Médicos asignados</p>
                  <div className="flex flex-wrap gap-1">
                    {docs.map(d=><span key={d.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{d.name}</span>)}
                  </div>
                </div>
              )}
              <div className="px-5 pb-4">
                <button onClick={()=>openEdit(cl)} className="text-xs text-blue-600 font-bold hover:underline mt-2">Editar clínica</button>
              </div>
            </div>
          );
        })}
      </div>

      {showSpecialties&&(
        <Modal title="Gestionar Especialidades" onClose={()=>setShowSpecialties(false)}>
          <div className="flex flex-wrap gap-2">
            {data.specialties.map((s,i)=>(
              <div key={i} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                <span className="text-sm text-blue-700 font-semibold">{s}</span>
                <button onClick={()=>setData(d=>({...d,specialties:d.specialties.filter((_,j)=>j!==i)}))} className="text-red-400 hover:text-red-600 text-xs font-bold ml-1">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Input value={newSpec} onChange={e=>setNewSpec(e.target.value)} placeholder="Nueva especialidad…"/>
            <Btn onClick={()=>{if(newSpec.trim()&&!data.specialties.includes(newSpec)){setData(d=>({...d,specialties:[...d.specialties,newSpec]}));setNewSpec("");}}} >Agregar</Btn>
          </div>
        </Modal>
      )}

      {showForm&&(
        <Modal title={selected?"Editar Clínica":"Nueva Clínica"} onClose={()=>setShowForm(false)}>
          <Field label="Nombre de la clínica"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
          <Field label="Especialidad">
            <Select value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))}>
              {data.specialties.map(s=><option key={s}>{s}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Consultorio / Sala"><Input value={form.room} onChange={e=>setForm(f=>({...f,room:e.target.value}))}/></Field>
            <Field label="Horario"><Input value={form.schedule} onChange={e=>setForm(f=>({...f,schedule:e.target.value}))} placeholder="ej. Lun-Vie 08:00-17:00"/></Field>
          </div>
          <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Activa</option><option>Inactiva</option></Select></Field>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TURNOS — editables, multi-turno por empleado
// ══════════════════════════════════════════════════════════════════════════════
function Shifts({data,setData}){
  const [showShiftEditor,setShowShiftEditor]=useState(false);
  const [editingStaff,setEditingStaff]=useState(null);
  const [tempShifts,setTempShifts]=useState([]);
  const [showShiftNames,setShowShiftNames]=useState(false);
  const [newShiftName,setNewShiftName]=useState("");
  const [shiftNames,setShiftNames]=useState(SHIFT_NAMES);

  const openShiftEdit=(e)=>{setEditingStaff(e);setTempShifts(e.shifts||[]);setShowShiftEditor(true);};
  const saveShifts=()=>{setData(d=>({...d,staff:d.staff.map(e=>e.id===editingStaff.id?{...e,shifts:tempShifts}:e)}));setShowShiftEditor(false);};
  const toggleShift=(s)=>setTempShifts(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]);

  // Agrupar personal por turno
  const byShift={};
  shiftNames.forEach(sn=>{byShift[sn]=data.staff.filter(e=>e.status==="Activo"&&(e.shifts||[]).includes(sn));});

  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Turnos del Personal</h2><p className="text-slate-500 text-sm">Cada empleado puede tener uno o más turnos asignados</p></div>
        <Btn variant="secondary" onClick={()=>setShowShiftNames(true)}>⚙️ Gestionar turnos</Btn>
      </div>

      {/* Lista editable de personal con turnos */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="bg-[#0f2a56] px-6 py-3"><p className="font-bold text-blue-200 text-sm uppercase tracking-wider">Personal y sus turnos asignados</p></div>
        <div className="divide-y divide-slate-100">
          {data.staff.filter(e=>e.status==="Activo").map(e=>(
            <div key={e.id} className="px-5 py-3 flex items-center gap-4 hover:bg-blue-50 transition-colors">
              <Avatar photo={e.photo} name={e.name} size="sm"/>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">{e.name}</p>
                <p className="text-xs text-slate-500">{e.category}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(e.shifts||[]).length===0
                  ?<span className="text-xs text-slate-400 italic">Sin turno asignado</span>
                  :(e.shifts||[]).map(s=><span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{s.split(" (")[0]}</span>)
                }
              </div>
              <button onClick={()=>openShiftEdit(e)} className="text-xs bg-blue-600 text-white px-2 sm:px-3 py-1.5 rounded-full font-bold hover:bg-blue-700 shrink-0 whitespace-nowrap">Editar turnos</button>
            </div>
          ))}
        </div>
      </div>

      {/* Vista por turno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {shiftNames.filter(sn=>byShift[sn]?.length>0).map(sn=>(
          <div key={sn} className="bg-white rounded-2xl shadow-md border border-slate-200">
            <div className="bg-[#0f2a56] px-5 py-3 rounded-t-2xl">
              <p className="font-bold text-white text-sm">{sn.split(" (")[0]}</p>
              {sn.includes("(")&&<p className="text-xs text-blue-300 font-mono">{sn.match(/\(([^)]+)\)/)?.[1]}</p>}
            </div>
            <div className="p-4 space-y-2">
              {byShift[sn].map(e=>(
                <div key={e.id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <Avatar photo={e.photo} name={e.name} size="sm"/>
                  <div>
                    <p className="text-sm text-slate-800 font-semibold">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.category}{e.colegiado?` · Col.${e.colegiado}`:""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal editar turnos de un empleado */}
      {showShiftEditor&&editingStaff&&(
        <Modal title={`Turnos — ${editingStaff.name}`} onClose={()=>setShowShiftEditor(false)}>
          <p className="text-xs text-slate-500">Selecciona uno o más turnos. Puedes asignar varios si el empleado trabaja en distintos horarios.</p>
          <div className="grid grid-cols-1 gap-2">
            {shiftNames.map(s=>(
              <button key={s} onClick={()=>toggleShift(s)}
                className={`p-3 rounded-xl border text-sm font-semibold text-left flex items-center gap-3 transition-all ${tempShifts.includes(s)?"bg-blue-600 text-white border-blue-600":"bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"}`}>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${tempShifts.includes(s)?"bg-white border-white":"border-slate-300"}`}>
                  {tempShifts.includes(s)&&<span className="w-2.5 h-2.5 rounded-full bg-blue-600 block"/>}
                </span>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-2"><Btn onClick={saveShifts}>Guardar turnos</Btn><Btn variant="secondary" onClick={()=>setShowShiftEditor(false)}>Cancelar</Btn></div>
        </Modal>
      )}

      {/* Modal gestionar nombres de turno */}
      {showShiftNames&&(
        <Modal title="Gestionar Tipos de Turno" onClose={()=>setShowShiftNames(false)}>
          <div className="space-y-2">
            {shiftNames.map((s,i)=>(
              <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="flex-1 text-sm text-slate-700 font-semibold">{s}</span>
                <button onClick={()=>setShiftNames(prev=>prev.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Input value={newShiftName} onChange={e=>setNewShiftName(e.target.value)} placeholder="ej. Guardia 12h (07:00–19:00)"/>
            <Btn onClick={()=>{if(newShiftName.trim()){setShiftNames(prev=>[...prev,newShiftName]);setNewShiftName("");}}} >Agregar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PERSONAL — DPI, multi-turno, multi-clínica
// ══════════════════════════════════════════════════════════════════════════════
function Staff({data,setData}){
  const [filterCat,setFilterCat]=useState("Todos");
  const [showForm,setShowForm]=useState(false);
  const [selected,setSelected]=useState(null);
  const [showDetail,setShowDetail]=useState(null);
  const blank={id:"",name:"",dpi:"",category:"Médico",specialty:"",colegiado:"",shifts:[],clinics:[],dept:"",salary:"",status:"Activo",userEmail:"",photo:null};
  const [form,setForm]=useState(blank);
  const [newCat,setNewCat]=useState("");const [addingCat,setAddingCat]=useState(false);
  const cats=["Todos",...new Set(data.staff.map(e=>e.category)),"＋ Nueva categoría"];
  const filtered=filterCat==="Todos"?data.staff:data.staff.filter(e=>e.category===filterCat);

  const openNew=()=>{setForm({...blank,id:`E${String(data.staff.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=e=>{setForm({...e,shifts:e.shifts||[],clinics:e.clinics||[]});setSelected(e.id);setShowForm(true);};
  const save=()=>{if(!form.name.trim())return;setData(d=>({...d,staff:selected?d.staff.map(e=>e.id===selected?form:e):[...d.staff,form]}));setShowForm(false);};
  const toggleArr=(arr,val)=>arr.includes(val)?arr.filter(x=>x!==val):[...arr,val];
  const SHIFT_OPTS=["Mañana (07:00–15:00)","Tarde (15:00–23:00)","Noche (23:00–07:00)","Completo (07:00–19:00)","Especial"];

  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Personal del Hospital</h2><Btn onClick={openNew}>＋ Nuevo empleado</Btn></div>
      <div className="flex flex-wrap gap-2">
        {cats.map(c=>(c==="＋ Nueva categoría"
          ?<button key={c} onClick={()=>setAddingCat(true)} className="px-3 py-1 rounded-full text-xs border border-dashed border-blue-400 text-blue-600 font-bold">{c}</button>
          :<button key={c} onClick={()=>setFilterCat(c)} className={`px-3 py-1 rounded-full text-xs border transition-colors font-bold ${filterCat===c?"border-blue-600 bg-blue-600 text-white":"border-slate-300 text-slate-600 hover:border-blue-400"}`}>{c}</button>
        ))}
      </div>
      {addingCat&&<div className="flex gap-2"><Input value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Nueva categoría"/><Btn onClick={()=>{if(newCat.trim()&&!EMPLOYEE_CATEGORIES.includes(newCat))EMPLOYEE_CATEGORIES.push(newCat);setAddingCat(false);setNewCat("");}}>Agregar</Btn><Btn variant="secondary" onClick={()=>setAddingCat(false)}>Cancelar</Btn></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map(e=>(
          <div key={e.id} className="bg-white rounded-2xl shadow border border-slate-100 p-4 flex gap-4 group hover:shadow-md hover:border-blue-200 transition-all">
            <div className="cursor-pointer" onClick={()=>setShowDetail(e)}><Avatar photo={e.photo} name={e.name}/></div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2"><p className="font-bold text-slate-800 text-sm truncate">{e.name}</p><Badge val={e.status} map={statusGen}/></div>
              <Badge val={e.category} map={catColors}/>
              <p className="text-xs text-slate-500 mt-1">{e.specialty}</p>
              {e.category==="Médico"&&e.colegiado&&<p className="text-xs text-amber-600 font-semibold">Col. {e.colegiado}</p>}
              {e.dpi&&<p className="text-xs text-slate-400 font-mono">DPI: {e.dpi}</p>}
              <div className="flex flex-wrap gap-1 mt-1">{(e.shifts||[]).map(s=><span key={s} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">{s.split(" (")[0]}</span>)}</div>
              <p className="text-xs text-emerald-700 font-bold mt-1">{Qtz(e.salary)}/mes</p>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={()=>openEdit(e)} className="text-xs text-blue-600">✏️</button>
              <button onClick={()=>setShowDetail(e)} className="text-xs text-slate-400">👁</button>
            </div>
          </div>
        ))}
      </div>

      {showDetail&&(
        <Modal title="Ficha del Empleado" onClose={()=>setShowDetail(null)} wide>
          <div className="flex gap-5 items-start">
            <Avatar photo={showDetail.photo} name={showDetail.name} size="lg"/>
            <div className="space-y-1 flex-1">
              <p className="text-xl font-bold text-slate-800">{showDetail.name}</p>
              <Badge val={showDetail.category} map={catColors}/>
              <p className="text-sm text-slate-600">{showDetail.specialty}</p>
              {showDetail.colegiado&&<p className="text-sm text-amber-600 font-bold">Colegiado No. {showDetail.colegiado}</p>}
              <Badge val={showDetail.status} map={statusGen}/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            {[["ID",showDetail.id],["DPI",showDetail.dpi||"—"],["Turno(s)",(showDetail.shifts||[]).map(s=>s.split(" (")[0]).join(", ")||"—"],["Salario",Qtz(showDetail.salary)],["Departamento",showDetail.dept],["Correo",showDetail.userEmail||"—"]].map(([k,v])=>(
              <div key={k}><p className="text-xs text-slate-400 uppercase font-semibold">{k}</p><p className="text-sm text-slate-800 font-medium">{v}</p></div>
            ))}
          </div>
          {(showDetail.clinics||[]).length>0&&(
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Clínicas asignadas</p>
              <div className="flex flex-wrap gap-2">{(showDetail.clinics||[]).map(cid=>{const cl=data.clinics.find(c=>c.id===cid);return cl?<span key={cid} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{cl.name}</span>:null;})}</div>
            </div>
          )}
          <Btn onClick={()=>{setShowDetail(null);openEdit(showDetail);}}>Editar ficha</Btn>
        </Modal>
      )}

      {showForm&&(
        <Modal title={selected?"Editar Empleado":"Nuevo Empleado"} onClose={()=>setShowForm(false)} wide>
          <PhotoPicker value={form.photo} onChange={v=>setForm(f=>({...f,photo:v}))}/>
          <Field label="Nombre completo"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
          <Field label="DPI (Documento Personal de Identificación)"><Input value={form.dpi} onChange={e=>setForm(f=>({...f,dpi:e.target.value}))} placeholder="13 dígitos"/></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Categoría"><Select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{EMPLOYEE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</Select></Field>
            <Field label="Especialidad"><Input value={form.specialty} onChange={e=>setForm(f=>({...f,specialty:e.target.value}))}/></Field>
          </div>
          {form.category==="Médico"&&<Field label="No. Colegiado"><Input value={form.colegiado} onChange={e=>setForm(f=>({...f,colegiado:e.target.value}))} placeholder="Requerido para médicos"/></Field>}

          <Field label="Turnos asignados (puede seleccionar varios)">
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SHIFT_OPTS.map(s=>(
                <button key={s} onClick={()=>setForm(f=>({...f,shifts:toggleArr(f.shifts||[],s)}))}
                  className={`p-2 rounded-xl border text-xs font-semibold text-left transition-all ${(form.shifts||[]).includes(s)?"bg-blue-600 text-white border-blue-600":"bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"}`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>

          {form.category==="Médico"&&(
            <Field label="Clínicas asignadas (puede seleccionar varias)">
              <div className="grid grid-cols-1 gap-1 mt-1">
                {data.clinics.filter(c=>c.status==="Activa").map(c=>(
                  <button key={c.id} onClick={()=>setForm(f=>({...f,clinics:toggleArr(f.clinics||[],c.id)}))}
                    className={`p-2 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${(form.clinics||[]).includes(c.id)?"bg-blue-600 text-white border-blue-600":"bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300"}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${(form.clinics||[]).includes(c.id)?"bg-white border-white":"border-slate-300"}`}>
                      {(form.clinics||[]).includes(c.id)&&<span className="w-2 h-2 rounded-full bg-blue-600 block"/>}
                    </span>
                    {c.name} — <span className="opacity-70">{c.specialty}</span>
                  </button>
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Departamento"><Input value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}/></Field>
            <Field label="Salario (Q)"><Input type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))}/></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Activo</option><option>Inactivo</option></Select></Field>
            <Field label="Correo sistema"><Input type="email" value={form.userEmail} onChange={e=>setForm(f=>({...f,userEmail:e.target.value}))} placeholder="correo@hospital.gt"/></Field>
          </div>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PACIENTES — con DPI
// ══════════════════════════════════════════════════════════════════════════════
function Patients({data,setData}){
  const [search,setSearch]=useState("");const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState(null);
  const blank={id:"",name:"",dpi:"",age:"",blood:"A+",phone:"",status:"Ambulatorio",ward:"—",bedId:null,doctor:"",photo:null};
  const [form,setForm]=useState(blank);
  const filtered=data.patients.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.dpi?.includes(search));
  const openNew=()=>{setForm({...blank,id:`P${String(data.patients.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=p=>{setForm({...p});setSelected(p.id);setShowForm(true);};
  const save=()=>{if(!form.name.trim())return;setData(d=>({...d,patients:selected?d.patients.map(p=>p.id===selected?form:p):[...d.patients,form]}));setShowForm(false);};
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Pacientes</h2>
        <div className="flex gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o DPI…" className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm w-full sm:w-48 md:w-56"/>
          <Btn onClick={openNew}>＋ Nuevo paciente</Btn>
        </div>
      </div>
      <Table cols={["","ID","Nombre","DPI","Edad","Sangre","Estado","Cama","Doctor",""]} rows={filtered}
        renderRow={p=>(<>
          <td className="px-4 py-2"><Avatar photo={p.photo} name={p.name} size="sm"/></td>
          <TD><span className="font-mono text-blue-700 font-bold">{p.id}</span></TD>
          <TD><span className="font-semibold text-slate-800">{p.name}</span></TD>
          <TD><span className="font-mono text-xs text-slate-500">{p.dpi||"—"}</span></TD>
          <TD>{p.age}</TD>
          <TD><span className="font-bold text-red-600">{p.blood}</span></TD>
          <TD><Badge val={p.status} map={statusPat}/></TD>
          <TD><span className="font-mono text-xs text-slate-500">{p.bedId||"—"}</span></TD>
          <TD>{p.doctor}</TD>
          <td className="px-4 py-2"><button onClick={()=>openEdit(p)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button></td>
        </>)}
      />
      {showForm&&(
        <Modal title={selected?"Editar Paciente":"Nuevo Paciente"} onClose={()=>setShowForm(false)} wide>
          <PhotoPicker value={form.photo} onChange={v=>setForm(f=>({...f,photo:v}))}/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre completo"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
            <Field label="DPI"><Input value={form.dpi} onChange={e=>setForm(f=>({...f,dpi:e.target.value}))} placeholder="13 dígitos"/></Field>
            <Field label="Edad"><Input type="number" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))}/></Field>
            <Field label="Teléfono"><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></Field>
            <Field label="Tipo de sangre"><Select value={form.blood} onChange={e=>setForm(f=>({...f,blood:e.target.value}))}>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b=><option key={b}>{b}</option>)}</Select></Field>
            <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{["Ambulatorio","Hospitalizado","Urgencias","UCI","Alta"].map(s=><option key={s}>{s}</option>)}</Select></Field>
          </div>
          <Field label="Médico tratante"><Select value={form.doctor} onChange={e=>setForm(f=>({...f,doctor:e.target.value}))}><option value="">—</option>{data.staff.filter(e=>e.category==="Médico").map(d=><option key={d.id}>{d.name}</option>)}</Select></Field>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROVEEDORES — con NIT
// ══════════════════════════════════════════════════════════════════════════════
function Suppliers({data,setData}){
  const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState(null);
  const blank={id:"",name:"",nit:"",contact:"",phone:"",email:"",category:"Medicamentos",credit:30,status:"Activo",lastOrder:"—",balance:0};
  const [form,setForm]=useState(blank);
  const openNew=()=>{setForm({...blank,id:`S${String(data.suppliers.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=s=>{setForm({...s});setSelected(s.id);setShowForm(true);};
  const save=()=>{if(!form.name.trim())return;setData(d=>({...d,suppliers:selected?d.suppliers.map(s=>s.id===selected?form:s):[...d.suppliers,form]}));setShowForm(false);};
  const catC={"Medicamentos":"bg-blue-100 text-blue-700","Insumos/EPP":"bg-emerald-100 text-emerald-700","Equipos":"bg-violet-100 text-violet-700","Gases Médicos":"bg-cyan-100 text-cyan-700","Otros":"bg-slate-100 text-slate-600"};
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2"><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Proveedores</h2><Btn onClick={openNew}>＋ Nuevo proveedor</Btn></div>
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card title="Total" value={data.suppliers.length} color="" sub="registrados"/>
        <Card title="Activos" value={data.suppliers.filter(s=>s.status==="Activo").length} color="" sub="en operación"/>
        <Card title="C. por pagar" value={Qtz(data.suppliers.reduce((a,s)=>a+Number(s.balance),0))} color="" sub="saldo total"/>
        <Card title="Crédito prom." value={Math.round(data.suppliers.reduce((a,s)=>a+Number(s.credit),0)/data.suppliers.length)+"d"} color="" sub="promedio"/>
      </div>
      <Table cols={["ID","NIT","Nombre","Contacto","Tel.","Categoría","Crédito","Saldo","Estado",""]} rows={data.suppliers}
        renderRow={s=>(<>
          <TD><span className="font-mono text-blue-700 font-bold">{s.id}</span></TD>
          <TD><span className="font-mono text-slate-600 text-xs">{s.nit||"—"}</span></TD>
          <TD><span className="font-semibold text-slate-800">{s.name}</span></TD>
          <TD>{s.contact}</TD><TD><span className="font-mono">{s.phone}</span></TD>
          <TD><Badge val={s.category} map={catC}/></TD>
          <TD>{s.credit}d</TD>
          <TD><span className={s.balance>0?"text-amber-600 font-bold":"text-slate-400"}>{Qtz(s.balance)}</span></TD>
          <TD><Badge val={s.status} map={statusGen}/></TD>
          <td className="px-4 py-2"><button onClick={()=>openEdit(s)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button></td>
        </>)}
      />
      {showForm&&(
        <Modal title={selected?"Editar Proveedor":"Nuevo Proveedor"} onClose={()=>setShowForm(false)}>
          <Field label="Nombre de empresa"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
          <Field label="NIT (Número de Identificación Tributaria)"><Input value={form.nit} onChange={e=>setForm(f=>({...f,nit:e.target.value}))} placeholder="ej. 987654-3"/></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Contacto"><Input value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))}/></Field>
            <Field label="Teléfono"><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></Field>
          </div>
          <Field label="Correo"><Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Categoría"><Select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{["Medicamentos","Insumos/EPP","Equipos","Gases Médicos","Otros"].map(c=><option key={c}>{c}</option>)}</Select></Field>
            <Field label="Días crédito"><Input type="number" value={form.credit} onChange={e=>setForm(f=>({...f,credit:e.target.value}))}/></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Saldo (Q)"><Input type="number" value={form.balance} onChange={e=>setForm(f=>({...f,balance:e.target.value}))}/></Field>
            <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Activo</option><option>Inactivo</option></Select></Field>
          </div>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ── Módulos restantes ─────────────────────────────────────────────────────────
function AlertsPanel({data}){
  const pharmAlerts=data.pharmacy.filter(f=>{const el=expiryLevel(f.expiry);return el==="vencido"||el==="critico"||el==="pronto"||f.stock<f.minStock;});
  const invAlerts=data.inventory.filter(i=>{const el=expiryLevel(i.expiry);return el==="vencido"||el==="critico"||el==="pronto"||i.qty<i.minStock;});
  const pendReturns=data.returns.filter(r=>r.status==="Pendiente");
  return(
    <div className="space-y-6 sm:space-y-8">
      <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-1">🔔 Panel de Alertas</h2><p className="text-slate-500 text-sm">Vencimientos, stock crítico y devoluciones pendientes</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card title="Vencidos" value={[...data.pharmacy,...data.inventory].filter(i=>expiryLevel(i.expiry)==="vencido").length} color="" alert={[...data.pharmacy,...data.inventory].filter(i=>expiryLevel(i.expiry)==="vencido").length>0} sub="farmacia + bodega"/>
        <Card title="Vencen pronto" value={[...data.pharmacy,...data.inventory].filter(i=>["critico","pronto"].includes(expiryLevel(i.expiry))).length} color="" sub="≤60 días"/>
        <Card title="Stock crítico" value={[...data.pharmacy,...data.inventory].filter(i=>(i.stock??i.qty)<i.minStock).length} color="" sub="bajo mínimo"/>
        <Card title="Dev. pendientes" value={pendReturns.length} color="" sub="por aprobar"/>
      </div>
      {pharmAlerts.map(f=>{const el=expiryLevel(f.expiry);const stockOk=f.stock>=f.minStock;return(
        <div key={f.id} className={`bg-white rounded-2xl shadow border-l-4 p-4 flex flex-wrap gap-4 items-center justify-between ${el==="vencido"?"border-l-red-500":el==="critico"?"border-l-orange-500":!stockOk?"border-l-amber-400":"border-l-slate-200"}`}>
          <div><p className="font-bold text-slate-800">{f.drug}</p><p className="text-xs text-slate-500">{f.supplier} · {Qtz(f.price)}/{f.unit}</p></div>
          <div className="flex flex-wrap gap-2 items-center"><StockChip qty={f.stock} minStock={f.minStock}/><span className="text-xs text-slate-500">Stock: {f.stock}/{f.minStock}</span>{f.expiry&&<ExpiryChip expiry={f.expiry}/>}</div>
        </div>
      );})}
      {invAlerts.map(i=>{const el=expiryLevel(i.expiry);const stockOk=i.qty>=i.minStock;return(
        <div key={i.id} className={`bg-white rounded-2xl shadow border-l-4 p-4 flex flex-wrap gap-4 items-center justify-between ${el==="vencido"?"border-l-red-500":el==="critico"?"border-l-orange-500":!stockOk?"border-l-amber-400":"border-l-slate-200"}`}>
          <div><p className="font-bold text-slate-800">{i.item}</p><p className="text-xs text-slate-500">{i.category} · {i.supplier}</p></div>
          <div className="flex flex-wrap gap-2 items-center"><StockChip qty={i.qty} minStock={i.minStock}/><span className="text-xs text-slate-500">{i.qty}/{i.minStock}</span>{i.expiry&&<ExpiryChip expiry={i.expiry}/>}</div>
        </div>
      );})}
      {pharmAlerts.length===0&&invAlerts.length===0&&pendReturns.length===0&&<div className="text-center py-16 text-slate-400"><div className="text-5xl mb-4">✅</div><p className="text-lg font-semibold">Sin alertas activas.</p></div>}
    </div>
  );
}

function Appointments({data,setData,userPerms}){
  const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState(null);
  const blank={id:"",patient:"",patientId:"",doctorId:"",doctor:"",date:"",time:"",status:"Pendiente",type:"Primera vez",surgeryRoom:null,clinicId:""};
  const [form,setForm]=useState(blank);
  const canSurgery=userPerms.includes("assign_surgery");
  const doctors=data.staff.filter(e=>e.category==="Médico"&&e.status==="Activo");
  const openNew=()=>{setForm({...blank,id:`C${String(data.appointments.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=a=>{setForm({...a});setSelected(a.id);setShowForm(true);};
  const save=()=>{
    if(!form.patient.trim()||!form.doctorId)return;
    const doc=doctors.find(d=>d.id===form.doctorId);const entry={...form,doctor:doc?doc.name:""};
    let newSurg=[...data.surgeries];
    if(form.surgeryRoom&&form.type==="Cirugía"){newSurg=newSurg.map(s=>s.room===form.surgeryRoom?{...s,patient:form.patient,patientId:form.patientId,surgeonId:form.doctorId,surgeon:doc?.name||"",status:"Programada",scheduled:`${form.date} ${form.time}`,scheduledDate:form.date}:s);}
    setData(d=>({...d,appointments:selected?d.appointments.map(a=>a.id===selected?entry:a):[...d.appointments,entry],surgeries:newSurg}));
    setShowForm(false);
  };
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2"><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Gestión de Citas</h2><Btn onClick={openNew}>＋ Nueva cita</Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">{["Confirmada","Pendiente","Cancelada"].map(s=><div key={s} className="bg-white rounded-2xl shadow border border-slate-100 p-4 text-center"><div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{data.appointments.filter(a=>a.status===s).length}</div><div className="text-xs text-slate-500 mt-1 font-semibold">{s}</div></div>)}</div>
      <Table cols={["ID","Paciente","Doctor","Clínica","Fecha","Hora","Tipo","Sala","Estado",""]} rows={data.appointments}
        renderRow={r=>(<>
          <TD><span className="font-mono text-blue-700 font-bold">{r.id}</span></TD>
          <TD>{r.patient}</TD><TD>{r.doctor}</TD>
          <TD><span className="text-xs text-slate-500">{r.clinicId?data.clinics.find(c=>c.id===r.clinicId)?.name||"—":"—"}</span></TD>
          <TD>{r.date}</TD><TD>{r.time}</TD><TD>{r.type}</TD>
          <TD>{r.surgeryRoom?<span className="text-blue-700 font-semibold">{r.surgeryRoom}</span>:<span className="text-slate-400">—</span>}</TD>
          <TD><Badge val={r.status} map={statusCita}/></TD>
          <td className="px-4 py-2"><button onClick={()=>openEdit(r)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button></td>
        </>)}
      />
      {showForm&&(
        <Modal title={selected?"Editar Cita":"Nueva Cita"} onClose={()=>setShowForm(false)} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Paciente"><Select value={form.patientId} onChange={e=>{const p=data.patients.find(x=>x.id===e.target.value);setForm(f=>({...f,patientId:e.target.value,patient:p?.name||""}));}}><option value="">—</option>{data.patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <Field label="Tipo"><Select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value,surgeryRoom:e.target.value==="Cirugía"?f.surgeryRoom:null}))}>{["Primera vez","Seguimiento","Control","Urgencia","Cirugía"].map(t=><option key={t}>{t}</option>)}</Select></Field>
          </div>
          <Field label="Médico"><Select value={form.doctorId} onChange={e=>setForm(f=>({...f,doctorId:e.target.value}))}><option value="">—</option>{doctors.map(d=><option key={d.id} value={d.id}>{d.name} (Col.{d.colegiado})</option>)}</Select></Field>
          <Field label="Clínica"><Select value={form.clinicId} onChange={e=>setForm(f=>({...f,clinicId:e.target.value}))}><option value="">—</option>{data.clinics.filter(c=>c.status==="Activa").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fecha"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
            <Field label="Hora"><Input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field>
          </div>
          {form.type==="Cirugía"&&canSurgery&&(
            <Field label="Sala disponible">
              <div className="grid grid-cols-3 gap-2 mt-1">{data.surgeries.map(s=><button key={s.id} disabled={s.status!=="Disponible"} onClick={()=>setForm(f=>({...f,surgeryRoom:f.surgeryRoom===s.room?null:s.room}))} className={`p-3 rounded-xl border text-xs text-left transition-all ${s.status!=="Disponible"?"opacity-40 cursor-not-allowed":form.surgeryRoom===s.room?"border-blue-500 bg-blue-600 text-white":"border-slate-200 bg-slate-50 hover:border-blue-300"}`}><p className="font-bold">{s.room}</p><Badge val={s.status} map={statusSurg}/></button>)}</div>
            </Field>
          )}
          <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{["Pendiente","Confirmada","Cancelada"].map(s=><option key={s}>{s}</option>)}</Select></Field>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function CalendarView({data}){
  const dates=[2,3,4,5,6,7,8];const days=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const apptByDate={};data.appointments.forEach(a=>{const d=a.date.split("-")[2];if(!apptByDate[d])apptByDate[d]=[];apptByDate[d].push(a);});
  const surgByDate={};data.surgeries.filter(s=>s.scheduledDate).forEach(s=>{const d=s.scheduledDate.split("-")[2];if(!surgByDate[d])surgByDate[d]=[];surgByDate[d].push(s);});
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Calendario — Junio 2026</h2>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map(d=><div key={d} className="text-center text-xs font-bold text-slate-500 uppercase py-2">{d}</div>)}
        {[null,null].concat(dates).map((d,i)=>(
          <div key={i} className={`min-h-16 sm:min-h-24 rounded-xl p-2 border-2 ${d===3?"border-blue-500 bg-blue-50":"border-slate-200 bg-white"} shadow-sm`}>
            {d&&<><div className={`text-xs sm:text-sm font-bold mb-1 ${d===3?"text-blue-600":"text-slate-500"}`}>{d}</div>
              {(apptByDate[String(d).padStart(2,"0")]||[]).map((a,ii)=><div key={ii} className="text-xs bg-violet-100 text-violet-700 border border-violet-200 rounded px-1.5 py-0.5 mb-1 truncate font-semibold">{a.time} {a.patient.split(" ")[0]}</div>)}
              {(surgByDate[String(d).padStart(2,"0")]||[]).map((s,ii)=><div key={ii} className="text-xs bg-red-100 text-red-700 border border-red-200 rounded px-1.5 py-0.5 mb-1 truncate font-semibold">🔬 {s.room}</div>)}
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Beds({data,setData}){
  const [showAssign,setShowAssign]=useState(null);const [patSel,setPatSel]=useState("");
  const freePats=data.patients.filter(p=>!p.bedId&&["Hospitalizado","Urgencias"].includes(p.status));
  const assignBed=bedId=>{if(!patSel)return;const pat=data.patients.find(p=>p.id===patSel);setData(d=>({...d,beds:d.beds.map(b=>b.id===bedId?{...b,patient:pat.name,patientId:pat.id,status:"Ocupada",since:TODAY}:b),patients:d.patients.map(p=>p.id===patSel?{...p,bedId,ward:d.beds.find(b=>b.id===bedId)?.ward||p.ward}:p)}));setShowAssign(null);setPatSel("");};
  const releaseBed=bedId=>{const bed=data.beds.find(b=>b.id===bedId);setData(d=>({...d,beds:d.beds.map(b=>b.id===bedId?{...b,patient:"—",patientId:null,status:"Libre",since:"—"}:b),patients:d.patients.map(p=>p.id===bed.patientId?{...p,bedId:null}:p)}));};
  const wards=[...new Set(data.beds.map(b=>b.ward))];
  return(
    <div className="space-y-5 sm:space-y-6">
      <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Encamamiento</h2><p className="text-slate-500 text-sm">🩺 Enfermería asigna y libera camas</p></div>
      {wards.map(w=>(
        <div key={w}><h3 className="text-base font-bold text-slate-500 mb-3 uppercase tracking-wider">Sala {w}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">
            {data.beds.filter(b=>b.ward===w).map(b=>(
              <div key={b.id} className="bg-white rounded-2xl shadow border border-slate-100 p-4 space-y-2">
                <div className="flex justify-between"><span className="font-mono text-blue-700 font-extrabold">{b.id}</span><Badge val={b.status} map={statusBed}/></div>
                <p className="text-sm text-slate-700 font-semibold">{b.patient}</p>
                {b.since!=="—"&&<p className="text-xs text-slate-400">Desde {b.since}</p>}
                <div className="flex gap-1">
                  {b.status==="Libre"&&<button onClick={()=>{setShowAssign(b.id);setPatSel("");}} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold hover:bg-blue-700">Asignar</button>}
                  {b.status==="Ocupada"&&<button onClick={()=>releaseBed(b.id)} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold hover:bg-red-200 border border-red-200">Liberar</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {showAssign&&(
        <Modal title={`Asignar — Cama ${showAssign}`} onClose={()=>setShowAssign(null)}>
          <Field label="Paciente"><Select value={patSel} onChange={e=>setPatSel(e.target.value)}><option value="">—</option>{freePats.map(p=><option key={p.id} value={p.id}>{p.name} ({p.status})</option>)}</Select></Field>
          <div className="flex gap-3"><Btn onClick={()=>assignBed(showAssign)}>Confirmar</Btn><Btn variant="secondary" onClick={()=>setShowAssign(null)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function MedsDose({data,setData}){
  const [showForm,setShowForm]=useState(false);
  const blank={id:"",patientId:"",patient:"",bedId:"",drugId:"",drug:"",dose:"",route:"Oral",freq:"Cada 8h",prescribedBy:"",nurseId:"E006",nurse:"Sara Pérez",date:TODAY,time:"",status:"Pendiente"};
  const [form,setForm]=useState(blank);
  const inpats=data.patients.filter(p=>p.bedId);
  const save=()=>{if(!form.patientId||!form.drugId)return;const drug=data.pharmacy.find(f=>f.id===form.drugId);const entry={...form,id:`D${String(data.dosages.length+1).padStart(3,"0")}`,drug:drug?.drug||form.drug};setData(d=>({...d,dosages:[...d.dosages,entry],pharmacy:d.pharmacy.map(f=>f.id===form.drugId?{...f,stock:Math.max(0,f.stock-1)}:f)}));setShowForm(false);};
  const markDone=id=>setData(d=>({...d,dosages:d.dosages.map(x=>x.id===id?{...x,status:"Administrada"}:x)}));
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Medicación / Dosis</h2><p className="text-slate-500 text-sm">🩺 Enfermería registra dosis según receta</p></div>
        <Btn onClick={()=>{setForm({...blank,id:`D${String(data.dosages.length+1).padStart(3,"0")}`});setShowForm(true);}}>＋ Registrar dosis</Btn>
      </div>
      <div className="space-y-3">
        {data.dosages.map(d=>(
          <div key={d.id} className={`rounded-2xl border-2 p-4 flex gap-4 items-start shadow-sm ${d.status==="Pendiente"?"bg-amber-50 border-amber-300":"bg-white border-slate-200"}`}>
            <div className="flex-1">
              <div className="flex justify-between flex-wrap gap-2"><span className="font-bold text-slate-800">{d.patient}<span className="text-xs text-slate-400 ml-2">Cama {d.bedId}</span></span><Badge val={d.status} map={{"Administrada":"bg-emerald-100 text-emerald-700","Pendiente":"bg-amber-100 text-amber-700"}}/></div>
              <p className="text-sm text-slate-700 mt-1">💊 <strong>{d.drug}</strong> — {d.dose} · {d.route} · {d.freq}</p>
              <p className="text-xs text-slate-400">{d.prescribedBy} · {d.nurse} · {d.date} {d.time}</p>
            </div>
            {d.status==="Pendiente"&&<button onClick={()=>markDone(d.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold hover:bg-emerald-700 shrink-0">✓ Administrada</button>}
          </div>
        ))}
      </div>
      {showForm&&(
        <Modal title="Registrar Dosis" onClose={()=>setShowForm(false)} wide>
          <Field label="Paciente internado"><Select value={form.patientId} onChange={e=>{const p=data.patients.find(x=>x.id===e.target.value);setForm(f=>({...f,patientId:e.target.value,patient:p?.name||"",bedId:p?.bedId||""}));}}><option value="">—</option>{inpats.map(p=><option key={p.id} value={p.id}>{p.name} — Cama {p.bedId}</option>)}</Select></Field>
          <Field label="Medicamento"><Select value={form.drugId} onChange={e=>{const d=data.pharmacy.find(x=>x.id===e.target.value);setForm(f=>({...f,drugId:e.target.value,drug:d?.drug||""}));}}><option value="">—</option>{data.pharmacy.filter(f=>f.stock>0).map(f=><option key={f.id} value={f.id}>{f.drug} (Stock:{f.stock})</option>)}</Select></Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Dosis"><Input value={form.dose} onChange={e=>setForm(f=>({...f,dose:e.target.value}))}/></Field>
            <Field label="Vía"><Select value={form.route} onChange={e=>setForm(f=>({...f,route:e.target.value}))}>{["Oral","IV","IM","SC","Sublingual","Inhalado"].map(r=><option key={r}>{r}</option>)}</Select></Field>
            <Field label="Frecuencia"><Select value={form.freq} onChange={e=>setForm(f=>({...f,freq:e.target.value}))}>{["Cada 4h","Cada 6h","Cada 8h","Cada 12h","Cada 24h","Una vez"].map(r=><option key={r}>{r}</option>)}</Select></Field>
          </div>
          <Field label="Recetado por"><Input value={form.prescribedBy} onChange={e=>setForm(f=>({...f,prescribedBy:e.target.value}))}/></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Fecha"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field><Field label="Hora"><Input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></Field></div>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Registrar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function ICU({data}){
  const icuPts=data.patients.filter(p=>p.status==="UCI");
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">UCI</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {icuPts.map(p=>{
          const hr=Math.floor(80+Math.random()*40),spo2=Math.floor(90+Math.random()*10),bp=`${Math.floor(110+Math.random()*40)}/${Math.floor(60+Math.random()*30)}`,temp=(36+Math.random()*2).toFixed(1);
          const pDoses=data.dosages.filter(d=>d.patientId===p.id&&d.status==="Pendiente");
          return(
            <div key={p.id} className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex gap-4 items-center"><Avatar photo={p.photo} name={p.name}/><div><p className="font-bold text-slate-800 text-lg">{p.name}</p><p className="text-xs text-slate-500">{p.id} · {p.age}a · {p.blood} · Cama {p.bedId}</p></div><Badge val="UCI" map={statusPat}/></div>
              <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3">{[["❤️","FC",hr+" bpm"],["🩸","SpO₂",spo2+"%"],["📊","P.A.",bp],["🌡","Temp",temp+"°C"]].map(([ico,lbl,val])=><div key={lbl} className="bg-white rounded-xl p-3 text-center shadow border border-slate-100"><div className="text-lg">{ico}</div><div className="text-xs text-slate-500 mt-1">{lbl}</div><div className="text-sm font-extrabold text-slate-800">{val}</div></div>)}</div>
              {pDoses.length>0&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-xs text-amber-700 font-bold mb-1">⏰ Dosis pendientes</p>{pDoses.map(d=><p key={d.id} className="text-xs text-slate-600">💊 {d.drug} {d.dose} {d.route} {d.freq}</p>)}</div>}
            </div>
          );
        })}
        {icuPts.length===0&&<p className="text-slate-400 font-medium">Sin pacientes en UCI.</p>}
      </div>
    </div>
  );
}

function Surgery({data}){
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Salas de Operaciones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-3">
        {data.surgeries.map(s=>(
          <div key={s.id} className={`bg-white rounded-2xl shadow-md p-6 border-l-4 space-y-3 ${s.status==="En curso"?"border-l-red-500":s.status==="Programada"?"border-l-blue-500":"border-l-emerald-400"}`}>
            <div className="flex flex-wrap justify-between items-center gap-2"><h3 className="text-xl font-extrabold text-slate-800">{s.room}</h3><Badge val={s.status} map={statusSurg}/></div>
            <div className="space-y-1 text-sm text-slate-600"><p>👨‍⚕️ {s.surgeon}</p><p>🏥 {s.patient}</p>{s.scheduled!=="—"&&<p className="text-blue-600 font-mono font-semibold">🕒 {s.scheduled}</p>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Lab({data}){
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Laboratorios</h2>
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">{["Completado","En proceso","Pendiente"].map(s=><div key={s} className="bg-white rounded-2xl shadow border border-slate-100 p-4 text-center"><div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{data.lab.filter(l=>l.status===s).length}</div><div className="text-xs text-slate-500 mt-1 font-semibold">{s}</div></div>)}</div>
      <Table cols={["ID","Paciente","Examen","Fecha","Estado","Resultado","Costo"]} rows={data.lab}
        renderRow={r=>(<><TD><span className="font-mono text-blue-700 font-bold">{r.id}</span></TD><TD>{r.patient}</TD><TD>{r.test}</TD><TD>{r.ordered}</TD><TD><Badge val={r.status} map={statusLab}/></TD><TD><span className={r.result==="Normal"?"text-emerald-600 font-semibold":r.result==="—"?"text-slate-400":"text-amber-600 font-semibold"}>{r.result}</span></TD><TD><span className="text-emerald-700 font-bold">{Qtz(r.cost)}</span></TD></>)}
      />
    </div>
  );
}

function Pharmacy({data}){
  const alerts=data.pharmacy.filter(f=>["vencido","critico"].includes(expiryLevel(f.expiry))||f.stock<f.minStock*0.5);
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Farmacia</h2>
      {alerts.length>0&&<div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2"><p className="text-sm font-bold text-red-700">⚠️ {alerts.length} alerta{alerts.length>1?"s":""} activa{alerts.length>1?"s":""}</p><div className="flex flex-wrap gap-2">{alerts.map(f=><span key={f.id} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-full font-bold">{f.drug}</span>)}</div></div>}
      <Table cols={["ID","Medicamento","Stock","Mín.","Unidad","Precio","Vencimiento","Estado",""]} rows={data.pharmacy}
        renderRow={f=>(
          <tr key={f.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
            <TD><span className="font-mono text-blue-700 font-bold">{f.id}</span></TD>
            <TD><span className="font-semibold text-slate-800">{f.drug}</span></TD>
            <TD><span className={f.stock===0?"text-red-600 font-bold":f.stock<f.minStock?"text-amber-600 font-semibold":"text-slate-700"}>{f.stock}</span></TD>
            <TD><span className="text-slate-400">{f.minStock}</span></TD>
            <TD>{f.unit}</TD>
            <TD><span className="text-emerald-700 font-bold">{Qtz(f.price)}</span></TD>
            <TD><ExpiryChip expiry={f.expiry}/></TD>
            <TD><StockChip qty={f.stock} minStock={f.minStock}/></TD>
            <TD><span className="text-xs text-slate-400">{f.supplier}</span></TD>
          </tr>
        )}
      />
    </div>
  );
}

function Inventory({data}){
  const alerts=data.inventory.filter(i=>["vencido","critico"].includes(expiryLevel(i.expiry))||i.qty<i.minStock*0.5);
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Inventario y Bodega</h2>
      {alerts.length>0&&<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2"><p className="text-sm font-bold text-amber-700">📦 {alerts.length} alerta{alerts.length>1?"s":""}</p><div className="flex flex-wrap gap-2">{alerts.map(i=><span key={i.id} className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-bold">{i.item}</span>)}</div></div>}
      <Table cols={["ID","Artículo","Qty","Mín.","Unidad","Costo","Vencimiento","Stock","Categoría"]} rows={data.inventory}
        renderRow={i=>(
          <tr key={i.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
            <TD><span className="font-mono text-blue-700 font-bold">{i.id}</span></TD>
            <TD><span className="font-semibold text-slate-800">{i.item}</span></TD>
            <TD><span className={i.qty<i.minStock?"text-amber-600 font-bold":"text-slate-700"}>{i.qty}</span></TD>
            <TD><span className="text-slate-400">{i.minStock}</span></TD>
            <TD>{i.unit}</TD>
            <TD><span className="text-emerald-700 font-bold">{Qtz(i.cost)}</span></TD>
            <TD><ExpiryChip expiry={i.expiry}/></TD>
            <TD><StockChip qty={i.qty} minStock={i.minStock}/></TD>
            <TD>{i.category}</TD>
          </tr>
        )}
      />
    </div>
  );
}

function Returns({data,setData}){
  const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState(null);
  const blank={id:"",drugId:"",drug:"",qty:"",unit:"",reason:"Vencido",expiry:"",supplier:"",status:"Pendiente",date:TODAY,approvedBy:"",credit:""};
  const [form,setForm]=useState(blank);
  const openNew=()=>{setForm({...blank,id:`RET${String(data.returns.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=r=>{setForm({...r});setSelected(r.id);setShowForm(true);};
  const save=()=>{
    if(!form.drugId||!form.qty)return;
    const drug=data.pharmacy.find(f=>f.id===form.drugId);
    const entry={...form,drug:drug?.drug||form.drug,unit:drug?.unit||form.unit,supplier:drug?.supplier||form.supplier};
    let newPharm=[...data.pharmacy];
    if(form.status==="Aprobada"&&selected){const prev=data.returns.find(r=>r.id===selected);if(prev?.status!=="Aprobada")newPharm=newPharm.map(f=>f.id===form.drugId?{...f,stock:f.stock+Number(form.qty)}:f);}
    setData(d=>({...d,returns:selected?d.returns.map(r=>r.id===selected?entry:r):[...d.returns,entry],pharmacy:newPharm}));
    setShowForm(false);
  };
  const totalCredit=data.returns.filter(r=>r.status==="Aprobada").reduce((a,r)=>a+Number(r.credit||0),0);
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"><div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Devoluciones</h2><p className="text-slate-500 text-sm">↩️ Canje por vencimiento con proveedor</p></div><Btn onClick={openNew}>＋ Nueva devolución</Btn></div>
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card title="Total" value={data.returns.length} color="" sub="registradas"/>
        <Card title="Pendientes" value={data.returns.filter(r=>r.status==="Pendiente").length} color="" sub="por aprobar"/>
        <Card title="Aprobadas" value={data.returns.filter(r=>r.status==="Aprobada").length} color="" sub="completadas"/>
        <Card title="Crédito total" value={Qtz(totalCredit)} color="" sub="recuperado"/>
      </div>
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4">
        <p className="text-xs font-bold text-slate-500 uppercase mb-3">Candidatos a devolución por vencimiento</p>
        <div className="flex flex-wrap gap-2">
          {data.pharmacy.filter(f=>["vencido","critico","pronto"].includes(expiryLevel(f.expiry))).map(f=>(
            <button key={f.id} onClick={()=>{setForm({...blank,id:`RET${String(data.returns.length+1).padStart(3,"0")}`,drugId:f.id,drug:f.drug,unit:f.unit,supplier:f.supplier,expiry:f.expiry,reason:expiryLevel(f.expiry)==="vencido"?"Vencido":"Próximo a vencer",credit:(f.price*f.stock).toFixed(2)});setSelected(null);setShowForm(true);}}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:border-blue-400 ${expiryBg(expiryLevel(f.expiry))||"bg-slate-50 border-slate-200"}`}>
              <ExpiryChip expiry={f.expiry}/><span className="font-semibold text-slate-700">{f.drug}</span><span className="text-slate-400">Stock: {f.stock}</span>
            </button>
          ))}
          {data.pharmacy.filter(f=>["vencido","critico","pronto"].includes(expiryLevel(f.expiry))).length===0&&<span className="text-xs text-slate-400">Sin candidatos activos</span>}
        </div>
      </div>
      <Table cols={["ID","Medicamento","Cant.","Razón","Vencimiento","Proveedor","Crédito","Estado",""]} rows={data.returns}
        renderRow={r=>(<>
          <TD><span className="font-mono text-blue-700 font-bold">{r.id}</span></TD>
          <TD><span className="font-semibold text-slate-800">{r.drug}</span></TD>
          <TD>{r.qty} {r.unit}</TD>
          <TD><Badge val={r.reason} map={{"Vencido":"bg-red-100 text-red-700","Próximo a vencer":"bg-orange-100 text-orange-700","Daño físico":"bg-slate-100 text-slate-600"}}/></TD>
          <TD><ExpiryChip expiry={r.expiry}/></TD>
          <TD><span className="text-xs text-slate-500">{r.supplier}</span></TD>
          <TD><span className="text-emerald-700 font-bold">{Qtz(r.credit)}</span></TD>
          <TD><Badge val={r.status} map={statusRet}/></TD>
          <td className="px-4 py-2"><button onClick={()=>openEdit(r)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button></td>
        </>)}
      />
      {showForm&&(
        <Modal title={selected?"Editar Devolución":"Nueva Devolución"} onClose={()=>setShowForm(false)} wide>
          <Field label="Medicamento"><Select value={form.drugId} onChange={e=>{const f=data.pharmacy.find(x=>x.id===e.target.value);setForm(p=>({...p,drugId:e.target.value,drug:f?.drug||"",unit:f?.unit||"",supplier:f?.supplier||"",expiry:f?.expiry||"",credit:((f?.price||0)*(f?.stock||0)).toFixed(2)}));}}><option value="">—</option>{data.pharmacy.map(f=><option key={f.id} value={f.id}>{f.drug} — Stock:{f.stock} {f.expiry?`| Vence:${f.expiry}`:""}</option>)}</Select></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Cantidad"><Input type="number" value={form.qty} onChange={e=>setForm(f=>({...f,qty:e.target.value}))}/></Field>
            <Field label="Razón"><Select value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}>{["Vencido","Próximo a vencer","Daño físico","Error de pedido"].map(r=><option key={r}>{r}</option>)}</Select></Field>
            <Field label="Vencimiento"><Input type="date" value={form.expiry} onChange={e=>setForm(f=>({...f,expiry:e.target.value}))}/></Field>
            <Field label="Crédito (Q)"><Input type="number" step="0.01" value={form.credit} onChange={e=>setForm(f=>({...f,credit:e.target.value}))}/></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{["Pendiente","Aprobada","Rechazada"].map(s=><option key={s}>{s}</option>)}</Select></Field>
            <Field label="Aprobado por"><Input value={form.approvedBy} onChange={e=>setForm(f=>({...f,approvedBy:e.target.value}))}/></Field>
          </div>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function Payments({data,setData}){
  const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState(null);
  const blank={id:"",patientId:"",patient:"",date:TODAY,amount:"",method:"Efectivo",authCode:"",concept:"",status:"Pendiente",secretary:"Lucía Barrera"};
  const [form,setForm]=useState(blank);
  const openNew=()=>{setForm({...blank,id:`PAG${String(data.payments.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=p=>{setForm({...p});setSelected(p.id);setShowForm(true);};
  const save=()=>{if(!form.patientId||!form.amount)return;setData(d=>({...d,payments:selected?d.payments.map(p=>p.id===selected?form:p):[...d.payments,form]}));setShowForm(false);};
  const total=data.payments.reduce((a,p)=>a+Number(p.amount),0);
  const cobrado=data.payments.filter(p=>p.status==="Pagado").reduce((a,p)=>a+Number(p.amount),0);
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2"><div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Pagos de Pacientes</h2><p className="text-slate-500 text-sm">💳 Secretaría registra cobros</p></div><Btn onClick={openNew}>＋ Registrar pago</Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card title="Total facturado" value={Qtz(total)} color=""/>
        <Card title="Cobrado" value={Qtz(cobrado)} color=""/>
        <Card title="Por cobrar" value={Qtz(total-cobrado)} color=""/>
      </div>
      <Table cols={["ID","Paciente","Fecha","Concepto","Método","Autorización","Monto","Estado",""]} rows={data.payments}
        renderRow={r=>(<>
          <TD><span className="font-mono text-blue-700 font-bold">{r.id}</span></TD><TD>{r.patient}</TD><TD>{r.date}</TD>
          <TD><span className="text-xs">{r.concept}</span></TD>
          <TD><span className={`text-xs font-bold ${r.method==="Efectivo"?"text-emerald-700":"text-blue-700"}`}>{r.method==="Efectivo"?"💵":"🏦"} {r.method}</span></TD>
          <TD><span className="font-mono text-xs text-slate-500">{r.authCode||"—"}</span></TD>
          <TD><span className="font-bold text-emerald-700">{Qtz(r.amount)}</span></TD>
          <TD><Badge val={r.status} map={statusPago}/></TD>
          <td className="px-4 py-2"><button onClick={()=>openEdit(r)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button></td>
        </>)}
      />
      {showForm&&(
        <Modal title={selected?"Editar Pago":"Registrar Pago"} onClose={()=>setShowForm(false)} wide>
          <Field label="Paciente"><Select value={form.patientId} onChange={e=>{const p=data.patients.find(x=>x.id===e.target.value);setForm(f=>({...f,patientId:e.target.value,patient:p?.name||""}));}}><option value="">—</option>{data.patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Concepto"><Input value={form.concept} onChange={e=>setForm(f=>({...f,concept:e.target.value}))}/></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Field label="Monto (Q)"><Input type="number" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field><Field label="Fecha"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field></div>
          <Field label="Método"><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{["Efectivo","Transferencia"].map(m=><button key={m} onClick={()=>setForm(f=>({...f,method:m,authCode:m==="Efectivo"?"":f.authCode}))} className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-2 justify-center transition-all ${form.method===m?"border-blue-500 bg-blue-600 text-white":"border-slate-300 bg-slate-50 text-slate-600"}`}>{m==="Efectivo"?"💵 Efectivo":"🏦 Transferencia"}</button>)}</div></Field>
          {form.method==="Transferencia"&&<Field label="No. autorización banco"><Input value={form.authCode} onChange={e=>setForm(f=>({...f,authCode:e.target.value}))} placeholder="TRF-XXXXXX"/></Field>}
          <Field label="Estado"><Select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{["Pendiente","Pagado","Anulado"].map(s=><option key={s}>{s}</option>)}</Select></Field>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function Roles({data,setData}){
  const [showForm,setShowForm]=useState(false);const [selected,setSelected]=useState(null);
  const blank={id:"",name:"",user:"",role:"Médico",dept:"",active:true,staffId:"",extraPerms:[],photo:null};
  const [form,setForm]=useState(blank);
  const roleColors2={"Administrador":"bg-violet-600 text-white","Médico":"bg-blue-600 text-white","Enfermera/o":"bg-cyan-600 text-white","Secretaria/o":"bg-rose-500 text-white","Técnico Laboratorio":"bg-emerald-600 text-white","Farmacéutico":"bg-amber-500 text-white"};
  const togglePerm=pid=>setForm(f=>({...f,extraPerms:f.extraPerms.includes(pid)?f.extraPerms.filter(x=>x!==pid):[...f.extraPerms,pid]}));
  const openNew=()=>{setForm({...blank,id:`R${String(data.roles.length+1).padStart(3,"0")}`});setSelected(null);setShowForm(true);};
  const openEdit=r=>{setForm({...r,extraPerms:r.extraPerms||[]});setSelected(r.id);setShowForm(true);};
  const save=()=>{if(!form.user.trim())return;const emp=data.staff.find(e=>e.id===form.staffId);const entry={...form,name:emp?emp.name:form.name,photo:emp?.photo||form.photo};setData(d=>({...d,roles:selected?d.roles.map(r=>r.id===selected?entry:r):[...d.roles,entry]}));setShowForm(false);};
  return(
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-2"><div><h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Roles y Usuarios</h2><p className="text-slate-500 text-sm">⚙️ El Administrador asigna roles y permisos por usuario</p></div><Btn onClick={openNew}>＋ Nuevo usuario</Btn></div>
      <div className="overflow-x-auto rounded-2xl shadow-md border border-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="bg-[#0f2a56]">{["","ID","Nombre","Correo","Rol","Permisos extra","Estado",""].map(c=><th key={c} className="px-4 py-3 text-xs uppercase tracking-wider text-blue-200 font-bold text-left">{c}</th>)}</tr></thead>
          <tbody className="bg-white divide-y divide-slate-100">{data.roles.map(r=>{
            const emp=data.staff.find(e=>e.id===r.staffId);
            return(<tr key={r.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-2"><Avatar photo={r.photo||emp?.photo} name={r.name||r.user} size="sm"/></td>
              <TD><span className="font-mono text-blue-700 font-bold">{r.id}</span></TD>
              <TD><span className="font-semibold text-slate-800">{r.name}</span></TD>
              <TD><span className="font-mono text-xs text-slate-500">{r.user}</span></TD>
              <TD><Badge val={r.role} map={roleColors2}/></TD>
              <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(r.extraPerms||[]).length===0?<span className="text-xs text-slate-400">—</span>:(r.extraPerms||[]).map(p=>{const pm=ALL_EXTRA_PERMS.find(x=>x.id===p);return pm?<span key={p} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{pm.icon} {pm.label}</span>:null;})}</div></td>
              <TD><Badge val={r.active?"Activo":"Inactivo"} map={statusGen}/></TD>
              <td className="px-4 py-2"><button onClick={()=>openEdit(r)} className="text-xs text-blue-600 font-bold hover:underline">Editar</button></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
      {showForm&&(
        <Modal title={selected?"Editar Usuario":"Nuevo Usuario"} onClose={()=>setShowForm(false)} wide>
          <PhotoPicker value={form.photo} onChange={v=>setForm(f=>({...f,photo:v}))}/>
          <Field label="Vincular a empleado"><Select value={form.staffId} onChange={e=>{const emp=data.staff.find(x=>x.id===e.target.value);setForm(f=>({...f,staffId:e.target.value,name:emp?emp.name:f.name,dept:emp?emp.dept:f.dept}));}}><option value="">—</option>{data.staff.map(e=><option key={e.id} value={e.id}>{e.name} ({e.category})</option>)}</Select></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
            <Field label="Correo"><Input type="email" value={form.user} onChange={e=>setForm(f=>({...f,user:e.target.value}))}/></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Rol"><Select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>{Object.keys(BASE_PERMS).map(r=><option key={r}>{r}</option>)}</Select></Field>
            <Field label="Departamento"><Input value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}/></Field>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Permisos adicionales</p>
            <div className="grid grid-cols-1 gap-2">
              {ALL_EXTRA_PERMS.map(perm=>{
                const active=form.extraPerms.includes(perm.id);const inBase=(BASE_PERMS[form.role]||[]).includes(perm.id);
                return(<button key={perm.id} disabled={inBase} onClick={()=>togglePerm(perm.id)} className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${inBase?"opacity-40 cursor-not-allowed border-slate-200 bg-slate-50":active?"border-blue-500 bg-blue-600 text-white":"border-slate-200 bg-slate-50 hover:border-blue-300"}`}>
                  <span className="text-xl">{perm.icon}</span>
                  <div><p className={`text-sm font-bold ${active&&!inBase?"text-white":"text-slate-700"}`}>{perm.label}{inBase&&<span className="text-slate-400 text-xs ml-1">(incluido)</span>}</p><p className={`text-xs ${active&&!inBase?"text-blue-100":"text-slate-500"}`}>{perm.desc}</p></div>
                  {active&&!inBase&&<span className="ml-auto text-white text-lg">✓</span>}
                </button>);
              })}
            </div>
          </div>
          <Field label="Estado"><Select value={form.active?"Activo":"Inactivo"} onChange={e=>setForm(f=>({...f,active:e.target.value==="Activo"}))}><option>Activo</option><option>Inactivo</option></Select></Field>
          <div className="flex gap-3 pt-2"><Btn onClick={save}>Guardar</Btn><Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancelar</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function Reports({data}){
  const totalSal=data.staff.filter(e=>e.status==="Activo").reduce((a,e)=>a+Number(e.salary),0);
  const totalCobrado=data.payments.filter(p=>p.status==="Pagado").reduce((a,p)=>a+Number(p.amount),0);
  const totalCredits=data.returns.filter(r=>r.status==="Aprobada").reduce((a,r)=>a+Number(r.credit||0),0);
  const stats=[{l:"Pacientes registrados",v:data.patients.length},{l:"Consultas registradas",v:data.consultations.length},{l:"Recetas emitidas",v:data.prescriptions.length},{l:"Laboratorios",v:data.lab.length},{l:"Planilla mensual",v:Qtz(totalSal)},{l:"Ingresos cobrados",v:Qtz(totalCobrado)},{l:"Crédito devoluciones",v:Qtz(totalCredits)},{l:"Clínicas activas",v:data.clinics.filter(c=>c.status==="Activa").length}];
  return(
    <div className="space-y-5 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Reportes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">{stats.map(s=><div key={s.l} className="bg-white rounded-2xl shadow border border-slate-100 p-5"><div className="text-xl sm:text-2xl font-extrabold text-blue-700">{s.v}</div><div className="text-xs text-slate-500 mt-2 font-semibold">{s.l}</div></div>)}</div>
      <div className="bg-white rounded-2xl shadow border border-slate-100 p-5">
        <h3 className="font-bold text-slate-700 mb-4">Ingresos por Semana</h3>
        <div className="flex items-end gap-2 h-32">{[32,28,41,47].map((v,i)=><div key={i} className="flex-1 flex flex-col items-center gap-1"><span className="text-xs text-slate-500 font-semibold">{v}</span><div className="w-full bg-blue-500 rounded-t" style={{height:`${(v/50)*100}%`}}/><span className="text-xs text-slate-400 font-semibold">S{i+1}</span></div>)}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MANTENIMIENTO — configuración del hospital
// ══════════════════════════════════════════════════════════════════════════════
function Maintenance({hospital,setHospital}){
  const [form,setForm]=useState({...hospital});
  const [saved,setSaved]=useState(false);
  const logoRef=useRef();

  const handleLogo=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>setForm(p=>({...p,logo:ev.target.result}));r.readAsDataURL(f);
  };
  const save=()=>{
    setHospital(form);
    localStorage.setItem("hospital_config",JSON.stringify(form));
    setSaved(true);setTimeout(()=>setSaved(false),2500);
  };

  return(
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">Configuración del Hospital</h2>
        <p className="text-slate-500 text-sm mt-1">Solo el Administrador puede modificar esta información.</p>
      </div>

      {saved&&<div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-700 font-bold flex items-center gap-2">✅ Cambios guardados correctamente</div>}

      {/* Logo */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-5 space-y-4">
        <h3 className="font-bold text-slate-700 text-base">Logo del Hospital</h3>
        <div className="flex items-center gap-5">
          {form.logo
            ?<img src={form.logo} alt="logo" className="w-24 h-24 rounded-2xl object-contain border-2 border-slate-200 shadow bg-slate-50"/>
            :<div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-3xl font-black shadow">{form.name?.[0]||"H"}</div>
          }
          <div className="space-y-2">
            <button onClick={()=>logoRef.current.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow transition-colors">{form.logo?"Cambiar logo":"Subir logo"}</button>
            {form.logo&&<button onClick={()=>setForm(p=>({...p,logo:null}))} className="block px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-bold transition-colors">Quitar logo</button>}
            <p className="text-xs text-slate-400">PNG, JPG o SVG recomendado</p>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo}/>
      </div>

      {/* Información */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-5 space-y-4">
        <h3 className="font-bold text-slate-700 text-base">Información del Hospital</h3>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Nombre del hospital</label>
            <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full" placeholder="ej. Hospital General de Guatemala"/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Eslogan</label>
            <input value={form.slogan} onChange={e=>setForm(p=>({...p,slogan:e.target.value}))} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full" placeholder="ej. Tu salud es nuestra misión"/>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Descripción</label>
            <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full resize-none" placeholder="Descripción breve del hospital..."/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Teléfono</label>
              <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 w-full" placeholder="ej. 2234-5678"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Correo</label>
              <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 w-full" placeholder="info@hospital.gt"/>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Dirección</label>
            <input value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 w-full" placeholder="ej. 6a Avenida, Zona 1, Guatemala"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Versión del sistema</label>
              <input value={form.version} onChange={e=>setForm(p=>({...p,version:e.target.value}))} className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 w-full" placeholder="ej. v5.0"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Color primario</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor||"#0f2a56"} onChange={e=>setForm(p=>({...p,primaryColor:e.target.value}))} className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"/>
                <span className="text-sm text-slate-600 font-mono">{form.primaryColor||"#0f2a56"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-5 space-y-3">
        <h3 className="font-bold text-slate-700 text-base">Vista previa del sidebar</h3>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"linear-gradient(135deg,#0a1f44,#0f2a56)"}}>
          {form.logo
            ?<img src={form.logo} className="w-10 h-10 rounded-xl object-contain bg-white p-1"/>
            :<div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black" style={{background:form.primaryColor||"#1d4ed8"}}>{form.name?.[0]||"H"}</div>
          }
          <div>
            <p className="font-extrabold text-white text-sm">{form.name||"HospitalSYS"}</p>
            <p className="text-xs text-blue-300">{form.slogan||"v5.0 — Guatemala"}</p>
          </div>
        </div>
      </div>

      <button onClick={save} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-lg transition-colors">💾 Guardar cambios</button>

      {/* Info sobre dónde se guardan los datos */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">ℹ️ ¿Dónde se guarda la información?</p>
        <p className="text-xs text-slate-500">Los datos se guardan en <strong>localStorage</strong> del navegador. Esto significa que persisten aunque cierres el navegador, pero son locales a este dispositivo/navegador.</p>
        <p className="text-xs text-slate-500">Para una base de datos en la nube (acceso desde múltiples dispositivos), se recomienda integrar <strong>Firebase Firestore</strong> o <strong>Supabase</strong>.</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PANTALLA DE LOGIN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({onLogin,hospital}){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [showPass,setShowPass]=useState(false);

  // Contraseñas por defecto (en producción usar hash)
  const PASSWORDS={
    "admin@hospital.gt":"admin123",
    "rmenendez@hospital.gt":"doctor123",
    "atorres@hospital.gt":"doctor123",
    "lcifuentes@hospital.gt":"doctor123",
    "sperez@hospital.gt":"enfermera123",
    "lbarrera@hospital.gt":"secretaria123",
    "jramirez@hospital.gt":"lab123",
    "mgodinez@hospital.gt":"farmacia123",
  };

  const handleLogin=e=>{
    e.preventDefault();
    const correct=PASSWORDS[email.trim().toLowerCase()];
    if(!correct){setError("Usuario no encontrado");return;}
    if(correct!==password){setError("Contraseña incorrecta");return;}
    setError("");
    onLogin(email.trim().toLowerCase());
  };

  return(
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:"linear-gradient(135deg,#0a1f44 0%,#0f2a56 50%,#0d3272 100%)"}}>
      <div className="w-full max-w-md space-y-6">

        {/* Logo / nombre hospital */}
        <div className="text-center space-y-3">
          {hospital.logo
            ?<img src={hospital.logo} className="w-20 h-20 mx-auto rounded-2xl object-contain bg-white/10 p-2 shadow-xl"/>
            :<div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-xl">{hospital.name?.[0]||"H"}</div>
          }
          <div>
            <h1 className="text-2xl font-extrabold text-white">{hospital.name||"HospitalSYS"}</h1>
            <p className="text-blue-300 text-sm">{hospital.slogan||"Sistema de Gestión Hospitalaria"}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Iniciar sesión</h2>
            <p className="text-slate-500 text-sm">Ingresa con tu cuenta del hospital</p>
          </div>

          {error&&<div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-semibold flex items-center gap-2">⚠️ {error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Correo electrónico</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@hospital.gt" required
                className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Contraseña</label>
              <div className="relative">
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
                  className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full pr-12"/>
                <button type="button" onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg">{showPass?"🙈":"👁"}</button>
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base shadow-md transition-colors">Ingresar</button>
          </form>

          {/* Usuarios de prueba */}
          <details className="group">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 font-semibold select-none">Ver usuarios de prueba ▾</summary>
            <div className="mt-3 space-y-1 bg-slate-50 rounded-xl p-3 border border-slate-200">
              {[
                ["admin@hospital.gt","admin123","Administrador"],
                ["rmenendez@hospital.gt","doctor123","Médico"],
                ["atorres@hospital.gt","doctor123","Médico"],
                ["sperez@hospital.gt","enfermera123","Enfermera"],
                ["lbarrera@hospital.gt","secretaria123","Secretaria"],
                ["jramirez@hospital.gt","lab123","Técnico Lab"],
                ["mgodinez@hospital.gt","farmacia123","Farmacéutico"],
              ].map(([u,p,r])=>(
                <button key={u} onClick={()=>{setEmail(u);setPassword(p);}} className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors">
                  <span className="text-xs font-bold text-blue-700">{r}</span>
                  <span className="text-xs text-slate-500 ml-2">{u}</span>
                </button>
              ))}
            </div>
          </details>
        </div>

        {hospital.address&&<p className="text-center text-blue-300/60 text-xs">{hospital.address}</p>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [active,setActive]=useState("dashboard");
  const [sidebar,setSidebar]=useState(true);

  // ── Persistencia con localStorage ──────────────────────────────────────────
  const [data,setData]=useState(()=>{
    try{const s=localStorage.getItem("hospital_data");return s?JSON.parse(s):INITIAL_DATA;}catch{return INITIAL_DATA;}
  });
  const [hospital,setHospital]=useState(()=>{
    try{const s=localStorage.getItem("hospital_config");return s?JSON.parse(s):{name:"HospitalSYS",slogan:"v5.0 — Guatemala",description:"",logo:null,phone:"",email:"",address:"",version:"v5.0",primaryColor:"#0f2a56"};}
    catch{return{name:"HospitalSYS",slogan:"v5.0 — Guatemala",description:"",logo:null,phone:"",email:"",address:"",version:"v5.0",primaryColor:"#0f2a56"};}
  });

  // Guarda data en localStorage cada vez que cambia
  const setDataPersist=newData=>{
    setData(newData);
    try{localStorage.setItem("hospital_data",JSON.stringify(newData));}catch{}
  };

  // ── Autenticación ───────────────────────────────────────────────────────────
  const [loggedUser,setLoggedUser]=useState(()=>{
    try{return localStorage.getItem("hospital_session")||null;}catch{return null;}
  });

  const handleLogin=email=>{
    setLoggedUser(email);
    try{localStorage.setItem("hospital_session",email);}catch{}
  };
  const handleLogout=()=>{
    setLoggedUser(null);
    try{localStorage.removeItem("hospital_session");}catch{}
  };

  // Si no hay sesión, mostrar login
  if(!loggedUser){
    return <LoginScreen onLogin={handleLogin} hospital={hospital}/>;
  }

  const sessionUser=data.roles.find(r=>r.user===loggedUser)||data.roles[0];
  const userPerms=useMemo(()=>{const base=BASE_PERMS[sessionUser.role]||[];return[...new Set([...base,...(sessionUser.extraPerms||[])])];},[ sessionUser]);
  const alertCount=[...data.pharmacy,...data.inventory].filter(i=>{const el=expiryLevel(i.expiry);return el==="vencido"||el==="critico"||el==="pronto"||(i.stock??i.qty)<i.minStock;}).length+data.returns.filter(r=>r.status==="Pendiente").length;

  const views={
    dashboard:<Dashboard data={data} setActive={setActive}/>,
    alerts:<AlertsPanel data={data}/>,
    patients:<Patients data={data} setData={setDataPersist}/>,
    consultations:<Consultations data={data} setData={setDataPersist}/>,
    prescriptions:<Prescriptions data={data} setData={setDataPersist}/>,
    appointments:<Appointments data={data} setData={setDataPersist} userPerms={userPerms}/>,
    calendar:<CalendarView data={data}/>,
    shifts:<Shifts data={data} setData={setDataPersist}/>,
    clinics:<Clinics data={data} setData={setDataPersist}/>,
    beds:<Beds data={data} setData={setDataPersist}/>,
    icu:<ICU data={data}/>,
    surgery:<Surgery data={data}/>,
    lab:<Lab data={data}/>,
    pharmacy:<Pharmacy data={data}/>,
    inventory:<Inventory data={data}/>,
    returns:<Returns data={data} setData={setDataPersist}/>,
    suppliers:<Suppliers data={data} setData={setDataPersist}/>,
    payments:<Payments data={data} setData={setDataPersist}/>,
    reports:<Reports data={data}/>,
    staff:<Staff data={data} setData={setDataPersist}/>,
    roles:<Roles data={data} setData={setDataPersist}/>,
    meds_dose:<MedsDose data={data} setData={setDataPersist}/>,
    maintenance:<Maintenance hospital={hospital} setHospital={setHospital}/>,
  };

  const roleColors2={"Administrador":"bg-violet-600 text-white","Médico":"bg-blue-600 text-white","Enfermera/o":"bg-cyan-600 text-white","Secretaria/o":"bg-rose-500 text-white","Técnico Laboratorio":"bg-emerald-600 text-white","Farmacéutico":"bg-amber-500 text-white"};
  const accessibleModules=MODULES.filter(m=>userPerms.includes(m.id)||m.id==="dashboard"||m.id==="alerts");
  const bottomModules=accessibleModules.slice(0,5);

  // TWO independent states:
  //  - mobileOpen  → controls the slide-in drawer on mobile (< 768px)
  //  - sidebar     → controls expanded (220px) vs icon-rail (60px) on DESKTOP
  // On desktop the sidebar is ALWAYS in the document flow (position:static) — never hidden.
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = ({onNavClick}) => (
    <>
      {/* Logo */}
      <div className="px-3 py-4 border-b border-white/10 flex items-center justify-between gap-2 overflow-hidden shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-lg">H</div>
          {sidebar && (
            <div className="min-w-0">
              <p className="font-extrabold text-white text-sm leading-tight truncate">{hospital.name||"HospitalSYS"}</p>
              <p className="text-[10px] text-blue-300">{hospital.slogan||"v5.0 — Guatemala"}</p>
            </div>
          )}
        </div>
        {/* ✕ only on mobile drawer */}
        {onNavClick && (
          <button onClick={onNavClick} className="text-blue-300 hover:text-white text-xl font-bold p-1">✕</button>
        )}
      </div>
      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
        {accessibleModules.map(m=>(
          <button key={m.id}
            onClick={()=>{ setActive(m.id); onNavClick?.(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative font-medium
              ${active===m.id?"bg-white text-blue-800 shadow-md font-bold":"text-blue-200 hover:bg-white/10 hover:text-white"}`}>
            <span className="shrink-0 text-base">{m.icon}</span>
            {sidebar && <span className="truncate">{m.label}</span>}
            {!sidebar && active===m.id && <span className="absolute right-1 w-1 h-1 bg-white rounded-full"/>}
            {m.id==="alerts"&&alertCount>0&&(
              <span className={`${sidebar?"ml-auto":"absolute -top-1 -right-1"} min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 shadow`}>
                {alertCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      {/* Collapse toggle — desktop only */}
      {!onNavClick && (
        <div className="p-2 border-t border-white/10 shrink-0">
          <button onClick={()=>setSidebar(s=>!s)}
            className="w-full flex items-center justify-center py-2 rounded-xl hover:bg-white/10 text-blue-300 hover:text-white text-xs font-bold transition-all">
            {sidebar ? "◀" : "▶"}
          </button>
        </div>
      )}
    </>
  );

  const sidebarBg = "linear-gradient(180deg,#0a1f44 0%,#0f2a56 60%,#0d3272 100%)";

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#eef2f7"}}>

      {/* ═══════════════════════════════════════════
          DESKTOP SIDEBAR — static, always in flow,
          never fixed, never hidden, never overlaps main
          ═══════════════════════════════════════════ */}
      <aside
        className="hidden md:flex flex-col shrink-0 shadow-2xl transition-all duration-300 overflow-hidden"
        style={{
          width: sidebar ? "220px" : "60px",
          minWidth: sidebar ? "220px" : "60px",
          background: sidebarBg,
        }}
      >
        <SidebarContent/>
      </aside>

      {/* ═══════════════════════════════════════════
          MOBILE DRAWER — fixed overlay, only < md
          ═══════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={()=>setMobileOpen(false)}/>
          {/* Drawer — force sidebar labels visible */}
          <div className="relative z-10 flex flex-col shadow-2xl overflow-hidden" style={{width:"240px",background:sidebarBg}}>
            {/* Logo */}
            <div className="px-3 py-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {hospital.logo
                  ?<img src={hospital.logo} className="w-8 h-8 rounded-xl object-contain bg-white/10 p-0.5 shrink-0"/>
                  :<div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-lg" style={{background:hospital.primaryColor||"#1d4ed8"}}>{hospital.name?.[0]||"H"}</div>
                }
                <div><p className="font-extrabold text-white text-sm leading-tight">{hospital.name||"HospitalSYS"}</p><p className="text-[10px] text-blue-300">{hospital.slogan||"v5.0"}</p></div>
              </div>
              <button onClick={()=>setMobileOpen(false)} className="text-blue-300 hover:text-white text-xl font-bold p-1">✕</button>
            </div>
            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-1.5">
              {accessibleModules.map(m=>(
                <button key={m.id}
                  onClick={()=>{ setActive(m.id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all relative font-medium
                    ${active===m.id?"bg-white text-blue-800 shadow-md font-bold":"text-blue-200 hover:bg-white/10 hover:text-white"}`}>
                  <span className="text-base shrink-0">{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                  {m.id==="alerts"&&alertCount>0&&(
                    <span className="ml-auto min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 shadow">{alertCount}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          MAIN — always occupies remaining width
          ═══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-5 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* Desktop: toggle collapse/expand */}
            <button onClick={()=>setSidebar(s=>!s)}
              className="hidden md:flex p-2 rounded-xl hover:bg-slate-100 text-slate-500 shrink-0 transition-colors"
              title={sidebar?"Colapsar menú":"Expandir menú"}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            {/* Mobile: open drawer */}
            <button onClick={()=>setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 shrink-0 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <span className="text-sm md:text-base font-extrabold text-slate-800 truncate">
              {MODULES.find(m=>m.id===active)?.label||active}
            </span>
            {alertCount>0&&(
              <button onClick={()=>setActive("alerts")}
                className="hidden sm:flex items-center gap-1 bg-red-100 border border-red-300 text-red-700 text-xs px-2 py-1 rounded-full font-bold hover:bg-red-200 shrink-0">
                🔔 {alertCount}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:block"><Badge val={sessionUser.role} map={roleColors2}/></span>
            <span className="text-xs text-slate-400 hidden xl:block truncate max-w-36">{sessionUser.user}</span>
            <Avatar photo={sessionUser.photo} name={sessionUser.name} size="sm" gradient="from-blue-600 to-blue-800"/>
            <button onClick={handleLogout} title="Cerrar sesión"
              className="p-2 rounded-xl hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5 pb-20 md:pb-5" style={{background:"#eef2f7"}}>
          {views[active]||(
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-4">🔒</div>
              <p className="font-semibold">Sin acceso a este módulo.</p>
            </div>
          )}
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-xl z-20 flex">
          {bottomModules.map(m=>(
            <button key={m.id} onClick={()=>setActive(m.id)}
              className={`flex-1 flex flex-col items-center justify-center pt-2 pb-3 gap-0.5 relative min-w-0
                ${active===m.id?"text-blue-700":"text-slate-400"}`}>
              <span className="text-xl leading-none">{m.icon}</span>
              <span className="text-[9px] font-bold leading-tight truncate w-full text-center px-0.5">{m.label.split("/")[0].split(" ")[0]}</span>
              {m.id==="alerts"&&alertCount>0&&(
                <span className="absolute top-1.5 right-1/4 min-w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold px-0.5 shadow">{alertCount}</span>
              )}
              {active===m.id&&<span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"/>}
            </button>
          ))}
          <button onClick={()=>setMobileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center pt-2 pb-3 gap-0.5 text-slate-400 min-w-0">
            <span className="text-xl leading-none">☰</span>
            <span className="text-[9px] font-bold leading-tight">Más</span>
          </button>
        </nav>

      </main>
    </div>
  );
}
