import re
import os
import subprocess

print("--- Generating Badge 5.0 Standalone HTML ---")

# Ensure template is clean from git HEAD
subprocess.run(['git', 'checkout', 'HEAD', '--', 'badge-studio.html'], check=True)
with open('badge-studio.html', 'r', encoding='utf-8') as f:
    template = f.read()

# Read all 123 prototypes
with open('badge-system/src/data/prototypes.ts', 'r', encoding='utf-8') as f:
    proto_content = f.read()

start_idx = proto_content.find('APPLE_LEARNING_AWARDS_CATALOG')
eq_idx = proto_content.find('=', start_idx)
pos = proto_content.find('[', eq_idx)
bracket_count = 1
i = pos + 1
while i < len(proto_content) and bracket_count > 0:
    if proto_content[i] == '[':
        bracket_count += 1
    elif proto_content[i] == ']':
        bracket_count -= 1
    i += 1

raw_catalog = proto_content[pos:i]

# Ensure state is 'unlocked' for catalog showcase preview
catalog_unlocked = re.sub(r"state:\s*'locked'", "state: 'unlocked'", raw_catalog)

# Clean TS conversion function
def convert_ts_to_js(code):
    # Remove imports
    code = re.sub(r'import\s+[\s\S]*?from\s+[\'\"][^\'\"]+[\'\"];?', '', code)
    code = re.sub(r'import\s+\*[\s\S]*?;?', '', code)
    
    # 1) Type aliases: type Foo = ...;
    code = re.sub(r'(?:export\s+)?type\s+\w+(?:<[^>]+>)?\s*=[\s\S]*?;', '', code)
    # 2) Interfaces and object types: interface Foo { ... }
    while True:
        m = re.search(r'(?:export\s+)?(?:interface|type)\s+\w+(?:<[^>]+>)?\s*(?:extends\s+[^{]+)?\{', code)
        if not m:
            break
        b_pos = m.end() - 1
        b_count = 1
        curr = b_pos + 1
        while curr < len(code) and b_count > 0:
            if code[curr] == '{':
                b_count += 1
            elif code[curr] == '}':
                b_count -= 1
            curr += 1
        code = code[:m.start()] + code[curr:]

    # Remove arrow function types: (x: number, y: number): boolean =>
    def clean_arrow(m):
        params = m.group(1)
        params = re.sub(r'\?\s*:\s*[A-Za-z0-9_.<>\[\]]+', '', params)
        params = re.sub(r':\s*[A-Za-z0-9_.<>\[\]]+(?=\s*=)', '', params)
        params = re.sub(r':\s*[A-Za-z0-9_.<>\[\]]+', '', params)
        params = re.sub(r'\?', '', params)
        return '(' + params + ') =>'
    code = re.sub(r'\(([^)]*?)\)\s*(?::\s*[A-Za-z0-9_.<>\[\] ]+\s*)?=>', clean_arrow, code)

    # Strip 'as [Type]'
    code = re.sub(r'\bas\s+[A-Za-z0-9_.]+(?:<[^>]+>)?(?:\[\])?', '', code)

    # Strip TS non-null assertion: expr!
    code = re.sub(r'([\w\)\]])\s*!(?=\s*[;\.,\)\n])', r'\1', code)

    # Strip variable type annotations: const/let/var x: Type = ... or let x: Type;
    code = re.sub(r'(\b(?:const|let|var)\s+\w+)\s*:\s*[A-Za-z0-9_.<>\[\], ]+?(?=\s*[;=])', r'\1', code)

    # Clean function signatures
    def clean_func_sig(match):
        sig = match.group(0)
        def clean_params(m):
            params = m.group(1)
            params = re.sub(r'\?\s*:\s*[A-Za-z0-9_.<>\[\]]+', '', params)
            params = re.sub(r':\s*[A-Za-z0-9_.<>\[\]]+(?=\s*=)', '', params)
            params = re.sub(r':\s*[A-Za-z0-9_.<>\[\]]+', '', params)
            params = re.sub(r'\?', '', params)
            return '(' + params + ')'
        sig = re.sub(r'\(([\s\S]*?)\)', clean_params, sig)
        sig = re.sub(r'\)\s*:\s*(?:\{[\s\S]*?\}|[A-Za-z0-9_.<>\[\]]+)\s*\{', ') {', sig)
        return sig

    code = re.sub(r'(?:export\s+)?function\s+\w+\s*\([\s\S]*?\)\s*(?::\s*(?:\{[\s\S]*?\}|[A-Za-z0-9_.<>\[\]]+)\s*)?\{', clean_func_sig, code)
    code = re.sub(r'\bexport\s+', '', code)
    return code

