export type BadgeId = string;

export type BadgePrototypeId =
  | 'perfect-week-study'
  | 'tricentric-learning'
  | 'challenge-september-sprint'
  | 'teardrop-streak'
  | 'octagon-milestone'
  | 'infinity-mastery'
  | 'circular-coin'
  | 'shield-crested'
  | 'rhombus-diamond'
  | 'pentagon-star'
  | 'rounded-squircle'
  | 'clover-quatrefoil'
  | 'oval-cameo'
  | 'triangle-prism'
  | 'decagon-wheel'
  | 'shield-arch'
  | 'wave-crescent'
  | 'interlocking-rings'
  | 'hourglass-nexus'
  | 'sunburst-radiant'
  | 'owl-wisdom'
  | 'octopus-polymath'
  | 'octopus-abyss'
  | 'octopus-quantum'
  | 'jellyfish-flow'
  | 'jellyfish-nebula'
  | 'eagle-sovereign'
  | 'owl-clockwork'
  // 10 Cute Animals
  | 'cute-panda'
  | 'cute-shiba'
  | 'cute-red-panda'
  | 'cute-koala'
  | 'cute-hamster'
  | 'cute-fennec-fox'
  | 'cute-penguin'
  | 'cute-bunny'
  | 'cute-otter'
  | 'cute-alpaca'
  // 10 Ocean Animals
  | 'ocean-whale'
  | 'ocean-manta'
  | 'ocean-turtle'
  | 'ocean-dolphin'
  | 'ocean-hammerhead'
  | 'ocean-seahorse'
  | 'ocean-narwhal'
  | 'ocean-octopus'
  | 'ocean-jellyfish'
  | 'ocean-flying-fish'
  // 10 Cartoon Characters
  | 'cartoon-wizard'
  | 'cartoon-astronaut'
  | 'cartoon-mecha'
  | 'cartoon-knight'
  | 'cartoon-prince'
  | 'cartoon-pirate'
  | 'cartoon-pixel-hero'
  | 'cartoon-aviator'
  | 'cartoon-elf'
  | 'cartoon-ninja'
  // 10 Minecraft Characters
  | 'mc-steve'
  | 'mc-alex'
  | 'mc-creeper'
  | 'mc-enderman'
  | 'mc-skeleton'
  | 'mc-zombie'
  | 'mc-iron-golem'
  | 'mc-pig'
  | 'mc-ender-dragon'
  | 'mc-axolotl'
  // Hexagon Challenge Pop Icons (Apple Limited Edition Hexagon Medal)
  | 'hex-axolotl-lucy'
  | 'hex-axolotl-cyan'
  | 'hex-minion-stuart'
  | 'hex-minion-bob'
  | 'hex-bluey'
  | 'hex-bingo'
  | 'hex-nemo'
  | 'hex-dory'
  | 'hex-rubble'
  | 'hex-pikachu'
  | 'hex-darth-vader'
  | 'hex-vader-helmet'
  | 'hex-baby-yoda'
  | 'hex-lightsaber-green'
  | 'hex-lightsaber-red'
  // 10 Liquid Glass Strike Badges
  | 'strike-3-days'
  | 'strike-7-days'
  | 'strike-14-days'
  | 'strike-30-days'
  | 'strike-40-days'
  | 'strike-50-days'
  | 'strike-60-days'
  | 'strike-80-days'
  | 'strike-90-days'
  | 'strike-100-days';

export type BadgeCategory =
  | 'Liquid Glass Strike'
  | 'Hexagon Pop Challenge'
  | 'Close Your Study Rings'
  | 'Learning Milestones'
  | 'Academic Disciplines & Mastery'
  | 'Limited Edition Challenges'
  | 'Knowledge Competitions'
  | 'Cute Animals'
  | 'Ocean Animals'
  | 'Cartoon Characters'
  | 'Minecraft Characters';

export type BadgeState = 'unlocked' | 'progress' | 'locked';

export type ViewAngle = 'front' | 'angled' | 'profile' | 'back' | 'free';

