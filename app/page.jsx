"use client";
import { useState, useMemo, useEffect } from "react";

// ── ADMIN PASSWORD — bunu değiştir ──────────────────────────────────────────
const ADMIN_PASSWORD = "aera2026";
// ────────────────────────────────────────────────────────────────────────────

const COLORS = ["#C17D3C","#5B8A72","#7B5EA7","#3A7CA5","#C45C5C","#4A8F6F","#8B6914","#5C7AB5","#A05C8A","#4A7A8A"];
const getColor = (id) => COLORS[(id - 1) % COLORS.length];
const initials = (name) => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
}
function formatDateShort(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function getDaysBetween(start,end) {
  const days=[]; let cur=new Date(start+"T12:00:00"); const last=new Date(end+"T12:00:00");
  while(cur<=last){days.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
  return days;
}

const DEFAULT_CONF = { name:"AERA 2026", subtitle:"American Educational Research Association Annual Meeting", location:"Philadelphia, PA", startDate:"2026-04-08", endDate:"2026-04-12" };
const DEFAULT_ATTENDEES = [
  { id:1, name:"Betul Yilmaz", affiliation:"University of Arizona", role:"Doctoral Student", email:"betul@arizona.edu", phone:"", website:"", days:["2026-04-08","2026-04-09","2026-04-10"],
    sessions:[
      {id:"s1",day:"2026-04-08",title:"Opening Keynote",time:"09:00",endTime:"10:30",room:"Hall A",building:"Convention Center",floor:"Level 1",description:"Annual opening keynote with featured speakers.",type:"Keynote"},
      {id:"s2",day:"2026-04-09",title:"Paper Presentation: Youth Agency",time:"14:00",endTime:"15:30",room:"Room 204",building:"Marriott Hotel",floor:"2nd Floor",description:"Presenting research on culture-based and arts-integrated pedagogies.",type:"Paper Presentation"},
      {id:"s3",day:"2026-04-10",title:"Closing Panel",time:"16:00",endTime:"17:30",room:"Main Stage",building:"Convention Center",floor:"Level 2",description:"Closing remarks and panel discussion.",type:"Panel"},
    ], notes:"Presenting on culture-based pedagogies" },
  { id:2, name:"Maria Gonzalez", affiliation:"UCLA", role:"Assistant Professor", email:"mgonzalez@ucla.edu", phone:"", website:"", days:["2026-04-08","2026-04-09"],
    sessions:[
      {id:"s4",day:"2026-04-08",title:"Workshop: YPAR Methods",time:"11:00",endTime:"12:30",room:"Workshop B",building:"Convention Center",floor:"Level 1",description:"Hands-on workshop exploring Youth Participatory Action Research.",type:"Workshop"},
      {id:"s5",day:"2026-04-09",title:"Roundtable Discussion",time:"10:00",endTime:"11:00",room:"Room 101",building:"Marriott Hotel",floor:"1st Floor",description:"Small group roundtable on equity in education.",type:"Roundtable"},
    ], notes:"Leading the YPAR workshop on Day 1" },
  { id:3, name:"James Park", affiliation:"Stanford University", role:"Postdoctoral Fellow", email:"jpark@stanford.edu", phone:"", website:"", days:["2026-04-09","2026-04-10"],
    sessions:[
      {id:"s6",day:"2026-04-09",title:"Equity in Education Panel",time:"13:00",endTime:"14:30",room:"Hall B",building:"Convention Center",floor:"Level 1",description:"Panel on systemic equity challenges in K-12 education.",type:"Panel"},
      {id:"s7",day:"2026-04-10",title:"Networking Lunch",time:"12:00",endTime:"13:30",room:"Lobby",building:"Marriott Hotel",floor:"Lobby Level",description:"Informal networking lunch for researchers.",type:"Social"},
    ], notes:"" },
];

const inp = { width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #E8E0D0",background:"#FDFAF5",fontSize:13,color:"#2C2416",outline:"none",boxSizing:"border-box",fontFamily:"inherit" };
const lbl = { fontSize:11,fontWeight:700,letterSpacing:1.5,color:"#9B8E7A",textTransform:"uppercase",display:"block",marginBottom:5 };
const secTitle = { fontSize:11,fontWeight:700,letterSpacing:2,color:"#9B8E7A",textTransform:"uppercase",marginBottom:8 };
const SESSION_TYPES = ["Keynote","Paper Presentation","Panel","Workshop","Roundtable","Symposium","Poster","Social","Other"];

function loadFromStorage(key, fallback) {
  try { const r=localStorage.getItem(key); return r?JSON.parse(r):fallback; } catch { return fallback; }
}
function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Admin login modal ─────────────────────────────────────────────────────────
function AdminLoginModal({ onClose, onSuccess }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const attempt = () => {
    if (pw === ADMIN_PASSWORD) { onSuccess(); onClose(); }
    else { setErr(true); setPw(""); setTimeout(()=>setErr(false),2000); }
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,12,8,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF5",borderRadius:16,maxWidth:360,width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.35)",animation:"slideUp 0.22s ease"}}>
        <div style={{background:"#2C2416",padding:"24px 28px",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>🔒</div>
          <div style={{fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#F8F3EB"}}>Admin Access</div>
          <div style={{fontSize:12,color:"#6B5F4F",marginTop:4}}>Enter password to edit</div>
        </div>
        <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <span style={lbl}>Password</span>
            <input
              style={{...inp, border: err?"1.5px solid #C45C5C":"1.5px solid #E8E0D0", transition:"border 0.2s"}}
              type="password" value={pw}
              onChange={e=>{setPw(e.target.value);setErr(false);}}
              onKeyDown={e=>e.key==="Enter"&&attempt()}
              placeholder="Enter admin password"
              autoFocus
            />
            {err && <div style={{fontSize:12,color:"#C45C5C",marginTop:5}}>Incorrect password, try again.</div>}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:"1.5px solid #E8E0D0",background:"none",color:"#9B8E7A",fontSize:13,cursor:"pointer"}}>Cancel</button>
            <button onClick={attempt} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#2C2416",color:"#F8F3EB",fontSize:13,fontWeight:700,cursor:"pointer"}}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Session detail popup ──────────────────────────────────────────────────────
function SessionDetail({ session, attendee, onClose }) {
  if (!session||!attendee) return null;
  const color = getColor(attendee.id);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,12,8,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1300,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF5",borderRadius:16,maxWidth:490,width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.4)",animation:"slideUp 0.22s ease"}}>
        <div style={{background:`linear-gradient(135deg,${color},${color}bb)`,padding:"24px 28px",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,0.25)",border:"none",color:"#fff",width:30,height:30,borderRadius:"50%",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          {session.type&&<span style={{background:"rgba(255,255,255,0.22)",color:"#fff",padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:700}}>{session.type}</span>}
          <div style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#fff",marginTop:10,lineHeight:1.3}}>{session.title}</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:5}}>{attendee.name} · {attendee.affiliation}</div>
        </div>
        <div style={{padding:"22px 28px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"#F5F0E8",borderRadius:10,padding:"12px 14px"}}>
              <div style={{...secTitle,marginBottom:4}}>📅 Date</div>
              <div style={{fontSize:13,fontWeight:600,color:"#2C2416"}}>{formatDateShort(session.day)}</div>
            </div>
            <div style={{background:"#F5F0E8",borderRadius:10,padding:"12px 14px"}}>
              <div style={{...secTitle,marginBottom:4}}>🕐 Time</div>
              <div style={{fontSize:13,fontWeight:600,color:"#2C2416"}}>{session.time||"TBD"}{session.endTime&&` – ${session.endTime}`}</div>
            </div>
          </div>
          <div style={{background:"#F5F0E8",borderRadius:10,padding:"12px 14px"}}>
            <div style={{...secTitle,marginBottom:4}}>📍 Location</div>
            <div style={{fontSize:15,fontWeight:700,color:"#2C2416"}}>{session.room||"TBD"}</div>
            {(session.building||session.floor)&&<div style={{fontSize:12,color:"#7A6E5A",marginTop:3}}>{[session.building,session.floor].filter(Boolean).join(" · ")}</div>}
          </div>
          {session.description&&(
            <div>
              <div style={secTitle}>Description</div>
              <div style={{fontSize:13,color:"#5A4E3A",lineHeight:1.7,background:"#F5F0E8",padding:"12px 14px",borderRadius:10}}>{session.description}</div>
            </div>
          )}
          <div style={{paddingTop:10,borderTop:"1px solid #E8E0D0",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:color+"22",color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{initials(attendee.name)}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#2C2416"}}>{attendee.name}</div>
              <div style={{fontSize:11,color:"#9B8E7A"}}>{[attendee.role,attendee.affiliation].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Attendee view modal ───────────────────────────────────────────────────────
function AttendeeView({ attendee, onClose, onEdit, isAdmin }) {
  const [sessDetail, setSessDetail] = useState(null);
  if (!attendee) return null;
  const color = getColor(attendee.id);
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,12,8,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF5",borderRadius:16,maxWidth:530,width:"100%",maxHeight:"88vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",animation:"slideUp 0.25s ease"}}>
          <div style={{background:color,padding:"26px 30px",position:"relative"}}>
            <div style={{display:"flex",gap:8,position:"absolute",top:14,right:14}}>
              {isAdmin&&<button onClick={()=>{onClose();onEdit(attendee);}} style={{background:"rgba(255,255,255,0.25)",border:"none",color:"#fff",padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>✏️ Edit</button>}
              <button onClick={onClose} style={{background:"rgba(255,255,255,0.25)",border:"none",color:"#fff",width:30,height:30,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✕</button>
            </div>
            <div style={{width:58,height:58,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Playfair Display',serif",marginBottom:12}}>{initials(attendee.name)}</div>
            <div style={{color:"#fff"}}>
              <div style={{fontSize:22,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{attendee.name}</div>
              <div style={{fontSize:13,opacity:0.85,marginTop:3}}>{[attendee.role,attendee.affiliation].filter(Boolean).join(" · ")}</div>
              {attendee.email&&<div style={{fontSize:12,opacity:0.7,marginTop:3}}>✉️ {attendee.email}</div>}
              {attendee.phone&&<div style={{fontSize:12,opacity:0.7,marginTop:2}}>📞 {attendee.phone}</div>}
              {attendee.website&&<div style={{fontSize:12,opacity:0.7,marginTop:2}}>🔗 {attendee.website}</div>}
            </div>
          </div>
          <div style={{padding:"22px 30px"}}>
            {attendee.days.length>0&&(
              <div style={{marginBottom:18}}>
                <div style={secTitle}>Attending Days</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {attendee.days.map(d=><span key={d} style={{background:color+"18",color,padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600}}>{formatDateShort(d)}</span>)}
                </div>
              </div>
            )}
            {attendee.sessions.length>0&&(
              <div style={{marginBottom:18}}>
                <div style={secTitle}>Sessions <span style={{fontWeight:400,opacity:0.55,fontSize:10}}>(click for details)</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {attendee.sessions.map((s,i)=>(
                    <div key={i} onClick={()=>setSessDetail(s)} style={{background:"#F5F0E8",borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"background 0.12s",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#EDE5D5"}
                      onMouseLeave={e=>e.currentTarget.style.background="#F5F0E8"}
                    >
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:"#2C2416"}}>{s.title}</div>
                        <div style={{fontSize:11,color:"#9B8E7A",marginTop:2}}>{formatDateShort(s.day)}{s.room&&` · ${s.room}`}{s.building&&` · ${s.building}`}</div>
                        {s.type&&<span style={{fontSize:10,background:color+"18",color,padding:"1px 7px",borderRadius:8,fontWeight:600,marginTop:4,display:"inline-block"}}>{s.type}</span>}
                      </div>
                      {s.time&&<span style={{background:"#fff",padding:"2px 8px",borderRadius:6,fontSize:12,fontWeight:700,color,marginLeft:10,whiteSpace:"nowrap"}}>{s.time}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {attendee.notes&&(
              <div>
                <div style={secTitle}>Notes</div>
                <div style={{fontSize:13,color:"#5A4E3A",lineHeight:1.65,background:"#F5F0E8",padding:"10px 14px",borderRadius:10}}>{attendee.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {sessDetail&&<SessionDetail session={sessDetail} attendee={attendee} onClose={()=>setSessDetail(null)}/>}
    </>
  );
}

// ── Session sub-form ──────────────────────────────────────────────────────────
function SessionForm({ session, confDays, onSave, onBack }) {
  const [f,setF] = useState(session||{title:"",day:"",time:"",endTime:"",room:"",building:"",floor:"",description:"",type:"Paper Presentation"});
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div style={{padding:"20px 28px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{fontSize:15,fontWeight:700,color:"#2C2416",marginBottom:4}}>{session?"Edit Session":"New Session"}</div>
      <div><span style={lbl}>Session Title *</span><input style={inp} value={f.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Paper Presentation: My Research"/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><span style={lbl}>Type</span><select style={inp} value={f.type} onChange={e=>set("type",e.target.value)}>{SESSION_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div><span style={lbl}>Day</span>
          <select style={inp} value={f.day} onChange={e=>set("day",e.target.value)}>
            <option value="">Select day</option>
            {confDays.map(d=><option key={d} value={d}>{formatDateShort(d)}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><span style={lbl}>Start Time</span><input style={inp} type="time" value={f.time} onChange={e=>set("time",e.target.value)}/></div>
        <div><span style={lbl}>End Time</span><input style={inp} type="time" value={f.endTime} onChange={e=>set("endTime",e.target.value)}/></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><span style={lbl}>Room / Hall</span><input style={inp} value={f.room} onChange={e=>set("room",e.target.value)} placeholder="e.g. Room 204"/></div>
        <div><span style={lbl}>Building</span><input style={inp} value={f.building} onChange={e=>set("building",e.target.value)} placeholder="e.g. Convention Center"/></div>
      </div>
      <div><span style={lbl}>Floor / Level</span><input style={inp} value={f.floor} onChange={e=>set("floor",e.target.value)} placeholder="e.g. Level 2"/></div>
      <div><span style={lbl}>Description</span><textarea style={{...inp,resize:"vertical",minHeight:80}} value={f.description} onChange={e=>set("description",e.target.value)} placeholder="What is this session about?"/></div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
        <button onClick={onBack} style={{padding:"9px 20px",borderRadius:8,border:"1.5px solid #E8E0D0",background:"none",color:"#9B8E7A",fontSize:13,cursor:"pointer"}}>← Back</button>
        <button onClick={()=>onSave({...f,id:f.id||"s"+Date.now()})} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#2C2416",color:"#F8F3EB",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Session</button>
      </div>
    </div>
  );
}

// ── Attendee form (add/edit) ──────────────────────────────────────────────────
function AttendeeForm({ attendee, confDays, onClose, onSave, onDelete }) {
  const isNew = !attendee?.id;
  const [form,setForm] = useState(attendee?{...attendee,sessions:attendee.sessions.map(s=>({...s}))}:{name:"",affiliation:"",role:"",email:"",phone:"",website:"",days:[],sessions:[],notes:""});
  const [editingSess,setEditingSess] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleDay = (d) => set("days",form.days.includes(d)?form.days.filter(x=>x!==d):[...form.days,d]);
  const saveSession = (data) => {
    if(editingSess.idx==="new") set("sessions",[...form.sessions,data]);
    else { const arr=[...form.sessions]; arr[editingSess.idx]=data; set("sessions",arr); }
    setEditingSess(null);
  };
  const handleSave = () => { if(!form.name) return; onSave({...form,id:attendee?.id||Date.now(),avatar:initials(form.name)}); onClose(); };
  const handleDelete = () => { if(window.confirm(`Remove ${attendee.name}?`)){onDelete(attendee.id);onClose();} };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,12,8,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF5",borderRadius:16,maxWidth:560,width:"100%",maxHeight:"88vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.35)",animation:"slideUp 0.22s ease"}}>
        <div style={{padding:"18px 28px",borderBottom:"1px solid #E8E0D0",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#FDFAF5",zIndex:1}}>
          <div style={{fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#2C2416"}}>{isNew?"Add Attendee":`Edit: ${attendee.name}`}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9B8E7A"}}>✕</button>
        </div>
        {editingSess?(
          <SessionForm session={editingSess.idx==="new"?null:form.sessions[editingSess.idx]} confDays={confDays} onSave={saveSession} onBack={()=>setEditingSess(null)}/>
        ):(
          <div style={{padding:"20px 28px",display:"flex",flexDirection:"column",gap:13}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><span style={lbl}>Full Name *</span><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Jane Smith"/></div>
              <div><span style={lbl}>Role / Title</span><input style={inp} value={form.role} onChange={e=>set("role",e.target.value)} placeholder="Doctoral Student"/></div>
            </div>
            <div><span style={lbl}>Affiliation</span><input style={inp} value={form.affiliation} onChange={e=>set("affiliation",e.target.value)} placeholder="University / Organization"/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><span style={lbl}>Email</span><input style={inp} value={form.email} onChange={e=>set("email",e.target.value)} placeholder="jane@university.edu"/></div>
              <div><span style={lbl}>Phone</span><input style={inp} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 555 000 0000"/></div>
            </div>
            <div><span style={lbl}>Website / LinkedIn</span><input style={inp} value={form.website} onChange={e=>set("website",e.target.value)} placeholder="https://..."/></div>
            <div>
              <span style={lbl}>Attending Days</span>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {confDays.map(d=>(
                  <button key={d} onClick={()=>toggleDay(d)} style={{padding:"5px 14px",borderRadius:20,border:"1.5px solid",borderColor:form.days.includes(d)?"#C17D3C":"#E8E0D0",background:form.days.includes(d)?"#C17D3C":"transparent",color:form.days.includes(d)?"#fff":"#9B8E7A",fontSize:12,fontWeight:600,cursor:"pointer"}}>{formatDateShort(d)}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={secTitle}>Sessions</span>
                <button onClick={()=>setEditingSess({idx:"new"})} style={{fontSize:12,color:"#C17D3C",background:"none",border:"1.5px dashed #C17D3C",padding:"4px 10px",borderRadius:8,cursor:"pointer",fontWeight:600}}>+ Add Session</button>
              </div>
              {form.sessions.length===0&&<div style={{fontSize:12,color:"#C0B49A",textAlign:"center",padding:"10px 0"}}>No sessions yet</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {form.sessions.map((s,i)=>(
                  <div key={i} style={{background:"#F5F0E8",borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#2C2416"}}>{s.title}</div>
                      <div style={{fontSize:11,color:"#9B8E7A"}}>{formatDateShort(s.day)}{s.time&&` · ${s.time}`}{s.room&&` · ${s.room}`}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditingSess({idx:i})} style={{background:"none",border:"none",cursor:"pointer",fontSize:14}}>✏️</button>
                      <button onClick={()=>set("sessions",form.sessions.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",fontSize:14}}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div><span style={lbl}>Notes</span><textarea style={{...inp,resize:"vertical",minHeight:60}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any notes..."/></div>
            <div style={{display:"flex",gap:10,justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #E8E0D0"}}>
              {!isNew?<button onClick={handleDelete} style={{padding:"9px 16px",borderRadius:8,border:"1.5px solid #C45C5C",background:"none",color:"#C45C5C",fontSize:13,cursor:"pointer"}}>🗑️ Delete</button>:<div/>}
              <div style={{display:"flex",gap:10}}>
                <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:"1.5px solid #E8E0D0",background:"none",color:"#9B8E7A",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button onClick={handleSave} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#2C2416",color:"#F8F3EB",fontSize:13,fontWeight:700,cursor:"pointer"}}>{isNew?"Add Attendee":"Save Changes"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────
function SettingsModal({ conf, onClose, onSave }) {
  const [f,setF] = useState({...conf});
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,12,8,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#FDFAF5",borderRadius:16,maxWidth:460,width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.35)",animation:"slideUp 0.22s ease"}}>
        <div style={{padding:"18px 28px",borderBottom:"1px solid #E8E0D0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:"#2C2416"}}>⚙️ Conference Settings</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9B8E7A"}}>✕</button>
        </div>
        <div style={{padding:"22px 28px",display:"flex",flexDirection:"column",gap:13}}>
          <div><span style={lbl}>Conference Name *</span><input style={inp} value={f.name} onChange={e=>set("name",e.target.value)}/></div>
          <div><span style={lbl}>Subtitle</span><input style={inp} value={f.subtitle} onChange={e=>set("subtitle",e.target.value)}/></div>
          <div><span style={lbl}>City / Location</span><input style={inp} value={f.location} onChange={e=>set("location",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><span style={lbl}>Start Date</span><input style={inp} type="date" value={f.startDate} onChange={e=>set("startDate",e.target.value)}/></div>
            <div><span style={lbl}>End Date</span><input style={inp} type="date" value={f.endDate} onChange={e=>set("endDate",e.target.value)}/></div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:4}}>
            <button onClick={onClose} style={{padding:"9px 20px",borderRadius:8,border:"1.5px solid #E8E0D0",background:"none",color:"#9B8E7A",fontSize:13,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{onSave(f);onClose();}} style={{padding:"9px 20px",borderRadius:8,border:"none",background:"#2C2416",color:"#F8F3EB",fontSize:13,fontWeight:700,cursor:"pointer"}}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [conf, setConf] = useState(DEFAULT_CONF);
  const [attendees, setAttendees] = useState(DEFAULT_ATTENDEES);
  const [selectedDay, setSelectedDay] = useState(DEFAULT_CONF.startDate);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("calendar");
  const [viewModal, setViewModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedConf = loadFromStorage("conf_settings", DEFAULT_CONF);
    const storedAttendees = loadFromStorage("conf_attendees", DEFAULT_ATTENDEES);
    setConf(storedConf);
    setAttendees(storedAttendees);
    setSelectedDay(storedConf.startDate);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveToStorage("conf_settings", conf);
    saveToStorage("conf_attendees", attendees);
    setSaved(true);
    const t = setTimeout(()=>setSaved(false), 1800);
    return () => clearTimeout(t);
  }, [conf, attendees, ready]);

  const confDays = useMemo(()=>getDaysBetween(conf.startDate,conf.endDate),[conf.startDate,conf.endDate]);
  useEffect(()=>{ if(confDays.length&&!confDays.includes(selectedDay)) setSelectedDay(confDays[0]); },[confDays]);

  const filtered = useMemo(()=>{
    const q=search.toLowerCase();
    return attendees.filter(a=>a.name.toLowerCase().includes(q)||(a.affiliation||"").toLowerCase().includes(q)||(a.role||"").toLowerCase().includes(q));
  },[attendees,search]);

  const dayPeople = useMemo(()=>filtered.filter(a=>a.days.includes(selectedDay)),[filtered,selectedDay]);
  const saveAttendee = (data) => setAttendees(prev=>prev.some(a=>a.id===data.id)?prev.map(a=>a.id===data.id?data:a):[...prev,data]);
  const deleteAttendee = (id) => setAttendees(prev=>prev.filter(a=>a.id!==id));

  if (!ready) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8F3EB",fontSize:14,color:"#9B8E7A"}}>Loading...</div>;

  return (
    <div style={{minHeight:"100vh",background:"#F8F3EB",fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#2C2416"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes savedPop{0%{opacity:0;transform:translateY(4px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,textarea{font-family:'DM Sans',sans-serif}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#D4C9B0;border-radius:3px}
      `}</style>

      {saved&&<div style={{position:"fixed",bottom:20,right:20,background:"#2C2416",color:"#F8F3EB",padding:"8px 16px",borderRadius:10,fontSize:12,fontWeight:600,zIndex:9999,animation:"savedPop 1.8s ease forwards"}}>✓ Saved</div>}

      {/* Header */}
      <div style={{background:"#2C2416"}}>
        <div style={{maxWidth:920,margin:"0 auto",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#C17D3C",fontWeight:700,marginBottom:2}}>{conf.location}</div>
            <div style={{fontSize:21,fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#F8F3EB"}}>{conf.name}</div>
            {conf.subtitle&&<div style={{fontSize:11,color:"#6B5F4F",marginTop:1}}>{conf.subtitle}</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{fontSize:12,color:"#6B5F4F",background:"#3A3020",padding:"4px 12px",borderRadius:8}}>{attendees.length} attendees</div>
            {isAdmin ? (
              <>
                <span style={{fontSize:11,color:"#5B8A72",background:"#1e2e24",padding:"4px 10px",borderRadius:8,fontWeight:600}}>🔓 Admin</span>
                <button onClick={()=>setShowSettings(true)} style={{background:"#3A3020",color:"#C0B49A",border:"none",padding:"8px 14px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>⚙️ Settings</button>
                <button onClick={()=>setShowAdd(true)} style={{background:"#C17D3C",color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Person</button>
                <button onClick={()=>setIsAdmin(false)} style={{background:"none",color:"#6B5F4F",border:"1px solid #3A3020",padding:"8px 12px",borderRadius:8,fontSize:12,cursor:"pointer"}}>Log out</button>
              </>
            ) : (
              <button onClick={()=>setShowLogin(true)} style={{background:"#3A3020",color:"#C0B49A",border:"none",padding:"8px 14px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600}}>🔒 Admin</button>
            )}
          </div>
        </div>
      </div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"20px 16px"}}>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180,position:"relative"}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#C0B49A"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, affiliation, role..."
              style={{width:"100%",padding:"9px 12px 9px 34px",borderRadius:10,border:"1.5px solid #E8E0D0",background:"#fff",fontSize:13,outline:"none",color:"#2C2416",fontFamily:"inherit"}}/>
          </div>
          <div style={{display:"flex",background:"#fff",borderRadius:10,border:"1.5px solid #E8E0D0",overflow:"hidden"}}>
            {[["calendar","📅 Calendar"],["list","📋 All People"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"9px 16px",border:"none",cursor:"pointer",background:view===v?"#2C2416":"transparent",color:view===v?"#F8F3EB":"#9B8E7A",fontSize:12,fontWeight:600}}>{l}</button>
            ))}
          </div>
        </div>

        {view==="calendar"?(
          <>
            <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
              {confDays.map(day=>{
                const cnt=attendees.filter(a=>a.days.includes(day)).length;
                const active=selectedDay===day;
                return (
                  <button key={day} onClick={()=>setSelectedDay(day)} style={{padding:"9px 18px",borderRadius:10,border:"none",background:active?"#2C2416":"#fff",color:active?"#F8F3EB":"#5A4E3A",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,boxShadow:active?"0 4px 12px rgba(44,36,22,0.2)":"none",transition:"all 0.14s"}}>
                    <div style={{fontSize:13,fontWeight:700}}>{formatDateShort(day)}</div>
                    <div style={{fontSize:10,opacity:0.55,marginTop:1}}>{cnt} people</div>
                  </button>
                );
              })}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:18,fontFamily:"'Playfair Display',serif",fontWeight:700}}>{formatDateLong(selectedDay)}</div>
              <div style={{fontSize:12,color:"#9B8E7A",marginTop:2}}>{dayPeople.length} {dayPeople.length===1?"person":"people"} attending{search&&` · filtered by "${search}"`}</div>
            </div>
            {dayPeople.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:"#C0B49A"}}>
                <div style={{fontSize:38,marginBottom:10}}>🎪</div>
                <div style={{fontSize:14}}>No attendees for this day</div>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(255px,1fr))",gap:12}}>
                {dayPeople.map(a=>{
                  const color=getColor(a.id);
                  const daySess=a.sessions.filter(s=>s.day===selectedDay);
                  return (
                    <div key={a.id} onClick={()=>setViewModal(a)} style={{background:"#fff",borderRadius:12,padding:"15px",cursor:"pointer",transition:"all 0.14s",boxShadow:"0 2px 8px rgba(44,36,22,0.06)",borderLeft:`4px solid ${color}`,animation:"fadeIn 0.2s ease"}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(44,36,22,0.11)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(44,36,22,0.06)";}}
                    >
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                        <div style={{display:"flex",alignItems:"center",gap:9}}>
                          <div style={{width:40,height:40,borderRadius:"50%",background:color+"22",color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:"'Playfair Display',serif",flexShrink:0}}>{initials(a.name)}</div>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"#2C2416"}}>{a.name}</div>
                            <div style={{fontSize:11,color:"#9B8E7A"}}>{a.role}</div>
                          </div>
                        </div>
                        {isAdmin&&<button onClick={e=>{e.stopPropagation();setEditModal(a);}} style={{background:"none",border:"none",fontSize:13,cursor:"pointer",color:"#C0B49A",flexShrink:0}}>✏️</button>}
                      </div>
                      {a.affiliation&&<div style={{fontSize:12,color:"#7A6E5A",marginBottom:7}}>{a.affiliation}</div>}
                      {daySess.length>0&&(
                        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:7}}>
                          {daySess.map((s,i)=>(
                            <div key={i} style={{fontSize:11,background:color+"12",color,padding:"3px 8px",borderRadius:6,fontWeight:500}}>
                              {s.time&&`${s.time} · `}{s.title}{s.room&&` · ${s.room}`}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{fontSize:11,color:"#C17D3C",fontWeight:600}}>View profile →</div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:13,color:"#9B8E7A",marginBottom:4}}>{filtered.length} attendees{search&&` matching "${search}"`}</div>
            {filtered.map(a=>{
              const color=getColor(a.id);
              return (
                <div key={a.id} onClick={()=>setViewModal(a)} style={{background:"#fff",borderRadius:12,padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 8px rgba(44,36,22,0.06)",transition:"all 0.14s",borderLeft:`4px solid ${color}`}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateX(4px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="translateX(0)"}
                >
                  <div style={{width:42,height:42,borderRadius:"50%",background:color+"22",color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,fontFamily:"'Playfair Display',serif",flexShrink:0}}>{initials(a.name)}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#2C2416"}}>{a.name}</div>
                    <div style={{fontSize:12,color:"#9B8E7A"}}>{[a.role,a.affiliation].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {a.days.map(d=><span key={d} style={{fontSize:11,background:"#F5F0E8",color:"#7A6E5A",padding:"2px 8px",borderRadius:10,fontWeight:500}}>{formatDateShort(d)}</span>)}
                  </div>
                  {isAdmin&&<button onClick={e=>{e.stopPropagation();setEditModal(a);}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer",color:"#C0B49A",flexShrink:0}}>✏️</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showLogin&&<AdminLoginModal onClose={()=>setShowLogin(false)} onSuccess={()=>setIsAdmin(true)}/>}
      {viewModal&&<AttendeeView attendee={viewModal} onClose={()=>setViewModal(null)} onEdit={a=>{setViewModal(null);setEditModal(a);}} isAdmin={isAdmin}/>}
      {isAdmin&&(editModal||showAdd)&&<AttendeeForm attendee={editModal||null} confDays={confDays} onClose={()=>{setEditModal(null);setShowAdd(false);}} onSave={saveAttendee} onDelete={deleteAttendee}/>}
      {isAdmin&&showSettings&&<SettingsModal conf={conf} onClose={()=>setShowSettings(false)} onSave={c=>setConf(c)}/>}
    </div>
  );
}