with open('badge-system/src/utils/rarity.ts', 'r', encoding='utf-8') as f:
    rarity_js = convert_ts_to_js(f.read())

hex_pop_js = convert_ts_to_js(open('badge-system/src/three/ChallengeHexBadgeGeometry.ts', 'r', encoding='utf-8').read())
strike_glass_js = convert_ts_to_js(open('badge-system/src/three/StrikeGlassBadgeGeometry.ts', 'r', encoding='utf-8').read())
minecraft_js = convert_ts_to_js(open('badge-system/src/three/MinecraftBadgeGeometry.ts', 'r', encoding='utf-8').read())
cartoon_js = convert_ts_to_js(open('badge-system/src/three/CartoonBadgeGeometry.ts', 'r', encoding='utf-8').read())
animals_js = convert_ts_to_js(open('badge-system/src/three/AnimalBadgeGeometry.ts', 'r', encoding='utf-8').read())

print("All TS files converted to clean JS.")

# 4. Build routing switch table for buildAppleBadge3D
build_badge_switch = """
    function buildAppleBadge3D(materialsLib, badge) {
      const protoId = getBadgePrototypeId(badge.badgeStyle);
      const isLocked = badge.state === 'locked';
      let lacquerColor = 0xfa114f;
      if (badge.colorTheme && badge.colorTheme.primary) {
        lacquerColor = parseInt(badge.colorTheme.primary.replace('#', '0x'), 16);
      }
      const earnedDate = badge.earnedDate || 'OCTOBER 28, 2026';
      
      switch (protoId) {
        // --- 10 Liquid Glass Strike Medals (New in Today's Git Push) ---
        case 'strike-3-days':
          return buildStrike3DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-7-days':
          return buildStrike7DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-14-days':
          return buildStrike14DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-30-days':
          return buildStrike30DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-40-days':
          return buildStrike40DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-50-days':
          return buildStrike50DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-60-days':
          return buildStrike60DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-80-days':
          return buildStrike80DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-90-days':
          return buildStrike90DaysBadge(materialsLib, earnedDate, isLocked);
        case 'strike-100-days':
          return buildStrike100DaysBadge(materialsLib, earnedDate, isLocked);

        // --- 15 Hexagon Pop Challenge Medals ---
        case 'hex-axolotl-lucy':
          return buildHexAxolotlLucyBadge(materialsLib, earnedDate, isLocked);
        case 'hex-axolotl-cyan':
          return buildHexAxolotlCyanBadge(materialsLib, earnedDate, isLocked);
        case 'hex-minion-stuart':
          return buildHexMinionStuartBadge(materialsLib, earnedDate, isLocked);
        case 'hex-minion-bob':
          return buildHexMinionBobBadge(materialsLib, earnedDate, isLocked);
        case 'hex-bluey':
          return buildHexBlueyBadge(materialsLib, earnedDate, isLocked);
        case 'hex-bingo':
          return buildHexBingoBadge(materialsLib, earnedDate, isLocked);
        case 'hex-nemo':
          return buildHexNemoBadge(materialsLib, earnedDate, isLocked);
        case 'hex-dory':
          return buildHexDoryBadge(materialsLib, earnedDate, isLocked);
        case 'hex-rubble':
          return buildHexRubbleBadge(materialsLib, earnedDate, isLocked);
        case 'hex-pikachu':
          return buildHexPikachuBadge(materialsLib, earnedDate, isLocked);
        case 'hex-darth-vader':
          return buildHexDarthVaderBadge(materialsLib, earnedDate, isLocked);
        case 'hex-vader-helmet':
          return buildHexVaderHelmetBadge(materialsLib, earnedDate, isLocked);
        case 'hex-baby-yoda':
          return buildHexBabyYodaBadge(materialsLib, earnedDate, isLocked);
        case 'hex-lightsaber-green':
          return buildHexLightsaberGreenBadge(materialsLib, earnedDate, isLocked);
        case 'hex-lightsaber-red':
          return buildHexLightsaberRedBadge(materialsLib, earnedDate, isLocked);

        // --- 10 Minecraft Characters ---
        case 'mc-steve':
          return buildMinecraftSteveBadge(materialsLib, earnedDate, isLocked);
        case 'mc-alex':
          return buildMinecraftAlexBadge(materialsLib, earnedDate, isLocked);
        case 'mc-creeper':
          return buildMinecraftCreeperBadge(materialsLib, earnedDate, isLocked);
        case 'mc-enderman':
          return buildMinecraftEndermanBadge(materialsLib, earnedDate, isLocked);
        case 'mc-skeleton':
          return buildMinecraftSkeletonBadge(materialsLib, earnedDate, isLocked);
        case 'mc-zombie':
          return buildMinecraftZombieBadge(materialsLib, earnedDate, isLocked);
        case 'mc-iron-golem':
          return buildMinecraftIronGolemBadge(materialsLib, earnedDate, isLocked);
        case 'mc-pig':
          return buildMinecraftPigBadge(materialsLib, earnedDate, isLocked);
        case 'mc-ender-dragon':
          return buildMinecraftEnderDragonBadge(materialsLib, earnedDate, isLocked);
        case 'mc-axolotl':
          return buildMinecraftAxolotlBadge(materialsLib, earnedDate, isLocked);

        // --- 10 Cartoon Characters ---
        case 'cartoon-wizard':
          return buildCartoonWizardBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-astronaut':
          return buildCartoonAstronautBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-mecha':
          return buildCartoonMechaBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-knight':
          return buildCartoonKnightBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-prince':
          return buildCartoonPrinceBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-pirate':
          return buildCartoonPirateBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-pixel-hero':
          return buildCartoonPixelHeroBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-aviator':
          return buildCartoonAviatorBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-elf':
          return buildCartoonElfBadge(materialsLib, earnedDate, isLocked);
        case 'cartoon-ninja':
          return buildCartoonNinjaBadge(materialsLib, earnedDate, isLocked);

        // --- 10 Cute Animals ---
        case 'cute-panda':
          return buildCutePandaBadge(materialsLib, earnedDate, isLocked);
        case 'cute-shiba':
          return buildCuteShibaBadge(materialsLib, earnedDate, isLocked);
        case 'cute-red-panda':
          return buildCuteRedPandaBadge(materialsLib, earnedDate, isLocked);
        case 'cute-koala':
          return buildCuteKoalaBadge(materialsLib, earnedDate, isLocked);
        case 'cute-hamster':
          return buildCuteHamsterBadge(materialsLib, earnedDate, isLocked);
        case 'cute-fennec-fox':
        case 'cute-fox':
          return buildCuteFoxBadge(materialsLib, earnedDate, isLocked);
        case 'cute-penguin':
          return buildCutePenguinBadge(materialsLib, earnedDate, isLocked);
        case 'cute-bunny':
          return buildCuteBunnyBadge(materialsLib, earnedDate, isLocked);
        case 'cute-otter':
          return buildCuteOtterBadge(materialsLib, earnedDate, isLocked);
        case 'cute-alpaca':
          return buildCuteAlpacaBadge(materialsLib, earnedDate, isLocked);

        // --- 10 Ocean Animals ---
        case 'ocean-whale':
          return buildOceanWhaleBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-manta':
          return buildOceanMantaBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-turtle':
          return buildOceanTurtleBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-dolphin':
          return buildOceanDolphinBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-hammerhead':
        case 'ocean-shark':
          return buildOceanSharkBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-seahorse':
          return buildOceanSeahorseBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-narwhal':
          return buildOceanNarwhalBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-octopus':
          return buildOceanOctopusBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-jellyfish':
          return buildOceanJellyfishBadge(materialsLib, earnedDate, isLocked);
        case 'ocean-flying-fish':
          return buildOceanFlyingFishBadge(materialsLib, earnedDate, isLocked);

        // --- Classic Apple Learning Awards ---
        case 'perfect-week-study':
          return buildAppleFacetedShieldBadge(materialsLib, lacquerColor, earnedDate, isLocked);
        case 'tricentric-learning':
          return buildAppleConcentricRingsBadge(materialsLib, earnedDate, isLocked);
        case 'teardrop-streak':
          return buildAppleTeardropStreakBadge(materialsLib, earnedDate, isLocked);
        case 'octagon-milestone':
          return buildAppleOctagonMilestoneBadge(materialsLib, earnedDate, isLocked);
        case 'infinity-mastery':
          return buildAppleInfinityMasteryBadge(materialsLib, earnedDate, isLocked);
        case 'circular-coin':
          return buildAppleCircularCoinBadge(materialsLib, earnedDate, isLocked);
        case 'shield-crested':
          return buildAppleShieldCrestedBadge(materialsLib, earnedDate, isLocked);
        case 'rhombus-diamond':
          return buildAppleRhombusDiamondBadge(materialsLib, earnedDate, isLocked);
        case 'pentagon-star':
          return buildApplePentagonStarBadge(materialsLib, earnedDate, isLocked);
        case 'rounded-squircle':
          return buildAppleRoundedSquircleBadge(materialsLib, earnedDate, isLocked);
        case 'clover-quatrefoil':
          return buildAppleCloverQuatrefoilBadge(materialsLib, earnedDate, isLocked);
        case 'oval-cameo':
          return buildAppleOvalCameoBadge(materialsLib, earnedDate, isLocked);
        case 'triangle-prism':
          return buildAppleTrianglePrismBadge(materialsLib, earnedDate, isLocked);
        case 'decagon-wheel':
          return buildAppleDecagonWheelBadge(materialsLib, earnedDate, isLocked);
        case 'shield-arch':
          return buildAppleShieldArchBadge(materialsLib, earnedDate, isLocked);
        case 'wave-crescent':
          return buildAppleWaveCrescentBadge(materialsLib, earnedDate, isLocked);
        case 'interlocking-rings':
          return buildAppleInterlockingRingsBadge(materialsLib, earnedDate, isLocked);
        case 'hourglass-nexus':
          return buildAppleHourglassNexusBadge(materialsLib, earnedDate, isLocked);
        case 'sunburst-radiant':
          return buildAppleSunburstRadiantBadge(materialsLib, earnedDate, isLocked);
        case 'owl-wisdom':
          return buildAppleOwlBadge(materialsLib, earnedDate, isLocked);
        case 'octopus-polymath':
          return buildAppleOctopusBadge(materialsLib, earnedDate, isLocked);
        default:
          return buildAppleChallengeHexBadge(materialsLib, earnedDate, isLocked);
      }
    }
"""

