// !LOCNS:galactic_war

var loadouts = [
	{
		"name": "!LOC:Lightweight Commander",
		"description": "!LOC:All combat units gain +25% movement speed and -25% health. Starts with bots.",
		"hint": "!LOC:Finish the tutorial to gain this speedy loadout."
	},
	{
		"name": "!LOC:Armored Commander",
		"description": "!LOC:All combat units gain +30% health, but cost 20% more. Starts with vehicles.",
		"hint": "!LOC:Imperator Invictus guards superior armor blueprints on Agoge"
	},
	{
		"name": "!LOC:Popcorn Commander",
		"description": "!LOC:All combat units cost 25% less and have 35% less health. Starts with bots.",
		"hint": "!LOC:Metrarch the Machinist places value in expendability. Learn his ways within the Platina system."
	},
	{
		"name": "!LOC:Simple Commander",
		"description": "!LOC:Begins with one combat unit unlocked in each factory. Cannot learn to build new units through tech.",
		"hint": "!LOC:Seek purity and simplicity through Inquisitor Nemicus on Blogar's Fist"
	},
	{
		"name": "!LOC:Spawn Commander",
		"description": "!LOC:Commander builds units instead of structures. Fabricators can only build certain structures.",
		"hint": "!LOC:Prove your self-sufficiency by defeating Osiris on Epiphany."
	},
	{
		"name": "!LOC:Expansionist Commander",
		"description": "!LOC:All economic structures gain -75% metal cost and -50% production. Starts with bots.",
		"hint": "!LOC:Learn by Osiris' roaming example on Varthema to expand your influence."
	},
	{
		"name": "!LOC:Isolationist Commander",
		"description": "!LOC:All economic structures gain +200% production and +300% metal cost. Starts with vehicles.",
		"hint": "!LOC:Metrarch the Machinist holds blueprints for advanced infrastructure on Fier."
	},
	{
		"name": "!LOC:Budget Commander",
		"description": "!LOC:Starts with +10,000% stored metal. Cannot build metal extractors. Starts with all basic factories.",
		"hint": "!LOC:Inquisitor Nemicus holds data for abstract economic techniques on Zeta Draconis"
	},
	{
		"name": "!LOC:Titan Commander",
		"description": "!LOC:Commander can build Atlas, Zeus, and Ares Titans. Starts with vehicles.",
		"hint": "!LOC:Imperator Invictus is mass producing the largest weapons known on Tau Leoporis"
	}
];

var techs = [
	{
		"name": "!LOC:Protocol: Precision",
		"description": "!LOC:All combat units gain +15% sight and weapon range and -15% movement speed."
	},
	{
		"name": "!LOC:Protocol: Wrath",
		"description": "!LOC:All combat units gain +20% movement speed and -10% sight and weapon range."
	},
	{
		"name": "!LOC:Protocol: Fortitude",
		"description": "!LOC:All combat units gain +30% health and -15% movement speed."
	},
	{
		"name": "!LOC:Protocol: Agility",
		"description": "!LOC:All combat units gain +20% movement speed and -20% health."
	},
	{
		"name": "!LOC:Protocol: Disposability",
		"description": "!LOC:All structures cost 30% less but have 50% less health and leave no wreckage."
	},
	{
		"name": "!LOC:Protocol: Kill-switch",
		"description": "!LOC:All units explode on death."
	},
	{
		"name": "!LOC:Protocol: Blindness",
		"description": "!LOC:Units gain +50% weapon range and +30% health, but only scouts and commanders can see."
	},
	{
		"name": "!LOC:Titan Tech",
		"description": "!LOC: Allows advanced fabricators to build all Titan-class units."
	},
	{
		"name": "!LOC:Atlas Tech",
		"description": "!LOC: Allows advanced bot fabricators to build the Seismic Titan, Atlas."
	},
	{
		"name": "!LOC:Helios Tech",
		"description": "!LOC: Allows orbital fabricators to build the Invasion Titan, Helios."
	},
	{
		"name": "!LOC:Ares Tech",
		"description": "!LOC: Allows advanced vehicle fabricators to build the Fortress Titan, Ares."
	},
	{
		"name": "!LOC:Zeus Tech",
		"description": "!LOC: Allows advanced air fabricators to build the Lightning Titan, Zeus."
	},
	{
		"name": "!LOC:Titan Cost Reduction",
		"description": "!LOC: Reduces the cost of all Titans by 50%."
	},
	{
		"name": "!LOC:Titan Engine Tech",
		"description": "!LOC: Increases the speed of all Titans by 20%."
	},
	{
		"name": "!LOC:Enhanced Radar Coverage",
		"description": "!LOC: Increases radar range by 60%"
	}
];

var ai_traits = [
	{
		"name": "!LOC:Vigilant",
		"description": "!LOC:+10% sight and weapon range"
	},
	{
		"name": "!LOC:Resilient",
		"description": "!LOC:+25% health"
	},
	{
		"name": "!LOC:Aggressive",
		"description": "!LOC:+25% damage"
	},
	{
		"name": "!LOC:Agile",
		"description": "!LOC:+15% movement speed"
	},
	{
		"name": "!LOC:Administrator",
		"description": "!LOC:+20% resource production"
	},
	{
		"name": "!LOC:Productive",
		"description": "!LOC:-20% unit costs"
	},
	{
		"name": "!LOC:Tough Commander",
		"description": "!LOC:+20% commander health, movement speed, and damage."
	}
];

var gw_tips = [
	"!LOC:Complete techs are valuable in that they give access to advanced units and fabricators, greatly expanding your options.",
	"!LOC:Defeating a faction's boss will eliminate that faction from the map entirely, allowing you to collect the tech from all their remaining systems without a fight.",
	"!LOC:Enemies will get stronger as you get further away from your starting system. If you're having difficulty progressing, try taking a different path to gain more tech.",
	"!LOC:Faction bosses are much stronger than other enemies. Make sure you're well-equipped before challenging one.",
	"!LOC:Defeating bosses will sometimes unlock a new commander loadout for you to equip in later galactic wars."
];

var misc = [
	"!LOC:Metal draw",
	"!LOC:Energy draw",
	"!LOC:Resource use",
	"!LOC:Consumption",
	"!LOC:Production",
	"!LOC:Fire when ready",
	"!LOC:Do not destroy",
	"!LOC:Reclaim at will",
	"!LOC:Stop when storage is full",
	"!LOC:Prod",
	"!LOC:Draw",
	"!LOC:Gen",
	"!LOC:Consumption",
	"!LOC:Consume",
	"!LOC:Use",
	"!LOC:ETA",
	"!LOC:Time",
	"!LOC:Build Time",
	"!LOC:Build",
	"!LOC:Cost",
	"!LOC:Storage"
];