export type BadgeStyleType =
  | 'faceted-shield'
  | 'concentric-rings'
  | 'challenge-hex'
  | 'teardrop-flame'
  | 'faceted-octagon'
  | 'infinity-loop'
  | 'circular-coin'
  | 'shield-crested'
  | 'rhombus-diamond'
  | 'pentagon-star'
  | 'rounded-squircle'
  | 'clover-quatrefoil'
  | 'oval-cameo'
  | 'triangle-prism'
  | 'decagon-wheel'
  | 'shield-arch'
  | 'wave-crescent'
  | 'interlocking-rings'
  | 'hourglass-nexus'
  | 'sunburst-radiant'
  | 'owl-wisdom'
  | 'octopus-polymath'
  | 'octopus-abyss'
  | 'octopus-quantum'
  | 'jellyfish-flow'
  | 'jellyfish-nebula'
  | 'eagle-sovereign'
  | 'owl-clockwork'
  // 10 Cute Animals
  | 'cute-panda'
  | 'cute-shiba'
  | 'cute-red-panda'
  | 'cute-koala'
  | 'cute-hamster'
  | 'cute-fennec-fox'
  | 'cute-penguin'
  | 'cute-bunny'
  | 'cute-otter'
  | 'cute-alpaca'
  // 10 Ocean Animals
  | 'ocean-whale'
  | 'ocean-manta'
  | 'ocean-turtle'
  | 'ocean-dolphin'
  | 'ocean-hammerhead'
  | 'ocean-seahorse'
  | 'ocean-narwhal'
  | 'ocean-octopus'
  | 'ocean-jellyfish'
  | 'ocean-flying-fish'
  // 10 Cartoon Characters
  | 'cartoon-wizard'
  | 'cartoon-astronaut'
  | 'cartoon-mecha'
  | 'cartoon-knight'
  | 'cartoon-prince'
  | 'cartoon-pirate'
  | 'cartoon-pixel-hero'
  | 'cartoon-aviator'
  | 'cartoon-elf'
  | 'cartoon-ninja'
  // 10 Minecraft Characters
  | 'mc-steve'
  | 'mc-alex'
  | 'mc-creeper'
  | 'mc-enderman'
  | 'mc-skeleton'
  | 'mc-zombie'
  | 'mc-iron-golem'
  | 'mc-pig'
  | 'mc-ender-dragon'
  | 'mc-axolotl'
  // Hexagon Challenge Pop Icons (Apple Limited Edition Hexagon Medal)
  | 'hex-axolotl-lucy'
  | 'hex-axolotl-cyan'
  | 'hex-minion-stuart'
  | 'hex-minion-bob'
  | 'hex-bluey'
  | 'hex-bingo'
  | 'hex-nemo'
  | 'hex-dory'
  | 'hex-rubble'
  | 'hex-pikachu'
  | 'hex-darth-vader'
  | 'hex-vader-helmet'
  | 'hex-baby-yoda'
  | 'hex-lightsaber-green'
  | 'hex-lightsaber-red'
  // 10 Liquid Glass Strike Badges
  | 'strike-3-days'
  | 'strike-7-days'
  | 'strike-14-days'
  | 'strike-30-days'
  | 'strike-40-days'
  | 'strike-50-days'
  | 'strike-60-days'
  | 'strike-80-days'
  | 'strike-90-days'
  | 'strike-100-days'
  | 'wireframe-dark';

export type BadgeRarity = 'Common' | 'Rare' | 'Legendary' | 'Mythic';

export interface BadgeModel {
  id: BadgeId;
  name: string;
  category: BadgeCategory;
  rarity?: BadgeRarity;
  earnedDate?: string;
  earnedCount?: number;
  progressCurrent?: number;
  progressTotal?: number;
  state: BadgeState;
  colorTheme: {
    primary: string;
    secondary?: string;
    accent?: string;
    bezel: 'silver' | 'gold' | 'space-gray';
  };
  description: string;
  longDescription: string;
  badgeStyle: BadgeStyleType;
  depthMetrics: {
    thickness: string;
    curvature: string;
    layers: number;
    enamelFinish: string;
  };
}

