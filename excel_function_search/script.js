"use strict";
const $ = id => document.getElementById(id);
const escapeHtml = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = s => String(s).normalize('NFKC').toLowerCase().replace(/を|が|したい|たい|する|出す/g,'');
let selectedTask = null;
let copyTimer;
const categories = [...new Set(FUNCTIONS.map(f=>f.category))];
$('inventory').textContent = `${FUNCTIONS.length}関数・${categories.length}カテゴリ`;
for(const c of categories){const option=document.createElement('option');option.value=c;option.textContent=c;$('category').append(option);}
TASKS.forEach((task,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=task.label;$('task').append(option);});
$('task').addEventListener('change',()=>{selectedTask=$('task').value===''?null:TASKS[Number($('task').value)];render();});
const searchIndex = new Map(FUNCTIONS.map(f=>[f.name,normalize([f.name,f.category,f.summary,...f.useCases,...f.keywords,...f.examples.map(e=>`${e.formula} ${e.explanation}`)].join(' '))]));
function render(){
 const words=normalize($('search').value.trim()).split(/\s+/).filter(Boolean);
 const found=FUNCTIONS.filter(f=>(!$('category').value||f.category===$('category').value)&&(!selectedTask||selectedTask.names.includes(f.name))&&words.every(w=>searchIndex.get(f.name).includes(w)));
 $('count').textContent=`${found.length}件 / ${FUNCTIONS.length}関数`;
 $('results').replaceChildren();$('empty').hidden=found.length>0;
 const frag=document.createDocumentFragment();
 for(const f of found){const b=document.createElement('button');b.type='button';b.className='function-card';b.innerHTML=`<span class="tag">${escapeHtml(f.category)}</span><strong>${escapeHtml(f.name)}</strong><span>${escapeHtml(f.summary)}</span><span class="use">使用場面：${escapeHtml(f.useCases[0])}</span><span class="arrow">使い方を見る →</span>`;b.addEventListener('click',()=>showDetail(f.name));frag.append(b);}
 $('results').append(frag);
}
function showDetail(name){
 const f=FUNCTIONS.find(f=>f.name===name);if(!f)return;
 clearTimeout(copyTimer);
 const related=f.related.map(n=>FUNCTIONS.find(x=>x.name===n)).filter(Boolean);
 $('detail-content').innerHTML=`<span class="tag">${escapeHtml(f.category)}</span><h2 id="detail-name">${escapeHtml(f.name)}</h2><p>${escapeHtml(f.summary)}</p><h3>どんなときに使う？・実務での使用例</h3><ul>${f.useCases.map(u=>`<li>${escapeHtml(u)}</li>`).join('')}</ul><h3>基本構文</h3><div class="formula-box"><code>${escapeHtml(f.syntax)}</code></div><p class="hint">[] は省略できる引数、… は繰り返し指定できる引数です。</p><h3>引数の意味</h3>${f.arguments.length?`<dl>${f.arguments.map(a=>`<dt><strong>${escapeHtml(a.name)}</strong></dt><dd>${escapeHtml(a.description)}</dd>`).join('')}</dl>`:'<p>引数はありません。括弧 () は付けます。</p>'}<h3>数式例</h3>${f.examples.map((e,i)=>`<div class="formula-box">${e.inputs?`<h4>① セルに入力する値</h4><table class="example-inputs"><thead><tr><th scope="col">セル</th><th scope="col">値</th><th scope="col">内容</th></tr></thead><tbody>${e.inputs.map(input=>`<tr><th scope="row">${escapeHtml(input.cell)}</th><td>${input.value===''?'<span class="hint">（空白・未入力）</span>':escapeHtml(input.value)}</td><td>${escapeHtml(input.meaning)}</td></tr>`).join('')}</tbody></table><h4>② ${escapeHtml(e.outputCell)}に入力する数式</h4>`:''}<code>${escapeHtml(e.formula)}</code><button type="button" data-copy="${i}">数式をコピー</button>${e.result!==undefined?`<h4>③ ${escapeHtml(e.outputCell)}に表示される結果</h4><samp class="example-result">${escapeHtml(e.result)}</samp>`:''}<p>${escapeHtml(e.explanation)}</p></div>`).join('')}<p id="copy-status" role="status" aria-live="polite"></p><h3>初心者が間違えやすいポイント</h3><p class="warning">${escapeHtml(f.pitfall)}</p><h3>関連する関数・違いを比べる</h3>${related.length?`<table><thead><tr><th>関数</th><th>何が違う？</th></tr></thead><tbody>${related.map(r=>`<tr><td><button type="button" class="related-link" data-related="${escapeHtml(r.name)}">${escapeHtml(r.name)}</button></td><td>${escapeHtml(r.summary)}</td></tr>`).join('')}</tbody></table>`:'<p>関連関数は今後追加予定です。</p>'}<h3>対応バージョン</h3><p>${escapeHtml(f.version)}</p><h3>注意事項</h3><p>${escapeHtml(f.notes)}</p><p class="hint">Microsoft 365は更新チャネルや環境によって利用できる関数が異なります。財務関数の結果は計算条件による試算です。</p><a href="${f.source}" target="_blank" rel="noopener">Microsoft公式の関数一覧で確認</a>`;
 for(const b of $('detail-content').querySelectorAll('[data-copy]'))b.addEventListener('click',()=>copyFormula(f.examples[Number(b.dataset.copy)].formula,b));
 for(const b of $('detail-content').querySelectorAll('[data-related]'))b.addEventListener('click',()=>{showDetail(b.dataset.related);$('close').focus();});
 if(!$('detail').open)$('detail').showModal();
 $('detail').scrollTop=0;
}
async function copyFormula(formula,button){
 try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(formula);else{const area=document.createElement('textarea');area.value=formula;area.style.position='fixed';area.style.opacity='0';$('detail').append(area);area.select();const success=document.execCommand('copy');area.remove();if(!success)throw new Error('copy');}button.textContent='コピーしました';$('copy-status').textContent='コピーしました';clearTimeout(copyTimer);copyTimer=setTimeout(()=>{button.textContent='数式をコピー';if($('copy-status'))$('copy-status').textContent='';},2500);}catch{$('copy-status').textContent='コピーできませんでした。数式を選択してCtrl+C（Macは⌘C）でコピーしてください。';}
}
$('search').addEventListener('input',render);$('category').addEventListener('change',render);
$('reset').addEventListener('click',()=>{$('search').value='';$('category').value='';$('task').value='';selectedTask=null;render();$('search').focus();});
$('close').addEventListener('click',()=>$('detail').close());
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const rect=$('detail').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)$('detail').close();}});
// 簡易的な閲覧抑止です。ソースの秘匿やセキュリティを保証しません。
document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea,[contenteditable]'))e.preventDefault();});
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k==='f12'||((e.ctrlKey||e.metaKey)&&(k==='u'||(e.shiftKey&&['i','j','c','k'].includes(k))))||(e.metaKey&&e.altKey&&['i','j','c','u'].includes(k)))e.preventDefault();});
render();
