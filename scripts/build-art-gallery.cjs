const fs = require("node:fs");
const { monsters, stories } = require("./engine-loader.cjs");
const manifest = JSON.parse(
  fs.readFileSync("assets/art-production-manifest.json", "utf8"),
);
const data = {
  enemies: monsters.MONSTERS.map((m) => ({
    id: m.id,
    name: m.name,
    path: "../assets/combat/" + m.visual + "-motion.png",
  })),
  stories: manifest.stories.map((a) => ({
    id: a.id,
    path: "../" + a.path,
    title: stories.STORY_CHAINS.find((c) => c.id === a.id).title,
    labels: stories.STORY_CHAINS.find((c) => c.id === a.id).stages.map(
      (s) => s.title,
    ),
  })),
  npcs: (manifest.npcs || []).map((a) => ({
    id: a.id,
    name: a.name,
    path: "../" + a.path,
  })),
};
const page = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Labyrinth Ascent — Art gallery</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#09131d;color:#e6e4d9;font:16px system-ui;line-height:1.5}main{max-width:1200px;margin:auto;padding:32px 20px}h1,h2{font-family:Georgia,serif;color:#ebca87}h1{font-size:38px;margin:0}p{color:#b7c2c9}a{color:#eed49f}button,input,select{font:inherit;background:#142635;color:#f5eddb;border:1px solid #826c45;border-radius:6px;padding:9px}button{cursor:pointer}button[aria-pressed=true]{background:#344d57;border-color:#f2cd83}nav{display:flex;gap:22px;margin:20px 0 30px;flex-wrap:wrap}section{padding:12px 0 32px;border-top:1px solid #3a4850}.layout{display:grid;grid-template-columns:minmax(220px,1fr) 2fr;gap:24px}.list{display:grid;gap:6px;max-height:590px;overflow:auto}.viewer{position:sticky;top:16px;align-self:start;background:#0e202e;border:1px solid #53606a;border-radius:12px;padding:16px}.viewer canvas{display:block;width:min(100%,320px);margin:0 auto;background:repeating-conic-gradient(#253744 0% 25%,#1a2c39 0% 50%) 50%/24px 24px;image-rendering:pixelated;border-radius:8px}.controls{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center}.controls label{display:flex;align-items:center;gap:8px}.controls input{max-width:150px}article{margin:28px 0}article h3{font:24px Georgia;color:#e7cb97;margin:0 0 12px}.panels{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.crop{position:relative;aspect-ratio:1.6;overflow:hidden;border:1px solid #52606a;border-radius:8px}.crop img{position:absolute;width:104%;height:312%;left:-2%;object-fit:fill}figure{margin:0}figcaption{font-size:13px;color:#bec9cc;margin:6px 0}.npcs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.npcs img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:10px}small{color:#9eafb9}#error{color:#ffafa3}input[type=search]{width:100%;margin-bottom:12px}@media(max-width:700px){.layout{grid-template-columns:1fr}.viewer{position:static;grid-row:1}.list{max-height:260px}.panels{grid-template-columns:1fr}.npcs{grid-template-columns:1fr}h1{font-size:30px}}
</style><main>
<h1>Labyrinth Ascent</h1><p>Artwork review · Enemy animation sheets, authored story stages and recurring NPC portraits. Story illustrations contain campaign spoilers.</p>
<nav><a href="#enemies">Enemy animations</a><a href="#stories">Story stages</a><a href="#npcs">Recurring characters</a><a href="../assets/art-production-manifest.json">Generation prompts and provenance</a></nav>
<section id="enemies"><h2>Enemy animations</h2><p id="enemyCount"></p><div class="layout"><div><input id="enemySearch" type="search" placeholder="Find an enemy" aria-label="Find an enemy"><div class="list" id="enemyList"></div></div><div class="viewer"><h3 id="enemyName"></h3><canvas id="sprite" width="256" height="256" aria-label="Selected enemy animation"></canvas><div class="controls"><label>Animation <select id="row"><option>Idle</option><option>Walk</option><option>Attack</option><option>Hit</option><option>Defeat</option><option>Skill</option></select></label><button id="play" aria-pressed="false">Play</button><label>Frame <input id="frame" type="range" min="0" max="7" value="0"><output id="frameNumber">1</output></label></div><p><a id="sheetLink">Open full sheet</a></p><small>Fixed grid: eight columns, six rows. This viewer checks the source frames; it does not simulate combat timing or certify device behavior.</small><p id="error" role="alert"></p></div></div></section>
<section id="stories"><h2>Authored story stages</h2><p id="storyCount"></p><input type="search" id="storySearch" placeholder="Find a companion, floor or route" aria-label="Find a story"><div id="storyList"></div></section>
<section id="npcs"><h2>Recurring characters</h2><div id="npcList" class="npcs"></div></section>
</main><script>
const data=${JSON.stringify(data).replaceAll("<", "\\u003c")};
const $=id=>document.getElementById(id), canvas=$("sprite"),ctx=canvas.getContext("2d");let image=null,current=null,playing=false,last=0;
function draw(){ctx.clearRect(0,0,256,256);if(!image)return;const cw=image.naturalWidth/8,ch=image.naturalHeight/6,frame=Number($("frame").value),row=$("row").selectedIndex;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,frame*cw,row*ch,cw,ch,0,0,256,256);$("frameNumber").value=String(frame+1)}
function select(e){current=e.id;$("enemyName").textContent=e.name;$("sheetLink").href=e.path;$("error").textContent="";image=null;draw();const next=new Image();next.onload=()=>{if(current===e.id){image=next;draw()}};next.onerror=()=>{$("error").textContent="Could not load this sheet."};next.src=e.path;document.querySelectorAll("#enemyList button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.id===e.id)))}
function enemyList(){const query=$("enemySearch").value.toLowerCase();$("enemyList").replaceChildren();for(const e of data.enemies.filter(e=>(e.name+" "+e.id).toLowerCase().includes(query))){const b=document.createElement("button");b.textContent=e.name;b.dataset.id=e.id;b.setAttribute("aria-pressed",String(current===e.id));b.onclick=()=>select(e);$("enemyList").append(b)}}
$("enemyCount").textContent=data.enemies.length+" species, each with its own transparent animation sheet.";$("enemySearch").oninput=enemyList;$("row").onchange=()=>{$("frame").value="0";draw()};$("frame").oninput=draw;$("play").onclick=()=>{playing=!playing;$("play").textContent=playing?"Pause":"Play";$("play").setAttribute("aria-pressed",String(playing))};
function tick(time){if(playing&&time-last>=125){$("frame").value=String((Number($("frame").value)+1)%8);draw();last=time}requestAnimationFrame(tick)}requestAnimationFrame(tick);enemyList();select(data.enemies[0]);
$("storyCount").textContent=data.stories.length+" chains · "+data.stories.length*3+" individually illustrated stages.";
function storyList(){const query=$("storySearch").value.toLowerCase();$("storyList").replaceChildren();for(const s of data.stories.filter(s=>(s.id+" "+s.title).toLowerCase().includes(query))){const a=document.createElement("article"),h=document.createElement("h3"),panels=document.createElement("div");h.textContent=s.id+" · "+s.title;panels.className="panels";s.labels.forEach((label,index)=>{const figure=document.createElement("figure"),crop=document.createElement("div"),img=document.createElement("img"),caption=document.createElement("figcaption");crop.className="crop";img.src=s.path;img.alt=label;img.loading="lazy";img.decoding="async";img.style.top=(-index*104-2)+"%";caption.textContent=(index+1)+". "+label;crop.append(img);figure.append(crop,caption);panels.append(figure)});a.append(h,panels);$("storyList").append(a)}}$("storySearch").oninput=storyList;storyList();
for(const n of data.npcs){const figure=document.createElement("figure"),img=document.createElement("img"),caption=document.createElement("figcaption");img.src=n.path;img.alt=n.name;img.loading="lazy";caption.textContent=n.name;figure.append(img,caption);$("npcList").append(figure)}
</script></html>`;
fs.writeFileSync("docs/art-gallery.html", page);
console.log(
  `Saved docs/art-gallery.html: ${data.enemies.length} species, ${data.stories.length * 3} panels, ${data.npcs.length} portraits`,
);