# Update Title and Description
html = template
html = html.replace("<title>Minest 3D Badge System • Authentic Spatial Learning Awards Master</title>",
                    "<title>Minest Badge 5.0 • 3D Spatial Learning Awards Master (Official Release)</title>")

html = html.replace("50 High-Prestige Learning Awards", "123 High-Prestige Learning Awards (Badge 5.0)")
html = html.replace("22 Parametric 3D Shapes • True Vitreous Enamel & Laser Ceramic Backs",
                    "10 Liquid Glass Strike Badges • 20+ Parametric 3D Geometries • Rarity Grading & Spatial Audio")

# Add Rarity Shimmer elements to modal HTML
old_modal_canvas_box = '<div id="modal-canvas-box" class="relative w-full h-[380px] sm:h-[440px] rounded-[40px] border border-white/10 overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent shadow-2xl">'
new_modal_canvas_box = """<div id="modal-canvas-box" class="relative w-full h-[380px] sm:h-[440px] rounded-[40px] border border-white/10 overflow-hidden bg-gradient-to-b from-white/[0.02] to-transparent shadow-2xl transition-all duration-500">
        <!-- Legendary & Mythic Ambient Rotational Shimmer & Edge Glow -->
        <div id="modal-rarity-shimmer" class="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-[inherit] hidden">
          <div id="modal-shimmer-rays" class="absolute -inset-[120%] opacity-25 animate-spin" style="animation-duration: 24s; filter: blur(90px);"></div>
          <div id="modal-shimmer-radial" class="absolute inset-0 opacity-30 animate-pulse" style="animation-duration: 3.5s;"></div>
          <div id="modal-shimmer-border" class="absolute inset-0 rounded-[inherit] pointer-events-none transition-all duration-500"></div>
        </div>"""
