// مكتبة رسومات flat (SVG) بستايل البراند: خط أسود سميك، cream/أبيض، والبرتقالي لتفصيلة واحدة.
// كل prop: viewBox ثابت + أجزاء ليها id (prefix) عشان GSAP يحرّكها. مفيش صور خارجية، كله كود.
const K = "#141414", P = "#F4EEE3", W = "#FFFFFF", S = "#E6DCCB", A = "#EC4E2A", G = "#B9AE9C";
const st = `stroke="${K}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;

export const PROPS = {
  // محل / سوبر ماركت
  shop: (id, o = {}) => ({ w: 420, h: 360, svg: `
    <rect x="20" y="70" width="380" height="270" fill="${W}" ${st}/>
    <g id="${id}-awn">${Array.from({ length: 8 }, (_, i) => `<path d="M${20 + i * 47.5} 70 h47.5 v38 a23.75 23.75 0 0 1 -47.5 0z" fill="${i % 2 ? W : A}" ${st}/>`).join("")}</g>
    <rect x="40" y="20" width="340" height="50" fill="${K}"/>
    <text x="210" y="56" text-anchor="middle" font-family="FB Readex" font-weight="700" font-size="30" fill="${P}">${o.sign ?? "سوبر ماركت"}</text>
    <rect x="50" y="150" width="190" height="130" fill="${S}" ${st}/>
    ${[0, 1, 2].map((r) => `<line x1="50" y1="${185 + r * 32}" x2="240" y2="${185 + r * 32}" ${st}/>`).join("")}
    <g id="${id}-goods">${[0, 1, 2].flatMap((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${62 + c * 35}" y="${160 + r * 32}" width="22" height="22" rx="3" fill="${(r + c) % 3 ? W : G}" stroke="${K}" stroke-width="3"/>`)).join("")}</g>
    <rect x="270" y="150" width="105" height="190" fill="${S}" ${st}/>
    <circle cx="355" cy="250" r="6" fill="${K}"/>
    <rect x="285" y="170" width="75" height="40" fill="${W}" stroke="${K}" stroke-width="3"/>
    <text x="322" y="198" text-anchor="middle" font-family="FB Readex" font-weight="700" font-size="20" fill="${K}">${o.door ?? "مفتوح"}</text>` }),

  // مصنع بسقف sawtooth ومدخنة بتطلّع دخان
  factory: (id) => ({ w: 460, h: 380, svg: `
    <g id="${id}-smoke">${[0, 1, 2].map((i) => `<circle class="${id}-puff" cx="${375 + i * 8}" cy="${70 - i * 30}" r="${16 + i * 6}" fill="${W}" stroke="${K}" stroke-width="4"/>`).join("")}</g>
    <rect x="350" y="80" width="50" height="130" fill="${S}" ${st}/>
    <rect x="350" y="80" width="50" height="18" fill="${A}" ${st}/>
    <path d="M30 360 V170 l80 -60 v60 l80 -60 v60 l80 -60 v60 l80 -60 v250 z" fill="${W}" ${st}/>
    <path d="M30 360 H430 V210 H350" fill="none" ${st}/>
    <rect x="70" y="230" width="70" height="55" fill="${S}" ${st}/><rect x="170" y="230" width="70" height="55" fill="${S}" ${st}/>
    <rect x="270" y="270" width="90" height="90" fill="${G}" ${st}/>
    ${[0, 1, 2, 3].map((i) => `<line x1="270" y1="${288 + i * 18}" x2="360" y2="${288 + i * 18}" stroke="${K}" stroke-width="3"/>`).join("")}` }),

  // عربية توزيع (العجل بيلف)
  truck: (id, o = {}) => ({ w: 480, h: 260, svg: `
    <rect x="20" y="30" width="290" height="170" rx="8" fill="${W}" ${st}/>
    <text x="165" y="128" text-anchor="middle" font-family="FB Readex" font-weight="700" font-size="34" fill="${K}">${o.label ?? "توزيع"}</text>
    <path d="M310 80 h90 l55 60 v60 h-145 z" fill="${S}" ${st}/>
    <path d="M330 95 h62 l38 42 h-100 z" fill="${W}" ${st}/>
    <rect x="440" y="170" width="22" height="14" fill="${A}" stroke="${K}" stroke-width="3"/>
    ${[95, 385].map((cx, i) => `<g id="${id}-w${i}" style="transform-box:fill-box;transform-origin:center"><circle cx="${cx}" cy="205" r="38" fill="${K}"/><circle cx="${cx}" cy="205" r="15" fill="${P}"/><line x1="${cx}" y1="172" x2="${cx}" y2="190" stroke="${P}" stroke-width="5"/></g>`).join("")}` }),

  // كاشير: الدرج بيتفتح، والشاشة فيها رقم
  register: (id, o = {}) => ({ w: 380, h: 330, svg: `
    <rect x="110" y="20" width="160" height="70" rx="8" fill="${K}"/>
    <text id="${id}-display" x="190" y="68" text-anchor="middle" font-family="FB Inter" font-weight="800" font-size="34" fill="${A}">${o.display ?? "0"}</text>
    <rect x="175" y="90" width="30" height="40" fill="${G}" ${st}/>
    <path d="M40 130 h300 l20 120 h-340 z" fill="${W}" ${st}/>
    ${[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => `<rect x="${95 + c * 50}" y="${150 + r * 28}" width="36" height="18" rx="4" fill="${S}" stroke="${K}" stroke-width="3"/>`)).join("")}
    <g id="${id}-drawer"><rect x="40" y="250" width="320" height="55" fill="${S}" ${st}/><rect x="170" y="268" width="60" height="12" rx="6" fill="${K}"/></g>` }),

  // موبايل عليه إشعارات
  phone: (id, o = {}) => ({ w: 260, h: 460, svg: `
    <rect x="20" y="10" width="220" height="440" rx="34" fill="${K}"/>
    <rect x="34" y="40" width="192" height="380" rx="18" fill="${P}"/>
    <rect x="100" y="22" width="60" height="10" rx="5" fill="${G}"/>
    ${(o.notes ?? ["أوردر جديد", "أوردر جديد", "تم الدفع"]).map((t, i) => `<g id="${id}-n${i}"><rect x="46" y="${70 + i * 92}" width="168" height="76" rx="14" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="74" cy="${108 + i * 92}" r="14" fill="${i === 0 ? A : G}"/><text x="142" y="${115 + i * 92}" text-anchor="middle" font-family="FB Readex" font-weight="600" font-size="22" fill="${K}">${t}</text></g>`).join("")}` }),

  // كراتين مخزون
  boxes: (id, o = {}) => ({ w: 380, h: 330, svg: `${[[30, 190], [150, 190], [270, 190], [90, 70], [210, 70]].slice(0, o.count ?? 5).map(([x, y], i) => `
    <g class="${id}-box" id="${id}-b${i}"><rect x="${x}" y="${y}" width="110" height="115" fill="${S}" ${st}/><line x1="${x + 55}" y1="${y}" x2="${x + 55}" y2="${y + 35}" stroke="${K}" stroke-width="4"/><rect x="${x + 22}" y="${y + 60}" width="66" height="28" fill="${W}" stroke="${K}" stroke-width="3"/></g>`).join("")}
    <line x1="10" y1="310" x2="370" y2="310" ${st}/>` }),

  // فلوس: رزمة + عملات بتنزل
  cash: (id) => ({ w: 360, h: 300, svg: `
    ${[0, 1, 2].map((i) => `<g id="${id}-bill${i}"><rect x="${40 + i * 10}" y="${150 - i * 22}" width="240" height="110" rx="10" fill="${i === 2 ? W : S}" ${st}/><circle cx="${160 + i * 10}" cy="${205 - i * 22}" r="28" fill="none" stroke="${K}" stroke-width="4"/><text x="${160 + i * 10}" y="${216 - i * 22}" text-anchor="middle" font-family="FB Inter" font-weight="900" font-size="30" fill="${K}">£</text></g>`).join("")}
    ${[0, 1, 2].map((i) => `<g id="${id}-coin${i}"><ellipse cx="${300 - i * 4}" cy="${250 - i * 18}" rx="40" ry="14" fill="${A}" ${st}/></g>`).join("")}` }),

  // فرن مخبز (الشباك بينوّر)
  oven: (id) => ({ w: 360, h: 380, svg: `
    <rect x="30" y="20" width="300" height="330" rx="14" fill="${W}" ${st}/>
    <rect x="30" y="20" width="300" height="60" rx="14" fill="${S}" ${st}/>
    ${[90, 150, 210, 270].map((x) => `<circle cx="${x}" cy="50" r="14" fill="${W}" stroke="${K}" stroke-width="4"/>`).join("")}
    <rect x="60" y="110" width="240" height="170" rx="12" fill="${K}" ${st}/>
    <rect id="${id}-glow" x="74" y="124" width="212" height="142" rx="8" fill="${A}" opacity="0.25"/>
    <path d="M110 240 q70 -40 140 0" fill="none" stroke="${P}" stroke-width="6"/>
    <rect x="90" y="300" width="180" height="16" rx="8" fill="${K}"/>` }),

  // فاتورة آجل بختم
  invoice: (id, o = {}) => ({ w: 300, h: 380, svg: `
    <path d="M30 20 h240 v340 l-20 -14 -20 14 -20 -14 -20 14 -20 -14 -20 14 -20 -14 -20 14 -20 -14 -20 14 -20 -14 -20 14 z" fill="${W}" ${st}/>
    <text x="150" y="70" text-anchor="middle" font-family="FB Readex" font-weight="700" font-size="30" fill="${K}">فاتورة</text>
    ${[0, 1, 2, 3].map((i) => `<line x1="60" y1="${110 + i * 40}" x2="${240 - (i % 2) * 40}" y2="${110 + i * 40}" stroke="${G}" stroke-width="8"/>`).join("")}
    <text x="150" y="330" text-anchor="middle" font-family="FB Inter" font-weight="800" font-size="34" fill="${K}">${o.amount ?? "100,000"}</text>
    <g id="${id}-stamp"><rect x="40" y="210" width="150" height="60" rx="8" fill="none" stroke="${A}" stroke-width="6" transform="rotate(-12 115 240)"/><text x="115" y="252" text-anchor="middle" font-family="FB Readex" font-weight="700" font-size="30" fill="${A}" transform="rotate(-12 115 240)">${o.stamp ?? "آجل 60 يوم"}</text></g>` }),
};

// خلفية "أوضة" زي الستايل الإيزومتري: حيطتين + أرضية + بلاط خفيف + شريط مخطط فوق
export function roomSvg(id, { tiles = true } = {}) {
  return `<svg id="${id}-room" width="1080" height="1920" viewBox="0 0 1080 1920" style="position:absolute;inset:0">
    <defs><pattern id="${id}-hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="${P}"/><line x1="0" y1="0" x2="0" y2="16" stroke="${K}" stroke-width="3"/></pattern></defs>
    <rect width="1080" height="1920" fill="#EFE7D9"/>
    <polygon points="0,0 1080,0 1080,1120 0,1240" fill="#EDE3D3"/>
    <polygon points="0,1240 1080,1120 1080,1920 0,1920" fill="#E4D8C4"/>
    ${tiles ? Array.from({ length: 9 }, (_, i) => `<line x1="${i * 135}" y1="0" x2="${i * 135}" y2="${1240 - i * 135 * (120 / 1080)}" stroke="#D9CDB9" stroke-width="3"/>`).join("") + Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${(i + 1) * 150}" x2="1080" y2="${(i + 1) * 150}" stroke="#D9CDB9" stroke-width="3"/>`).join("") : ""}
    <line x1="0" y1="1240" x2="1080" y2="1120" stroke="${K}" stroke-width="5"/>
    <rect x="0" y="0" width="1080" height="56" fill="url(#${id}-hatch)"/><line x1="0" y1="56" x2="1080" y2="56" stroke="${K}" stroke-width="5"/>
  </svg>`;
}
