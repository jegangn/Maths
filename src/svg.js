export const banji = (state = "idle") => `
<svg viewBox="0 0 540 540" xmlns="http://www.w3.org/2000/svg" class="mascot banji ${state}">
  <defs>
    <linearGradient id="beak-g" x1="0" x2="1">
      <stop offset="0" stop-color="#FFC83A"/>
      <stop offset=".5" stop-color="#FF7A40"/>
      <stop offset="1" stop-color="#FF3E6B"/>
    </linearGradient>
  </defs>
  <g class="tail">
    <path d="M380,320 q60,40 30,100 q-40,10 -70,-20 z" fill="#1F1A12" stroke="#000" stroke-width="3"/>
  </g>
  <g class="body">
    <ellipse cx="270" cy="320" rx="150" ry="160" fill="#2A1B0A" stroke="#000" stroke-width="4"/>
    <ellipse cx="240" cy="370" rx="90" ry="80" fill="#FFFAF0"/>
  </g>
  <g class="wing-l">
    <path d="M170,300 q-50,30 -30,90 q60,10 90,-40 z" fill="#1F1A12" stroke="#000" stroke-width="3"/>
  </g>
  <g class="wing-r">
    <path d="M370,300 q50,30 30,90 q-60,10 -90,-40 z" fill="#1F1A12" stroke="#000" stroke-width="3"/>
  </g>
  <g class="bandana">
    <path d="M180,200 q90,-30 180,0 l-10,30 q-80,-25 -160,0 z" fill="#E03E3E"/>
    <circle cx="200" cy="215" r="6" fill="#FFFAF0"/>
    <circle cx="270" cy="205" r="6" fill="#FFFAF0"/>
    <circle cx="340" cy="215" r="6" fill="#FFFAF0"/>
  </g>
  <g class="head">
    <circle cx="270" cy="180" r="105" fill="#2A1B0A" stroke="#000" stroke-width="4"/>
    <g class="eye-l">
      <circle cx="235" cy="160" r="20" fill="#FFFAF0"/>
      <circle cx="240" cy="162" r="10" fill="#2A1B0A"/>
      <circle cx="243" cy="158" r="4" fill="#FFFAF0"/>
    </g>
    <g class="eye-r">
      <circle cx="310" cy="160" r="20" fill="#FFFAF0"/>
      <circle cx="315" cy="162" r="10" fill="#2A1B0A"/>
      <circle cx="318" cy="158" r="4" fill="#FFFAF0"/>
    </g>
  </g>
  <g class="beak">
    <path d="M255,195 q60,5 110,40 q-30,30 -90,30 q-30,0 -30,-30 z" fill="url(#beak-g)" stroke="#7A2A04" stroke-width="3"/>
    <path d="M260,225 q40,5 90,15" stroke="#7A2A04" stroke-width="2" fill="none"/>
  </g>
</svg>`;

export const mo = (state = "idle") => `
<svg viewBox="0 0 360 480" xmlns="http://www.w3.org/2000/svg" class="mascot mo ${state}">
  <g class="branch"><rect x="40" y="40" width="280" height="22" rx="11" fill="#5C3A1A"/></g>
  <g class="arm-l"><path d="M120,60 q-25,80 0,150" stroke="#8A6A4A" stroke-width="22" stroke-linecap="round" fill="none"/></g>
  <g class="arm-r"><path d="M240,60 q25,80 0,150" stroke="#8A6A4A" stroke-width="22" stroke-linecap="round" fill="none"/></g>
  <g class="body">
    <ellipse cx="180" cy="280" rx="100" ry="120" fill="#A38762"/>
    <ellipse cx="180" cy="290" rx="70" ry="90" fill="#D3B98C"/>
  </g>
  <g class="head">
    <circle cx="180" cy="200" r="78" fill="#A38762"/>
    <ellipse cx="180" cy="210" rx="62" ry="48" fill="#E6D4AC"/>
    <ellipse cx="155" cy="195" rx="22" ry="14" fill="#5C3A1A"/>
    <ellipse cx="205" cy="195" rx="22" ry="14" fill="#5C3A1A"/>
    <circle cx="155" cy="195" r="6" fill="#2A1B0A"/>
    <circle cx="205" cy="195" r="6" fill="#2A1B0A"/>
    <ellipse cx="180" cy="225" rx="10" ry="6" fill="#2A1B0A"/>
    <path d="M165,240 q15,12 30,0" stroke="#2A1B0A" stroke-width="3" fill="none"/>
  </g>
</svg>`;

