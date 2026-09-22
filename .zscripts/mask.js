(function(){
  // 1. Brand mask
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n;
  while(n=walk.nextNode()){ if(/newmobility/i.test(n.textContent)){ n.textContent=n.textContent.replace(/newmobility/gi,'LipeHost'); } }
  document.title=document.title.replace(/newmobility/gi,'LipeHost');
  // 2. Remove dev overlay
  document.querySelectorAll('nextjs-portal').forEach(e=>e.remove());
  // 3. Fix broken images with emoji gradient placeholders
  const map=[[/hamb|hurg|burger|lanche/i,'🍔','#FF7043,#FFB74D'],[/pizza/i,'🍕','#E57373,#FFB74D'],[/ma[cç]a|apple|fruta/i,'🍎','#EF5350,#FF8A65'],[/t[eê]nis|sneaker|sapato/i,'👟','#78909C,#B0BEC5'],[/smart|galaxy|phone|celular/i,'📱','#5C6BC0,#7986CB'],[/fone|headphone|bluetooth/i,'🎧','#26A69A,#80CBC4'],[/watch|pulse|rel[oó]/i,'⌚','#8D6E63,#BCAAA4'],[/camiseta|shirt|vest/i,'👕','#42A5F5,#90CAF9'],[/caf[eé]/i,'☕','#795548,#A1887F'],[/bebida|suco|drink/i,'🥤','#29B6F6,#81D4FA'],[/salad|verdura/i,'🥗','#66BB6A,#A5D6A7'],[/doc[ei]|sobrem/i,'🍰','#F06292,#F8BBD0']];
  document.querySelectorAll('img').forEach(img=>{
    if(img.naturalWidth===0||img.complete===false){
      const alt=img.alt||'produto'; let em='🛍️', col='#FF7043,#FFB74D';
      for(const [re,e,c] of map){ if(re.test(alt)){ em=e; col=c; break; } }
      const g=col.split(',');
      const svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+g[0]+'"/><stop offset="1" stop-color="'+g[1]+'"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="255" font-size="150" text-anchor="middle">'+em+'</text></svg>';
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      img.style.objectFit='cover';
    }
  });
  return 1;
})()