html = html.replace(old_modal_canvas_box, new_modal_canvas_box)

# Add Rarity badge pill container above modal-badge-name
old_meta = '<div class="w-full max-w-md mx-auto px-6 text-center space-y-2 pt-2 z-10">\n      <h2 id="modal-badge-name"'
new_meta = """<div class="w-full max-w-md mx-auto px-6 text-center space-y-2 pt-2 z-10">
      <div id="modal-rarity-badge-pill" class="flex items-center justify-center gap-2 mb-1.5"></div>
      <h2 id="modal-badge-name" """
html = html.replace(old_meta, new_meta)

# Replace buildAppleBadge3D in template
build_badge_pattern = r'function buildAppleBadge3D\(materialsLib, badge\)\s*\{[\s\S]*?switch \(protoId\) \{[\s\S]*?default:[\s\S]*?\}\s*\}'
assert re.search(build_badge_pattern, html), "Could not find buildAppleBadge3D"
html = re.sub(build_badge_pattern, build_badge_switch.strip(), html)

# Insert the new geometries before buildAppleBadge3D
all_new_geometries = f"""
    /* =========================================================================
       NEW 3D GEOMETRIES (STRIKE GLASS, MINECRAFT, CARTOON, ANIMALS, HEX POP)
       Integrated from latest Mac Git Updates (7ff2808c579dbd16b0c13c65a3d9e97c12b4ee94)
       ========================================================================= */
{hex_pop_js}

{strike_glass_js}

{minecraft_js}

{cartoon_js}

{animals_js}

    /* Rarity Classification & Metrics */
{rarity_js}
"""

