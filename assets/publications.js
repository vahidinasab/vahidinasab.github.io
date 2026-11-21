(function(){
  document.getElementById('yr').textContent=new Date().getFullYear();
  var q=document.getElementById('q'), note=document.getElementById('note'), empty=document.getElementById('empty');
  var items=[].slice.call(document.querySelectorAll('.pub-item'));
  var cats=[].slice.call(document.querySelectorAll('.pubcat'));
  var years=[].slice.call(document.querySelectorAll('.pubyear'));
  var curFilter='all';
  function apply(){
    var term=(q.value||'').trim().toLowerCase();
    var shown=0;
    items.forEach(function(it){
      var okCat = curFilter==='all' || it.closest('.pubcat').getAttribute('data-cat')===curFilter;
      var okTerm = !term || it.getAttribute('data-blob').indexOf(term)>-1;
      var show=okCat&&okTerm;
      it.style.display=show?'':'none';
      if(show) shown++;
    });
    years.forEach(function(y){
      var any=y.querySelector('.pub-item:not([style*="display: none"])');
      y.style.display=any?'':'none';
    });
    cats.forEach(function(c){
      var any=c.querySelector('.pub-item:not([style*="display: none"])');
      c.style.display=any?'':'none';
    });
    empty.style.display=shown?'none':'block';
    note.textContent = (term||curFilter!=='all') ? (shown+' of '+items.length+' shown') : '';
  }
  q.addEventListener('input', apply);
  document.getElementById('filters').addEventListener('click', function(e){
    var b=e.target.closest('.filt'); if(!b) return;
    document.querySelectorAll('.filt').forEach(function(x){x.classList.remove('active');x.setAttribute('aria-pressed','false')});
    b.classList.add('active'); b.setAttribute('aria-pressed','true'); curFilter=b.getAttribute('data-f'); apply();
  });
})();
