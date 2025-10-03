export const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
export const jaccard=(a,b)=>{const A=new Set(a),B=new Set(b);const i=[...A].filter(x=>B.has(x)).length;const u=new Set([...A,...B]).size;return u?i/u:0;};
export const rnd=(n)=>Math.floor(Math.random()*n);
export const pick=(arr)=>arr[Math.max(0,Math.min(arr.length-1,rnd(arr.length)))];
export const uniq=(arr)=>[...new Set(arr)];
export const hash=(s)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),0);
export const sample=(arr,k)=>{const a=[...arr];const out=[];while(a.length&&out.length<k){out.push(a.splice(rnd(a.length),1)[0]);}return out;}
