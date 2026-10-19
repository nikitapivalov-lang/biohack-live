/* Shared participant routing for group lessons; each sender has its own event history. */
function biohackParticipantColor(id,role){return role==='host'?'#800020':`hsl(${((Number(id)*137.508)%360).toFixed(3)} 70% 36%)`;}
class BioHackGroupRoster {
 constructor(){this.seen=new Map();this.known=new Set();}
 read(states,ownId,role,preferredHost){
  const members=[...states].filter(([id,s])=>id!==ownId&&s?.profile?.app==='biohack-live-1'&&['host','guest'].includes(s.profile.role)).map(([id,state])=>({id,state,role:state.profile.role,name:String(state.profile.name||'Участник').slice(0,32),color:biohackParticipantColor(id,state.profile.role)}));
  const teachers=members.filter(m=>m.role==='host').sort((a,b)=>a.id-b.id),host=teachers.find(m=>m.id===preferredHost)||teachers[0]||null,guests=members.filter(m=>m.role==='guest');
  const events=[];
  for(const member of members){const fresh=!this.known.has(member.id);for(const field of ['pointer','scroll','action','refresh']){
   const message=member.state[field],key=member.id+':'+field;
   if(!message||typeof message.nonce!=='string'||this.seen.get(key)===message.nonce)continue;
   this.seen.set(key,message.nonce);
   if(fresh&&field==='action')continue;
   if(field!=='pointer'&&(role==='guest'?member.id!==host?.id||field!=='scroll':member.role!=='guest'||!['action','refresh'].includes(field)))continue;
   events.push({member,message});
  }}
  this.known=new Set(members.map(m=>m.id));
  return {members,host,guests,events,remote:role==='host'?guests[0]||null:host};
 }
}