export function getBadgePrototypeId(style: BadgeStyleType): BadgePrototypeId {
  switch (style) {
    case 'concentric-rings':
      return 'tricentric-learning';
    case 'challenge-hex':
      return 'challenge-september-sprint';
    case 'teardrop-flame':
      return 'teardrop-streak';
    case 'faceted-octagon':
      return 'octagon-milestone';
    case 'infinity-loop':
      return 'infinity-mastery';
    case 'circular-coin':
      return 'circular-coin';
    case 'shield-crested':
      return 'shield-crested';
    case 'rhombus-diamond':
      return 'rhombus-diamond';
    case 'pentagon-star':
      return 'pentagon-star';
    case 'rounded-squircle':
      return 'rounded-squircle';
    case 'clover-quatrefoil':
      return 'clover-quatrefoil';
    case 'oval-cameo':
      return 'oval-cameo';
    case 'triangle-prism':
      return 'triangle-prism';
    case 'decagon-wheel':
      return 'decagon-wheel';
    case 'shield-arch':
      return 'shield-arch';
    case 'wave-crescent':
      return 'wave-crescent';
    case 'interlocking-rings':
      return 'interlocking-rings';
    case 'hourglass-nexus':
      return 'hourglass-nexus';
    case 'sunburst-radiant':
      return 'sunburst-radiant';
    case 'owl-wisdom':
      return 'owl-wisdom';
    case 'octopus-polymath':
      return 'octopus-polymath';
    case 'octopus-abyss':
      return 'octopus-abyss';
    case 'octopus-quantum':
      return 'octopus-quantum';
    case 'jellyfish-flow':
      return 'jellyfish-flow';
    case 'jellyfish-nebula':
      return 'jellyfish-nebula';
    case 'eagle-sovereign':
      return 'eagle-sovereign';
    case 'owl-clockwork':
      return 'owl-clockwork';
    // 10 Cute Animals
    case 'cute-panda':
      return 'cute-panda';
    case 'cute-shiba':
      return 'cute-shiba';
    case 'cute-red-panda':
      return 'cute-red-panda';
    case 'cute-koala':
      return 'cute-koala';
    case 'cute-hamster':
      return 'cute-hamster';
    case 'cute-fennec-fox':
      return 'cute-fennec-fox';
    case 'cute-penguin':
      return 'cute-penguin';
    case 'cute-bunny':
      return 'cute-bunny';
    case 'cute-otter':
      return 'cute-otter';
    case 'cute-alpaca':
      return 'cute-alpaca';
    // 10 Ocean Animals
    case 'ocean-whale':
      return 'ocean-whale';
    case 'ocean-manta':
      return 'ocean-manta';
    case 'ocean-turtle':
      return 'ocean-turtle';
    case 'ocean-dolphin':
      return 'ocean-dolphin';
    case 'ocean-hammerhead':
      return 'ocean-hammerhead';
    case 'ocean-seahorse':
      return 'ocean-seahorse';
    case 'ocean-narwhal':
      return 'ocean-narwhal';
    case 'ocean-octopus':
      return 'ocean-octopus';
    case 'ocean-jellyfish':
      return 'ocean-jellyfish';
    case 'ocean-flying-fish':
      return 'ocean-flying-fish';
    // 10 Cartoon Characters
    case 'cartoon-wizard':
      return 'cartoon-wizard';
    case 'cartoon-astronaut':
      return 'cartoon-astronaut';
    case 'cartoon-mecha':
      return 'cartoon-mecha';
    case 'cartoon-knight':
      return 'cartoon-knight';
    case 'cartoon-prince':
      return 'cartoon-prince';
    case 'cartoon-pirate':
      return 'cartoon-pirate';
    case 'cartoon-pixel-hero':
      return 'cartoon-pixel-hero';
    case 'cartoon-aviator':
      return 'cartoon-aviator';
    case 'cartoon-elf':
      return 'cartoon-elf';
    case 'cartoon-ninja':
      return 'cartoon-ninja';
    // 10 Minecraft Characters
    case 'mc-steve':
      return 'mc-steve';
    case 'mc-alex':
      return 'mc-alex';
    case 'mc-creeper':
      return 'mc-creeper';
    case 'mc-enderman':
      return 'mc-enderman';
    case 'mc-skeleton':
      return 'mc-skeleton';
    case 'mc-zombie':
      return 'mc-zombie';
    case 'mc-iron-golem':
      return 'mc-iron-golem';
    case 'mc-pig':
      return 'mc-pig';
    case 'mc-ender-dragon':
      return 'mc-ender-dragon';
    case 'mc-axolotl':
      return 'mc-axolotl';
    case 'hex-axolotl-lucy':
      return 'hex-axolotl-lucy';
    case 'hex-axolotl-cyan':
      return 'hex-axolotl-cyan';
    case 'hex-minion-stuart':
      return 'hex-minion-stuart';
    case 'hex-minion-bob':
      return 'hex-minion-bob';
    case 'hex-bluey':
      return 'hex-bluey';
    case 'hex-bingo':
      return 'hex-bingo';
    case 'hex-nemo':
      return 'hex-nemo';
    case 'hex-dory':
      return 'hex-dory';
    case 'hex-rubble':
      return 'hex-rubble';
    case 'hex-pikachu':
      return 'hex-pikachu';
    case 'hex-darth-vader':
      return 'hex-darth-vader';
    case 'hex-vader-helmet':
      return 'hex-vader-helmet';
    case 'hex-baby-yoda':
      return 'hex-baby-yoda';
    case 'hex-lightsaber-green':
      return 'hex-lightsaber-green';
    case 'hex-lightsaber-red':
      return 'hex-lightsaber-red';
    case 'strike-3-days':
      return 'strike-3-days';
    case 'strike-7-days':
      return 'strike-7-days';
    case 'strike-14-days':
      return 'strike-14-days';
    case 'strike-30-days':
      return 'strike-30-days';
    case 'strike-40-days':
      return 'strike-40-days';
    case 'strike-50-days':
      return 'strike-50-days';
    case 'strike-60-days':
      return 'strike-60-days';
    case 'strike-80-days':
      return 'strike-80-days';
    case 'strike-90-days':
      return 'strike-90-days';
    case 'strike-100-days':
      return 'strike-100-days';
    default:
      return 'perfect-week-study';
  }
}
