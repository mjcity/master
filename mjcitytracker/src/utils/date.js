export const formatDate = (d) => d ? new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '-';
export const isOverdue = (d) => { if(!d) return false; const x=new Date(d); const n=new Date(); n.setHours(0,0,0,0); return x<n; };
