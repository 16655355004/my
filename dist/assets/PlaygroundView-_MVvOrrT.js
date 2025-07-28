import{d as g,g as r,S as v,r as u,o as x,c as p,a as e,b as m,e as f,w,f as k,v as C,t as c,n as S,E as P,h as b,_ as A}from"./index-9D5d5A6B.js";const $={class:"playground-page"},O={class:"container"},q={class:"playground-content"},E={class:"editor-section"},V={class:"editor-header"},h={class:"preset-buttons"},N={class:"editor-controls"},T=["disabled"],D=g({__name:"PlaygroundView",setup(G){r.registerPlugin(v);const i=u(`// 欢迎使用GSAP动画实验室！
// 这里是一个基础动画示例
gsap.to(".playground-box", {
  x: 200,
  y: 100,
  rotation: 360,
  scale: 1.5,
  duration: 2,
  ease: "power2.inOut",
  yoyo: true,
  repeat: 1
});`),l=u(!1),s=u(""),y=()=>{if(!l.value){l.value=!0;try{s.value="正在执行动画...",r.set(".playground-box",{clearProps:"all"}),new Function("gsap","document","window",`
      try {
        ${i.value}
      } catch (error) {
        console.error("Animation execution error:", error);
        throw error;
      }
    `)(r,document,window),s.value="动画执行成功！",setTimeout(()=>{l.value=!1,s.value=""},3e3)}catch(t){console.error("Animation error:",t);const o=t instanceof Error?t.message:String(t);s.value="代码执行出错: "+o,setTimeout(()=>{s.value=""},5e3),l.value=!1}}},d=()=>{r.killTweensOf(".playground-box"),r.set(".playground-box",{clearProps:"all"}),l.value=!1,document.querySelectorAll(".clone-box").forEach(o=>o.remove());const t=document.querySelector(".playground-box");t&&(t.removeAttribute("style"),r.set(t,{clearProps:"all"}))},n=t=>{d();const o={basic:`// 基础动画
gsap.to(".playground-box", {
  x: 200,
  y: 100,
  rotation: 360,
  duration: 2,
  ease: "power2.out"
});`,timeline:`// 时间轴动画
var tl = gsap.timeline();
tl.to(".playground-box", { x: 100, duration: 0.5 })
  .to(".playground-box", { y: -50, duration: 0.5 })
  .to(".playground-box", { rotation: 360, duration: 0.5 })
  .to(".playground-box", { scale: 1.5, duration: 0.5 });`,bounce:`// 弹跳动画
gsap.to(".playground-box", {
  y: -100,
  duration: 0.6,
  ease: "power2.out",
  yoyo: true,
  repeat: 3
});`,morph:`// 变形动画
gsap.to(".playground-box", {
  borderRadius: "50%",
  backgroundColor: "#ff5722",
  scale: 1.2,
  duration: 1,
  ease: "elastic.out(1, 0.3)",
  yoyo: true,
  repeat: 1
});`,colors:`// 颜色渐变动画
gsap.to(".playground-box", {
  backgroundColor: "#ff1493",
  boxShadow: "0 0 20px #ff1493",
  duration: 2,
  yoyo: true,
  repeat: 1,
  ease: "sine.inOut"
});`,rotate3d:`// 3D旋转动画
gsap.to(".playground-box", {
  rotationY: 360,
  rotationX: 180,
  duration: 2,
  ease: "power1.inOut",
  transformPerspective: 800
});`,stagger:`// 交错动画示例
// 首先创建几个克隆元素
const box = document.querySelector(".playground-box");
const parent = box.parentElement;
box.style.position = "absolute";

// 清除之前可能存在的克隆元素
document.querySelectorAll(".clone-box").forEach(el => el.remove());

// 创建5个克隆
for (let i = 0; i < 5; i++) {
  const clone = box.cloneNode();
  clone.classList.add("clone-box");
  clone.style.opacity = "0.6";
  parent.appendChild(clone);
}

// 应用交错动画
gsap.to(".playground-box, .clone-box", {
  x: i => i * 20 - 40,
  y: i => i * 15 - 30,
  rotation: 90,
  scale: 0.8,
  duration: 1,
  stagger: 0.2,
  ease: "back.out"
});`,path:`// 曲线路径动画 (使用基础动画模拟)
const box = document.querySelector(".playground-box");
box.style.position = "absolute";

// 创建曲线路径动画时间轴
const tl = gsap.timeline({ repeat: 1, yoyo: true });

tl.to(".playground-box", {
  x: 100,
  y: -50,
  rotation: 45,
  duration: 1,
  ease: "power1.inOut"
})
.to(".playground-box", {
  x: 200,
  y: 0,
  rotation: 90,
  duration: 1,
  ease: "power1.inOut"
})
.to(".playground-box", {
  x: 300,
  y: 50,
  rotation: 135,
  duration: 1,
  ease: "power1.inOut"
});`,elastic:`// 弹性缓动动画
gsap.to(".playground-box", {
  x: 200,
  rotation: 90,
  scale: 2,
  duration: 2,
  ease: "elastic.out(1, 0.3)",
  yoyo: true,
  repeat: 1
});`,shake:`// 抖动效果
gsap.timeline()
  .to(".playground-box", {x: -10, duration: 0.1})
  .to(".playground-box", {x: 10, duration: 0.1})
  .to(".playground-box", {x: -8, duration: 0.1})
  .to(".playground-box", {x: 8, duration: 0.1})
  .to(".playground-box", {x: -5, duration: 0.1})
  .to(".playground-box", {x: 5, duration: 0.1})
  .to(".playground-box", {x: 0, duration: 0.1});`};i.value=o[t]||o.basic};return x(()=>{r.from(".playground-header",{opacity:0,y:50,duration:1,ease:"power3.out"}),r.from(".playground-content",{opacity:0,y:30,duration:.8,delay:.3,ease:"power2.out"}),r.to(".playground-box",{y:-10,duration:2,ease:"power1.inOut",yoyo:!0,repeat:-1})}),(t,o)=>(b(),p("div",$,[e("div",O,[o[13]||(o[13]=e("div",{class:"playground-header"},[e("h1",{class:"page-title"},"动画实验室"),e("p",{class:"page-subtitle"},"在这里实时体验和测试GSAP动画效果")],-1)),e("div",q,[e("div",E,[e("div",V,[o[11]||(o[11]=e("h3",null,"动画代码",-1)),e("div",h,[e("button",{class:"preset-btn",onClick:o[0]||(o[0]=a=>n("basic"))},"基础"),e("button",{class:"preset-btn",onClick:o[1]||(o[1]=a=>n("timeline"))},"时间轴"),e("button",{class:"preset-btn",onClick:o[2]||(o[2]=a=>n("bounce"))},"弹跳"),e("button",{class:"preset-btn",onClick:o[3]||(o[3]=a=>n("morph"))},"变形"),e("button",{class:"preset-btn",onClick:o[4]||(o[4]=a=>n("colors"))},"颜色渐变"),e("button",{class:"preset-btn",onClick:o[5]||(o[5]=a=>n("rotate3d"))},"3D旋转"),e("button",{class:"preset-btn",onClick:o[6]||(o[6]=a=>n("stagger"))},"交错"),e("button",{class:"preset-btn",onClick:o[7]||(o[7]=a=>n("path"))},"路径"),e("button",{class:"preset-btn",onClick:o[8]||(o[8]=a=>n("elastic"))},"弹性"),e("button",{class:"preset-btn",onClick:o[9]||(o[9]=a=>n("shake"))},"抖动")])]),w(e("textarea",{"onUpdate:modelValue":o[10]||(o[10]=a=>i.value=a),class:"code-editor",placeholder:"在这里输入你的GSAP动画代码..."},null,512),[[C,i.value]]),e("div",N,[e("button",{class:"control-btn run-btn",onClick:y,disabled:l.value},c(l.value?"运行中...":"运行动画"),9,T),e("button",{class:"control-btn reset-btn",onClick:d},"重置")]),s.value?(b(),p("div",{key:0,class:S(["status-message",{error:s.value.includes("出错")}])},c(s.value),3)):k("",!0)]),o[12]||(o[12]=f('<div class="preview-section" data-v-afce0240><div class="preview-header" data-v-afce0240><h3 data-v-afce0240>动画预览</h3></div><div class="preview-area" data-v-afce0240><div class="playground-box" data-v-afce0240></div><div class="grid-background" data-v-afce0240></div></div><div class="preview-info" data-v-afce0240><p data-v-afce0240>上面的蓝色方块是你的动画目标 (.playground-box)</p><p data-v-afce0240>编写GSAP代码来控制它，然后点击&quot;运行动画&quot;</p></div></div>',1))])]),m(P)]))}}),B=A(D,[["__scopeId","data-v-afce0240"]]);export{B as default};
