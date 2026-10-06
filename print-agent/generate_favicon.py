import math
import os
from PIL import Image, ImageDraw

SVG_CONTENT = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Rich Gradients -->
    <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <linearGradient id="racingRed" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#ff1e38"/>
      <stop offset="60%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>

    <linearGradient id="flameOrange" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>

    <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>

    <filter id="gearShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Mechanical Gear / Corona Dentada Exterior (12 Dientes Industriales) -->
  <g filter="url(#gearShadow)">
    <path fill="url(#gearGradient)" stroke="#334155" stroke-width="6" fill-rule="evenodd" d="
      M 256,12
      L 278,14 L 284,52 L 314,62 L 344,36 L 364,48 L 356,86 L 382,100 L 418,84 L 434,102 L 412,136 L 432,158 L 470,154 L 478,176 L 444,204 L 456,234 L 492,244 L 492,268 L 456,278 L 444,308 L 478,336 L 470,358 L 432,354 L 412,376 L 434,410 L 418,428 L 382,412 L 356,426 L 364,464 L 344,476 L 314,450 L 284,460 L 278,498 L 256,500 L 234,498 L 228,460 L 198,450 L 168,476 L 148,464 L 156,426 L 130,412 L 94,428 L 78,410 L 100,376 L 80,354 L 42,358 L 34,336 L 68,308 L 56,278 L 20,268 L 20,244 L 56,234 L 68,204 L 34,176 L 42,154 L 80,158 L 100,136 L 78,102 L 94,84 L 130,100 L 156,86 L 148,48 L 168,36 L 198,62 L 228,52 L 234,14 Z
    "/>

    <!-- Inner Gear Rim Accent -->
    <circle cx="256" cy="256" r="186" fill="none" stroke="#475569" stroke-width="4" opacity="0.6"/>

    <!-- Fondo de contraste blanco / plata pulido -->
    <circle cx="256" cy="256" r="176" fill="#ffffff" stroke="#e2e8f0" stroke-width="4"/>
  </g>

  <!-- Dynamic Racing Speed Streaks (Líneas de velocidad de escape) -->
  <g fill="none" stroke="url(#racingRed)" stroke-linecap="round">
    <path d="M 106,192 L 205,192" stroke-width="11"/>
    <path d="M 88,228 L 190,228" stroke-width="13"/>
    <path d="M 102,264 L 168,264" stroke-width="11"/>
    <path d="M 128,158 L 235,158" stroke-width="8"/>
  </g>

  <!-- Track / Ground Shadow -->
  <path d="M 145,372 C 205,378 320,378 395,372" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>

  <!-- Rueda Trasera (Left Wheel) -->
  <circle cx="184" cy="318" r="48" fill="#0f172a" stroke="#334155" stroke-width="6"/>
  <circle cx="184" cy="318" r="30" fill="#f8fafc" stroke="#dc2626" stroke-width="8"/>
  <circle cx="184" cy="318" r="12" fill="#0f172a"/>

  <!-- Rueda Delantera (Right Wheel) -->
  <circle cx="356" cy="318" r="48" fill="#0f172a" stroke="#334155" stroke-width="6"/>
  <circle cx="356" cy="318" r="30" fill="#f8fafc" stroke="#dc2626" stroke-width="8"/>
  <circle cx="356" cy="318" r="12" fill="#0f172a"/>

  <!-- Bloque Motor & Escape Deportivo (Dark & Chrome) -->
  <path d="M 165,308 L 225,296 L 248,322 L 282,322 L 265,278 L 208,290 Z" fill="#1e293b"/>
  <path d="M 160,314 L 212,302 L 226,310 L 168,324 Z" fill="url(#silverRim)" stroke="#334155" stroke-width="1.5"/>

  <!-- Chasis y Carrocería de Moto Deportiva Racing Red -->
  <path d="
    M 180,270
    C 198,232 232,220 262,220
    C 280,220 306,232 328,245
    C 354,258 378,272 388,292
    C 392,302 380,310 365,308
    C 344,306 326,290 308,274
    C 290,262 272,268 254,286
    C 236,304 212,305 185,294
    Z
  " fill="url(#racingRed)"/>

  <!-- Carenado Delantero / Cúpula Aerodinámica -->
  <path d="
    M 322,228
    C 342,198 368,194 388,238
    C 390,244 374,256 358,256
    C 338,256 328,242 322,228
    Z
  " fill="url(#racingRed)"/>
  
  <!-- Parabrisas / Visera Cúpula Tintada -->
  <path d="
    M 338,218
    C 352,202 368,200 380,226
    C 370,234 354,234 338,218
    Z
  " fill="#0f172a"/>

  <!-- Silueta de Piloto Agresivo en Posición de Ataque -->
  <!-- Espalda / Traje Racing (Negro / Rojo) -->
  <path d="
    M 208,258
    C 226,208 258,184 300,196
    C 306,200 282,218 258,240
    C 244,252 226,260 208,258
    Z
  " fill="#0f172a"/>
  
  <path d="
    M 232,228
    C 248,202 272,190 296,198
    C 280,208 262,222 248,236
    Z
  " fill="url(#racingRed)"/>

  <!-- Casco Racing Aerodinámico -->
  <path d="
    M 298,172
    C 298,150 322,146 338,162
    C 350,174 346,194 328,196
    C 308,196 298,186 298,172
    Z
  " fill="#0f172a"/>
  
  <!-- Visor del Casco (Brillo Blanco Espejo) -->
  <path d="
    M 320,164
    C 330,162 340,168 340,178
    C 332,182 322,178 316,172
    Z
  " fill="#ffffff"/>

  <!-- Franjas & Reflejos Blancos de Alta Velocidad -->
  <path d="M 276,238 C 300,248 326,260 348,274" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M 218,268 C 242,272 260,280 272,292" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
</svg>'''

def generate_icons():
    workspace = r"c:\Users\Alexis\Documents\Development\Ssvel\Ferventa\ferventa-web"
    public_dir = os.path.join(workspace, "public")
    
    # 1. Write SVG
    svg_path = os.path.join(public_dir, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(SVG_CONTENT.strip())
    print("Updated SVG:", svg_path)

    # 2. Supersampled PIL Rendering at 1024x1024 for high quality antialiasing
    canvas_size = 1024
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = 2.0  # From 512 coordinate space to 1024
    def s(val):
        return val * scale

    cx, cy = 512, 512
    r_outer = s(240)
    r_inner = s(195)

    # 12 Gear Teeth with trapezoidal bevels
    num_teeth = 12
    gear_points = []
    for i in range(num_teeth * 2):
        angle = i * (math.pi / num_teeth)
        if i % 2 == 0:
            # Outer tooth flat top
            gear_points.append((cx + r_outer * math.cos(angle - 0.09), cy + r_outer * math.sin(angle - 0.09)))
            gear_points.append((cx + r_outer * math.cos(angle + 0.09), cy + r_outer * math.sin(angle + 0.09)))
        else:
            # Inner tooth root
            gear_points.append((cx + r_inner * math.cos(angle - 0.13), cy + r_inner * math.sin(angle - 0.13)))
            gear_points.append((cx + r_inner * math.cos(angle + 0.13), cy + r_inner * math.sin(angle + 0.13)))

    # Outer Gear Body (Solid Slate Navy)
    draw.polygon(gear_points, fill=(15, 23, 42, 255), outline=(51, 65, 85, 255))

    # Inner circular badge (Crisp white background)
    r_badge = s(176)
    draw.ellipse([cx - r_badge, cy - r_badge, cx + r_badge, cy + r_badge], fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=int(s(4)))

    # Speed lines
    draw.line([(s(106), s(192)), (s(205), s(192))], fill=(225, 29, 72, 245), width=int(s(11)))
    draw.line([(s(88), s(228)), (s(190), s(228))], fill=(225, 29, 72, 245), width=int(s(13)))
    draw.line([(s(102), s(264)), (s(168), s(264))], fill=(225, 29, 72, 245), width=int(s(11)))
    draw.line([(s(128), s(158)), (s(235), s(158))], fill=(225, 29, 72, 245), width=int(s(8)))

    # Wheels
    # Rear (Left)
    rw_cx, rw_cy = s(184), s(318)
    draw.ellipse([rw_cx - s(48), rw_cy - s(48), rw_cx + s(48), rw_cy + s(48)], fill=(15, 23, 42, 255), outline=(51, 65, 85, 255), width=int(s(6)))
    draw.ellipse([rw_cx - s(30), rw_cy - s(30), rw_cx + s(30), rw_cy + s(30)], fill=(248, 250, 252, 255), outline=(220, 38, 38, 255), width=int(s(8)))
    draw.ellipse([rw_cx - s(12), rw_cy - s(12), rw_cx + s(12), rw_cy + s(12)], fill=(15, 23, 42, 255))

    # Front (Right)
    fw_cx, fw_cy = s(356), s(318)
    draw.ellipse([fw_cx - s(48), fw_cy - s(48), fw_cx + s(48), fw_cy + s(48)], fill=(15, 23, 42, 255), outline=(51, 65, 85, 255), width=int(s(6)))
    draw.ellipse([fw_cx - s(30), fw_cy - s(30), fw_cx + s(30), fw_cy + s(30)], fill=(248, 250, 252, 255), outline=(220, 38, 38, 255), width=int(s(8)))
    draw.ellipse([fw_cx - s(12), fw_cy - s(12), fw_cx + s(12), fw_cy + s(12)], fill=(15, 23, 42, 255))

    # Track shadow
    draw.line([(s(145), s(372)), (s(395), s(372))], fill=(15, 23, 42, 255), width=int(s(8)))

    # Mechanical Engine & Exhaust
    draw.polygon([(s(165), s(308)), (s(225), s(296)), (s(248), s(322)), (s(282), s(322)), (s(265), s(278)), (s(208), s(290))], fill=(30, 41, 59, 255))
    draw.polygon([(s(160), s(314)), (s(212), s(302)), (s(226), s(310)), (s(168), s(324))], fill=(203, 213, 225, 255))

    # Motorcycle Body (Red Fairing)
    body_pts = [
        (s(180), s(270)), (s(202), s(240)), (s(232), s(224)), (s(262), s(220)),
        (s(288), s(228)), (s(328), s(245)), (s(360), s(266)), (s(388), s(292)),
        (s(382), s(306)), (s(365), s(308)), (s(340), s(298)), (s(308), s(274)),
        (s(282), s(264)), (s(254), s(286)), (s(230), s(300)), (s(185), s(294))
    ]
    draw.polygon(body_pts, fill=(225, 29, 72, 255), outline=(190, 18, 60, 255))

    # Front Cowl
    cowl_pts = [(s(322), s(228)), (s(346), s(200)), (s(368), s(196)), (s(388), s(238)), (s(374), s(254)), (s(352), s(254))]
    draw.polygon(cowl_pts, fill=(225, 29, 72, 255))
    
    # Visor
    visor_pts = [(s(338), s(218)), (s(352), s(202)), (s(368), s(200)), (s(380), s(226)), (s(366), s(232)), (s(348), s(228))]
    draw.polygon(visor_pts, fill=(15, 23, 42, 255))

    # Rider Silhouette
    rider_pts = [(s(208), s(258)), (s(226), s(212)), (s(258), s(186)), (s(300), s(196)), (s(282), s(216)), (s(258), s(240)), (s(236), s(254))]
    draw.polygon(rider_pts, fill=(15, 23, 42, 255))
    rider_red_pts = [(s(232), s(228)), (s(250), s(204)), (s(274), s(192)), (s(296), s(198)), (s(280), s(210)), (s(262), s(222)), (s(248), s(236))]
    draw.polygon(rider_red_pts, fill=(225, 29, 72, 255))

    # Helmet
    draw.ellipse([s(298), s(150), s(346), s(196)], fill=(15, 23, 42, 255))
    draw.ellipse([s(316), s(162), s(340), s(180)], fill=(255, 255, 255, 255))

    # White Highlights
    draw.line([(s(276), s(238)), (s(348), s(274))], fill=(255, 255, 255, 255), width=int(s(4.5)))
    draw.line([(s(218), s(268)), (s(272), s(292))], fill=(255, 255, 255, 255), width=int(s(3)))

    # 3. Downscale and save multi-resolution ICO and PNGs
    sizes = [16, 32, 48, 64, 128, 180, 192, 512]
    for s_px in sizes:
        resized = img.resize((s_px, s_px), Image.Resampling.LANCZOS)
        if s_px == 180:
            resized.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")
        elif s_px in (16, 32):
            resized.save(os.path.join(public_dir, f"favicon-{s_px}x{s_px}.png"), "PNG")
        elif s_px in (192, 512):
            resized.save(os.path.join(public_dir, f"icon-{s_px}.png"), "PNG")

    # Save multi-size favicon.ico
    ico_layers = [img.resize((s_px, s_px), Image.Resampling.LANCZOS) for s_px in (16, 32, 48, 64)]
    ico_path = os.path.join(public_dir, "favicon.ico")
    ico_layers[0].save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)], append_images=ico_layers[1:])
    print("Successfully generated all favicon and icon formats in /public!")

if __name__ == "__main__":
    generate_icons()