html = html.replace(build_badge_switch.strip(), all_new_geometries + "\n" + build_badge_switch.strip())

# Replace AWARDS_CATALOG with full 123 catalog
catalog_pattern = r'const AWARDS_CATALOG = \[[\s\S]*?\n\];'
assert re.search(catalog_pattern, html), "Could not find AWARDS_CATALOG"
html = re.sub(catalog_pattern, f"const AWARDS_CATALOG = {catalog_unlocked.strip()};", html)

# Update categories array in UI
old_categories = """const categories = [
      { key: 'all', label: 'All Awards' },
      { key: 'Close Your Study Rings', label: 'Study Rings' },
      { key: 'Learning Milestones', label: 'Milestones' },
      { key: 'Academic Disciplines & Mastery', label: 'Disciplines' },
      { key: 'Limited Edition Challenges', label: 'Challenges' }
    ];"""

new_categories = """const categories = [
      { key: 'all', label: '全部 (All 123)' },
      { key: 'Liquid Glass Strike', label: '连胜打卡 (Strike 10)' },
      { key: 'Hexagon Pop Challenge', label: '潮玩六边形 (Hex Pop 15)' },
      { key: 'Minecraft Characters', label: '我的世界 (MC 10)' },
      { key: 'Cartoon Characters', label: '卡通角色 (Cartoon 10)' },
      { key: 'Cute Animals', label: '可爱动物 (Animals 10)' },
      { key: 'Ocean Animals', label: '海洋生灵 (Ocean 10)' },
      { key: 'Close Your Study Rings', label: '圆满三环 (Rings)' },
      { key: 'Learning Milestones', label: '学习里程碑 (Milestones)' },
      { key: 'Academic Disciplines & Mastery', label: '学科精通 (Disciplines)' },
      { key: 'Limited Edition Challenges', label: '限量挑战 (Challenges)' }
    ];"""

html = html.replace(old_categories, new_categories)

# Update renderGrid to display rarity badges on cards
old_render_card = """        card.innerHTML = `
          <div class="flex items-center justify-between text-left">
            <span class="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">${badge.category}</span>
            <span class="text-[10px] font-medium text-[#636366] px-2 py-0.5 rounded-full bg-white/5">${badge.badgeStyle}</span>
          </div>"""

