"use client";
import { useState, useMemo, useEffect } from "react";

const ADMIN_PASSWORD = "aera2026";

// ── UA Brand Colors ───────────────────────────────────────────────────────────
const UA = {
  red:      "#AB0520",
  blue:     "#0C234B",
  midnight: "#001C48",
  azurite:  "#1E5288",
  oasis:    "#378DBD",
  chili:    "#8B0015",
  bloom:    "#EF4056",
  sky:      "#81D3EB",
  leaf:     "#70B865",
  river:    "#007D84",
  mesa:     "#A95C42",
  warmGray: "#F4EDE5",
  coolGray: "#E2E9EB",
};

const PERSON_COLORS = [UA.azurite, UA.river, UA.mesa, UA.leaf, UA.oasis, UA.chili, UA.bloom, UA.midnight, "#5C7AB5", "#A05C8A"];
const getColor = (id) => PERSON_COLORS[(id - 1) % PERSON_COLORS.length];
const initials = (name) => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

function formatDateLong(d) { if(!d) return ""; return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); }
function formatDateShort(d) { if(!d) return ""; return new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function getDaysBetween(start,end) {
  const days=[]; let cur=new Date(start+"T12:00:00"); const last=new Date(end+"T12:00:00");
  while(cur<=last){days.push(cur.toISOString().slice(0,10));cur.setDate(cur.getDate()+1);}
  return days;
}
function loadLS(key,fb){try{const r=localStorage.getItem(key);return r?JSON.parse(r):fb;}catch{return fb;}}
function saveLS(key,v){try{localStorage.setItem(key,JSON.stringify(v));}catch{}}

// ── Default data ───────────────────────────────────────────────────────────────
const DEFAULT_CONF = { name:"AERA 2026", subtitle:"American Educational Research Association Annual Meeting", location:"Philadelphia, PA", startDate:"2026-04-08", endDate:"2026-04-12" };

const DEFAULT_SESSIONS = [
  {id:"S1",title:"Opening Keynote",type:"Keynote",day:"2026-04-08",time:"09:00",endTime:"10:30",room:"Hall A",building:"Convention Center",floor:"Level 1",description:"Annual opening keynote with featured speakers on transformative education.",presenterIds:[1,2]},
  {id:"S2",title:"Workshop: YPAR Methods in Practice",type:"Workshop",day:"2026-04-08",time:"11:00",endTime:"12:30",room:"Workshop B",building:"Convention Center",floor:"Level 1",description:"Hands-on workshop exploring Youth Participatory Action Research methodologies for educational researchers.",presenterIds:[2]},
  {id:"S3",title:"Paper Presentation: Youth Agency & Culture-Based Pedagogies",type:"Paper Presentation",day:"2026-04-09",time:"14:00",endTime:"15:30",room:"Room 204",building:"Marriott Hotel",floor:"2nd Floor",description:"Research on culture-based and arts-integrated pedagogies for immigrant youth populations.",presenterIds:[1,3]},
  {id:"S4",title:"Roundtable: Equity in Urban Schools",type:"Roundtable",day:"2026-04-09",time:"10:00",endTime:"11:00",room:"Room 101",building:"Marriott Hotel",floor:"1st Floor",description:"Small group roundtable on equity challenges in urban K-12 settings.",presenterIds:[2,3]},
  {id:"S5",title:"Equity in Education Panel",type:"Panel",day:"2026-04-09",time:"13:00",endTime:"14:30",room:"Hall B",building:"Convention Center",floor:"Level 1",description:"Panel discussion on systemic equity challenges in K-12 education.",presenterIds:[3]},
  {id:"S6",title:"Closing Panel: Future of Education Research",type:"Panel",day:"2026-04-10",time:"16:00",endTime:"17:30",room:"Main Stage",building:"Convention Center",floor:"Level 2",description:"Closing panel and remarks from conference organizers.",presenterIds:[1]},
];

const DEFAULT_ATTENDEES = [
  {id:1,name:"Betul Yilmaz",affiliation:"University of Arizona",role:"Doctoral Student",email:"betul@arizona.edu",phone:"",website:"",days:["2026-04-08","2026-04-09","2026-04-10"],notes:"Presenting on culture-based pedagogies"},
  {id:2,name:"Maria Gonzalez",affiliation:"UCLA",role:"Assistant Professor",email:"mgonzalez@ucla.edu",phone:"",website:"",days:["2026-04-08","2026-04-09"],notes:"Leading the YPAR workshop on Day 1"},
  {id:3,name:"James Park",affiliation:"Stanford University",role:"Postdoctoral Fellow",email:"jpark@stanford.edu",phone:"",website:"",days:["2026-04-09","2026-04-10"],notes:""},
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const inp = {width:"100%",padding:"9px 12px",borderRadius:6,border:"1.5px solid #D0C8BE",background:"#fff",fontSize:13,color:"#1a1a2e",outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
const lbl = {fontSize:10,fontWeight:700,letterSpacing:1.8,color:"#6B6057",textTransform:"uppercase",display:"block",marginBottom:5};
const secT = {fontSize:10,fontWeight:700,letterSpacing:1.8,color:"#6B6057",textTransform:"uppercase",marginBottom:8};
const SESSION_TYPES = ["Keynote","Paper Presentation","Panel","Workshop","Roundtable","Symposium","Poster","Social","Other"];
const TYPE_COLORS = {Keynote:UA.red,Panel:UA.azurite,Workshop:UA.river,"Paper Presentation":UA.blue,Roundtable:UA.mesa,Symposium:UA.oasis,Poster:UA.leaf,Social:UA.chili,Other:"#888"};

// ── Admin Login ────────────────────────────────────────────────────────────────
function AdminLogin({onClose,onSuccess}){
  const [pw,setPw]=useState(""); const [err,setErr]=useState(false);
  const go=()=>{if(pw===ADMIN_PASSWORD){onSuccess();onClose();}else{setErr(true);setPw("");setTimeout(()=>setErr(false),2000);}};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,35,75,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,maxWidth:340,width:"100%",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.3)",animation:"slideUp 0.22s ease"}}>
        <div style={{background:UA.blue,padding:"24px 28px",textAlign:"center"}}>
          <img src="https://cdn.digital.arizona.edu/logos/v1.0.0/ua_wordmark_line_logo_white_rgb.min.svg" alt="University of Arizona" style={{height:28,marginBottom:12}}/>
          <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:0.5}}>Admin Access</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:3}}>Enter password to edit</div>
        </div>
        <div style={{padding:"22px 28px",display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <span style={lbl}>Password</span>
            <input style={{...inp,border:err?"1.5px solid "+UA.red:"1.5px solid #D0C8BE"}} type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Enter password" autoFocus/>
            {err&&<div style={{fontSize:11,color:UA.red,marginTop:4}}>Incorrect password.</div>}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={onClose} style={{padding:"8px 18px",borderRadius:6,border:"1.5px solid #D0C8BE",background:"none",color:"#6B6057",fontSize:12,cursor:"pointer"}}>Cancel</button>
            <button onClick={go} style={{padding:"8px 18px",borderRadius:6,border:"none",background:UA.blue,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Session detail popup ──────────────────────────────────────────────────────
function SessionDetail({session,attendees,onClose,onEdit,isAdmin}){
  if(!session) return null;
  const tc=TYPE_COLORS[session.type]||UA.azurite;
  const presenters=attendees.filter(a=>session.presenterIds?.includes(a.id));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,35,75,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1300,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,maxWidth:520,width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",animation:"slideUp 0.22s ease"}}>
        <div style={{background:`linear-gradient(135deg,${tc},${tc}dd)`,padding:"22px 28px",position:"relative"}}>
          <div style={{display:"flex",gap:8,position:"absolute",top:12,right:12}}>
            {isAdmin&&<button onClick={()=>{onClose();onEdit(session);}} style={{background:"rgba(255,255,255,0.22)",border:"none",color:"#fff",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>✏️ Edit</button>}
            <button onClick={onClose} style={{background:"rgba(255,255,255,0.22)",border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
          {session.type&&<span style={{background:"rgba(255,255,255,0.2)",color:"#fff",padding:"2px 9px",borderRadius:10,fontSize:10,fontWeight:700,letterSpacing:0.8}}>{session.type.toUpperCase()}</span>}
          <div style={{fontSize:19,fontWeight:800,color:"#fff",marginTop:9,lineHeight:1.3}}>{session.title}</div>
        </div>
        <div style={{padding:"20px 28px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["📅","Date",formatDateShort(session.day)],["🕐","Time",(session.time||"TBD")+(session.endTime?` – ${session.endTime}`:"")],["📍","Room",session.room||"TBD"]].map(([ico,ttl,val])=>(
              <div key={ttl} style={{background:UA.warmGray,borderRadius:8,padding:"10px 12px"}}>
                <div style={{...secT,marginBottom:3}}>{ico} {ttl}</div>
                <div style={{fontSize:12,fontWeight:700,color:"#1a1a2e"}}>{val}</div>
              </div>
            ))}
          </div>
          {(session.building||session.floor)&&(
            <div style={{background:UA.warmGray,borderRadius:8,padding:"10px 14px"}}>
              <div style={{...secT,marginBottom:3}}>🏛️ Building</div>
              <div style={{fontSize:13,fontWeight:600,color:"#1a1a2e"}}>{session.building}{session.floor&&<span style={{fontSize:11,color:"#6B6057",marginLeft:6}}>· {session.floor}</span>}</div>
            </div>
          )}
          {session.description&&(
            <div>
              <div style={secT}>Description</div>
              <div style={{fontSize:13,color:"#3a3a5c",lineHeight:1.7,background:UA.warmGray,padding:"10px 14px",borderRadius:8}}>{session.description}</div>
            </div>
          )}
          {presenters.length>0&&(
            <div>
              <div style={secT}>Presenters / Attendees</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {presenters.map(p=>{
                  const c=getColor(p.id);
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,background:UA.warmGray,borderRadius:8,padding:"8px 12px"}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:c+"20",color:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{initials(p.name)}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#1a1a2e"}}>{p.name}</div>
                        <div style={{fontSize:11,color:"#6B6057"}}>{[p.role,p.affiliation].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Attendee view modal ───────────────────────────────────────────────────────
function AttendeeView({attendee,sessions,onClose,onEdit,isAdmin}){
  const [sessDetail,setSessDetail]=useState(null);
  if(!attendee) return null;
  const c=getColor(attendee.id);
  const myS=sessions.filter(s=>s.presenterIds?.includes(attendee.id));
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,35,75,0.78)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,backdropFilter:"blur(4px)"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,maxWidth:520,width:"100%",maxHeight:"88vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.25)",animation:"slideUp 0.24s ease"}}>
          <div style={{background:`linear-gradient(135deg,${c},${c}cc)`,padding:"24px 28px",position:"relative"}}>
            <div style={{display:"flex",gap:8,position:"absolute",top:12,right:12}}>
              {isAdmin&&<button onClick={()=>{onClose();onEdit(attendee);}} style={{background:"rgba(255,255,255,0.22)",border:"none",color:"#fff",padding:"4px 10px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>✏️ Edit</button>}
              <button onClick={onClose} style={{background:"rgba(255,255,255,0.22)",border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✕</button>
            </div>
            <div style={{width:54,height:54,borderRadius:"50%",background:"rgba(255,255,255,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",marginBottom:10}}>{initials(attendee.name)}</div>
            <div style={{color:"#fff"}}>
              <div style={{fontSize:20,fontWeight:800}}>{attendee.name}</div>
              <div style={{fontSize:12,opacity:0.85,marginTop:3}}>{[attendee.role,attendee.affiliation].filter(Boolean).join(" · ")}</div>
              {attendee.email&&<div style={{fontSize:11,opacity:0.7,marginTop:3}}>✉️ {attendee.email}</div>}
              {attendee.phone&&<div style={{fontSize:11,opacity:0.7,marginTop:2}}>📞 {attendee.phone}</div>}
              {attendee.website&&<div style={{fontSize:11,opacity:0.7,marginTop:2}}>🔗 {attendee.website}</div>}
            </div>
          </div>
          <div style={{padding:"20px 28px"}}>
            {attendee.days.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={secT}>Attending Days</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {attendee.days.map(d=><span key={d} style={{background:c+"18",color:c,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>{formatDateShort(d)}</span>)}
                </div>
              </div>
            )}
            {myS.length>0&&(
              <div style={{marginBottom:16}}>
                <div style={secT}>Sessions <span style={{fontWeight:400,opacity:0.5,fontSize:10}}>(click for details)</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {myS.map(s=>{
                    const tc=TYPE_COLORS[s.type]||UA.azurite;
                    return(
                      <div key={s.id} onClick={()=>setSessDetail(s)} style={{background:UA.warmGray,borderRadius:8,padding:"9px 13px",cursor:"pointer",transition:"background 0.12s",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#EBE0D2"}
                        onMouseLeave={e=>e.currentTarget.style.background=UA.warmGray}
                      >
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:"#1a1a2e"}}>{s.title}</div>
                          <div style={{fontSize:10,color:"#6B6057",marginTop:2}}>{formatDateShort(s.day)}{s.room&&` · ${s.room}`}</div>
                          {s.type&&<span style={{fontSize:9,background:tc+"18",color:tc,padding:"1px 6px",borderRadius:8,fontWeight:700,marginTop:3,display:"inline-block",letterSpacing:0.5}}>{s.type.toUpperCase()}</span>}
                        </div>
                        {s.time&&<span style={{background:"#fff",padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:700,color:tc,marginLeft:10,whiteSpace:"nowrap",border:"1px solid "+tc+"30"}}>{s.time}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {attendee.notes&&(
              <div>
                <div style={secT}>Notes</div>
                <div style={{fontSize:12,color:"#3a3a5c",lineHeight:1.65,background:UA.warmGray,padding:"10px 13px",borderRadius:8}}>{attendee.notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {sessDetail&&<SessionDetail session={sessDetail} attendees={DEFAULT_ATTENDEES} onClose={()=>setSessDetail(null)} onEdit={()=>{}} isAdmin={false}/>}
    </>
  );
}

// ── Session form (add/edit) ────────────────────────────────────────────────────
function SessionForm({session,confDays,attendees,onClose,onSave,onDelete}){
  const isNew=!session?.id;
  const [f,setF]=useState(session?{...session}:{title:"",type:"Paper Presentation",day:"",time:"",endTime:"",room:"",building:"",floor:"",description:"",presenterIds:[]});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleP=(id)=>set("presenterIds",f.presenterIds.includes(id)?f.presenterIds.filter(x=>x!==id):[...f.presenterIds,id]);
  const handleSave=()=>{if(!f.title)return;onSave({...f,id:f.id||"S"+Date.now()});onClose();};
  const handleDel=()=>{if(window.confirm(`Delete "${session.title}"?`)){onDelete(session.id);onClose();}};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,35,75,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,maxWidth:560,width:"100%",maxHeight:"88vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",animation:"slideUp 0.22s ease"}}>
        <div style={{padding:"16px 26px",borderBottom:"1px solid #E8E0D4",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1a1a2e"}}>{isNew?"Add Session":`Edit Session`}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:17,cursor:"pointer",color:"#9B8E7A"}}>✕</button>
        </div>
        <div style={{padding:"18px 26px",display:"flex",flexDirection:"column",gap:12}}>
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
          <div><span style={lbl}>Description</span><textarea style={{...inp,resize:"vertical",minHeight:70}} value={f.description} onChange={e=>set("description",e.target.value)} placeholder="What is this session about?"/></div>
          <div>
            <span style={lbl}>Presenters / Attendees in This Session</span>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:2}}>
              {attendees.map(a=>{
                const sel=f.presenterIds.includes(a.id);
                const c=getColor(a.id);
                return(
                  <button key={a.id} onClick={()=>toggleP(a.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:20,border:"1.5px solid",borderColor:sel?c:"#D0C8BE",background:sel?c+"18":"transparent",cursor:"pointer",transition:"all 0.12s"}}>
                    <div style={{width:20,height:20,borderRadius:"50%",background:c+"22",color:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>{initials(a.name)}</div>
                    <span style={{fontSize:12,fontWeight:600,color:sel?c:"#6B6057"}}>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #E8E0D4"}}>
            {!isNew?<button onClick={handleDel} style={{padding:"8px 14px",borderRadius:6,border:"1.5px solid "+UA.red,background:"none",color:UA.red,fontSize:12,cursor:"pointer"}}>🗑️ Delete</button>:<div/>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{padding:"8px 18px",borderRadius:6,border:"1.5px solid #D0C8BE",background:"none",color:"#6B6057",fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSave} style={{padding:"8px 18px",borderRadius:6,border:"none",background:UA.blue,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{isNew?"Add Session":"Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Attendee form (add/edit) ──────────────────────────────────────────────────
function AttendeeForm({attendee,confDays,onClose,onSave,onDelete}){
  const isNew=!attendee?.id;
  const [f,setF]=useState(attendee?{...attendee}:{name:"",affiliation:"",role:"",email:"",phone:"",website:"",days:[],notes:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleDay=(d)=>set("days",f.days.includes(d)?f.days.filter(x=>x!==d):[...f.days,d]);
  const handleSave=()=>{if(!f.name)return;onSave({...f,id:attendee?.id||Date.now()});onClose();};
  const handleDel=()=>{if(window.confirm(`Remove ${attendee.name}?`)){onDelete(attendee.id);onClose();}};
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,35,75,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,maxWidth:540,width:"100%",maxHeight:"88vh",overflow:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",animation:"slideUp 0.22s ease"}}>
        <div style={{padding:"16px 26px",borderBottom:"1px solid #E8E0D4",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1a1a2e"}}>{isNew?"Add Attendee":`Edit: ${attendee.name}`}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:17,cursor:"pointer",color:"#9B8E7A"}}>✕</button>
        </div>
        <div style={{padding:"18px 26px",display:"flex",flexDirection:"column",gap:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><span style={lbl}>Full Name *</span><input style={inp} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Jane Smith"/></div>
            <div><span style={lbl}>Role / Title</span><input style={inp} value={f.role} onChange={e=>set("role",e.target.value)} placeholder="Doctoral Student"/></div>
          </div>
          <div><span style={lbl}>Affiliation</span><input style={inp} value={f.affiliation} onChange={e=>set("affiliation",e.target.value)} placeholder="University / Organization"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><span style={lbl}>Email</span><input style={inp} value={f.email} onChange={e=>set("email",e.target.value)} placeholder="jane@university.edu"/></div>
            <div><span style={lbl}>Phone</span><input style={inp} value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+1 555 000 0000"/></div>
          </div>
          <div><span style={lbl}>Website / LinkedIn</span><input style={inp} value={f.website} onChange={e=>set("website",e.target.value)} placeholder="https://..."/></div>
          <div>
            <span style={lbl}>Attending Days</span>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {confDays.map(d=>(
                <button key={d} onClick={()=>toggleDay(d)} style={{padding:"4px 13px",borderRadius:20,border:"1.5px solid",borderColor:f.days.includes(d)?UA.red:"#D0C8BE",background:f.days.includes(d)?UA.red:"transparent",color:f.days.includes(d)?"#fff":"#6B6057",fontSize:11,fontWeight:700,cursor:"pointer"}}>{formatDateShort(d)}</button>
              ))}
            </div>
          </div>
          <div><span style={lbl}>Notes</span><textarea style={{...inp,resize:"vertical",minHeight:55}} value={f.notes} onChange={e=>set("notes",e.target.value)} placeholder="Any notes..."/></div>
          <div style={{display:"flex",gap:8,justifyContent:"space-between",paddingTop:8,borderTop:"1px solid #E8E0D4"}}>
            {!isNew?<button onClick={handleDel} style={{padding:"8px 14px",borderRadius:6,border:"1.5px solid "+UA.red,background:"none",color:UA.red,fontSize:12,cursor:"pointer"}}>🗑️ Delete</button>:<div/>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{padding:"8px 18px",borderRadius:6,border:"1.5px solid #D0C8BE",background:"none",color:"#6B6057",fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSave} style={{padding:"8px 18px",borderRadius:6,border:"none",background:UA.blue,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>{isNew?"Add Attendee":"Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────
function SettingsModal({conf,onClose,onSave}){
  const [f,setF]=useState({...conf});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(12,35,75,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1200,padding:20,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,maxWidth:440,width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",animation:"slideUp 0.22s ease"}}>
        <div style={{padding:"16px 26px",borderBottom:"1px solid #E8E0D4",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1a1a2e"}}>⚙️ Conference Settings</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:17,cursor:"pointer",color:"#9B8E7A"}}>✕</button>
        </div>
        <div style={{padding:"20px 26px",display:"flex",flexDirection:"column",gap:12}}>
          <div><span style={lbl}>Conference Name *</span><input style={inp} value={f.name} onChange={e=>set("name",e.target.value)}/></div>
          <div><span style={lbl}>Subtitle</span><input style={inp} value={f.subtitle} onChange={e=>set("subtitle",e.target.value)}/></div>
          <div><span style={lbl}>City / Location</span><input style={inp} value={f.location} onChange={e=>set("location",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><span style={lbl}>Start Date</span><input style={inp} type="date" value={f.startDate} onChange={e=>set("startDate",e.target.value)}/></div>
            <div><span style={lbl}>End Date</span><input style={inp} type="date" value={f.endDate} onChange={e=>set("endDate",e.target.value)}/></div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",paddingTop:4}}>
            <button onClick={onClose} style={{padding:"8px 18px",borderRadius:6,border:"1.5px solid #D0C8BE",background:"none",color:"#6B6057",fontSize:12,cursor:"pointer"}}>Cancel</button>
            <button onClick={()=>{onSave(f);onClose();}} style={{padding:"8px 18px",borderRadius:6,border:"none",background:UA.blue,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({value,onChange,placeholder}){
  return(
    <div style={{position:"relative",flex:1,minWidth:180}}>
      <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#9B8E7A"}}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search..."}
        style={{width:"100%",padding:"9px 12px 9px 32px",borderRadius:8,border:"1.5px solid #D0C8BE",background:"#fff",fontSize:13,outline:"none",color:"#1a1a2e",fontFamily:"inherit",boxSizing:"border-box"}}/>
      {value&&<button onClick={()=>onChange("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#9B8E7A",fontSize:14}}>✕</button>}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [ready,setReady]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);
  const [showLogin,setShowLogin]=useState(false);
  const [conf,setConf]=useState(DEFAULT_CONF);
  const [sessions,setSessions]=useState(DEFAULT_SESSIONS);
  const [attendees,setAttendees]=useState(DEFAULT_ATTENDEES);
  const [view,setView]=useState("sessions"); // sessions | calendar | people
  const [selectedDay,setSelectedDay]=useState(DEFAULT_CONF.startDate);
  const [search,setSearch]=useState("");
  const [viewSession,setViewSession]=useState(null);
  const [editSession,setEditSession]=useState(null);
  const [showAddSession,setShowAddSession]=useState(false);
  const [viewAttendee,setViewAttendee]=useState(null);
  const [editAttendee,setEditAttendee]=useState(null);
  const [showAddAttendee,setShowAddAttendee]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    setConf(loadLS("ua_conf",DEFAULT_CONF));
    setSessions(loadLS("ua_sessions",DEFAULT_SESSIONS));
    setAttendees(loadLS("ua_attendees",DEFAULT_ATTENDEES));
    setReady(true);
  },[]);

  useEffect(()=>{
    if(!ready) return;
    saveLS("ua_conf",conf); saveLS("ua_sessions",sessions); saveLS("ua_attendees",attendees);
    setSaved(true); const t=setTimeout(()=>setSaved(false),1800); return()=>clearTimeout(t);
  },[conf,sessions,attendees,ready]);

  const confDays=useMemo(()=>getDaysBetween(conf.startDate,conf.endDate),[conf.startDate,conf.endDate]);
  useEffect(()=>{if(confDays.length&&!confDays.includes(selectedDay))setSelectedDay(confDays[0]);},[confDays]);

  const q=search.toLowerCase();

  // Sessions filtered
  const filteredSessions=useMemo(()=>sessions.filter(s=>
    s.title.toLowerCase().includes(q)||
    (s.type||"").toLowerCase().includes(q)||
    (s.room||"").toLowerCase().includes(q)||
    (s.building||"").toLowerCase().includes(q)||
    attendees.filter(a=>s.presenterIds?.includes(a.id)).some(a=>a.name.toLowerCase().includes(q)||a.affiliation.toLowerCase().includes(q))
  ),[sessions,attendees,q]);

  const daySessions=useMemo(()=>filteredSessions.filter(s=>s.day===selectedDay).sort((a,b)=>a.time.localeCompare(b.time)),[filteredSessions,selectedDay]);

  // People filtered
  const filteredPeople=useMemo(()=>attendees.filter(a=>
    a.name.toLowerCase().includes(q)||(a.affiliation||"").toLowerCase().includes(q)||(a.role||"").toLowerCase().includes(q)
  ),[attendees,q]);

  const dayPeople=useMemo(()=>filteredPeople.filter(a=>a.days.includes(selectedDay)),[filteredPeople,selectedDay]);

  const saveSession=(data)=>setSessions(prev=>prev.some(s=>s.id===data.id)?prev.map(s=>s.id===data.id?data:s):[...prev,data]);
  const deleteSession=(id)=>setSessions(prev=>prev.filter(s=>s.id!==id));
  const saveAttendee=(data)=>setAttendees(prev=>prev.some(a=>a.id===data.id)?prev.map(a=>a.id===data.id?data:a):[...prev,data]);
  const deleteAttendee=(id)=>setAttendees(prev=>prev.filter(a=>a.id!==id));

  if(!ready) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:UA.warmGray,fontSize:13,color:UA.blue}}>Loading...</div>;

  const SessionCard=({s})=>{
    const tc=TYPE_COLORS[s.type]||UA.azurite;
    const presenters=attendees.filter(a=>s.presenterIds?.includes(a.id));
    return(
      <div onClick={()=>setViewSession(s)} style={{background:"#fff",borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.14s",boxShadow:"0 1px 6px rgba(12,35,75,0.07)",borderLeft:`4px solid ${tc}`,animation:"fadeIn 0.18s ease"}}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(12,35,75,0.13)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 6px rgba(12,35,75,0.07)";}}
      >
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
              {s.type&&<span style={{fontSize:9,background:tc+"18",color:tc,padding:"2px 7px",borderRadius:8,fontWeight:800,letterSpacing:0.8}}>{s.type.toUpperCase()}</span>}
              {s.time&&<span style={{fontSize:11,fontWeight:700,color:tc}}>{s.time}{s.endTime&&` – ${s.endTime}`}</span>}
            </div>
            <div style={{fontSize:14,fontWeight:800,color:"#1a1a2e",lineHeight:1.3,marginBottom:4}}>{s.title}</div>
            {(s.room||s.building)&&<div style={{fontSize:11,color:"#6B6057"}}>{[s.room,s.building,s.floor].filter(Boolean).join(" · ")}</div>}
          </div>
          <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
            {isAdmin&&<button onClick={e=>{e.stopPropagation();setEditSession(s);}} style={{background:"none",border:"none",fontSize:13,cursor:"pointer",color:"#C0B49A"}}>✏️</button>}
          </div>
        </div>
        {presenters.length>0&&(
          <div style={{marginTop:10,display:"flex",gap:5,flexWrap:"wrap"}}>
            {presenters.map(p=>{
              const pc=getColor(p.id);
              return(
                <div key={p.id} onClick={e=>{e.stopPropagation();setViewAttendee(p);}} style={{display:"flex",alignItems:"center",gap:5,background:UA.warmGray,borderRadius:20,padding:"3px 9px 3px 4px",cursor:"pointer",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#EBE0D2"}
                  onMouseLeave={e=>e.currentTarget.style.background=UA.warmGray}
                >
                  <div style={{width:20,height:20,borderRadius:"50%",background:pc+"20",color:pc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>{initials(p.name)}</div>
                  <span style={{fontSize:11,fontWeight:600,color:"#3a3a5c"}}>{p.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return(
    <div style={{minHeight:"100vh",background:UA.warmGray,fontFamily:"'DM Sans','Segoe UI',sans-serif",color:"#1a1a2e"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes slideUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes savedPop{0%{opacity:0;transform:translateY(4px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,textarea{font-family:'DM Sans',sans-serif}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#C0B4A0;border-radius:3px}
      `}</style>

      {saved&&<div style={{position:"fixed",bottom:20,right:20,background:UA.blue,color:"#fff",padding:"7px 15px",borderRadius:8,fontSize:11,fontWeight:700,zIndex:9999,animation:"savedPop 1.8s ease forwards",letterSpacing:0.5}}>✓ SAVED</div>}

      {/* ── Header ── */}
      <div style={{background:UA.blue}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"14px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <img src="https://cdn.digital.arizona.edu/logos/v1.0.0/ua_wordmark_line_logo_white_rgb.min.svg" alt="University of Arizona" style={{height:30,flexShrink:0}}/>
              <div style={{width:1,height:30,background:"rgba(255,255,255,0.2)"}}/>
              <div>
                <div style={{fontSize:9,letterSpacing:3,textTransform:"uppercase",color:UA.sky,fontWeight:700,marginBottom:2}}>{conf.location}</div>
                <div style={{fontSize:17,fontWeight:800,color:"#fff",lineHeight:1.2}}>{conf.name}</div>
                {conf.subtitle&&<div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:1}}>{conf.subtitle}</div>}
              </div>
            </div>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.08)",padding:"3px 10px",borderRadius:6}}>{sessions.length} sessions · {attendees.length} people</div>
              {isAdmin?(
                <>
                  <span style={{fontSize:10,color:UA.leaf,background:"rgba(112,184,101,0.15)",padding:"3px 9px",borderRadius:6,fontWeight:700,letterSpacing:0.5}}>🔓 ADMIN</span>
                  <button onClick={()=>setShowSettings(true)} style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",border:"none",padding:"6px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontWeight:600}}>⚙️ Settings</button>
                  {view==="sessions"&&<button onClick={()=>setShowAddSession(true)} style={{background:UA.red,color:"#fff",border:"none",padding:"7px 14px",borderRadius:6,fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:0.3}}>+ Add Session</button>}
                  {view==="people"&&<button onClick={()=>setShowAddAttendee(true)} style={{background:UA.red,color:"#fff",border:"none",padding:"7px 14px",borderRadius:6,fontSize:11,fontWeight:800,cursor:"pointer",letterSpacing:0.3}}>+ Add Person</button>}
                  <button onClick={()=>setIsAdmin(false)} style={{background:"none",color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.15)",padding:"6px 10px",borderRadius:6,fontSize:11,cursor:"pointer"}}>Log out</button>
                </>
              ):(
                <button onClick={()=>setShowLogin(true)} style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)",border:"1px solid rgba(255,255,255,0.15)",padding:"6px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontWeight:600}}>🔒 Admin</button>
              )}
            </div>
          </div>
          {/* Nav tabs */}
          <div style={{display:"flex",gap:2,marginTop:14,borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
            {[["sessions","📋 Sessions"],["calendar","📅 By Day"],["people","👤 People"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"8px 16px",border:"none",background:"none",color:view===v?"#fff":"rgba(255,255,255,0.45)",fontSize:12,fontWeight:view===v?800:500,cursor:"pointer",borderBottom:view===v?`2px solid ${UA.red}`:"2px solid transparent",marginBottom:-1,transition:"all 0.14s",letterSpacing:0.3}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}}>

        {/* ── Sessions view ── */}
        {view==="sessions"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search sessions by title, type, room, presenter..."/>
            </div>
            {/* Group by day */}
            {confDays.map(day=>{
              const ds=filteredSessions.filter(s=>s.day===day).sort((a,b)=>a.time.localeCompare(b.time));
              if(ds.length===0) return null;
              return(
                <div key={day} style={{marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:800,color:UA.blue,letterSpacing:0.3}}>{formatDateLong(day)}</div>
                    <div style={{flex:1,height:1,background:"#D0C8BE"}}/>
                    <div style={{fontSize:11,color:"#9B8E7A",fontWeight:600}}>{ds.length} session{ds.length!==1?"s":""}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {ds.map(s=><SessionCard key={s.id} s={s}/>)}
                  </div>
                </div>
              );
            })}
            {filteredSessions.length===0&&(
              <div style={{textAlign:"center",padding:"60px 0",color:"#9B8E7A"}}>
                <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                <div style={{fontSize:14}}>No sessions found{search&&` for "${search}"`}</div>
              </div>
            )}
          </>
        )}

        {/* ── Calendar (by day) view ── */}
        {view==="calendar"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search sessions, presenters, rooms..."/>
            </div>
            {/* Day tabs */}
            <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
              {confDays.map(day=>{
                const cnt=sessions.filter(s=>s.day===day).length;
                const active=selectedDay===day;
                return(
                  <button key={day} onClick={()=>setSelectedDay(day)} style={{padding:"8px 16px",borderRadius:8,border:"none",background:active?UA.blue:"#fff",color:active?"#fff":"#5A4E3A",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,boxShadow:active?"0 3px 10px rgba(12,35,75,0.25)":"none",transition:"all 0.13s"}}>
                    <div style={{fontSize:12,fontWeight:800}}>{formatDateShort(day)}</div>
                    <div style={{fontSize:9,opacity:0.55,marginTop:1}}>{cnt} sessions</div>
                  </button>
                );
              })}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:17,fontWeight:800,color:UA.blue}}>{formatDateLong(selectedDay)}</div>
              <div style={{fontSize:11,color:"#9B8E7A",marginTop:2}}>{daySessions.length} session{daySessions.length!==1?"s":""}·{attendees.filter(a=>a.days.includes(selectedDay)).length} attendees</div>
            </div>
            {daySessions.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:"#9B8E7A"}}>
                <div style={{fontSize:36,marginBottom:10}}>📅</div>
                <div style={{fontSize:14}}>No sessions for this day{search&&` matching "${search}"`}</div>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {daySessions.map(s=><SessionCard key={s.id} s={s}/>)}
              </div>
            )}
          </>
        )}

        {/* ── People view ── */}
        {view==="people"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search by name, affiliation, role..."/>
            </div>
            <div style={{fontSize:12,color:"#9B8E7A",marginBottom:12}}>{filteredPeople.length} people{search&&` matching "${search}"`}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {filteredPeople.map(a=>{
                const c=getColor(a.id);
                const mySessions=sessions.filter(s=>s.presenterIds?.includes(a.id));
                return(
                  <div key={a.id} onClick={()=>setViewAttendee(a)} style={{background:"#fff",borderRadius:10,padding:"14px",cursor:"pointer",transition:"all 0.14s",boxShadow:"0 1px 6px rgba(12,35,75,0.07)",borderTop:`3px solid ${c}`,animation:"fadeIn 0.18s ease"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(12,35,75,0.12)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 1px 6px rgba(12,35,75,0.07)";}}
                  >
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:38,height:38,borderRadius:"50%",background:c+"18",color:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>{initials(a.name)}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:800,color:"#1a1a2e"}}>{a.name}</div>
                          <div style={{fontSize:10,color:"#9B8E7A"}}>{a.role}</div>
                        </div>
                      </div>
                      {isAdmin&&<button onClick={e=>{e.stopPropagation();setEditAttendee(a);}} style={{background:"none",border:"none",fontSize:12,cursor:"pointer",color:"#C0B49A"}}>✏️</button>}
                    </div>
                    {a.affiliation&&<div style={{fontSize:11,color:"#6B6057",marginBottom:7}}>{a.affiliation}</div>}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:7}}>
                      {a.days.map(d=><span key={d} style={{fontSize:9,background:c+"12",color:c,padding:"2px 7px",borderRadius:10,fontWeight:700,letterSpacing:0.3}}>{formatDateShort(d)}</span>)}
                    </div>
                    {mySessions.length>0&&<div style={{fontSize:10,color:"#9B8E7A"}}>{mySessions.length} session{mySessions.length!==1?"s":""}</div>}
                  </div>
                );
              })}
            </div>
            {filteredPeople.length===0&&(
              <div style={{textAlign:"center",padding:"60px 0",color:"#9B8E7A"}}>
                <div style={{fontSize:36,marginBottom:10}}>👤</div>
                <div style={{fontSize:14}}>No people found{search&&` for "${search}"`}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showLogin&&<AdminLogin onClose={()=>setShowLogin(false)} onSuccess={()=>setIsAdmin(true)}/>}
      {viewSession&&<SessionDetail session={viewSession} attendees={attendees} onClose={()=>setViewSession(null)} onEdit={s=>{setViewSession(null);setEditSession(s);}} isAdmin={isAdmin}/>}
      {viewAttendee&&<AttendeeView attendee={viewAttendee} sessions={sessions} onClose={()=>setViewAttendee(null)} onEdit={a=>{setViewAttendee(null);setEditAttendee(a);}} isAdmin={isAdmin}/>}
      {isAdmin&&(editSession||showAddSession)&&<SessionForm session={editSession||null} confDays={confDays} attendees={attendees} onClose={()=>{setEditSession(null);setShowAddSession(false);}} onSave={saveSession} onDelete={deleteSession}/>}
      {isAdmin&&(editAttendee||showAddAttendee)&&<AttendeeForm attendee={editAttendee||null} confDays={confDays} onClose={()=>{setEditAttendee(null);setShowAddAttendee(false);}} onSave={saveAttendee} onDelete={deleteAttendee}/>}
      {isAdmin&&showSettings&&<SettingsModal conf={conf} onClose={()=>setShowSettings(false)} onSave={c=>setConf(c)}/>}
    </div>
  );
}