export const pip = (state = "idle") => `
<svg viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg" class="mascot pip ${state}">
  <g class="tail"><path d="M260,250 q60,30 80,-20" stroke="#C97070" stroke-width="6" fill="none"/></g>
  <g class="body">
    <ellipse cx="180" cy="230" rx="110" ry="85" fill="#D9A5A5"/>
    <ellipse cx="180" cy="245" rx="80" ry="55" fill="#FFE8E8"/>
    <circle cx="140" cy="200" r="14" fill="#C97070"/>
    <circle cx="220" cy="240" r="10" fill="#C97070"/>
    <circle cx="170" cy="280" r="8" fill="#C97070"/>
  </g>
  <g class="ear-l"><circle cx="130" cy="120" r="40" fill="#D9A5A5"/><circle cx="130" cy="125" r="22" fill="#FFCCCC"/></g>
  <g class="ear-r"><circle cx="230" cy="120" r="40" fill="#D9A5A5"/><circle cx="230" cy="125" r="22" fill="#FFCCCC"/></g>
  <g class="head">
    <circle cx="180" cy="165" r="80" fill="#D9A5A5"/>
    <circle cx="155" cy="160" r="9" fill="#2A1B0A"/>
    <circle cx="205" cy="160" r="9" fill="#2A1B0A"/>
    <ellipse cx="180" cy="195" rx="14" ry="9" fill="#C97070"/>
    <path d="M170,205 q10,8 20,0" stroke="#2A1B0A" stroke-width="3" fill="none"/>
  </g>
</svg>`;

export const banana = (state = "default") => `
<svg viewBox="0 0 96 96" class="block banana ${state}">
  <path d="M20,75 q-10,-50 35,-65 q15,5 5,15 q-30,15 -25,55 z" fill="#FFD13A" stroke="#7A4A08" stroke-width="3"/>
  <path d="M55,12 q3,-5 8,-2 q3,3 -2,7 z" fill="#4AAE3F" stroke="#2A1B0A" stroke-width="2"/>
</svg>`;

export const coconut = (state = "default") => `
<svg viewBox="0 0 96 96" class="block coconut ${state}">
  <circle cx="48" cy="50" r="36" fill="#6A3A1A" stroke="#2A1B0A" stroke-width="3"/>
  <g stroke="#3A1F08" stroke-width="2" fill="none">
    <path d="M20,40 q10,8 20,2"/><path d="M55,38 q10,6 22,4"/>
    <path d="M25,55 q12,8 24,2"/><path d="M55,60 q12,6 22,2"/>
  </g>
  <circle cx="40" cy="35" r="3" fill="#FFFAF0"/>
  <circle cx="56" cy="36" r="3" fill="#FFFAF0"/>
</svg>`;

export const mango = (state = "default") => `
<svg viewBox="0 0 96 96" class="block mango ${state}">
  <path d="M48,12 q35,8 32,45 q-3,28 -32,30 q-29,-2 -32,-30 q-3,-37 32,-45 z" fill="#FF7A1A" stroke="#7A2A04" stroke-width="3"/>
  <path d="M30,30 q15,-6 30,2" stroke="#FF3E6B" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="48" cy="13" rx="3" ry="6" fill="#4AAE3F" stroke="#2A1B0A" stroke-width="2"/>
</svg>`;

export const firefly = (state = "default") => `
<svg viewBox="0 0 96 96" class="block firefly ${state}">
  <g class="glow"><circle cx="48" cy="50" r="42" fill="#FFF8C8" opacity="0"/></g>
  <g class="wing-l"><ellipse cx="32" cy="40" rx="22" ry="14" fill="#FFFAF0" opacity=".75"/></g>
  <g class="wing-r"><ellipse cx="64" cy="40" rx="22" ry="14" fill="#FFFAF0" opacity=".75"/></g>
  <g class="body">
    <ellipse cx="48" cy="55" rx="18" ry="22" fill="#FFE680" stroke="#6A4A08" stroke-width="3"/>
    <ellipse cx="48" cy="68" rx="14" ry="10" fill="#FFD13A"/>
    <circle cx="44" cy="48" r="3" fill="#2A1B0A"/>
    <circle cx="52" cy="48" r="3" fill="#2A1B0A"/>
  </g>
</svg>`;