new_render_card = """        const rarityInfo = typeof calculateBadgeRarity === 'function' ? calculateBadgeRarity(badge) : { tier: badge.rarity || 'Common', rankBadgeText: 'Award' };
        const effectiveRarity = badge.rarity || rarityInfo.tier;
        const rarityColor = typeof getRarityColor === 'function' ? getRarityColor(effectiveRarity) : '#8E8E93';
        
        card.innerHTML = `
          <div class="flex items-center justify-between text-left">
            <span class="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">${badge.category}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background: ${rarityColor}20; color: ${rarityColor}; border: 1px solid ${rarityColor}40;">${effectiveRarity}</span>
          </div>"""

html = html.replace(old_render_card, new_render_card)

# Update openModalWithBadge to configure the Rarity Shimmer overlay
old_open_modal_start = "function openModalWithBadge(badge) {"
new_open_modal_start = """function openModalWithBadge(badge) {
      const rarityInfo = typeof calculateBadgeRarity === 'function' ? calculateBadgeRarity(badge) : { tier: badge.rarity || 'Common', rankBadgeText: 'Award', score: 50 };
      const effectiveRarity = badge.rarity || rarityInfo.tier;
      const rarityColor = typeof getRarityColor === 'function' ? getRarityColor(effectiveRarity) : '#8E8E93';
      const isRareOrMythic = effectiveRarity === 'Legendary' || effectiveRarity === 'Mythic';

      const shimmerEl = document.getElementById('modal-rarity-shimmer');
      const boxEl = document.getElementById('modal-canvas-box');
      if (shimmerEl) {
        if (isRareOrMythic) {
          shimmerEl.classList.remove('hidden');
          const rays = document.getElementById('modal-shimmer-rays');
          const radial = document.getElementById('modal-shimmer-radial');
          const border = document.getElementById('modal-shimmer-border');
          if (rays) rays.style.background = `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${rarityColor} 45deg, transparent 90deg, ${rarityColor} 180deg, transparent 270deg, ${rarityColor} 315deg, transparent 360deg)`;
          if (radial) radial.style.background = `radial-gradient(circle at 50% 35%, ${rarityColor} 0%, transparent 68%)`;
          if (border) {
            border.style.border = `1.5px solid ${rarityColor}65`;
            border.style.boxShadow = `inset 0 0 32px ${rarityColor}25, 0 0 45px ${rarityColor}35`;
          }
          if (boxEl) {
            boxEl.style.borderColor = `${rarityColor}55`;
            boxEl.style.boxShadow = `0 0 32px ${rarityColor}28, inset 0 0 28px ${rarityColor}20`;
          }
        } else {
          shimmerEl.classList.add('hidden');
          if (boxEl) {
            boxEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            boxEl.style.boxShadow = '';
          }
        }
      }

      const pillEl = document.getElementById('modal-rarity-badge-pill');
      if (pillEl) {
        pillEl.innerHTML = `
          <span class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-md backdrop-blur-md transition-all"
                style="background-color: ${rarityColor}1A; color: ${rarityColor}; border-color: ${rarityColor}45; box-shadow: 0 0 16px ${rarityColor}20;">
            <span class="w-2 h-2 rounded-full animate-pulse" style="background-color: ${rarityColor}; box-shadow: 0 0 8px ${rarityColor}"></span>
            <span>${effectiveRarity} AWARD</span>
            <span class="text-[10px] opacity-75 font-mono font-medium border-l border-current/30 pl-2">${rarityInfo.rankBadgeText}</span>
          </span>
        `;
      }"""

html = html.replace(old_open_modal_start, new_open_modal_start)

# Write out badge5.0.html
with open('badge5.0.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"Successfully generated badge5.0.html ({len(html)} bytes)")

# Also write to badge-studio.html and badge-library/badge5.0.html and badge-library/index.html
with open('badge-studio.html', 'w', encoding='utf-8') as f:
    f.write(html)
os.makedirs('badge-library', exist_ok=True)
with open('badge-library/badge5.0.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open('badge-library/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Synchronized badge-studio.html and badge-library/ files")
